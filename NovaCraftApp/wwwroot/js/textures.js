// Procedural Pixel-Art Texture Atlas Generator for NovaCraft
(function(global) {
    const TEX_SIZE = 16;
    const ATLAS_SLOTS_X = 16;
    const ATLAS_SLOTS_Y = 16;
    const ATLAS_WIDTH = TEX_SIZE * ATLAS_SLOTS_X; // 256
    const ATLAS_HEIGHT = TEX_SIZE * ATLAS_SLOTS_Y; // 256

    const TEXTURE_SLOTS = {};
    let nextSlotIndex = 0;

    function registerSlot(name) {
        if (TEXTURE_SLOTS[name] !== undefined) return TEXTURE_SLOTS[name];
        const slot = nextSlotIndex++;
        TEXTURE_SLOTS[name] = slot;
        return slot;
    }

    // Helper: Pseudo-random generator with seed
    function createRNG(seed) {
        let s = seed % 2147483647;
        if (s <= 0) s += 2147483646;
        return function() {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
    }

    // Helper: color interpolation
    function lerpColor(c1, c2, t) {
        return [
            Math.round(c1[0] + (c2[0] - c1[0]) * t),
            Math.round(c1[1] + (c2[1] - c1[1]) * t),
            Math.round(c1[2] + (c2[2] - c1[2]) * t),
            c1[3] !== undefined ? Math.round(c1[3] + ((c2[3] ?? 255) - c1[3]) * t) : 255
        ];
    }

    class TextureAtlas {
        constructor() {
            this.canvas = document.createElement('canvas');
            this.canvas.width = ATLAS_WIDTH;
            this.canvas.height = ATLAS_HEIGHT;
            this.ctx = this.canvas.getContext('2d');
            this.generateAllTextures();
        }

        getTexture() {
            const texture = new THREE.CanvasTexture(this.canvas);
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            return texture;
        }

        // Returns UV coordinates [uMin, vMin, uMax, vMax] for a given slot name
        getUVs(slotName) {
            const slot = TEXTURE_SLOTS[slotName] ?? 0;
            const sx = slot % ATLAS_SLOTS_X;
            const sy = Math.floor(slot / ATLAS_SLOTS_X);

            const uMin = sx / ATLAS_SLOTS_X;
            const uMax = (sx + 1) / ATLAS_SLOTS_X;
            // WebGL V coordinates are inverted (0 at bottom, 1 at top)
            const vMax = 1.0 - (sy / ATLAS_SLOTS_Y);
            const vMin = 1.0 - ((sy + 1) / ATLAS_SLOTS_Y);

            return { uMin, vMin, uMax, vMax };
        }

        drawPixel(slotName, x, y, r, g, b, a = 255) {
            const slot = registerSlot(slotName);
            const sx = (slot % ATLAS_SLOTS_X) * TEX_SIZE;
            const sy = Math.floor(slot / ATLAS_SLOTS_X) * TEX_SIZE;
            this.ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
            this.ctx.fillRect(sx + x, sy + y, 1, 1);
        }

        generateAllTextures() {
            const ctx = this.ctx;
            ctx.imageSmoothingEnabled = false;

            // 1. DIRT
            const rngDirt = createRNG(101);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const noise = rngDirt();
                    const r = Math.floor(115 + noise * 30);
                    const g = Math.floor(75 + noise * 25);
                    const b = Math.floor(45 + noise * 15);
                    this.drawPixel('dirt', x, y, r, g, b);
                }
            }

            // 2. GRASS TOP
            const rngGrass = createRNG(202);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const noise = rngGrass();
                    const r = Math.floor(70 + noise * 35);
                    const g = Math.floor(155 + noise * 45);
                    const b = Math.floor(40 + noise * 25);
                    this.drawPixel('grass_top', x, y, r, g, b);
                }
            }

            // 3. GRASS SIDE
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const grassH = 3 + Math.floor(createRNG(x * 17 + 5)() * 3);
                    if (y < grassH) {
                        const noise = rngGrass();
                        this.drawPixel('grass_side', x, y, Math.floor(70 + noise * 35), Math.floor(155 + noise * 45), Math.floor(40 + noise * 25));
                    } else {
                        const noise = rngDirt();
                        this.drawPixel('grass_side', x, y, Math.floor(115 + noise * 30), Math.floor(75 + noise * 25), Math.floor(45 + noise * 15));
                    }
                }
            }

            // 4. STONE
            const rngStone = createRNG(303);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const noise = rngStone();
                    const v = Math.floor(110 + noise * 35);
                    this.drawPixel('stone', x, y, v, v, v);
                }
            }

            // 5. COBBLESTONE
            const rngCobble = createRNG(404);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const isBorder = (x % 4 === 0 || y % 4 === 0 || (x + y) % 5 === 0);
                    const noise = rngCobble();
                    const v = isBorder ? Math.floor(70 + noise * 25) : Math.floor(125 + noise * 35);
                    this.drawPixel('cobblestone', x, y, v, v, v);
                }
            }

            // 6. BEDROCK
            const rngBedrock = createRNG(505);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const noise = rngBedrock();
                    const v = noise < 0.2 ? 10 : (noise < 0.6 ? 50 : 90);
                    this.drawPixel('bedrock', x, y, v, v, v);
                }
            }

            // 7. SAND
            const rngSand = createRNG(606);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const noise = rngSand();
                    const r = Math.floor(215 + noise * 25);
                    const g = Math.floor(200 + noise * 25);
                    const b = Math.floor(145 + noise * 20);
                    this.drawPixel('sand', x, y, r, g, b);
                }
            }

            // 8. GRAVEL
            const rngGravel = createRNG(707);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const noise = rngGravel();
                    const r = Math.floor(110 + noise * 40);
                    const g = Math.floor(105 + noise * 35);
                    const b = Math.floor(100 + noise * 30);
                    this.drawPixel('gravel', x, y, r, g, b);
                }
            }

            // 9. OAK LOG (Side)
            const rngOakSide = createRNG(808);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const barkStrip = (x % 3 === 0);
                    const noise = rngOakSide();
                    const r = barkStrip ? Math.floor(80 + noise * 20) : Math.floor(105 + noise * 25);
                    const g = barkStrip ? Math.floor(55 + noise * 15) : Math.floor(75 + noise * 20);
                    const b = barkStrip ? Math.floor(30 + noise * 10) : Math.floor(45 + noise * 15);
                    this.drawPixel('oak_log_side', x, y, r, g, b);
                }
            }

            // 10. OAK LOG (Top)
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const dx = x - 7.5;
                    const dy = y - 7.5;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 7) {
                        this.drawPixel('oak_log_top', x, y, 90, 60, 35); // Outer bark
                    } else if (Math.floor(dist) % 2 === 0) {
                        this.drawPixel('oak_log_top', x, y, 160, 130, 85); // Light ring
                    } else {
                        this.drawPixel('oak_log_top', x, y, 140, 110, 70); // Dark ring
                    }
                }
            }

            // 11. OAK PLANKS
            const rngOakPlank = createRNG(909);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const isBorder = (y % 4 === 0) || ((y < 4 || (y >= 8 && y < 12)) && x === 7) || ((y >= 4 && y < 8) && x === 14);
                    const noise = rngOakPlank();
                    const r = isBorder ? 120 : Math.floor(165 + noise * 25);
                    const g = isBorder ? 90 : Math.floor(130 + noise * 20);
                    const b = isBorder ? 50 : Math.floor(80 + noise * 15);
                    this.drawPixel('oak_planks', x, y, r, g, b);
                }
            }

            // 12. OAK LEAVES
            const rngLeaves = createRNG(1010);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const noise = rngLeaves();
                    if (noise < 0.15) {
                        this.drawPixel('oak_leaves', x, y, 0, 0, 0, 0); // Transparent hole
                    } else {
                        const r = Math.floor(40 + noise * 30);
                        const g = Math.floor(115 + noise * 50);
                        const b = Math.floor(25 + noise * 20);
                        this.drawPixel('oak_leaves', x, y, r, g, b, 230);
                    }
                }
            }

            // 13. BIRCH LOG (Side)
            const rngBirch = createRNG(1111);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const isSpot = (rngBirch() < 0.08);
                    if (isSpot) {
                        this.drawPixel('birch_log_side', x, y, 35, 35, 35);
                    } else {
                        const noise = rngBirch();
                        const v = Math.floor(215 + noise * 30);
                        this.drawPixel('birch_log_side', x, y, v, v, v - 10);
                    }
                }
            }

            // 14. BIRCH PLANKS
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const isBorder = (y % 4 === 0);
                    const noise = createRNG(x * 13 + y * 7)();
                    const r = isBorder ? 160 : Math.floor(205 + noise * 20);
                    const g = isBorder ? 150 : Math.floor(195 + noise * 20);
                    const b = isBorder ? 120 : Math.floor(160 + noise * 20);
                    this.drawPixel('birch_planks', x, y, r, g, b);
                }
            }

            // 15. GLASS
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const isBorder = (x === 0 || x === 15 || y === 0 || y === 15);
                    const isStreak = ((x + y === 8 || x + y === 9) && x > 2 && x < 7) ||
                                     ((x + y === 20 || x + y === 21) && x > 9 && x < 14);
                    if (isBorder) {
                        this.drawPixel('glass', x, y, 220, 230, 245, 230);
                    } else if (isStreak) {
                        this.drawPixel('glass', x, y, 255, 255, 255, 180);
                    } else {
                        this.drawPixel('glass', x, y, 200, 220, 240, 25); // mostly clear
                    }
                }
            }

            // Helper to generate Ore
            const makeOre = (slotName, oreColors) => {
                const rng = createRNG(slotName.charCodeAt(0) * 100);
                for (let y = 0; y < 16; y++) {
                    for (let x = 0; x < 16; x++) {
                        // Stone base
                        const noise = rng();
                        const sv = Math.floor(110 + noise * 35);
                        // Ore vein clusters
                        const isOre = ((x > 3 && x < 7 && y > 3 && y < 8) ||
                                       (x > 9 && x < 13 && y > 7 && y < 12) ||
                                       (x > 5 && x < 9 && y > 10 && y < 14)) && (rng() > 0.3);
                        if (isOre) {
                            const c = oreColors[Math.floor(rng() * oreColors.length)];
                            this.drawPixel(slotName, x, y, c[0], c[1], c[2]);
                        } else {
                            this.drawPixel(slotName, x, y, sv, sv, sv);
                        }
                    }
                }
            };

            // 16-22 ORES
            makeOre('coal_ore', [[30,30,30], [50,50,50], [20,20,20]]);
            makeOre('iron_ore', [[215,180,150], [185,150,120], [230,200,170]]);
            makeOre('gold_ore', [[245,215,65], [255,235,90], [210,180,40]]);
            makeOre('diamond_ore', [[75,230,240], [130,245,255], [45,200,210]]);
            makeOre('redstone_ore', [[235,30,30], [255,60,60], [190,20,20]]);
            makeOre('emerald_ore', [[40,225,90], [80,245,130], [25,185,65]]);
            makeOre('lapis_ore', [[35,65,195], [60,95,225], [20,45,160]]);

            // ★ 23. ASTRAL ORE (Custom: Neon glowing purple/cyan crystal veins)
            const rngAstral = createRNG(7777);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const noise = rngAstral();
                    const isOre = ((x > 2 && x < 7 && y > 3 && y < 9) ||
                                   (x > 8 && x < 14 && y > 6 && y < 13) ||
                                   (x > 4 && x < 10 && y > 10 && y < 15)) && (rngAstral() > 0.25);
                    if (isOre) {
                        const astralColors = [
                            [210, 50, 255],  // Bright magenta
                            [140, 30, 240],  // Deep violet
                            [75, 230, 255],  // Cyan star edge
                            [255, 180, 255]  // Core white-purple
                        ];
                        const c = astralColors[Math.floor(rngAstral() * astralColors.length)];
                        this.drawPixel('astral_ore', x, y, c[0], c[1], c[2]);
                    } else {
                        // Dark obsidian-tinted stone
                        const sv = Math.floor(55 + noise * 25);
                        this.drawPixel('astral_ore', x, y, sv + 10, sv, sv + 25);
                    }
                }
            }

            // 24. ASTRAL BLOCK (Custom: High-tech glowing crystal lattice)
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const isBorder = (x === 0 || x === 15 || y === 0 || y === 15);
                    const isCenter = (x >= 6 && x <= 9 && y >= 6 && y <= 9);
                    const isCross = (x === y || x + y === 15);
                    if (isCenter) {
                        this.drawPixel('astral_block', x, y, 255, 220, 255);
                    } else if (isCross) {
                        this.drawPixel('astral_block', x, y, 90, 220, 255);
                    } else if (isBorder) {
                        this.drawPixel('astral_block', x, y, 160, 40, 240);
                    } else {
                        this.drawPixel('astral_block', x, y, 80, 20, 140);
                    }
                }
            }

            // 25. CRAFTING TABLE (Top)
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const isGrid = (x === 7 || y === 7 || x === 0 || x === 15 || y === 0 || y === 15);
                    if (isGrid) {
                        this.drawPixel('crafting_top', x, y, 120, 85, 45);
                    } else {
                        this.drawPixel('crafting_top', x, y, 175, 130, 80);
                    }
                }
            }
            // Crafting Table (Side)
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const isBorder = (x === 0 || x === 15 || y === 0 || y === 15);
                    if (isBorder) {
                        this.drawPixel('crafting_side', x, y, 110, 75, 40);
                    } else if (x > 3 && x < 8 && y > 4 && y < 12) {
                        // Tool silhouette
                        this.drawPixel('crafting_side', x, y, 60, 60, 65);
                    } else {
                        this.drawPixel('crafting_side', x, y, 155, 115, 70);
                    }
                }
            }

            // 26. FURNACE (Front)
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const isHole = (x >= 4 && x <= 11 && y >= 7 && y <= 12);
                    if (isHole) {
                        this.drawPixel('furnace_front', x, y, 35, 35, 35);
                    } else {
                        const noise = createRNG(x * 19 + y * 11)();
                        const v = Math.floor(105 + noise * 30);
                        this.drawPixel('furnace_front', x, y, v, v, v);
                    }
                }
            }

            // 27. TNT (Side)
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const isWhiteBand = (y >= 6 && y <= 9);
                    if (isWhiteBand) {
                        // Letter T-N-T pixels
                        const isT1 = (y === 7 && x >= 2 && x <= 4) || (x === 3 && y === 8);
                        const isN  = (x === 6 || x === 8) && (y >= 7 && y <= 9) || (x === 7 && y === 8);
                        const isT2 = (y === 7 && x >= 10 && x <= 12) || (x === 11 && y === 8);
                        if (isT1 || isN || isT2) {
                            this.drawPixel('tnt_side', x, y, 0, 0, 0);
                        } else {
                            this.drawPixel('tnt_side', x, y, 235, 235, 235);
                        }
                    } else {
                        const isStripe = (x % 3 === 0);
                        this.drawPixel('tnt_side', x, y, isStripe ? 190 : 225, 35, 30);
                    }
                }
            }
            // TNT (Top)
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const isCenter = (x >= 7 && x <= 8 && y >= 7 && y <= 8);
                    if (isCenter) {
                        this.drawPixel('tnt_top', x, y, 40, 40, 40); // Fuse
                    } else {
                        const noise = createRNG(x * 5 + y * 7)();
                        this.drawPixel('tnt_top', x, y, Math.floor(190 + noise * 30), 40, 30);
                    }
                }
            }

            // ★ 28. CLUSTER TNT (Custom Side & Top)
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const isHazard = ((x + y) % 4 < 2);
                    if (y >= 5 && y <= 10) {
                        this.drawPixel('cluster_tnt_side', x, y, isHazard ? 245 : 30, isHazard ? 200 : 30, isHazard ? 30 : 30);
                    } else {
                        this.drawPixel('cluster_tnt_side', x, y, 140, 20, 180);
                    }
                }
            }

            // 29. TORCH
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    if (x >= 7 && x <= 8 && y >= 6 && y <= 15) {
                        this.drawPixel('torch', x, y, 130, 90, 50); // Stick
                    } else if (x >= 6 && x <= 9 && y >= 3 && y <= 5) {
                        this.drawPixel('torch', x, y, 255, 200, 40); // Fire
                    } else {
                        this.drawPixel('torch', x, y, 0, 0, 0, 0); // Transparent
                    }
                }
            }

            // ★ 30. HEALING TORCH
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    if (x >= 7 && x <= 8 && y >= 6 && y <= 15) {
                        this.drawPixel('healing_torch', x, y, 60, 150, 180); // Crystal wand
                    } else if (x >= 6 && x <= 9 && y >= 2 && y <= 5) {
                        this.drawPixel('healing_torch', x, y, 70, 255, 180); // Radiant green/cyan aura
                    } else {
                        this.drawPixel('healing_torch', x, y, 0, 0, 0, 0);
                    }
                }
            }

            // ★ 31. WAYGATE (Teleporter)
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const dx = x - 7.5;
                    const dy = y - 7.5;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 5) {
                        // Glowing swirl
                        const angle = Math.atan2(dy, dx);
                        const wave = Math.sin(angle * 3 + dist);
                        this.drawPixel('waygate_top', x, y, Math.floor(180 + wave * 60), 60, Math.floor(220 + wave * 35));
                    } else {
                        this.drawPixel('waygate_top', x, y, 40, 20, 60);
                    }
                    this.drawPixel('waygate_side', x, y, 35, 25, 45);
                }
            }

            // ★ 32. SPEED PAD / JUMP PAD
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    // Speed: blue chevron arrow
                    const isChevron = (Math.abs(x - 7.5) <= (y - 3) && (y >= 4 && y <= 11) && Math.abs(x - 7.5) >= (y - 6));
                    this.drawPixel('speed_pad', x, y, isChevron ? 80 : 35, isChevron ? 230 : 65, isChevron ? 255 : 120);

                    // Jump: orange ring
                    const dist = Math.sqrt((x-7.5)*(x-7.5) + (y-7.5)*(y-7.5));
                    const isRing = (dist >= 3 && dist <= 5);
                    this.drawPixel('jump_pad', x, y, isRing ? 255 : 80, isRing ? 160 : 60, isRing ? 30 : 30);
                }
            }

            // 33. WATER & LAVA
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const wave = Math.sin(x * 0.8) * Math.cos(y * 0.8);
                    this.drawPixel('water', x, y, 45, 95 + Math.floor(wave * 25), 215, 190);
                    this.drawPixel('lava', x, y, 235 + Math.floor(wave * 20), 100 + Math.floor(wave * 40), 20);
                }
            }

            // 34. METAL BLOCKS (Iron, Gold, Diamond)
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const isBorder = (x === 0 || x === 15 || y === 0 || y === 15);
                    this.drawPixel('iron_block', x, y, isBorder ? 170 : 225, isBorder ? 170 : 225, isBorder ? 170 : 225);
                    this.drawPixel('gold_block', x, y, isBorder ? 200 : 255, isBorder ? 170 : 225, isBorder ? 40 : 60);
                    this.drawPixel('diamond_block', x, y, isBorder ? 70 : 120, isBorder ? 200 : 245, isBorder ? 210 : 255);
                }
            }

            // 35. OBSIDIAN & BRICKS & BOOKSHELF
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const noise = createRNG(x * 7 + y * 13)();
                    this.drawPixel('obsidian', x, y, 20 + Math.floor(noise * 15), 12 + Math.floor(noise * 10), 30 + Math.floor(noise * 20));

                    // Bricks
                    const isMorter = (y % 4 === 0) || ((y < 4 || (y >= 8 && y < 12)) && x % 8 === 0) || ((y >= 4 && y < 8 || y >= 12) && (x + 4) % 8 === 0);
                    this.drawPixel('bricks', x, y, isMorter ? 180 : 160 + Math.floor(noise * 25), isMorter ? 175 : 60 + Math.floor(noise * 15), isMorter ? 170 : 50 + Math.floor(noise * 15));

                    // Bookshelf
                    if (y === 0 || y === 15 || y === 7 || y === 8) {
                        this.drawPixel('bookshelf', x, y, 160, 120, 70); // Wood shelf
                    } else {
                        const bookColors = [[180,40,40], [40,140,60], [40,80,180], [180,150,40], [140,50,140]];
                        const c = bookColors[(Math.floor(x / 3) + Math.floor(y / 8) * 3) % bookColors.length];
                        this.drawPixel('bookshelf', x, y, c[0], c[1], c[2]);
                    }
                }
            }

            // 36. FLOWERS (Red / Yellow)
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const isStem = (x >= 7 && x <= 8 && y >= 7 && y <= 15);
                    const isPetal = (x >= 5 && x <= 10 && y >= 3 && y <= 7);
                    if (isStem) {
                        this.drawPixel('flower_red', x, y, 50, 160, 40);
                        this.drawPixel('flower_yellow', x, y, 50, 160, 40);
                    } else if (isPetal) {
                        this.drawPixel('flower_red', x, y, 230, 30, 30);
                        this.drawPixel('flower_yellow', x, y, 245, 220, 30);
                    } else {
                        this.drawPixel('flower_red', x, y, 0, 0, 0, 0);
                        this.drawPixel('flower_yellow', x, y, 0, 0, 0, 0);
                    }
                }
            }

            // 37. SNOW & ICE & CACTUS
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    this.drawPixel('snow', x, y, 245, 248, 255);
                    this.drawPixel('ice', x, y, 140, 190, 245, 210);
                    // Cactus
                    const isThorn = ((x + y) % 5 === 0);
                    this.drawPixel('cactus_side', x, y, isThorn ? 230 : 50, isThorn ? 230 : 130, isThorn ? 180 : 40);
                    this.drawPixel('cactus_top', x, y, 60, 145, 45);
                }
            }

            // 38. CHEST
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const isBorder = (x === 0 || x === 15 || y === 0 || y === 15 || y === 6);
                    const isLock = (x >= 7 && x <= 8 && y >= 5 && y <= 7);
                    if (isLock) {
                        this.drawPixel('chest_front', x, y, 220, 220, 220); // Silver latch
                    } else if (isBorder) {
                        this.drawPixel('chest_front', x, y, 70, 50, 25);
                    } else {
                        this.drawPixel('chest_front', x, y, 160, 115, 65);
                    }
                    this.drawPixel('chest_side', x, y, isBorder ? 70 : 160, isBorder ? 50 : 115, isBorder ? 25 : 65);
                    this.drawPixel('chest_top', x, y, isBorder ? 70 : 160, isBorder ? 50 : 115, isBorder ? 25 : 65);
                }
            }

            // 39. DESTRUCTION CRACK STAGES (0 to 9) - Authentic Minecraft Breaking Overlay
            const crackSeeds = [
                [[7,7],[8,8],[7,8]],
                [[7,6],[7,7],[8,8],[7,8],[9,9]],
                [[6,5],[7,6],[7,7],[8,8],[7,8],[9,9],[10,10],[6,8]],
                [[5,4],[6,5],[7,6],[7,7],[8,8],[7,8],[9,9],[10,10],[11,11],[6,8],[5,9],[9,6]],
                [[5,4],[6,5],[7,6],[7,7],[8,8],[7,8],[9,9],[10,10],[11,11],[6,8],[5,9],[9,6],[10,5],[4,10],[8,11],[12,12]],
                [[4,3],[5,4],[6,5],[7,6],[7,7],[8,8],[7,8],[9,9],[10,10],[11,11],[6,8],[5,9],[9,6],[10,5],[4,10],[8,11],[12,12],[3,11],[8,5],[11,4]],
                [[4,3],[5,4],[6,5],[7,6],[7,7],[8,8],[7,8],[9,9],[10,10],[11,11],[6,8],[5,9],[9,6],[10,5],[4,10],[8,11],[12,12],[3,11],[8,5],[11,4],[2,12],[12,3],[13,13],[7,13]],
                [[4,3],[5,4],[6,5],[7,6],[7,7],[8,8],[7,8],[9,9],[10,10],[11,11],[6,8],[5,9],[9,6],[10,5],[4,10],[8,11],[12,12],[3,11],[8,5],[11,4],[2,12],[12,3],[13,13],[7,13],[14,14],[1,13],[13,2],[6,2]],
                [[4,3],[5,4],[6,5],[7,6],[7,7],[8,8],[7,8],[9,9],[10,10],[11,11],[6,8],[5,9],[9,6],[10,5],[4,10],[8,11],[12,12],[3,11],[8,5],[11,4],[2,12],[12,3],[13,13],[7,13],[14,14],[1,13],[13,2],[6,2],[0,14],[14,1],[15,15],[2,2],[14,7],[2,8]],
                [[4,3],[5,4],[6,5],[7,6],[7,7],[8,8],[7,8],[9,9],[10,10],[11,11],[6,8],[5,9],[9,6],[10,5],[4,10],[8,11],[12,12],[3,11],[8,5],[11,4],[2,12],[12,3],[13,13],[7,13],[14,14],[1,13],[13,2],[6,2],[0,14],[14,1],[15,15],[2,2],[14,7],[2,8],[0,0],[15,0],[0,15],[7,0],[8,15],[0,7],[15,8],[8,2],[2,14]]
            ];

            for (let stage = 0; stage < 10; stage++) {
                const slotName = `destroy_stage_${stage}`;
                const pts = crackSeeds[stage];
                // Fill clear first
                for (let y = 0; y < 16; y++) {
                    for (let x = 0; x < 16; x++) {
                        this.drawPixel(slotName, x, y, 0, 0, 0, 0);
                    }
                }
                // Draw crack pixels
                pts.forEach(p => {
                    this.drawPixel(slotName, p[0], p[1], 20, 20, 20, 230);
                });
            }

            // 40. CLOUDS
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    this.drawPixel('cloud', x, y, 255, 255, 255, 210);
                }
            }

            // ★ 41. DEEPSLATE & DEEPSLATE BRICKS & DEEPSLATE TILES
            const rngDeep = createRNG(8881);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const n = rngDeep();
                    // Deepslate: dark layered slate
                    const dv = Math.floor(42 + ((x + y * 2) % 4 === 0 ? -8 : 0) + n * 18);
                    this.drawPixel('deepslate', x, y, dv, dv + 2, dv + 6);

                    // Deepslate Bricks
                    const isBrickMortar = (y % 8 === 0) || (y < 8 && x % 8 === 0) || (y >= 8 && (x + 4) % 8 === 0);
                    const bv = isBrickMortar ? 24 : Math.floor(52 + n * 18);
                    this.drawPixel('deepslate_bricks', x, y, bv, bv + 3, bv + 7);

                    // Deepslate Tiles
                    const isTileMortar = (y % 4 === 0) || ((Math.floor(y / 4) % 2 === 0) ? (x % 4 === 0) : ((x + 2) % 4 === 0));
                    const tv = isTileMortar ? 20 : Math.floor(44 + n * 14);
                    this.drawPixel('deepslate_tiles', x, y, tv, tv + 2, tv + 5);
                }
            }

            // ★ 42. REINFORCED DEEPSLATE (Ancient City Central Portal Frame)
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const isFrame = (x <= 2 || x >= 13 || y <= 2 || y >= 13);
                    const isBoneTrim = (x === 0 || x === 15 || y === 0 || y === 15 || x === 3 || x === 12 || y === 3 || y === 12);
                    const isCyanRunes = ((x === 7 || x === 8) && (y >= 4 && y <= 11)) || ((y === 7 || y === 8) && (x >= 4 && x <= 11));
                    if (isBoneTrim) {
                        this.drawPixel('reinforced_deepslate_top', x, y, 185, 195, 175);
                        this.drawPixel('reinforced_deepslate_side', x, y, 175, 185, 165);
                    } else if (isCyanRunes) {
                        this.drawPixel('reinforced_deepslate_top', x, y, 45, 210, 220);
                        this.drawPixel('reinforced_deepslate_side', x, y, 40, 195, 205);
                    } else if (isFrame) {
                        this.drawPixel('reinforced_deepslate_top', x, y, 55, 65, 68);
                        this.drawPixel('reinforced_deepslate_side', x, y, 48, 58, 62);
                    } else {
                        this.drawPixel('reinforced_deepslate_top', x, y, 28, 34, 40);
                        this.drawPixel('reinforced_deepslate_side', x, y, 28, 34, 40);
                    }
                }
            }

            // ★ 43. SCULK, SCULK CATALYST, SCULK SHRIEKER
            const rngSculk = createRNG(9912);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const n = rngSculk();
                    const isStar = (n > 0.86);
                    const isPulse = (n > 0.72 && n <= 0.86);
                    if (isStar) {
                        this.drawPixel('sculk', x, y, 40, 225, 235); // Bright cyan sculk sensor dot
                    } else if (isPulse) {
                        this.drawPixel('sculk', x, y, 15, 125, 145); // Teal vein
                    } else {
                        const sv = Math.floor(10 + n * 14);
                        this.drawPixel('sculk', x, y, sv, sv + 14, sv + 24); // Deep dark navy-black
                    }

                    // Sculk Catalyst Side (Bone base + sculk top)
                    if (y >= 9) {
                        const bv = (x % 3 === 0) ? 165 : 205;
                        this.drawPixel('sculk_catalyst_side', x, y, bv, bv - 5, bv - 20);
                    } else {
                        this.drawPixel('sculk_catalyst_side', x, y, isStar ? 40 : 14, isStar ? 225 : 30, isStar ? 235 : 42);
                    }
                    // Sculk Catalyst Top (Glowing soul bloom)
                    const dist = Math.sqrt((x - 7.5) * (x - 7.5) + (y - 7.5) * (y - 7.5));
                    if (dist < 4.5) {
                        this.drawPixel('sculk_catalyst_top', x, y, 45, 230, 240);
                    } else {
                        this.drawPixel('sculk_catalyst_top', x, y, 16, 35, 48);
                    }

                    // Sculk Shrieker
                    const isHorn = (y < 6 && (x <= 3 || x >= 12));
                    const isSoulCore = (x >= 5 && x <= 10 && y >= 5 && y <= 10);
                    if (isHorn) {
                        this.drawPixel('sculk_shrieker_side', x, y, 215, 215, 195);
                    } else if (isSoulCore) {
                        this.drawPixel('sculk_shrieker_side', x, y, 35, 210, 235);
                    } else {
                        this.drawPixel('sculk_shrieker_side', x, y, 15, 32, 44);
                    }
                    this.drawPixel('sculk_shrieker_top', x, y, dist < 5 ? 45 : 195, dist < 5 ? 225 : 195, dist < 5 ? 240 : 175);
                }
            }

            // ★ 44. SOUL LANTERN, STONE BRICKS, GLOWSTONE
            const rngGlow = createRNG(6543);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    // Soul Lantern
                    if (x >= 4 && x <= 11 && y >= 4 && y <= 14) {
                        const isIronFrame = (x === 4 || x === 11 || y === 4 || y === 14);
                        if (isIronFrame) {
                            this.drawPixel('soul_lantern', x, y, 55, 65, 75, 255);
                        } else {
                            this.drawPixel('soul_lantern', x, y, 70, 235, 255, 255); // Bright soul fire cyan
                        }
                    } else if (x >= 7 && x <= 8 && y >= 1 && y <= 3) {
                        this.drawPixel('soul_lantern', x, y, 65, 70, 80, 255); // Chain
                    } else {
                        this.drawPixel('soul_lantern', x, y, 0, 0, 0, 0);
                    }

                    // Stone Bricks
                    const isSBMortar = (y % 8 === 0) || (y < 8 && x % 8 === 0) || (y >= 8 && (x + 4) % 8 === 0);
                    const n = rngGlow();
                    const sbv = isSBMortar ? 75 : Math.floor(130 + n * 25);
                    this.drawPixel('stone_bricks', x, y, sbv, sbv, sbv);

                    // Glowstone
                    const gv = n > 0.65 ? 255 : (n > 0.3 ? 215 : 160);
                    this.drawPixel('glowstone', x, y, gv, Math.floor(gv * 0.85), Math.floor(gv * 0.45));
                }
            }

            // ★ 45. FIRE, NETHER PORTAL, SAPLING, LADDER, BED
            const rngExtra = createRNG(4321);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const n = rngExtra();

                    // Fire (Cross-model flickering flame)
                    const flameH = 4 + Math.floor(Math.sin(x * 0.9) * 3 + n * 4);
                    if (y >= flameH && x >= 2 && x <= 13) {
                        if (y > 11 && x >= 5 && x <= 10) {
                            this.drawPixel('fire', x, y, 255, 245, 110, 255); // Bright yellow core
                        } else if (y > 8) {
                            this.drawPixel('fire', x, y, 255, 150, 25, 245); // Orange flame
                        } else {
                            this.drawPixel('fire', x, y, 235, 55, 15, 220); // Red tips
                        }
                    } else {
                        this.drawPixel('fire', x, y, 0, 0, 0, 0);
                    }

                    // Nether Portal (Swirling purple vortex)
                    const swirl = Math.sin((x - 7.5) * 0.6 + (y - 7.5) * 0.6);
                    this.drawPixel('nether_portal', x, y, Math.floor(155 + swirl * 60), 25, Math.floor(225 + swirl * 30), 210);

                    // Oak Sapling
                    if (x >= 7 && x <= 8 && y >= 10 && y <= 15) {
                        this.drawPixel('sapling', x, y, 115, 78, 42, 255);
                    } else if (x >= 4 && x <= 11 && y >= 4 && y <= 10 && ((x + y) % 2 === 0 || n > 0.4)) {
                        this.drawPixel('sapling', x, y, 55, 165, 45, 255);
                    } else {
                        this.drawPixel('sapling', x, y, 0, 0, 0, 0);
                    }

                    // Ladder
                    const isRail = (x === 3 || x === 4 || x === 11 || x === 12);
                    const isRung = (y % 4 === 1 || y % 4 === 2) && (x >= 3 && x <= 12);
                    if (isRail || isRung) {
                        this.drawPixel('ladder', x, y, 155, 115, 65, 255);
                    } else {
                        this.drawPixel('ladder', x, y, 0, 0, 0, 0);
                    }

                    // Bed (Red blanket + white pillow + wood base)
                    if (y < 5) {
                        this.drawPixel('bed_top', x, y, 240, 240, 245); // Pillow
                    } else {
                        this.drawPixel('bed_top', x, y, 200, 35, 35); // Red blanket
                    }
                    if (y >= 11) {
                        this.drawPixel('bed_side', x, y, 155, 115, 65); // Wood frame
                    } else {
                        this.drawPixel('bed_side', x, y, x < 5 ? 240 : 200, x < 5 ? 240 : 35, x < 5 ? 245 : 35);
                    }
                }
            }

            // ★ 46. WOOLS, MOSSY COBBLE, SANDSTONE, NETHERRACK, SOUL SAND, CRYING OBSIDIAN, AMETHYST, COPPER, LAMP, MINERAL BLOCKS
            const rngMat = createRNG(9876);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const n = rngMat();
                    const wv = Math.floor(225 + n * 25);
                    this.drawPixel('wool_white', x, y, wv, wv, wv);
                    this.drawPixel('wool_red', x, y, Math.floor(185 + n * 35), 32, 32);
                    this.drawPixel('wool_blue', x, y, 35, 65, Math.floor(185 + n * 40));

                    // Mossy Cobblestone
                    const isMoss = (n > 0.58);
                    const cv = Math.floor(95 + n * 35);
                    this.drawPixel('mossy_cobblestone', x, y, isMoss ? 55 : cv, isMoss ? 135 : cv, isMoss ? 42 : cv);

                    // Sandstone
                    const sv = (y < 3) ? 230 : Math.floor(210 + n * 20);
                    this.drawPixel('sandstone', x, y, sv, sv - 15, sv - 65);

                    // Netherrack
                    this.drawPixel('netherrack', x, y, Math.floor(105 + n * 45), Math.floor(35 + n * 20), Math.floor(35 + n * 20));

                    // Soul Sand
                    this.drawPixel('soul_sand', x, y, Math.floor(70 + n * 25), Math.floor(52 + n * 20), Math.floor(42 + n * 16));

                    // Crying Obsidian
                    const isCry = (n > 0.78);
                    this.drawPixel('crying_obsidian', x, y, isCry ? 165 : 24, isCry ? 45 : 14, isCry ? 255 : 42);

                    // Amethyst Block
                    this.drawPixel('amethyst_block', x, y, Math.floor(135 + n * 55), Math.floor(75 + n * 40), Math.floor(205 + n * 45));

                    // Copper Block
                    const isBorder = (x === 0 || x === 15 || y === 0 || y === 15);
                    this.drawPixel('copper_block', x, y, isBorder ? 165 : 205, isBorder ? 85 : 112, isBorder ? 55 : 75);

                    // Redstone Lamp
                    const isLampFrame = (x === 0 || x === 15 || y === 0 || y === 15 || x === y || x + y === 15);
                    this.drawPixel('redstone_lamp', x, y, isLampFrame ? 75 : 250, isLampFrame ? 45 : 210, isLampFrame ? 25 : 115);

                    // Redstone, Emerald, Lapis, Netherite Blocks
                    this.drawPixel('redstone_block', x, y, isBorder ? 155 : 215, 22, 18);
                    this.drawPixel('emerald_block', x, y, 25, isBorder ? 165 : 225, isBorder ? 65 : 95);
                    this.drawPixel('lapis_block', x, y, 28, 55, isBorder ? 155 : 205);
                    this.drawPixel('netherite_block', x, y, isBorder ? 45 : 68, isBorder ? 40 : 62, isBorder ? 48 : 70);
                }
            }
        }

        // Returns UV mapping object for a block type
        // Faces order in Three.js BoxGeometry: [right, left, top, bottom, front, back]
        getBlockUVs(blockId) {
            const B = window.BLOCKS;
            switch(blockId) {
                case B.GRASS.id:
                    return { top: 'grass_top', bottom: 'dirt', side: 'grass_side' };
                case B.DIRT.id:
                    return { all: 'dirt' };
                case B.STONE.id:
                    return { all: 'stone' };
                case B.COBBLESTONE.id:
                    return { all: 'cobblestone' };
                case B.BEDROCK.id:
                    return { all: 'bedrock' };
                case B.SAND.id:
                    return { all: 'sand' };
                case B.GRAVEL.id:
                    return { all: 'gravel' };
                case B.OAK_LOG.id:
                    return { top: 'oak_log_top', bottom: 'oak_log_top', side: 'oak_log_side' };
                case B.OAK_PLANKS.id:
                    return { all: 'oak_planks' };
                case B.OAK_LEAVES.id:
                    return { all: 'oak_leaves' };
                case B.BIRCH_LOG.id:
                    return { top: 'oak_log_top', bottom: 'oak_log_top', side: 'birch_log_side' };
                case B.BIRCH_PLANKS.id:
                    return { all: 'birch_planks' };
                case B.BIRCH_LEAVES.id:
                    return { all: 'oak_leaves' };
                case B.GLASS.id:
                    return { all: 'glass' };
                case B.COAL_ORE.id:
                    return { all: 'coal_ore' };
                case B.IRON_ORE.id:
                    return { all: 'iron_ore' };
                case B.GOLD_ORE.id:
                    return { all: 'gold_ore' };
                case B.DIAMOND_ORE.id:
                    return { all: 'diamond_ore' };
                case B.REDSTONE_ORE.id:
                    return { all: 'redstone_ore' };
                case B.EMERALD_ORE.id:
                    return { all: 'emerald_ore' };
                case B.LAPIS_ORE.id:
                    return { all: 'lapis_ore' };
                case B.IRON_BLOCK.id:
                    return { all: 'iron_block' };
                case B.GOLD_BLOCK.id:
                    return { all: 'gold_block' };
                case B.DIAMOND_BLOCK.id:
                    return { all: 'diamond_block' };
                case B.BRICKS.id:
                    return { all: 'bricks' };
                case B.BOOKSHELF.id:
                    return { top: 'oak_planks', bottom: 'oak_planks', side: 'bookshelf' };
                case B.OBSIDIAN.id:
                    return { all: 'obsidian' };
                case B.CRAFTING_TABLE.id:
                    return { top: 'crafting_top', bottom: 'oak_planks', side: 'crafting_side' };
                case B.FURNACE.id:
                    return { top: 'stone', bottom: 'stone', front: 'furnace_front', side: 'stone' };
                case B.CHEST.id:
                    return { top: 'chest_top', bottom: 'chest_top', front: 'chest_front', side: 'chest_side' };
                case B.TORCH.id:
                    return { all: 'torch' };
                case B.TNT.id:
                    return { top: 'tnt_top', bottom: 'tnt_top', side: 'tnt_side' };
                case B.WATER.id:
                    return { all: 'water' };
                case B.LAVA.id:
                    return { all: 'lava' };
                case B.SNOW.id:
                    return { all: 'snow' };
                case B.ICE.id:
                    return { all: 'ice' };
                case B.CACTUS.id:
                    return { top: 'cactus_top', bottom: 'cactus_top', side: 'cactus_side' };
                case B.FLOWER_RED.id:
                    return { all: 'flower_red' };
                case B.FLOWER_YELLOW.id:
                    return { all: 'flower_yellow' };
                
                // ★ オリジナルブロック
                case B.ASTRAL_ORE.id:
                    return { all: 'astral_ore' };
                case B.ASTRAL_BLOCK.id:
                    return { all: 'astral_block' };
                case B.HEALING_TORCH.id:
                    return { all: 'healing_torch' };
                case B.WAYGATE.id:
                    return { top: 'waygate_top', bottom: 'waygate_top', side: 'waygate_side' };
                case B.CLUSTER_TNT.id:
                    return { top: 'tnt_top', bottom: 'tnt_top', side: 'cluster_tnt_side' };
                case B.SPEED_PAD.id:
                    return { top: 'speed_pad', bottom: 'stone', side: 'stone' };
                case B.JUMP_PAD.id:
                    return { top: 'jump_pad', bottom: 'stone', side: 'stone' };

                // ★ ディープダーク・古代都市 & 追加バニラブロック
                case B.DEEPSLATE?.id:
                    return { all: 'deepslate' };
                case B.DEEPSLATE_BRICKS?.id:
                    return { all: 'deepslate_bricks' };
                case B.DEEPSLATE_TILES?.id:
                    return { all: 'deepslate_tiles' };
                case B.REINFORCED_DEEPSLATE?.id:
                    return { top: 'reinforced_deepslate_top', bottom: 'deepslate', side: 'reinforced_deepslate_side' };
                case B.SCULK?.id:
                    return { all: 'sculk' };
                case B.SCULK_CATALYST?.id:
                    return { top: 'sculk_catalyst_top', bottom: 'sculk', side: 'sculk_catalyst_side' };
                case B.SCULK_SHRIEKER?.id:
                    return { top: 'sculk_shrieker_top', bottom: 'sculk', side: 'sculk_shrieker_side' };
                case B.SOUL_LANTERN?.id:
                    return { all: 'soul_lantern' };
                case B.STONE_BRICKS?.id:
                    return { all: 'stone_bricks' };
                case B.GLOWSTONE?.id:
                    return { all: 'glowstone' };
                case B.FIRE?.id:
                    return { all: 'fire' };
                case B.NETHER_PORTAL?.id:
                    return { all: 'nether_portal' };
                case B.WOOL_WHITE?.id:
                    return { all: 'wool_white' };
                case B.WOOL_RED?.id:
                    return { all: 'wool_red' };
                case B.WOOL_BLUE?.id:
                    return { all: 'wool_blue' };
                case B.MOSSY_COBBLESTONE?.id:
                    return { all: 'mossy_cobblestone' };
                case B.SANDSTONE?.id:
                    return { all: 'sandstone' };
                case B.NETHERRACK?.id:
                    return { all: 'netherrack' };
                case B.SOUL_SAND?.id:
                    return { all: 'soul_sand' };
                case B.CRYING_OBSIDIAN?.id:
                    return { all: 'crying_obsidian' };
                case B.AMETHYST_BLOCK?.id:
                    return { all: 'amethyst_block' };
                case B.COPPER_BLOCK?.id:
                    return { all: 'copper_block' };
                case B.REDSTONE_LAMP?.id:
                    return { all: 'redstone_lamp' };
                case B.LADDER?.id:
                    return { all: 'ladder' };
                case B.SAPLING?.id:
                    return { all: 'sapling' };
                case B.BED?.id:
                    return { top: 'bed_top', bottom: 'oak_planks', side: 'bed_side' };
                case B.REDSTONE_BLOCK?.id:
                    return { all: 'redstone_block' };
                case B.EMERALD_BLOCK?.id:
                    return { all: 'emerald_block' };
                case B.LAPIS_BLOCK?.id:
                    return { all: 'lapis_block' };
                case B.NETHERITE_BLOCK?.id:
                    return { all: 'netherite_block' };

                default:
                    return { all: 'stone' };
            }
        }

        // Apply authentic Minecraft block UVs to a standard Three.js BoxGeometry
        applyBlockUVs(geometry, blockId) {
            const uvMapping = this.getBlockUVs(blockId);
            const faces = [
                uvMapping.side || uvMapping.all, // +X right
                uvMapping.side || uvMapping.all, // -X left
                uvMapping.top || uvMapping.all,  // +Y top
                uvMapping.bottom || uvMapping.all, // -Y bottom
                uvMapping.front || uvMapping.side || uvMapping.all, // +Z front
                uvMapping.side || uvMapping.all  // -Z back
            ];

            const uvAttr = geometry.attributes.uv;
            const uvArr = uvAttr.array;

            for (let f = 0; f < 6; f++) {
                const tex = faces[f];
                const uv = this.getUVs(tex);
                const offset = f * 8;
                // 4 corners of standard Three.js Box face
                uvArr[offset + 0] = uv.uMin; uvArr[offset + 1] = uv.vMax;
                uvArr[offset + 2] = uv.uMax; uvArr[offset + 3] = uv.vMax;
                uvArr[offset + 4] = uv.uMin; uvArr[offset + 5] = uv.vMin;
                uvArr[offset + 6] = uv.uMax; uvArr[offset + 7] = uv.vMin;
            }
            uvAttr.needsUpdate = true;
        }

        // Apply crack stage (0 to 9) to a BoxGeometry
        applyCrackUVs(geometry, stage) {
            const uv = this.getUVs(`destroy_stage_${stage}`);
            const uvAttr = geometry.attributes.uv;
            const uvArr = uvAttr.array;

            for (let f = 0; f < 6; f++) {
                const offset = f * 8;
                uvArr[offset + 0] = uv.uMin; uvArr[offset + 1] = uv.vMax;
                uvArr[offset + 2] = uv.uMax; uvArr[offset + 3] = uv.vMax;
                uvArr[offset + 4] = uv.uMin; uvArr[offset + 5] = uv.vMin;
                uvArr[offset + 6] = uv.uMax; uvArr[offset + 7] = uv.vMin;
            }
            uvAttr.needsUpdate = true;
        }

        // Generate and cache pixel-art DataURL for any item (Blocks, Tools, Items, Custom)
        getItemIconDataURL(itemKey) {
            if (!this.iconCache) this.iconCache = {};
            if (this.iconCache[itemKey]) return this.iconCache[itemKey];

            const c = document.createElement('canvas');
            c.width = 16;
            c.height = 16;
            const ctx = c.getContext('2d');
            ctx.imageSmoothingEnabled = false;

            const itemDef = window.ITEMS[itemKey];

            if (itemDef?.blockId) {
                // Draw Block texture from Atlas
                const uvMap = this.getBlockUVs(itemDef.blockId);
                const slotName = uvMap.side || uvMap.all || uvMap.top || 'stone';
                const slot = TEXTURE_SLOTS[slotName] ?? 0;
                const sx = (slot % ATLAS_SLOTS_X) * TEX_SIZE;
                const sy = Math.floor(slot / ATLAS_SLOTS_X) * TEX_SIZE;
                ctx.drawImage(this.canvas, sx, sy, 16, 16, 0, 0, 16, 16);
            } else {
                // Draw 2D Minecraft Pixel Art Item
                let matColor = '#ffffff';
                if (itemKey.includes('wooden') || itemKey.includes('wood')) matColor = '#9c6b3e';
                else if (itemKey.includes('stone') || itemKey.includes('cobble')) matColor = '#8a8a8a';
                else if (itemKey.includes('iron')) matColor = '#d8d8d8';
                else if (itemKey.includes('gold')) matColor = '#fcee4b';
                else if (itemKey.includes('diamond')) matColor = '#4eeded';
                else if (itemKey.includes('netherite')) matColor = '#4d444f';
                else if (itemKey.includes('astral')) matColor = '#df44ff';
                else if (itemKey.includes('laser')) matColor = '#33eeff';

                if (itemKey === 'flint_and_steel') {
                    // Iconic Flint & Steel (Steel C-striker on left + Dark grey Flint on right)
                    ctx.fillStyle = '#d4d8de'; // Steel striker
                    ctx.fillRect(2, 3, 5, 2);
                    ctx.fillRect(2, 5, 2, 5);
                    ctx.fillRect(2, 9, 5, 2);
                    ctx.fillStyle = '#36363c'; // Dark flint shard
                    ctx.fillRect(8, 7, 5, 6);
                    ctx.fillStyle = '#585862';
                    ctx.fillRect(9, 8, 3, 3);
                } else if (itemKey === 'flint') {
                    ctx.fillStyle = '#2d2d32';
                    ctx.fillRect(5, 3, 6, 10);
                    ctx.fillRect(4, 6, 8, 6);
                    ctx.fillStyle = '#5a5a64';
                    ctx.fillRect(6, 5, 3, 4);
                } else if (itemKey === 'fire_charge') {
                    ctx.fillStyle = '#332211';
                    ctx.fillRect(3, 3, 10, 10);
                    ctx.fillStyle = '#ff6600';
                    ctx.fillRect(4, 4, 8, 8);
                    ctx.fillStyle = '#ffee44';
                    ctx.fillRect(6, 6, 4, 4);
                } else if (itemKey.includes('bucket')) {
                    ctx.fillStyle = '#b8bcc2';
                    ctx.fillRect(3, 5, 10, 7);
                    ctx.fillRect(5, 12, 6, 2);
                    if (itemKey === 'water_bucket') {
                        ctx.fillStyle = '#2b6ef2';
                        ctx.fillRect(4, 5, 8, 3);
                    } else if (itemKey === 'lava_bucket') {
                        ctx.fillStyle = '#ff5511';
                        ctx.fillRect(4, 5, 8, 3);
                    } else {
                        ctx.fillStyle = '#55585e';
                        ctx.fillRect(4, 5, 8, 3);
                    }
                } else if (itemKey === 'bow') {
                    ctx.fillStyle = '#8b5a2b';
                    ctx.fillRect(4, 2, 2, 3);
                    ctx.fillRect(3, 5, 2, 6);
                    ctx.fillRect(4, 11, 2, 3);
                    ctx.fillStyle = '#dcdcdc'; // Bowstring
                    ctx.fillRect(6, 3, 1, 10);
                } else if (itemKey === 'arrow') {
                    ctx.fillStyle = '#8b5a2b';
                    for (let i = 3; i < 12; i++) ctx.fillRect(i, 15 - i, 1, 1);
                    ctx.fillStyle = '#d8d8d8'; // Arrowhead
                    ctx.fillRect(10, 2, 3, 3);
                    ctx.fillStyle = '#ffffff'; // Feather fletching
                    ctx.fillRect(2, 11, 3, 3);
                } else if (itemKey === 'shears') {
                    ctx.fillStyle = '#8b4513';
                    ctx.fillRect(3, 10, 3, 3); ctx.fillRect(7, 11, 3, 3);
                    ctx.fillStyle = '#dcdcdc';
                    ctx.fillRect(6, 4, 2, 6); ctx.fillRect(9, 6, 4, 2);
                } else if (itemKey === 'ender_pearl') {
                    ctx.fillStyle = '#0e4d45';
                    ctx.fillRect(4, 4, 8, 8);
                    ctx.fillStyle = '#25b59c';
                    ctx.fillRect(5, 5, 6, 6);
                    ctx.fillStyle = '#99ffee';
                    ctx.fillRect(6, 6, 2, 2);
                } else if (itemKey === 'spyglass') {
                    ctx.fillStyle = '#d47a38';
                    ctx.fillRect(4, 9, 4, 4);
                    ctx.fillRect(7, 6, 4, 4);
                    ctx.fillStyle = '#9d55d4';
                    ctx.fillRect(10, 3, 3, 3);
                } else if (itemKey === 'compass' || itemKey === 'clock') {
                    ctx.fillStyle = (itemKey === 'clock') ? '#fcee4b' : '#a8adb5';
                    ctx.fillRect(3, 3, 10, 10);
                    ctx.fillStyle = '#222222';
                    ctx.fillRect(5, 5, 6, 6);
                    ctx.fillStyle = (itemKey === 'clock') ? '#44aaff' : '#ff2222';
                    ctx.fillRect(7, 5, 2, 4);
                } else if (itemKey.includes('pickaxe') || itemKey.includes('drill')) {
                    // Pickaxe
                    ctx.fillStyle = '#6d4c28'; // Stick
                    for (let i = 4; i < 13; i++) ctx.fillRect(i, 16 - i, 1, 1);
                    ctx.fillStyle = matColor; // Head
                    ctx.fillRect(2, 2, 8, 2);
                    ctx.fillRect(2, 4, 2, 4);
                    ctx.fillRect(8, 2, 4, 2);
                } else if (itemKey.includes('sword') || itemKey.includes('blade')) {
                    // Sword
                    ctx.fillStyle = '#6d4c28'; // Handle
                    ctx.fillRect(3, 12, 2, 2);
                    ctx.fillStyle = '#444444'; // Guard
                    ctx.fillRect(4, 10, 4, 1);
                    ctx.fillRect(3, 11, 1, 4);
                    ctx.fillStyle = matColor; // Blade
                    for (let i = 0; i < 7; i++) {
                        ctx.fillRect(6 + i, 8 - i, 2, 2);
                    }
                } else if (itemKey.includes('axe')) {
                    // Axe
                    ctx.fillStyle = '#6d4c28';
                    for (let i = 4; i < 13; i++) ctx.fillRect(i, 16 - i, 1, 1);
                    ctx.fillStyle = matColor;
                    ctx.fillRect(2, 2, 6, 5);
                } else if (itemKey.includes('shovel')) {
                    // Shovel
                    ctx.fillStyle = '#6d4c28';
                    for (let i = 4; i < 13; i++) ctx.fillRect(i, 16 - i, 1, 1);
                    ctx.fillStyle = matColor;
                    ctx.fillRect(9, 2, 5, 5);
                } else if (itemKey.includes('apple')) {
                    // Apple
                    ctx.fillStyle = itemKey.includes('enchanted') ? '#d866ff' : (itemKey.includes('gold') ? '#fcee4b' : '#d82222');
                    ctx.fillRect(4, 4, 8, 8);
                    ctx.fillStyle = '#449922'; // Leaf
                    ctx.fillRect(7, 2, 2, 2);
                } else if (itemKey.includes('beef') || itemKey.includes('pork') || itemKey.includes('chicken') || itemKey.includes('flesh') || itemKey.includes('fish')) {
                    ctx.fillStyle = itemKey.includes('cooked') ? '#8c4625' : (itemKey.includes('flesh') ? '#6b4428' : '#d45555');
                    ctx.fillRect(3, 4, 10, 8);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(11, 3, 2, 2);
                } else if (itemKey.includes('bread') || itemKey.includes('potato') || itemKey.includes('pie') || itemKey.includes('cookie')) {
                    ctx.fillStyle = '#c68a4c';
                    ctx.fillRect(2, 6, 12, 5);
                } else if (itemKey.includes('carrot') || itemKey.includes('melon')) {
                    ctx.fillStyle = itemKey.includes('carrot') ? '#ff7711' : '#dd3333';
                    ctx.fillRect(4, 4, 8, 8);
                } else if (itemKey.includes('crystal') || itemKey.includes('diamond') || itemKey.includes('emerald') || itemKey.includes('shard')) {
                    ctx.fillStyle = itemKey.includes('shard') ? '#22d8e8' : matColor;
                    ctx.fillRect(6, 3, 4, 10);
                    ctx.fillRect(4, 5, 8, 6);
                } else if (itemKey.includes('ingot')) {
                    ctx.fillStyle = matColor;
                    ctx.fillRect(3, 7, 10, 4);
                    ctx.fillRect(5, 5, 6, 2);
                } else if (itemKey.includes('boots')) {
                    ctx.fillStyle = matColor;
                    ctx.fillRect(3, 6, 3, 6); ctx.fillRect(2, 10, 4, 2);
                    ctx.fillRect(10, 6, 3, 6); ctx.fillRect(9, 10, 4, 2);
                } else if (itemKey.includes('jetpack')) {
                    ctx.fillStyle = '#666666';
                    ctx.fillRect(3, 4, 4, 8);
                    ctx.fillRect(9, 4, 4, 8);
                    ctx.fillStyle = '#ff5500';
                    ctx.fillRect(4, 12, 2, 3);
                    ctx.fillRect(10, 12, 2, 3);
                } else if (itemKey === 'bone' || itemKey === 'feather') {
                    ctx.fillStyle = '#eeeeee';
                    for (let i = 3; i < 13; i++) ctx.fillRect(i, 16 - i, 2, 2);
                } else if (itemKey === 'gunpowder' || itemKey === 'bone_meal' || itemKey === 'coal' || itemKey === 'redstone') {
                    ctx.fillStyle = itemKey === 'bone_meal' ? '#f2f2f2' : (itemKey === 'redstone' ? '#dd1111' : '#444444');
                    ctx.fillRect(4, 5, 8, 7);
                    ctx.fillRect(6, 3, 4, 2);
                } else {
                    // Generic material / stick
                    ctx.fillStyle = '#8b5a2b';
                    for (let i = 3; i < 13; i++) ctx.fillRect(i, 16 - i, 2, 2);
                }
            }

            const dataUrl = c.toDataURL();
            this.iconCache[itemKey] = dataUrl;
            return dataUrl;
        }
    }

    global.TextureAtlas = TextureAtlas;
})(window);
