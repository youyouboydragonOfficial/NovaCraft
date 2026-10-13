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
                else if (itemKey.includes('astral')) matColor = '#df44ff';
                else if (itemKey.includes('laser')) matColor = '#33eeff';

                if (itemKey.includes('pickaxe') || itemKey.includes('drill')) {
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
                    ctx.fillStyle = itemKey.includes('gold') ? '#fcee4b' : '#d82222';
                    ctx.fillRect(4, 4, 8, 8);
                    ctx.fillStyle = '#449922'; // Leaf
                    ctx.fillRect(7, 2, 2, 2);
                } else if (itemKey.includes('beef') || itemKey.includes('meat')) {
                    // Steak / Beef
                    ctx.fillStyle = itemKey.includes('cooked') ? '#7d3820' : '#b22222';
                    ctx.fillRect(3, 4, 10, 8);
                    ctx.fillStyle = '#ffffff'; // Bone tip
                    ctx.fillRect(11, 3, 2, 2);
                } else if (itemKey.includes('bread')) {
                    // Bread
                    ctx.fillStyle = '#c68a4c';
                    ctx.fillRect(2, 6, 12, 5);
                } else if (itemKey.includes('crystal') || itemKey.includes('diamond') || itemKey.includes('emerald')) {
                    // Gem
                    ctx.fillStyle = matColor;
                    ctx.fillRect(6, 3, 4, 10);
                    ctx.fillRect(4, 5, 8, 6);
                } else if (itemKey.includes('ingot')) {
                    // Ingot
                    ctx.fillStyle = matColor;
                    ctx.fillRect(3, 7, 10, 4);
                    ctx.fillRect(5, 5, 6, 2);
                } else if (itemKey.includes('boots')) {
                    // Boots
                    ctx.fillStyle = matColor;
                    ctx.fillRect(3, 6, 3, 6); ctx.fillRect(2, 10, 4, 2);
                    ctx.fillRect(10, 6, 3, 6); ctx.fillRect(9, 10, 4, 2);
                } else if (itemKey.includes('jetpack')) {
                    // Jetpack
                    ctx.fillStyle = '#666666';
                    ctx.fillRect(3, 4, 4, 8);
                    ctx.fillRect(9, 4, 4, 8);
                    ctx.fillStyle = '#ff5500'; // Thruster flame
                    ctx.fillRect(4, 12, 2, 3);
                    ctx.fillRect(10, 12, 2, 3);
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
