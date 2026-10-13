// Voxel World Engine, Procedural Biomes & Chunk Meshing for NovaCraft
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

            this.teleportWaygates = []; // registered waygates [{x,y,z}]
        }

        chunkKey(cx, cz) {
            return `${cx},${cz}`;
        }

        getChunk(cx, cz) {
            return this.chunks.get(this.chunkKey(cx, cz));
        }

        getOrCreateChunk(cx, cz) {
            const key = this.chunkKey(cx, cz);
            let chunk = this.chunks.get(key);
            if (!chunk) {
                chunk = new Chunk(cx, cz, this);
                this.chunks.set(key, chunk);
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

        getBlock(wx, wy, wz) {
            if (wy < 0 || wy >= CHUNK_HEIGHT) return 0;
            const { cx, cz, lx, lz } = this.worldToChunkCoords(wx, wz);
            const chunk = this.getChunk(cx, cz);
            if (!chunk) return 0;
            return chunk.getBlock(lx, wy, lz);
        }

        getHighestSolidY(wx, wz) {
            const { cx, cz, lx, lz } = this.worldToChunkCoords(wx, wz);
            let chunk = this.getOrCreateChunk(cx, cz);
            if (!chunk.generated) {
                this.generateChunkTerrain(chunk);
            }
            for (let y = CHUNK_HEIGHT - 1; y >= 1; y--) {
                const bId = chunk.getBlock(lx, y, lz);
                const def = window.BLOCK_BY_ID[bId];
                if (def && def.solid && !def.liquid) {
                    return y;
                }
            }
            return 20; // Fallback sea level
        }

        setBlock(wx, wy, wz, blockId) {
            if (wy < 0 || wy >= CHUNK_HEIGHT) return;
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

            // Rebuild chunk mesh and neighbors if on border
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
                    while (dropToY >= 1) {
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

        generateChunkTerrain(chunk) {
            if (chunk.generated) return;
            const B = window.BLOCKS;
            const cx = chunk.cx;
            const cz = chunk.cz;

            for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
                for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
                    const wx = cx * CHUNK_SIZE_X + lx;
                    const wz = cz * CHUNK_SIZE_Z + lz;

                    // Biome determination
                    const biomeNoise = this.noiseBiome.noise2D(wx * 0.005, wz * 0.005);
                    const isDesert = biomeNoise > 0.45;
                    const isMountains = biomeNoise < -0.45;
                    const isAstral = (biomeNoise > 0.15 && biomeNoise < 0.28); // ★ Rare Astral Biome!

                    // Base height calculation with octaves
                    let height = 24;
                    const n1 = this.noiseTerrain.noise2D(wx * 0.015, wz * 0.015) * 12;
                    const n2 = this.noiseTerrain.noise2D(wx * 0.04, wz * 0.04) * 5;
                    const n3 = this.noiseTerrain.noise2D(wx * 0.1, wz * 0.1) * 2;
                    height += Math.floor(n1 + n2 + n3);

                    if (isMountains) height += Math.floor(Math.abs(this.noiseTerrain.noise2D(wx * 0.02, wz * 0.02)) * 18);
                    if (height < 2) height = 2;
                    if (height >= CHUNK_HEIGHT - 6) height = CHUNK_HEIGHT - 7;

                    // Fill column
                    for (let y = 0; y < CHUNK_HEIGHT; y++) {
                        if (y === 0) {
                            chunk.setBlock(lx, y, lz, B.BEDROCK.id);
                        } else if (y <= height) {
                            // 3D Cave generation
                            const caveNoise = this.noiseCaves.noise3D(wx * 0.05, y * 0.08, wz * 0.05);
                            if (caveNoise > 0.62 && y > 3 && y < height - 2) {
                                chunk.setBlock(lx, y, lz, B.AIR.id); // Hollow cave
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
                                // Underground Stone and Ores
                                let block = B.STONE.id;
                                const oreNoise = Math.sin(wx * 3.7 + y * 7.1 + wz * 5.3);

                                // Ore veins
                                if (y < 12 && oreNoise > 0.85) {
                                    block = B.ASTRAL_ORE.id; // ★ Rare Astral Ore at bedrock
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

                    // Trees & Foliage Generation
                    const surfaceBlock = chunk.getBlock(lx, height, lz);
                    if (surfaceBlock === B.GRASS.id && height > WATER_LEVEL) {
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
            chunk.generated = true;
        }

        generateTree(chunk, x, y, z, type = 'oak') {
            const B = window.BLOCKS;
            const logId = type === 'birch' ? B.BIRCH_LOG.id : B.OAK_LOG.id;
            const leavesId = type === 'birch' ? B.BIRCH_LEAVES.id : B.OAK_LEAVES.id;
            const trunkHeight = 4 + Math.floor(Math.random() * 2);

            // Trunk
            for (let ty = 0; ty < trunkHeight; ty++) {
                chunk.setBlock(x, y + ty, z, logId);
            }

            // Leaves Crown
            const leafBase = y + trunkHeight - 2;
            for (let ly = leafBase; ly <= y + trunkHeight + 1; ly++) {
                const radius = ly >= y + trunkHeight ? 1 : 2;
                for (let dx = -radius; dx <= radius; dx++) {
                    for (let dz = -radius; dz <= radius; dz++) {
                        if (dx === 0 && dz === 0 && ly < y + trunkHeight) continue;
                        if (Math.abs(dx) === radius && Math.abs(dz) === radius && (ly === y + trunkHeight + 1 || Math.random() > 0.5)) continue;
                        const nx = x + dx;
                        const nz = z + dz;
                        if (nx >= 0 && nx < CHUNK_SIZE_X && nz >= 0 && nz < CHUNK_SIZE_Z) {
                            if (chunk.getBlock(nx, ly, nz) === B.AIR.id) {
                                chunk.setBlock(nx, ly, nz, leavesId);
                            }
                        }
                    }
                }
            }
        }

        // Rebuild 3D Mesh for Chunk with Face Culling & Texture Mapping
        rebuildChunkMesh(chunk) {
            if (!chunk) return;
            const B = window.BLOCKS;

            const positions = [];
            const normals = [];
            const uvs = [];
            const colors = [];

            const waterPositions = [];
            const waterNormals = [];
            const waterUvs = [];
            const waterColors = [];

            const cx = chunk.cx;
            const cz = chunk.cz;

            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                for (let z = 0; z < CHUNK_SIZE_Z; z++) {
                    for (let x = 0; x < CHUNK_SIZE_X; x++) {
                        const blockId = chunk.getBlock(x, y, z);
                        if (blockId === B.AIR.id) continue;

                        const blockDef = window.BLOCK_BY_ID[blockId];
                        const isWater = (blockId === B.WATER.id);
                        const isCross = (blockId === B.FLOWER_RED.id || blockId === B.FLOWER_YELLOW.id || blockId === B.TORCH.id || blockId === B.HEALING_TORCH.id);

                        const wx = cx * CHUNK_SIZE_X + x;
                        const wz = cz * CHUNK_SIZE_Z + z;
                        const uvMapping = this.atlas.getBlockUVs(blockId);

                        if (isCross) {
                            // Cross geometry (X shape) for flowers and torches
                            const uvSlot = uvMapping.all || 'torch';
                            const uv = this.atlas.getUVs(uvSlot);
                            this.addCrossFace(positions, normals, uvs, colors, wx, y, wz, uv);
                            continue;
                        }

                        // Standard 6 faces
                        for (let f = 0; f < FACES.length; f++) {
                            const face = FACES[f];
                            const nx = wx + face.dir[0];
                            const ny = y + face.dir[1];
                            const nz = wz + face.dir[2];

                            const neighborId = this.getBlock(nx, ny, nz);
                            const neighborDef = window.BLOCK_BY_ID[neighborId];

                            // Face Culling: render face only if neighbor is air, liquid, or transparent
                            let shouldRender = false;
                            if (neighborId === B.AIR.id) {
                                shouldRender = true;
                            } else if (isWater) {
                                shouldRender = (neighborId !== B.WATER.id && neighborId !== B.LAVA.id && (!neighborDef || !neighborDef.solid));
                            } else if (neighborDef && neighborDef.transparent && neighborId !== blockId) {
                                shouldRender = true;
                            }

                            if (!shouldRender) continue;

                            // Select texture for this face
                            let texName = uvMapping.all;
                            if (!texName) {
                                if (face.name === 'top') texName = uvMapping.top;
                                else if (face.name === 'bottom') texName = uvMapping.bottom;
                                else if (face.name === 'front' && uvMapping.front) texName = uvMapping.front;
                                else texName = uvMapping.side || uvMapping.all;
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

            // Update Solid Mesh
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

            // Update Water Mesh
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
            // 2 Triangles: (0, 1, 2) and (0, 2, 3)
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
            // Diagonal 1
            const p1 = [x, y, z,  x+1, y+1, z+1,  x+1, y, z+1,  x, y, z,  x, y+1, z,  x+1, y+1, z+1];
            // Diagonal 2
            const p2 = [x+1, y, z,  x, y+1, z+1,  x, y, z+1,  x+1, y, z,  x+1, y+1, z,  x, y+1, z+1];

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

        // Load chunks around player radius with Infinite World streaming & memory unloading
        updateChunksAround(px, pz, loadRadius = 3, unloadRadius = 5) {
            const { cx, cz } = this.worldToChunkCoords(px, pz);

            // 1. Unload distant chunk meshes to guarantee infinite exploration without memory leaks or FPS drops
            for (let [key, chunk] of this.chunks) {
                const dist = Math.max(Math.abs(chunk.cx - cx), Math.abs(chunk.cz - cz));
                if (dist > unloadRadius) {
                    if (chunk.mesh) {
                        this.scene.remove(chunk.mesh);
                        chunk.mesh.geometry.dispose();
                        chunk.mesh = null;
                        chunk.isDirty = true; // Mark to rebuild if player comes back
                    }
                    if (chunk.waterMesh) {
                        this.scene.remove(chunk.waterMesh);
                        chunk.waterMesh.geometry.dispose();
                        chunk.waterMesh = null;
                        chunk.isDirty = true;
                    }
                }
            }

            // 2. Queue and load chunks within active radius (prioritize closest first)
            const chunksToProcess = [];
            for (let dx = -loadRadius; dx <= loadRadius; dx++) {
                for (let dz = -loadRadius; dz <= loadRadius; dz++) {
                    const chunk = this.getOrCreateChunk(cx + dx, cz + dz);
                    const distSq = dx * dx + dz * dz;
                    chunksToProcess.push({ chunk, distSq });
                }
            }

            // Sort closest first
            chunksToProcess.sort((a, b) => a.distSq - b.distSq);

            // Staggered generation: generate up to 2 new chunks per tick to maintain stable 60 FPS
            let generatedThisTick = 0;
            for (let i = 0; i < chunksToProcess.length; i++) {
                const item = chunksToProcess[i].chunk;
                if (!item.generated) {
                    this.generateChunkTerrain(item);
                    generatedThisTick++;
                    if (generatedThisTick >= 2) break;
                }
                if (item.isDirty && item.generated) {
                    this.rebuildChunkMesh(item);
                }
            }
        }
    }

    global.World = World;
})(window);
