// Bulletproof Voxel World Engine, Zero-Fallthrough Infinite Chunks & Bedrock Anchoring for NovaCraft
(function(global) {
    const CHUNK_SIZE_X = 16;
    const CHUNK_SIZE_Z = 16;
    const CHUNK_HEIGHT = 64;
    const WATER_LEVEL = 18;

    // Face directions: [+X, -X, +Y, -Y, +Z, -Z]
    const FACES = [
        { dir: [1, 0, 0],  name: 'right',  ao: 0.85, corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]] },
        { dir: [-1, 0, 0], name: 'left',   ao: 0.85, corners: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]] },
        { dir: [0, 1, 0],  name: 'top',    ao: 1.0,  corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]] },
        { dir: [0, -1, 0], name: 'bottom', ao: 0.55, corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]] },
        { dir: [0, 0, 1],  name: 'front',  ao: 0.75, corners: [[1,0,1],[1,1,1],[0,1,1],[0,0,1]] },
        { dir: [0, 0, -1], name: 'back',   ao: 0.75, corners: [[0,0,0],[0,1,0],[1,1,0],[1,0,0]] }
    ];

    class Chunk {
        constructor(cx, cz, world) {
            this.cx = cx;
            this.cz = cz;
            this.world = world;
            this.data = new Uint8Array(CHUNK_SIZE_X * CHUNK_SIZE_Z * CHUNK_HEIGHT);
            this.mesh = null;
            this.waterMesh = null;
            this.isDirty = true;
            this.generated = false;
        }

        getIndex(x, y, z) {
            return (y * CHUNK_SIZE_Z + z) * CHUNK_SIZE_X + x;
        }

        getBlock(x, y, z) {
            if (x < 0 || x >= CHUNK_SIZE_X || z < 0 || z >= CHUNK_SIZE_Z || y < 0 || y >= CHUNK_HEIGHT) {
                return 0;
            }
            return this.data[this.getIndex(x, y, z)];
        }

        setBlock(x, y, z, id) {
            if (x < 0 || x >= CHUNK_SIZE_X || z < 0 || z >= CHUNK_SIZE_Z || y < 0 || y >= CHUNK_HEIGHT) {
                return;
            }
            this.data[this.getIndex(x, y, z)] = id;
            this.isDirty = true;
        }
    }

    class World {
        constructor(scene, textureAtlas, seed = 12345) {
            this.scene = scene;
            this.atlas = textureAtlas;
            this.seed = seed;
            this.chunks = new Map(); // key: "cx,cz"
            this.noiseTerrain = new SimplexNoise(seed);
            this.noiseBiome = new SimplexNoise(seed + 999);
            this.noiseCaves = new SimplexNoise(seed + 5555);

            this.material = new THREE.MeshLambertMaterial({
                map: this.atlas.getTexture(),
                vertexColors: true,
                transparent: true,
                alphaTest: 0.1,
                side: THREE.FrontSide
            });

            this.waterMaterial = new THREE.MeshLambertMaterial({
                map: this.atlas.getTexture(),
                vertexColors: true,
                transparent: true,
                opacity: 0.75,
                side: THREE.DoubleSide
            });

            this.teleportWaygates = [];
        }

        chunkKey(cx, cz) {
            return `${cx},${cz}`;
        }

        getChunk(cx, cz) {
            return this.chunks.get(this.chunkKey(cx, cz));
        }

        // Guaranteed instant data generation upon instantiation: NO empty chunks!
        getOrCreateChunk(cx, cz) {
            const key = this.chunkKey(cx, cz);
            let chunk = this.chunks.get(key);
            if (!chunk) {
                chunk = new Chunk(cx, cz, this);
                this.chunks.set(key, chunk);
                this.generateChunkTerrain(chunk);
            }
            return chunk;
        }

        worldToChunkCoords(wx, wz) {
            return {
                cx: Math.floor(wx / CHUNK_SIZE_X),
                cz: Math.floor(wz / CHUNK_SIZE_Z),
                lx: ((wx % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X,
                lz: ((wz % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z
            };
        }

        // Zero-Fail getBlock: Never returns empty air on ground! Under bottom is Bedrock!
        getBlock(wx, wy, wz) {
            const B = window.BLOCKS;
            if (wy <= 1) return B.BEDROCK.id; // Unbreakable bottom guard
            if (wy >= CHUNK_HEIGHT) return 0;

            const { cx, cz, lx, lz } = this.worldToChunkCoords(wx, wz);
            let chunk = this.chunks.get(this.chunkKey(cx, cz));
            if (!chunk || !chunk.generated) {
                chunk = this.getOrCreateChunk(cx, cz);
            }
            return chunk.getBlock(lx, wy, lz);
        }

        // Always finds authentic terrain surface Y (ignoring tree leaves/logs so players & mobs never snap to tree tops!)
        getHighestSolidY(wx, wz) {
            const { cx, cz, lx, lz } = this.worldToChunkCoords(wx, wz);
            let chunk = this.getOrCreateChunk(cx, cz);
            const B = window.BLOCKS;

            for (let y = CHUNK_HEIGHT - 1; y >= 2; y--) {
                const bId = chunk.getBlock(lx, y, lz);
                if (
                    bId === B.OAK_LEAVES.id ||
                    bId === B.BIRCH_LEAVES.id ||
                    bId === B.OAK_LOG.id ||
                    bId === B.BIRCH_LOG.id ||
                    bId === B.CACTUS.id
                ) {
                    continue;
                }
                const def = window.BLOCK_BY_ID[bId];
                if (def && def.solid && !def.liquid) {
                    return y;
                }
            }
            return 22; // Safe sea level fallback
        }

        // Finds walkable solid ground at or below startY (essential for underground Ancient City, caves & walking under trees)
        getGroundYBelow(wx, startY, wz) {
            const { cx, cz, lx, lz } = this.worldToChunkCoords(wx, wz);
            let chunk = this.getOrCreateChunk(cx, cz);
            const B = window.BLOCKS;
            const maxScanY = Math.min(CHUNK_HEIGHT - 3, Math.max(3, Math.floor(startY)));

            for (let y = maxScanY; y >= 2; y--) {
                const bId = chunk.getBlock(lx, y, lz);
                if (bId === B.OAK_LEAVES.id || bId === B.BIRCH_LEAVES.id) continue;
                const def = window.BLOCK_BY_ID[bId];
                if (def && def.solid && !def.liquid) {
                    const above1 = chunk.getBlock(lx, y + 1, lz);
                    const above2 = chunk.getBlock(lx, y + 2, lz);
                    const def1 = window.BLOCK_BY_ID[above1];
                    const def2 = window.BLOCK_BY_ID[above2];
                    if ((!def1 || !def1.solid) && (!def2 || !def2.solid)) {
                        return y;
                    }
                }
            }
            return this.getHighestSolidY(wx, wz);
        }

        setBlock(wx, wy, wz, blockId) {
            if (wy <= 1 || wy >= CHUNK_HEIGHT) return; // Prevent destroying bedrock bottom
            const { cx, cz, lx, lz } = this.worldToChunkCoords(wx, wz);
            const chunk = this.getOrCreateChunk(cx, cz);
            const oldId = chunk.getBlock(lx, wy, lz);
            chunk.setBlock(lx, wy, lz, blockId);

            // Waygate management
            const B = window.BLOCKS;
            if (blockId === B.WAYGATE.id) {
                this.teleportWaygates.push({ x: wx, y: wy, z: wz });
            } else if (oldId === B.WAYGATE.id) {
                this.teleportWaygates = this.teleportWaygates.filter(w => !(w.x === wx && w.y === wy && w.z === wz));
            }

            // Rebuild chunk mesh and borders
            this.rebuildChunkMesh(chunk);
            if (lx === 0) this.rebuildChunkMesh(this.getChunk(cx - 1, cz));
            if (lx === CHUNK_SIZE_X - 1) this.rebuildChunkMesh(this.getChunk(cx + 1, cz));
            if (lz === 0) this.rebuildChunkMesh(this.getChunk(cx, cz - 1));
            if (lz === CHUNK_SIZE_Z - 1) this.rebuildChunkMesh(this.getChunk(cx, cz + 1));
        }

        // Safe and Authentic Minecraft Gravity Physics for Sand and Gravel (Crash-free)
        applyGravityAbove(wx, startY, wz) {
            const B = window.BLOCKS;
            let checkY = startY + 1;
            while (checkY < CHUNK_HEIGHT) {
                const bId = this.getBlock(wx, checkY, wz);
                if (bId === B.SAND.id || bId === B.GRAVEL.id) {
                    let dropToY = checkY - 1;
                    while (dropToY >= 2) {
                        const belowId = this.getBlock(wx, dropToY, wz);
                        if (belowId === B.AIR.id || belowId === B.WATER.id) {
                            dropToY--;
                        } else {
                            break;
                        }
                    }
                    const targetY = dropToY + 1;
                    if (targetY < checkY) {
                        this.setBlock(wx, checkY, wz, B.AIR.id);
                        this.setBlock(wx, targetY, wz, bId);
                    }
                    checkY++;
                } else {
                    break;
                }
            }
        }

        isAncientCityChunk(cx, cz) {
            // Primary Ancient City spans chunks (1..2, 1..2) -> world X: 16..47, Z: 16..47
            // Plus repeating Ancient Cities every 10 chunks across the infinite world
            const modX = ((cx % 10) + 10) % 10;
            const modZ = ((cz % 10) + 10) % 10;
            return (modX === 1 || modX === 2) && (modZ === 1 || modZ === 2);
        }

        generateChunkTerrain(chunk) {
            if (chunk.generated) return;
            const B = window.BLOCKS;
            const cx = chunk.cx;
            const cz = chunk.cz;
            const surfaceHeights = new Uint8Array(CHUNK_SIZE_X * CHUNK_SIZE_Z);

            for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
                for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
                    const wx = cx * CHUNK_SIZE_X + lx;
                    const wz = cz * CHUNK_SIZE_Z + lz;

                    // Biome determination
                    const biomeNoise = this.noiseBiome.noise2D(wx * 0.005, wz * 0.005);
                    const isDesert = biomeNoise > 0.45;
                    const isMountains = biomeNoise < -0.45;
                    const isAstral = (biomeNoise > 0.15 && biomeNoise < 0.28);

                    // Base height calculation with smooth octaves
                    let height = 24;
                    const n1 = this.noiseTerrain.noise2D(wx * 0.015, wz * 0.015) * 12;
                    const n2 = this.noiseTerrain.noise2D(wx * 0.04, wz * 0.04) * 5;
                    const n3 = this.noiseTerrain.noise2D(wx * 0.1, wz * 0.1) * 2;
                    height += Math.floor(n1 + n2 + n3);

                    if (isMountains) height += Math.floor(Math.abs(this.noiseTerrain.noise2D(wx * 0.02, wz * 0.02)) * 18);
                    if (height < 20 && cx >= 0 && cx <= 2 && cz >= 0 && cz <= 2) height = 22; // Keep spawn & Ancient City roof solid
                    if (height < 6) height = 6;
                    if (height >= CHUNK_HEIGHT - 6) height = CHUNK_HEIGHT - 7;
                    surfaceHeights[ lz * CHUNK_SIZE_X + lx ] = height;

                    // Fill column
                    for (let y = 0; y < CHUNK_HEIGHT; y++) {
                        if (y <= 1) {
                            // ★ Double Bedrock Layer: Impossible to fall through into the void!
                            chunk.setBlock(lx, y, lz, B.BEDROCK.id);
                        } else if (y <= height) {
                            // 3D Cave generation (Safely isolated beneath 5 solid surface blocks)
                            const caveNoise = this.noiseCaves.noise3D(wx * 0.05, y * 0.08, wz * 0.05);
                            if (caveNoise > 0.65 && y > 4 && y < height - 5) {
                                chunk.setBlock(lx, y, lz, B.AIR.id);
                                continue;
                            }

                            if (y === height) {
                                // Surface layer
                                if (isDesert) {
                                    chunk.setBlock(lx, y, lz, B.SAND.id);
                                } else if (isAstral) {
                                    chunk.setBlock(lx, y, lz, B.ASTRAL_BLOCK.id);
                                } else if (height > 45) {
                                    chunk.setBlock(lx, y, lz, B.SNOW.id);
                                } else {
                                    chunk.setBlock(lx, y, lz, B.GRASS.id);
                                }
                            } else if (y >= height - 3) {
                                chunk.setBlock(lx, y, lz, isDesert ? B.SAND.id : B.DIRT.id);
                            } else {
                                // Underground Stone, Deepslate (Y < 15) and Ores
                                let block = (y < 15 && B.DEEPSLATE) ? B.DEEPSLATE.id : B.STONE.id;
                                const oreNoise = Math.sin(wx * 3.7 + y * 7.1 + wz * 5.3);

                                if (y < 12 && oreNoise > 0.85) {
                                    block = B.ASTRAL_ORE.id;
                                } else if (y < 16 && oreNoise > 0.78) {
                                    block = B.DIAMOND_ORE.id;
                                } else if (y < 25 && oreNoise > 0.72) {
                                    block = B.GOLD_ORE.id;
                                } else if (y < 35 && oreNoise > 0.65) {
                                    block = B.REDSTONE_ORE.id;
                                } else if (y < 45 && oreNoise > 0.58) {
                                    block = B.IRON_ORE.id;
                                } else if (oreNoise > 0.45) {
                                    block = B.COAL_ORE.id;
                                }
                                chunk.setBlock(lx, y, lz, block);
                            }
                        } else if (y <= WATER_LEVEL) {
                            chunk.setBlock(lx, y, lz, B.WATER.id);
                        }
                    }

                    // Trees & Foliage Generation (Skip over village house footprint or Ancient City entrance)
                    const isHouseArea = (cx === 0 && cz === 1 && lx >= 3 && lx <= 11 && lz >= 3 && lz <= 11);
                    const isStairEntrance = (cx === 1 && cz === 0 && lx >= 0 && lx <= 6 && lz >= 10 && lz <= 15);
                    const surfaceBlock = chunk.getBlock(lx, height, lz);
                    if (!isHouseArea && !isStairEntrance && surfaceBlock === B.GRASS.id && height > WATER_LEVEL) {
                        const treeNoise = Math.sin(wx * 12.3 + wz * 43.1);
                        if (treeNoise > 0.82 && lx >= 2 && lx <= CHUNK_SIZE_X - 3 && lz >= 2 && lz <= CHUNK_SIZE_Z - 3) {
                            this.generateTree(chunk, lx, height + 1, lz, treeNoise > 0.92 ? 'birch' : 'oak');
                        } else if (treeNoise > 0.65) {
                            chunk.setBlock(lx, height + 1, lz, treeNoise > 0.73 ? B.FLOWER_RED.id : B.FLOWER_YELLOW.id);
                        }
                    } else if (surfaceBlock === B.SAND.id && height > WATER_LEVEL) {
                        const cactusNoise = Math.sin(wx * 19.3 + wz * 11.7);
                        if (cactusNoise > 0.9) {
                            chunk.setBlock(lx, height + 1, lz, B.CACTUS.id);
                            chunk.setBlock(lx, height + 2, lz, B.CACTUS.id);
                        }
                    }
                }
            }

            // ★ Generate Authentic Underground ANCIENT CITY (Deep Dark Y = 5..16)
            if (this.isAncientCityChunk(cx, cz)) {
                this.generateAncientCityInChunk(chunk);
            }

            // ★ Generate Surface Entrance Portal Ruin & Grand Staircase down to the Ancient City (in chunk 1, 0)
            if (cx === 1 && cz === 0) {
                this.generateAncientCityEntranceStairs(chunk, surfaceHeights);
            }

            // ★ Generate Authentic Minecraft Village House near spawn (in chunk 0, 1)
            if (cx === 0 && cz === 1) {
                this.generateVillageHouse(chunk, surfaceHeights);
            }

            // ★ Generate Authentic Underground STRONGHOLD (要塞 & エンドポータル部屋) in chunk (3, 3 -> wx: 48..63, wz: 48..63)
            if (cx === 3 && cz === 3) {
                this.generateStronghold(chunk, surfaceHeights);
            }

            chunk.generated = true;
        }

        // ★ Authentic Minecraft 1.19+ Ancient City (Deep Dark) Generator
        generateAncientCityInChunk(chunk) {
            const B = window.BLOCKS;
            const cx = chunk.cx;
            const cz = chunk.cz;

            for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
                for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
                    const wx = cx * CHUNK_SIZE_X + lx;
                    const wz = cz * CHUNK_SIZE_Z + lz;

                    // Local coordinates within the 32x32 Ancient City (0..31, 0..31), center at (16, 16) -> world (32, 32)
                    const ax = ((wx - 16) % 160 + 160) % 160;
                    const az = ((wz - 16) % 160 + 160) % 160;
                    if (ax >= 32 || az >= 32) continue;

                    // 1. Solid Deepslate Ceiling & Subfloor
                    chunk.setBlock(lx, 4, lz, B.DEEPSLATE.id);
                    chunk.setBlock(lx, 17, lz, B.DEEPSLATE.id);

                    // 2. Carve out the grand underground hall (Y = 6..16)
                    for (let y = 6; y <= 16; y++) {
                        chunk.setBlock(lx, y, lz, B.AIR.id);
                    }

                    // 3. Ancient City Floor (Y = 5): Corridors of Deepslate Tiles/Bricks + Sculk infestation
                    const isMainCorridor = (Math.abs(ax - 16) <= 3 || Math.abs(az - 16) <= 3);
                    const sculkPattern = Math.sin(wx * 0.45 + wz * 0.35) + Math.cos(wx * 0.25 - wz * 0.5);
                    if (isMainCorridor) {
                        chunk.setBlock(lx, 5, lz, (ax + az) % 2 === 0 ? B.DEEPSLATE_TILES.id : B.DEEPSLATE_BRICKS.id);
                    } else if (sculkPattern > 0.45) {
                        chunk.setBlock(lx, 5, lz, B.SCULK.id);
                        if (sculkPattern > 1.45 && (ax + az) % 5 === 0) {
                            chunk.setBlock(lx, 5, lz, B.SCULK_CATALYST.id);
                        }
                    } else {
                        chunk.setBlock(lx, 5, lz, B.DEEPSLATE_BRICKS.id);
                    }

                    // 4. Perimeter Walls with Archways
                    if (ax === 0 || ax === 31 || az === 0 || az === 31) {
                        const isEntranceArch = (az === 0 && ax >= 2 && ax <= 5);
                        if (!isEntranceArch) {
                            for (let y = 6; y <= 16; y++) {
                                chunk.setBlock(lx, y, lz, (y % 4 === 0) ? B.DEEPSLATE_TILES.id : B.DEEPSLATE_BRICKS.id);
                            }
                        }
                        continue;
                    }

                    // 5. Colonnade Pillars & Soul Lanterns along the Grand Corridors
                    const isPillar = ((ax === 6 || ax === 12 || ax === 20 || ax === 26) && (az === 6 || az === 12 || az === 20 || az === 26));
                    if (isPillar) {
                        for (let y = 6; y <= 16; y++) {
                            chunk.setBlock(lx, y, lz, (y === 6 || y === 15) ? B.DEEPSLATE_TILES.id : B.DEEPSLATE_BRICKS.id);
                        }
                        chunk.setBlock(lx, 10, lz, B.SCULK_CATALYST.id);
                    }
                    // Soul Lanterns next to pillars & walkways
                    if ((ax === 7 || ax === 13 || ax === 19 || ax === 25) && (az === 6 || az === 12 || az === 20 || az === 26)) {
                        chunk.setBlock(lx, 6, lz, B.SOUL_LANTERN.id);
                    }

                    // 6. Central Warden Altar & Giant Reinforced Deepslate Portal (ax = 11..21, az = 14..18)
                    if (ax >= 10 && ax <= 22 && az >= 13 && az <= 19) {
                        // Raised Deepslate Tile Altar Platform at Y = 6
                        chunk.setBlock(lx, 6, lz, B.DEEPSLATE_TILES.id);

                        // Giant Reinforced Deepslate Portal Frame at az === 16, ax = 11..21, Y = 7..14
                        if (az === 16 && ax >= 11 && ax <= 21) {
                            // Bottom & Top horizontal bars (Y = 7, 8 and Y = 14) + Left & Right vertical pillars (ax = 11, 12 and ax = 20, 21)
                            if (ax === 11 || ax === 21) {
                                for (let y = 7; y <= 14; y++) {
                                    chunk.setBlock(lx, y, lz, B.REINFORCED_DEEPSLATE.id);
                                }
                            } else {
                                chunk.setBlock(lx, 7, lz, B.REINFORCED_DEEPSLATE.id);
                                chunk.setBlock(lx, 14, lz, B.REINFORCED_DEEPSLATE.id);
                            }
                        }

                        // Sculk Shriekers & Soul Lanterns guarding the Altar
                        if ((ax === 11 || ax === 21) && (az === 14 || az === 18)) {
                            chunk.setBlock(lx, 7, lz, B.SOUL_LANTERN.id);
                        }
                        if (ax === 16 && (az === 14 || az === 18)) {
                            chunk.setBlock(lx, 7, lz, B.SCULK_SHRIEKER.id);
                        }
                    }

                    // 7. Ancient City Loot Shrines (Left & Right Wings)
                    if ((ax === 4 || ax === 27) && az === 16) {
                        chunk.setBlock(lx, 6, lz, B.DEEPSLATE_TILES.id);
                        chunk.setBlock(lx, 7, lz, B.CHEST.id);
                    }
                    if ((ax === 4 || ax === 27) && (az === 15 || az === 17)) {
                        chunk.setBlock(lx, 6, lz, B.SCULK_CATALYST.id);
                        chunk.setBlock(lx, 7, lz, B.SOUL_LANTERN.id);
                    }
                }
            }
        }

        // ★ Surface Ruin Gate & Staircase leading from (wx=18..21, wz=10..15) down into the Ancient City
        generateAncientCityEntranceStairs(chunk, surfaceHeights) {
            const B = window.BLOCKS;
            const baseH = surfaceHeights[10 * CHUNK_SIZE_X + 3] || 23;

            // Surface Deepslate Ruin Archway at lx = 2..5 (wx = 18..21), lz = 9..10 (wz = 9..10)
            for (let lx = 2; lx <= 5; lx++) {
                for (let y = baseH + 1; y <= baseH + 4; y++) {
                    if (lx === 2 || lx === 5 || y === baseH + 4) {
                        chunk.setBlock(lx, y, 9, y === baseH + 4 ? B.REINFORCED_DEEPSLATE.id : B.DEEPSLATE_BRICKS.id);
                    } else {
                        chunk.setBlock(lx, y, 9, B.AIR.id);
                    }
                }
            }
            chunk.setBlock(2, baseH + 2, 8, B.SOUL_LANTERN.id);
            chunk.setBlock(5, baseH + 2, 8, B.SOUL_LANTERN.id);

            // Stepped Tunnel descending from lz = 10..15 into the Ancient City North Arch
            for (let lz = 10; lz < CHUNK_SIZE_Z; lz++) {
                const stepIndex = lz - 10; // 0..5
                const floorY = Math.max(6, baseH - stepIndex * 3);
                for (let lx = 2; lx <= 5; lx++) {
                    chunk.setBlock(lx, floorY, lz, B.DEEPSLATE_TILES.id);
                    for (let y = floorY + 1; y <= baseH + 3; y++) {
                        chunk.setBlock(lx, y, lz, B.AIR.id);
                    }
                    if (lx === 2 || lx === 5) {
                        chunk.setBlock(lx, floorY + 1, lz, B.DEEPSLATE_BRICKS.id);
                        if (lz % 2 === 0) chunk.setBlock(lx, floorY + 2, lz, B.SOUL_LANTERN.id);
                    }
                }
            }
        }

        // ★ Authentic Minecraft Village House near spawn (chunk 0, 1 -> wx = 4..10, wz = 20..26)
        generateVillageHouse(chunk, surfaceHeights) {
            const B = window.BLOCKS;
            const baseH = surfaceHeights[6 * CHUNK_SIZE_X + 6] || 23;
            if (baseH <= WATER_LEVEL) return;

            for (let lx = 4; lx <= 10; lx++) {
                for (let lz = 4; lz <= 10; lz++) {
                    // Foundation & Oak Plank Floor
                    for (let y = baseH - 2; y < baseH; y++) {
                        chunk.setBlock(lx, y, lz, B.COBBLESTONE.id);
                    }
                    chunk.setBlock(lx, baseH, lz, B.OAK_PLANKS.id);

                    // Clear interior & above
                    for (let y = baseH + 1; y <= baseH + 6; y++) {
                        chunk.setBlock(lx, y, lz, B.AIR.id);
                    }

                    const isCorner = (lx === 4 || lx === 10) && (lz === 4 || lz === 10);
                    const isWall = (lx === 4 || lx === 10 || lz === 4 || lz === 10);
                    const isDoor = (lz === 4 && lx === 7);

                    if (isWall) {
                        for (let y = baseH + 1; y <= baseH + 3; y++) {
                            if (isDoor && y <= baseH + 2) {
                                chunk.setBlock(lx, y, lz, B.AIR.id);
                            } else if (isCorner) {
                                chunk.setBlock(lx, y, lz, B.OAK_LOG.id);
                            } else if (y === baseH + 2 && (lx === 7 || lz === 7)) {
                                chunk.setBlock(lx, y, lz, B.GLASS.id);
                            } else {
                                chunk.setBlock(lx, y, lz, B.OAK_PLANKS.id);
                            }
                        }
                    }

                    // Pitched Roof
                    const distEdge = Math.min(lx - 4, 10 - lx, lz - 4, 10 - lz);
                    chunk.setBlock(lx, baseH + 4 + Math.min(2, distEdge), lz, distEdge === 0 ? B.COBBLESTONE.id : B.OAK_PLANKS.id);
                }
            }

            // Interior Furnishings (Crafting Table, Furnace, Chest, Torch)
            chunk.setBlock(5, baseH + 1, 9, B.CRAFTING_TABLE.id);
            chunk.setBlock(6, baseH + 1, 9, B.FURNACE.id);
            chunk.setBlock(9, baseH + 1, 9, B.CHEST.id);
            chunk.setBlock(7, baseH + 3, 7, B.TORCH.id);
        }

        // ★ Authentic Minecraft Underground STRONGHOLD & End Portal Room Generator
        generateStronghold(chunk, surfaceHeights) {
            const B = window.BLOCKS;
            const floorY = 12;
            const ceilY = 22;

            // 1. Excavate underground area and line with Stone Bricks
            for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
                for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
                    chunk.setBlock(lx, floorY, lz, (lx + lz) % 7 === 0 ? B.CRACKED_STONE_BRICKS.id : ((lx + lz) % 5 === 0 ? B.MOSSY_COBBLESTONE.id : B.STONE_BRICKS.id));
                    chunk.setBlock(lx, ceilY, lz, B.STONE_BRICKS.id);
                    for (let y = floorY + 1; y < ceilY; y++) {
                        chunk.setBlock(lx, y, lz, B.AIR.id);
                    }
                    if (lx === 0 || lx === 15 || lz === 0 || lz === 15) {
                        for (let y = floorY + 1; y < ceilY; y++) {
                            chunk.setBlock(lx, y, lz, (y + lx + lz) % 6 === 0 ? B.CRACKED_STONE_BRICKS.id : B.STONE_BRICKS.id);
                        }
                    }
                }
            }

            // 2. Stronghold Corridor & Iron Bars Jail (lx: 1..6, lz: 1..14)
            for (let lz = 1; lz <= 14; lz++) {
                chunk.setBlock(6, floorY + 1, lz, B.STONE_BRICKS.id);
                chunk.setBlock(6, floorY + 2, lz, (lz === 7 || lz === 8) ? B.AIR.id : B.IRON_BARS.id);
                chunk.setBlock(6, floorY + 3, lz, (lz === 7 || lz === 8) ? B.AIR.id : B.IRON_BARS.id);
                chunk.setBlock(6, floorY + 4, lz, B.STONE_BRICKS.id);
            }

            // Stronghold Chest in Library/Jail (lx: 2, lz: 4)
            chunk.setBlock(2, floorY + 1, 4, B.CHEST.id);
            // Bookshelves in corridor
            for (let by = floorY + 1; by <= floorY + 3; by++) {
                chunk.setBlock(1, by, 2, B.BOOKSHELF.id);
                chunk.setBlock(1, by, 3, B.BOOKSHELF.id);
                chunk.setBlock(2, by, 1, B.BOOKSHELF.id);
                chunk.setBlock(3, by, 1, B.BOOKSHELF.id);
            }
            chunk.setBlock(3, floorY + 1, 3, B.CRAFTING_TABLE.id);
            chunk.setBlock(1, floorY + 3, 5, B.TORCH.id);

            // 3. The End Portal Room (lx: 7..14, lz: 7..14)
            // Center of portal is at lx = 11, lz = 11, Y = 15
            const portalCenterX = 11;
            const portalCenterZ = 11;
            const portalY = 15;

            // Lava Pool at Y = 14 (3x3)
            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    chunk.setBlock(portalCenterX + dx, portalY - 1, portalCenterZ + dz, B.LAVA.id);
                    chunk.setBlock(portalCenterX + dx, portalY, portalCenterZ + dz, B.AIR.id); // Center starts as AIR
                }
            }

            // 12 End Portal Frames surrounding the 3x3 lava pool at Y = 15
            for (let dx = -1; dx <= 1; dx++) {
                chunk.setBlock(portalCenterX + dx, portalY, portalCenterZ - 2, B.END_PORTAL_FRAME.id); // North
                chunk.setBlock(portalCenterX + dx, portalY, portalCenterZ + 2, B.END_PORTAL_FRAME.id); // South
            }
            for (let dz = -1; dz <= 1; dz++) {
                chunk.setBlock(portalCenterX - 2, portalY, portalCenterZ + dz, B.END_PORTAL_FRAME.id); // West
                chunk.setBlock(portalCenterX + 2, portalY, portalCenterZ + dz, B.END_PORTAL_FRAME.id); // East
            }

            // Portal room torches
            chunk.setBlock(7, floorY + 3, 7, B.TORCH.id);
            chunk.setBlock(14, floorY + 3, 7, B.TORCH.id);
            chunk.setBlock(7, floorY + 3, 14, B.TORCH.id);
            chunk.setBlock(14, floorY + 3, 14, B.TORCH.id);

            // 4. Staircase ascending to surface at lx: 2, lz: 13
            const baseH = surfaceHeights ? (surfaceHeights[13 * CHUNK_SIZE_X + 2] || 24) : 24;
            let curY = floorY + 1;
            for (let step = 0; step < 10 && curY < baseH; step++) {
                const sy = curY + step;
                chunk.setBlock(2, sy, 13, B.COBBLESTONE.id);
                chunk.setBlock(2, sy + 1, 13, B.AIR.id);
                chunk.setBlock(2, sy + 2, 13, B.AIR.id);
                chunk.setBlock(2, sy + 3, 13, B.AIR.id);
            }
        }

        // ★ Authentic The End Dimension Generator (End Stone Island, Obsidian Pillars, End Crystals, Ender Dragon)
        generateTheEndIsland() {
            const B = window.BLOCKS;

            // Generate central 80x80 floating End Stone Island
            const islandRadius = 38;
            for (let x = -islandRadius; x <= islandRadius; x++) {
                for (let z = -islandRadius; z <= islandRadius; z++) {
                    const distSq = (x * x) / (islandRadius * islandRadius) + (z * z) / (islandRadius * islandRadius);
                    if (distSq <= 1.0) {
                        const edgeFactor = 1.0 - distSq;
                        const topY = Math.floor(62 + edgeFactor * 4);
                        const bottomY = Math.floor(58 - edgeFactor * 14);
                        for (let y = bottomY; y <= topY; y++) {
                            this.setBlock(x, y, z, B.END_STONE.id);
                        }
                    }
                }
            }

            // 8 Tall Obsidian Pillars surrounding the island at radius 26
            const numPillars = 8;
            const pillarRadius = 26;
            this.endCrystalPositions = [];
            for (let i = 0; i < numPillars; i++) {
                const angle = (i / numPillars) * Math.PI * 2;
                const px = Math.round(Math.cos(angle) * pillarRadius);
                const pz = Math.round(Math.sin(angle) * pillarRadius);
                const pillarHeight = 76 + (i % 3) * 6; // Y = 76, 82, 88
                for (let y = 60; y <= pillarHeight; y++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dz = -1; dz <= 1; dz++) {
                            this.setBlock(px + dx, y, pz + dz, B.OBSIDIAN.id);
                        }
                    }
                }
                this.endCrystalPositions.push({ x: px, y: pillarHeight + 1, z: pz });
            }

            // Center Exit Bedrock Portal Structure at (0, 62, 0)
            for (let dx = -2; dx <= 2; dx++) {
                for (let dz = -2; dz <= 2; dz++) {
                    const isBorder = (Math.abs(dx) === 2 || Math.abs(dz) === 2);
                    if (isBorder) {
                        this.setBlock(dx, 62, dz, B.BEDROCK.id);
                    } else if (dx === 0 && dz === 0) {
                        for (let y = 62; y <= 66; y++) {
                            this.setBlock(0, y, 0, B.BEDROCK.id);
                        }
                        this.setBlock(1, 66, 0, B.TORCH.id);
                        this.setBlock(-1, 66, 0, B.TORCH.id);
                        this.setBlock(0, 66, 1, B.TORCH.id);
                        this.setBlock(0, 66, -1, B.TORCH.id);
                    } else {
                        this.setBlock(dx, 61, dz, B.BEDROCK.id);
                        this.setBlock(dx, 62, dz, B.AIR.id); // Will become END_PORTAL upon dragon defeat!
                    }
                }
            }
        }

        generateTree(chunk, x, y, z, type = 'oak') {
            const B = window.BLOCKS;
            const logId = type === 'birch' ? B.BIRCH_LOG.id : B.OAK_LOG.id;
            const leavesId = type === 'birch' ? B.BIRCH_LEAVES.id : B.OAK_LEAVES.id;
            const trunkHeight = 4 + Math.floor(Math.random() * 2);

            for (let ty = 0; ty < trunkHeight; ty++) {
                chunk.setBlock(x, y + ty, z, logId);
            }

            const leafBase = y + trunkHeight - 2;
            for (let ly = leafBase; ly <= y + trunkHeight + 1; ly++) {
                const radius = ly >= y + trunkHeight ? 1 : 2;
                for (let dx = -radius; dx <= radius; dx++) {
                    for (let dz = -radius; dz <= radius; dz++) {
                        if (dx === 0 && dz === 0 && ly < y + trunkHeight) continue;
                        if (Math.abs(dx) === radius && Math.abs(dz) === radius && Math.random() < 0.4) continue;
                        if (chunk.getBlock(x + dx, ly, z + dz) === 0) {
                            chunk.setBlock(x + dx, ly, z + dz, leavesId);
                        }
                    }
                }
            }
        }

        rebuildChunkMesh(chunk) {
            if (!chunk || !chunk.generated) return;

            const positions = [];
            const normals = [];
            const uvs = [];
            const colors = [];

            const waterPositions = [];
            const waterNormals = [];
            const waterUvs = [];
            const waterColors = [];

            const B = window.BLOCKS;
            const cx = chunk.cx;
            const cz = chunk.cz;

            for (let x = 0; x < CHUNK_SIZE_X; x++) {
                for (let z = 0; z < CHUNK_SIZE_Z; z++) {
                    for (let y = 0; y < CHUNK_HEIGHT; y++) {
                        const blockId = chunk.getBlock(x, y, z);
                        if (blockId === B.AIR.id) continue;

                        const def = window.BLOCK_BY_ID[blockId];
                        if (!def) continue;

                        const wx = cx * CHUNK_SIZE_X + x;
                        const wz = cz * CHUNK_SIZE_Z + z;
                        const isWater = (blockId === B.WATER.id);

                        if (def.crossModel) {
                            const uvMap = this.atlas.getBlockUVs(blockId);
                            const texName = (typeof uvMap === 'string') ? uvMap : (uvMap?.all || 'flower_red');
                            const uv = this.atlas.getUVs(texName);
                            this.addCrossFace(positions, normals, uvs, colors, wx, y, wz, uv);
                            continue;
                        }

                        for (let f = 0; f < FACES.length; f++) {
                            const face = FACES[f];
                            const nx = wx + face.dir[0];
                            const ny = y + face.dir[1];
                            const nz = wz + face.dir[2];

                            const neighborId = this.getBlock(nx, ny, nz);
                            const neighborDef = window.BLOCK_BY_ID[neighborId];

                            let shouldRender = false;
                            if (isWater) {
                                shouldRender = (neighborId === B.AIR.id);
                            } else if (def.transparent) {
                                shouldRender = (neighborId === B.AIR.id || (neighborDef && neighborDef.liquid));
                            } else {
                                shouldRender = (!neighborDef || !neighborDef.solid || neighborDef.transparent);
                            }

                            if (!shouldRender) continue;

                            const uvMapping = this.atlas.getBlockUVs(blockId);
                            let texName = '';
                            if (typeof uvMapping === 'string') {
                                texName = uvMapping;
                            } else if (uvMapping) {
                                if (face.name === 'top') texName = uvMapping.top || uvMapping.all;
                                else if (face.name === 'bottom') texName = uvMapping.bottom || uvMapping.all;
                                else if (face.name === 'front' && uvMapping.front) texName = uvMapping.front;
                                else texName = uvMapping.side || uvMapping.all || 'stone';
                            } else {
                                texName = 'stone';
                            }

                            const uv = this.atlas.getUVs(texName);
                            const lightLevel = face.ao;

                            const targetPos = isWater ? waterPositions : positions;
                            const targetNorm = isWater ? waterNormals : normals;
                            const targetUvs = isWater ? waterUvs : uvs;
                            const targetCol = isWater ? waterColors : colors;

                            this.addQuadFace(targetPos, targetNorm, targetUvs, targetCol, wx, y, wz, face, uv, lightLevel);
                        }
                    }
                }
            }

            if (chunk.mesh) {
                this.scene.remove(chunk.mesh);
                chunk.mesh.geometry.dispose();
                chunk.mesh = null;
            }
            if (positions.length > 0) {
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
                geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                chunk.mesh = new THREE.Mesh(geometry, this.material);
                this.scene.add(chunk.mesh);
            }

            if (chunk.waterMesh) {
                this.scene.remove(chunk.waterMesh);
                chunk.waterMesh.geometry.dispose();
                chunk.waterMesh = null;
            }
            if (waterPositions.length > 0) {
                const wGeo = new THREE.BufferGeometry();
                wGeo.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3));
                wGeo.setAttribute('normal', new THREE.Float32BufferAttribute(waterNormals, 3));
                wGeo.setAttribute('uv', new THREE.Float32BufferAttribute(waterUvs, 2));
                wGeo.setAttribute('color', new THREE.Float32BufferAttribute(waterColors, 3));
                chunk.waterMesh = new THREE.Mesh(wGeo, this.waterMaterial);
                this.scene.add(chunk.waterMesh);
            }

            chunk.isDirty = false;
        }

        addQuadFace(pos, norm, uvs, cols, x, y, z, face, uv, light) {
            const c = face.corners;
            const indices = [0, 1, 2, 0, 2, 3];
            const uvCoords = [
                [uv.uMin, uv.vMin],
                [uv.uMin, uv.vMax],
                [uv.uMax, uv.vMax],
                [uv.uMax, uv.vMin]
            ];

            for (let i = 0; i < indices.length; i++) {
                const idx = indices[i];
                pos.push(x + c[idx][0], y + c[idx][1], z + c[idx][2]);
                norm.push(face.dir[0], face.dir[1], face.dir[2]);
                uvs.push(uvCoords[idx][0], uvCoords[idx][1]);
                cols.push(light, light, light);
            }
        }

        addCrossFace(pos, norm, uvs, cols, x, y, z, uv) {
            const p1 = [x, y, z,  x+1, y+1, z+1,  x+1, y, z+1,  x, y, z,  x, y+1, z,  x+1, y+1, z+1];
            const p2 = [x+1, y, z,  x, y+1, z+1,  x, y, z+1,  x, y, z,  x+1, y+1, z,  x, y+1, z+1];

            const uvQuad = [
                uv.uMin, uv.vMin,  uv.uMax, uv.vMax,  uv.uMax, uv.vMin,
                uv.uMin, uv.vMin,  uv.uMin, uv.vMax,  uv.uMax, uv.vMax
            ];

            for (let i = 0; i < p1.length; i += 3) {
                pos.push(p1[i], p1[i+1], p1[i+2]);
                norm.push(0, 1, 0);
                cols.push(1, 1, 1);
            }
            for (let i = 0; i < p2.length; i += 3) {
                pos.push(p2[i], p2[i+1], p2[i+2]);
                norm.push(0, 1, 0);
                cols.push(1, 1, 1);
            }
            uvs.push(...uvQuad, ...uvQuad);
        }

        // Guaranteed streaming: Player chunk and immediate surroundings ALWAYS generated synchronously!
        updateChunksAround(px, pz, loadRadius = 3, unloadRadius = 5) {
            const { cx, cz } = this.worldToChunkCoords(px, pz);

            // 1. Unload distant chunk meshes only (keep data intact so no empty holes exist)
            for (let [key, chunk] of this.chunks) {
                const dist = Math.max(Math.abs(chunk.cx - cx), Math.abs(chunk.cz - cz));
                if (dist > unloadRadius) {
                    if (chunk.mesh) {
                        this.scene.remove(chunk.mesh);
                        chunk.mesh.geometry.dispose();
                        chunk.mesh = null;
                        chunk.isDirty = true;
                    }
                    if (chunk.waterMesh) {
                        this.scene.remove(chunk.waterMesh);
                        chunk.waterMesh.geometry.dispose();
                        chunk.waterMesh = null;
                        chunk.isDirty = true;
                    }
                }
            }

            // 2. Immediate guarantee for player's current and adjacent 3x3 chunks
            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const chunk = this.getOrCreateChunk(cx + dx, cz + dz);
                    if (chunk.isDirty) {
                        this.rebuildChunkMesh(chunk);
                    }
                }
            }

            // 3. Wider radius chunk generation (Incremental: rebuild at most 1 outer chunk per frame for smooth 60 FPS)
            let outerRebuilt = 0;
            for (let dx = -loadRadius; dx <= loadRadius; dx++) {
                for (let dz = -loadRadius; dz <= loadRadius; dz++) {
                    if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1) continue;
                    const chunk = this.getOrCreateChunk(cx + dx, cz + dz);
                    if (chunk.isDirty) {
                        this.rebuildChunkMesh(chunk);
                        outerRebuilt++;
                        if (outerRebuilt >= 1) return;
                    }
                }
            }
        }
    }

    global.World = World;
})(window);
