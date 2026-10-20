// Main Game Engine, Lighting, Input Loops & Interaction for NovaCraft
(function(global) {
    // Zero-Crash Safeguard: Prevent uncaught errors from freezing the game loop
    window.addEventListener('error', function(e) {
        console.warn('NovaCraft Safe Guard Error:', e.message);
        e.preventDefault();
    });
    window.addEventListener('unhandledrejection', function(e) {
        console.warn('NovaCraft Safe Guard Rejection:', e.reason);
        e.preventDefault();
    });

    class Game {
        constructor() {
            this.container = document.getElementById('game-container');
            this.showDebug = false;
            this.timeOfDay = 0.22; // 0.22 = bright morning (~8:30 AM), 0.25 = noon, 0.5 = sunset, 0.75 = midnight
            this.daySpeed = 0.000833; // 20 minutes per full day-night cycle (Minecraft Vanilla authentic)

            this.input = {
                keys: {},
                mouseButtons: {},
                spaceJustPressed: false,
                sprint: false
            };

            this.lastTime = performance.now();
            this.lastForwardPressTime = 0;
            this.lastClickTime = 0;
            this.fpsFrames = 0;
            this.fpsTime = 0;
            this.currentFPS = 60;
            this.gameStarted = false;
            this.pointerLockAcquired = false;

            this.initThree();
            this.initComponents();
            this.setupInputs();
            this.initHandMesh();

            // Auto-save every 30 seconds
            setInterval(() => this.saveManager.saveWorld(), 30000);

            // Load existing save or generate fresh
            const hasSave = this.saveManager.loadWorld();
            this.world.updateChunksAround(this.player.x, this.player.z, 2);
            const surfaceY = this.world.getHighestSolidY(Math.floor(this.player.x), Math.floor(this.player.z));
            if (!hasSave || this.player.y < surfaceY - 1.0 || this.player.y < 3.0) {
                this.player.y = surfaceY + 1.8;
                this.player.velocity.set(0, 0, 0);
            }

            this.animate();
        }

        initThree() {
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x78a7ff);
            this.scene.fog = new THREE.FogExp2(0x78a7ff, 0.015);

            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
            this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.container.appendChild(this.renderer.domElement);

            // Lighting
            this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(this.ambientLight);

            this.sunLight = new THREE.DirectionalLight(0xffffff, 0.9);
            this.sunLight.position.set(50, 100, 50);
            this.scene.add(this.sunLight);

            // Celestial Sun & Moon
            const sunGeo = new THREE.BoxGeometry(10, 10, 1);
            const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
            this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
            this.scene.add(this.sunMesh);

            const moonGeo = new THREE.BoxGeometry(8, 8, 1);
            const moonMat = new THREE.MeshBasicMaterial({ color: 0xddddff });
            this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
            this.scene.add(this.moonMesh);

            // Block selection wireframe box
            const wireGeo = new THREE.BoxGeometry(1.004, 1.004, 1.004);
            const wireMat = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
            this.highlightBox = new THREE.Mesh(wireGeo, wireMat);
            this.highlightBox.visible = false;
            this.scene.add(this.highlightBox);

            // Realistic Minecraft Breaking / Crack Overlay Box
            const crackGeo = new THREE.BoxGeometry(1.006, 1.006, 1.006);
            this.crackMaterial = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0.85,
                depthWrite: false
            });
            this.crackBox = new THREE.Mesh(crackGeo, this.crackMaterial);
            this.crackBox.visible = false;
            this.scene.add(this.crackBox);

            // Authentic Minecraft Procedural Clouds
            this.cloudsGroup = new THREE.Group();
            const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 });
            const cloudGeo = new THREE.BoxGeometry(24, 4, 16);
            for (let cx = -4; cx <= 4; cx++) {
                for (let cz = -4; cz <= 4; cz++) {
                    if ((cx * 3 + cz * 7) % 3 === 0) {
                        const cloudPiece = new THREE.Mesh(cloudGeo, cloudMat);
                        cloudPiece.position.set(cx * 40, 56, cz * 40);
                        this.cloudsGroup.add(cloudPiece);
                    }
                }
            }
            this.scene.add(this.cloudsGroup);

            window.addEventListener('resize', () => {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            });
        }

        initComponents() {
            this.atlas = new TextureAtlas();
            this.sound = new SoundEngine();
            this.world = new World(this.scene, this.atlas);
            this.physics = new Physics(this.world);
            this.player = new Player(this.camera, this.world, this.physics, this.sound);
            this.itemManager = new ItemManager(this.scene, this.world, this.sound);
            this.mobManager = new MobManager(this.scene, this.world, this.sound, this.itemManager);
            this.inventory = new Inventory();
            this.ui = new UIManager(this, this.inventory, this.player);
            this.saveManager = new SaveManager(this);

            // Bind atlas texture to crack material
            this.crackMaterial.map = this.atlas.getTexture();
        }

        initHandMesh() {
            // Authentic Minecraft first-person arm & held item model attached to camera
            this.handGroup = new THREE.Group();
            this.handGroup.position.set(0.36, -0.32, -0.48);
            this.currentHandItemKey = null;
            this.heldItemMesh = null;
            this.updateHandMesh(null);

            this.camera.add(this.handGroup);
            this.scene.add(this.camera);
        }

        updateHandMesh(itemKey) {
            if (this.currentHandItemKey === itemKey && this.heldItemMesh) return;
            this.currentHandItemKey = itemKey;

            // Clear previous model
            while (this.handGroup.children.length > 0) {
                this.handGroup.remove(this.handGroup.children[0]);
            }

            const itemDef = itemKey ? window.ITEMS[itemKey] : null;

            // Master Arm Rig (Steve's arm is ALWAYS rendered!)
            const armRig = new THREE.Group();

            // 1. Steve's Sleeve (Teal/Cyan)
            const sleeveMat = new THREE.MeshLambertMaterial({ color: 0x009a9a });
            const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.26, 0.13), sleeveMat);
            sleeve.position.set(0, -0.13, 0);
            armRig.add(sleeve);

            // 2. Steve's Hand / Fist (Skin tone)
            const skinMat = new THREE.MeshLambertMaterial({ color: 0xcc8855 });
            const hand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.12), skinMat);
            hand.position.set(0, 0.08, 0);
            armRig.add(hand);

            // 3. Held Item attached to Hand
            if (itemDef?.blockId) {
                // Miniature 3D Voxel Block in hand
                const blockGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
                this.atlas.applyBlockUVs(blockGeo, itemDef.blockId);
                const blockMat = new THREE.MeshLambertMaterial({
                    map: this.atlas.getTexture(),
                    transparent: true
                });
                const blockMesh = new THREE.Mesh(blockGeo, blockMat);
                blockMesh.position.set(0, 0.22, -0.06);
                blockMesh.rotation.set(0.3, 0.6, 0.1);
                armRig.add(blockMesh);
            } else if (itemDef?.category === 'combat' || itemKey?.includes('sword') || itemKey?.includes('blade')) {
                // Authentic Minecraft 3D Sword (Handle, Crossguard, Blade)
                const swordGroup = new THREE.Group();
                const stickMat = new THREE.MeshLambertMaterial({ color: 0x5a3d28 });

                // Pommel
                const pommel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.06), stickMat);
                pommel.position.set(0, 0.02, 0);
                swordGroup.add(pommel);

                // Handle (grip)
                const handle = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.18, 0.045), stickMat);
                handle.position.set(0, 0.12, 0);
                swordGroup.add(handle);

                // Crossguard
                const guardMat = new THREE.MeshLambertMaterial({ color: 0x3e2815 });
                const guard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.06), guardMat);
                guard.position.set(0, 0.22, 0);
                swordGroup.add(guard);

                // Blade
                let bladeColor = 0x8a6035; // Wood default
                if (itemKey?.includes('stone')) bladeColor = 0x7a7a7a;
                else if (itemKey?.includes('iron')) bladeColor = 0xe0e0e0;
                else if (itemKey?.includes('gold')) bladeColor = 0xffd700;
                else if (itemKey?.includes('diamond')) bladeColor = 0x4dedf0;
                else if (itemKey?.includes('astral')) bladeColor = 0xd044ff; // Glowing Astral

                const bladeMat = new THREE.MeshLambertMaterial({ color: bladeColor });
                const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.60, 0.035), bladeMat);
                blade.position.set(0, 0.53, 0);
                swordGroup.add(blade);

                // Angle sword naturally forward from hand
                swordGroup.rotation.set(0.65, 0.1, -0.2);
                swordGroup.position.set(0, 0.06, 0);
                armRig.add(swordGroup);
            } else if (itemDef?.category === 'tools') {
                // Tools (Pickaxe, Axe, Shovel)
                const toolGroup = new THREE.Group();
                const stickMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
                const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.50, 0.05), stickMat);
                handle.position.set(0, 0.25, 0);
                toolGroup.add(handle);

                let headColor = 0x888888;
                if (itemKey?.includes('wood')) headColor = 0x8a6035;
                else if (itemKey?.includes('iron')) headColor = 0xd8d8d8;
                else if (itemKey?.includes('gold')) headColor = 0xffd700;
                else if (itemKey?.includes('diamond') || itemKey?.includes('laser')) headColor = 0x44eeff;

                const headMat = new THREE.MeshLambertMaterial({ color: headColor });
                if (itemKey?.includes('pickaxe') || itemKey?.includes('drill')) {
                    const pickHead = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.06), headMat);
                    pickHead.position.set(0, 0.48, 0);
                    toolGroup.add(pickHead);
                } else if (itemKey?.includes('axe')) {
                    const axeHead = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.06), headMat);
                    axeHead.position.set(0.08, 0.44, 0);
                    toolGroup.add(axeHead);
                } else {
                    const shovelHead = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.03), headMat);
                    shovelHead.position.set(0, 0.46, 0);
                    toolGroup.add(shovelHead);
                }

                toolGroup.rotation.set(0.65, 0.1, -0.2);
                armRig.add(toolGroup);
            } else if (itemDef) {
                // Generic items (Torch, Food, etc.)
                const itemIcon = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.06), new THREE.MeshLambertMaterial({ color: 0xffaa44 }));
                itemIcon.position.set(0, 0.20, 0);
                armRig.add(itemIcon);
            }

            // Arm resting tilt
            armRig.rotation.set(0.35, -0.20, 0.15);
            this.heldItemMesh = armRig;
            this.handGroup.add(armRig);
        }

        setupInputs() {
            const dom = this.renderer.domElement;

            dom.addEventListener('click', () => {
                if (this.inventory.openMode === 'none') {
                    this.requestPointerLock();
                    this.sound.init();
                    this.sound.startAmbientBGM();
                }
            });

            document.addEventListener('pointerlockchange', () => {
                this.isPointerLocked = (document.pointerLockElement === dom);
                if (this.isPointerLocked) {
                    this.pointerLockAcquired = true;
                } else {
                    // Always clear held keys & mouse buttons when pointer lock exits so Space/WASD never get stuck!
                    this.input.keys = {};
                    this.input.mouseButtons = {};
                    this.input.spaceJustPressed = false;
                    if (this.gameStarted && this.pointerLockAcquired && this.inventory.openMode === 'none' && !this.player.isDead) {
                        this.pointerLockAcquired = false;
                        this.ui.openModal('pause');
                    }
                }
            });

            window.addEventListener('blur', () => {
                this.input.keys = {};
                this.input.mouseButtons = {};
                this.input.spaceJustPressed = false;
            });

            document.addEventListener('mousemove', (e) => {
                if (!this.isPointerLocked) return;
                const sens = 0.0022;
                this.player.yaw -= e.movementX * sens;
                this.player.pitch -= e.movementY * sens;
                const maxPitch = Math.PI / 2 - 0.01;
                this.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.player.pitch));
            });

            window.addEventListener('keydown', (e) => {
                this.sound.init();
                if (e.code === 'Space') {
                    this.input.spaceJustPressed = true;
                }
                this.input.keys[e.code] = true;

                // Authentic Minecraft Double-Tap W or Up-Arrow to Sprint!
                if ((e.code === 'KeyW' || e.code === 'ArrowUp') && !e.repeat) {
                    const now = performance.now();
                    if (now - this.lastForwardPressTime < 320) {
                        this.player.isSprinting = true;
                    }
                    this.lastForwardPressTime = now;
                }

                // Hotbar select with 1-9
                if (e.key >= '1' && e.key <= '9') {
                    this.inventory.selectedHotbarIndex = parseInt(e.key) - 1;
                }

                // Inventory 'E' key
                if (e.code === 'KeyE') {
                    if (this.inventory.openMode === 'none') {
                        if (this.player.gameMode === 'creative') {
                            this.ui.openModal('creative');
                        } else {
                            this.ui.openModal('inventory');
                        }
                    } else {
                        this.ui.closeModal();
                    }
                }

                // Chat 'T' or '/'
                if ((e.code === 'KeyT' || e.key === '/') && this.inventory.openMode === 'none') {
                    e.preventDefault();
                    this.ui.openChat();
                    if (e.key === '/') this.ui.chatInput.value = '/';
                }

                // F3 Debug toggle
                if (e.code === 'F3') {
                    e.preventDefault();
                    this.showDebug = !this.showDebug;
                }

                // Escape key toggle pause menu
                if (e.code === 'Escape') {
                    if (this.inventory.openMode !== 'none') {
                        if (this.gameStarted) {
                            this.ui.closeModal();
                        }
                    } else if (this.gameStarted && !this.player.isDead) {
                        this.ui.openModal('pause');
                    }
                }
            });

            window.addEventListener('keyup', (e) => {
                this.input.keys[e.code] = false;
                // Stop sprinting when releasing forward movement key
                if (e.code === 'KeyW' || e.code === 'ArrowUp') {
                    this.player.isSprinting = false;
                }
            });

            // Mouse wheel for hotbar
            window.addEventListener('wheel', (e) => {
                if (this.isPointerLocked) {
                    if (e.deltaY > 0) {
                        this.inventory.selectedHotbarIndex = (this.inventory.selectedHotbarIndex + 1) % 9;
                    } else {
                        this.inventory.selectedHotbarIndex = (this.inventory.selectedHotbarIndex + 8) % 9;
                    }
                }
            });

            // Mouse Click (Mining, Placing & Double-click sprint toggle)
            window.addEventListener('mousedown', (e) => {
                if (!this.isPointerLocked) return;
                this.input.mouseButtons[e.button] = true;

                if (e.button === 0) {
                    // Double-click mouse to toggle sprint
                    const now = performance.now();
                    if (now - this.lastClickTime < 300) {
                        this.player.isSprinting = !this.player.isSprinting;
                    }
                    this.lastClickTime = now;

                    // Left click: Attack mob or Mine
                    this.player.swingHand();
                    this.handleLeftClick();
                } else if (e.button === 2) {
                    // Right click: Interact / Place block / Custom ability
                    this.handleRightClick();
                }
            });

            window.addEventListener('mouseup', (e) => {
                this.input.mouseButtons[e.button] = false;
                if (e.button === 0) {
                    this.player.miningProgress = 0;
                }
            });
        }

        requestPointerLock() {
            if (this.sound) {
                this.sound.init();
                this.sound.startAmbientBGM();
            }
            this.renderer.domElement.requestPointerLock();
        }

        handleLeftClick() {
            // Check mob hit
            const ray = this.player.raycast(3.5);
            const cameraDir = new THREE.Vector3();
            this.camera.getWorldDirection(cameraDir);
            const origin = new THREE.Vector3(this.player.x, this.player.y + this.player.eyeHeight, this.player.z);

            const hitMob = this.mobManager.checkMobHit(origin.clone().addScaledVector(cameraDir, 2.0), 1.5);
            if (hitMob) {
                const heldItem = this.inventory.getSelectedItem();
                const itemDef = window.ITEMS[heldItem?.item];
                const damage = itemDef?.damage || 1;
                hitMob.takeDamage(damage);
                this.sound.playHit();
                this.itemManager.spawnBlockParticles(hitMob.x, hitMob.y + 1, hitMob.z, 0xff2222, 6);
                return;
            }

            // Creative instant break
            if (this.player.gameMode === 'creative' && ray) {
                const bId = ray.blockId;
                const def = window.BLOCK_BY_ID[bId];
                this.world.setBlock(ray.x, ray.y, ray.z, window.BLOCKS.AIR.id);
                this.sound.playBreak(def?.sound || 'stone');
                this.itemManager.spawnBlockParticles(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5, 0xaaaaaa, 8);
                // Safe Sand/Gravel gravity physics
                this.world.applyGravityAbove(ray.x, ray.y, ray.z);
            }
        }

        handleRightClick() {
            const heldItem = this.inventory.getSelectedItem();
            const ray = this.player.raycast(5.0);

            // ★ 1. Custom Item: Astral Blade (Shockwave Slash!)
            if (heldItem && heldItem.item === 'astral_blade') {
                const dir = new THREE.Vector3();
                this.camera.getWorldDirection(dir);
                const origin = new THREE.Vector3(this.player.x, this.player.y + this.player.eyeHeight, this.player.z);
                this.itemManager.shootAstralSlash(origin.addScaledVector(dir, 1.0), dir);
                this.player.swingHand();
                return;
            }

            // ★ 2. Custom Item: Laser Drill (Area Mine 3x3x3!)
            if (heldItem && heldItem.item === 'laser_drill' && ray) {
                this.sound.playLaser();
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dz = -1; dz <= 1; dz++) {
                            const bx = ray.x + dx;
                            const by = ray.y + dy;
                            const bz = ray.z + dz;
                            const bId = this.world.getBlock(bx, by, bz);
                            const def = window.BLOCK_BY_ID[bId];
                            if (def && def.solid && def.id !== window.BLOCKS.BEDROCK.id) {
                                this.world.setBlock(bx, by, bz, window.BLOCKS.AIR.id);
                                if (def.drop) {
                                    this.itemManager.spawnDroppedItem(bx + 0.5, by + 0.5, bz + 0.5, def.drop);
                                }
                            }
                        }
                    }
                }
                this.itemManager.spawnBlockParticles(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5, 0x44ddff, 16);
                return;
            }

            // 3. Eat Food
            if (heldItem) {
                const itemDef = window.ITEMS[heldItem.item];
                if (itemDef?.category === 'food' && (this.player.food < this.player.maxFood || itemDef.heal)) {
                    this.player.food = Math.min(this.player.maxFood, this.player.food + (itemDef.foodRestore || 0));
                    if (itemDef.heal) this.player.heal(itemDef.heal);
                    this.inventory.consumeSelectedItem(1);
                    this.sound.playPop();
                    return;
                }
            }

            // 4. Block Interaction (Crafting Table, Furnace, Chest, Waygate, TNT)
            if (ray) {
                const bId = ray.blockId;
                const B = window.BLOCKS;

                if (bId === B.CRAFTING_TABLE.id) {
                    this.ui.openModal('crafting');
                    return;
                } else if (bId === B.FURNACE.id) {
                    this.ui.openModal('furnace');
                    return;
                } else if (bId === B.CHEST.id) {
                    this.ui.openModal('chest');
                    return;
                } else if (bId === B.WAYGATE.id) {
                    // ★ Teleport to next Waygate!
                    this.teleportToNextWaygate(ray.x, ray.y, ray.z);
                    return;
                } else if (bId === B.TNT.id || bId === B.CLUSTER_TNT.id) {
                    // Ignite TNT
                    this.itemManager.igniteTnt(ray.x, ray.y, ray.z, bId === B.CLUSTER_TNT.id);
                    return;
                }

                // 5. Place Block
                if (heldItem) {
                    const itemDef = window.ITEMS[heldItem.item];
                    if (itemDef?.blockId) {
                        const px = ray.x + ray.normal[0];
                        const py = ray.y + ray.normal[1];
                        const pz = ray.z + ray.normal[2];

                        // Check collision with player
                        const placeBox = new AABB(px, py, pz, px + 1, py + 1, pz + 1);
                        const playerBox = new AABB(
                            this.player.x - 0.3, this.player.y, this.player.z - 0.3,
                            this.player.x + 0.3, this.player.y + 1.8, this.player.z + 0.3
                        );

                        if (!placeBox.intersects(playerBox) || !window.BLOCK_BY_ID[itemDef.blockId]?.solid) {
                            this.world.setBlock(px, py, pz, itemDef.blockId);
                            this.sound.playPlace();
                            this.player.swingHand();
                            if (this.player.gameMode !== 'creative') {
                                this.inventory.consumeSelectedItem(1);
                            }
                        }
                    }
                }
            }
        }

        teleportToNextWaygate(curX, curY, curZ) {
            const gates = this.world.teleportWaygates;
            if (gates.length <= 1) {
                this.ui.addChatMessage('テレポート先となる別のウェイゲートがありません。', '#ff8888');
                return;
            }
            // Find next gate in list
            let nextIndex = 0;
            for (let i = 0; i < gates.length; i++) {
                if (gates[i].x === curX && gates[i].y === curY && gates[i].z === curZ) {
                    nextIndex = (i + 1) % gates.length;
                    break;
                }
            }
            const target = gates[nextIndex];
            this.player.x = target.x + 0.5;
            this.player.y = target.y + 1.2;
            this.player.z = target.z + 0.5;
            this.sound.playWarp();
            this.itemManager.spawnBlockParticles(this.player.x, this.player.y, this.player.z, 0xee22ff, 20);
            this.ui.addChatMessage(`ウェイゲートへテレポートしました！ (${target.x}, ${target.y}, ${target.z})`, '#bb55ff');
        }

        handleMiningTick(dt) {
            if (this.player.gameMode === 'creative') {
                this.crackBox.visible = false;
                return;
            }

            if (this.input.mouseButtons[0]) {
                if (!this.player.isSwinging) {
                    this.player.swingHand();
                }
                const ray = this.player.raycast(4.5);
                if (ray) {
                    const bId = ray.blockId;
                    const def = window.BLOCK_BY_ID[bId];
                    if (def && def.hardness !== Infinity) {
                        const heldItem = this.inventory.getSelectedItem();
                        const toolDef = window.ITEMS[heldItem?.item];

                        let speed = 1.0;
                        if (toolDef && toolDef.toolType === def.tool) {
                            speed = toolDef.speed || 2.0;
                        }

                        this.player.miningProgress += (dt * speed) / (def.hardness || 1.0);

                        // Update Crack Overlay Box (0 to 9 stages)
                        const stage = Math.min(9, Math.floor(this.player.miningProgress * 10));
                        this.crackBox.visible = true;
                        this.crackBox.position.set(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5);
                        this.atlas.applyCrackUVs(this.crackBox.geometry, stage);

                        // Digging sound & particles
                        this.player.breakSoundTimer = (this.player.breakSoundTimer || 0) + dt;
                        if (this.player.breakSoundTimer > 0.22) {
                            this.sound.playDig(def.sound || 'stone');
                            this.itemManager.spawnBlockParticles(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5, 0x888888, 2);
                            this.player.breakSoundTimer = 0;
                        }

                        if (this.player.miningProgress >= 1.0) {
                            // Break block!
                            this.world.setBlock(ray.x, ray.y, ray.z, window.BLOCKS.AIR.id);
                            this.sound.playBreak(def.sound || 'stone');
                            this.player.miningProgress = 0;
                            this.crackBox.visible = false;

                            // Drop item
                            if (def.drop) {
                                this.itemManager.spawnDroppedItem(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5, def.drop);
                            }
                            this.itemManager.spawnBlockParticles(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5, 0x888888, 8);
                            // Safe Sand/Gravel gravity physics
                            this.world.applyGravityAbove(ray.x, ray.y, ray.z);
                        }
                        return;
                    }
                }
            }
            this.player.miningProgress = 0;
            this.crackBox.visible = false;
        }

        // UI Slot Interactions
        handleSlotClick(type, index) {
            try {
                let targetSlot = null;
                let targetArr = null;

                if (type === 'player') targetArr = this.inventory.slots;
                else if (type === 'craft2x2') targetArr = this.inventory.craft2x2;
                else if (type === 'craft3x3') targetArr = this.inventory.craft3x3;
                else if (type === 'chest') targetArr = this.inventory.chestSlots;

                if (!targetArr) return;

                const cur = this.inventory.cursorItem;
                const slot = targetArr[index];

                if (!cur && slot) {
                    this.inventory.cursorItem = slot;
                    targetArr[index] = null;
                    this.sound.playPop();
                } else if (cur && !slot) {
                    targetArr[index] = cur;
                    this.inventory.cursorItem = null;
                    this.sound.playPlace();
                } else if (cur && slot) {
                    if (cur.item === slot.item) {
                        const max = window.ITEMS[cur.item]?.maxStack || 64;
                        const space = max - slot.count;
                        const add = Math.min(space, cur.count);
                        slot.count += add;
                        cur.count -= add;
                        if (cur.count <= 0) this.inventory.cursorItem = null;
                    } else {
                        targetArr[index] = cur;
                        this.inventory.cursorItem = slot;
                    }
                    this.sound.playPlace();
                }

                if (type.startsWith('craft')) {
                    this.inventory.updateCraftResult(type === 'craft3x3');
                }
                this.refreshModalUI();
            } catch (err) {
                console.warn('Slot click safety guard:', err);
            }
        }

        handleCraftResultClick(is3x3 = false) {
            try {
                if (!this.inventory.craftResult) return;
                const res = this.inventory.craftResult;

                if (!this.inventory.cursorItem) {
                    this.inventory.cursorItem = { item: res.item, count: res.count };
                    this.inventory.takeCraftResult(is3x3);
                    this.sound.playPop();
                } else if (this.inventory.cursorItem.item === res.item) {
                    this.inventory.cursorItem.count += res.count;
                    this.inventory.takeCraftResult(is3x3);
                    this.sound.playPop();
                }
                this.refreshModalUI();
            } catch (err) {
                console.warn('Craft result safety guard:', err);
            }
        }

        handleFurnaceClick(slotType) {
            try {
                const f = this.inventory.furnace;
                const cur = this.inventory.cursorItem;
                const slot = f[slotType];

                if (!cur && slot) {
                    this.inventory.cursorItem = slot;
                    f[slotType] = null;
                    this.sound.playPop();
                } else if (cur && !slot) {
                    if (slotType !== 'output') {
                        f[slotType] = cur;
                        this.inventory.cursorItem = null;
                        this.sound.playPlace();
                    }
                } else if (cur && slot) {
                    if (cur.item === slot.item && slotType !== 'output') {
                        const max = window.ITEMS[cur.item]?.maxStack || 64;
                        const space = max - slot.count;
                        const add = Math.min(space, cur.count);
                        slot.count += add;
                        cur.count -= add;
                        if (cur.count <= 0) this.inventory.cursorItem = null;
                        this.sound.playPlace();
                    }
                }
                this.refreshModalUI();
            } catch (err) {
                console.warn('Furnace safety guard:', err);
            }
        }

        pickCreativeItem(itemKey) {
            this.inventory.addItem(itemKey, 64);
            this.sound.playPop();
            this.ui.renderHUD();
        }

        refreshModalUI() {
            const mode = this.inventory.openMode;
            if (mode === 'inventory') this.ui.renderInventoryModal();
            else if (mode === 'crafting') this.ui.renderCraftingModal();
            else if (mode === 'furnace') this.ui.renderFurnaceModal();
            else if (mode === 'chest') this.ui.renderChestModal();
            this.ui.renderHUD();
        }

        toggleGameMode() {
            const newMode = (this.player.gameMode === 'creative') ? 'survival' : 'creative';
            this.player.setGameMode(newMode);
            this.input.keys = {};
            this.input.mouseButtons = {};
            this.input.spaceJustPressed = false;
            const toggleBtn = document.getElementById('pause-mode-btn');
            if (toggleBtn) {
                toggleBtn.textContent = `ゲームモード切替 (現在: ${newMode === 'creative' ? 'クリエイティブ' : 'サバイバル'})`;
            }
            this.ui.renderHUD();
            this.ui.addChatMessage(`ゲームモードを「${newMode === 'creative' ? 'クリエイティブ' : 'サバイバル'}」に切り替えました。`, '#55ff55');
            return newMode;
        }

        teleportToAncientCity() {
            this.world.updateChunksAround(32, 32, 3);
            this.player.x = 32.5;
            this.player.y = 7.2;
            this.player.z = 22.5; // Facing the giant central Reinforced Deepslate Portal at Z=32
            this.player.yaw = Math.PI;
            this.player.pitch = 0.05;
            this.player.velocity.set(0, 0, 0);
            this.player.fallDistance = 0;
            this.input.keys = {};
            if (this.mobManager && this.mobManager.spawnWardenIfNeeded) {
                this.mobManager.spawnWardenIfNeeded(32.5, 7.0, 32.5);
            }
            this.sound.playWarp();
            this.ui.closeModal();
            this.ui.addChatMessage('🏛️ ディープダーク「古代都市 (Ancient City)」の祭壇前へ移動しました！', '#44eeff');
        }

        respawnPlayer() {
            this.player.isDead = false;
            this.player.health = 20;
            this.player.food = 20;
            this.player.x = 8.5;
            this.player.z = 8.5;
            this.world.updateChunksAround(this.player.x, this.player.z, 2);
            const surfaceY = this.world.getHighestSolidY(Math.floor(this.player.x), Math.floor(this.player.z));
            this.player.y = surfaceY + 1.8;
            this.player.velocity.set(0, 0, 0);
            this.player.fallDistance = 0;
            this.ui.closeModal();
            this.requestPointerLock();
        }

        updateEnvironment(dt) {
            // Day/Night Cycle
            this.timeOfDay = (this.timeOfDay + this.daySpeed * dt) % 1.0;

            const sunAngle = this.timeOfDay * Math.PI * 2;
            const sunDistance = 200;

            const sx = Math.cos(sunAngle) * sunDistance;
            const sy = Math.sin(sunAngle) * sunDistance;

            this.sunMesh.position.set(this.player.x + sx, this.player.y + sy, this.player.z);
            this.sunMesh.lookAt(this.player.x, this.player.y, this.player.z);

            this.moonMesh.position.set(this.player.x - sx, this.player.y - sy, this.player.z);
            this.moonMesh.lookAt(this.player.x, this.player.y, this.player.z);

            this.sunLight.position.set(sx, sy, 0);

            // Drifting Clouds - Follow player infinite position
            this.cloudsGroup.position.x = this.player.x;
            this.cloudsGroup.position.z = (this.cloudsGroup.position.z + dt * 1.5);
            if (Math.abs(this.cloudsGroup.position.z - this.player.z) > 120) {
                this.cloudsGroup.position.z = this.player.z;
            }

            // Sky and Fog Colors
            let skyColor = new THREE.Color(0x6eb5ff); // day blue
            if (sy < 0) {
                // Night (Clear Moonlit Night - terrain, trees and blocks remain clearly visible!)
                skyColor.setHex(0x101830);
                this.ambientLight.color.setHex(0x99aacc);
                this.ambientLight.intensity = 0.42;
                this.sunLight.color.setHex(0x6080b0);
                this.sunLight.intensity = 0.35;
            } else if (sy < 45) {
                // Sunset / Sunrise
                skyColor.setHex(0xe88245);
                this.ambientLight.color.setHex(0xffffff);
                this.ambientLight.intensity = 0.52;
                this.sunLight.color.setHex(0xffaa66);
                this.sunLight.intensity = 0.75;
            } else {
                // Day (Bright, Sunny & Clear Morning Sun)
                skyColor.setHex(0x6eb5ff);
                this.ambientLight.color.setHex(0xffffff);
                this.ambientLight.intensity = 0.68;
                this.sunLight.color.setHex(0xfffae8);
                this.sunLight.intensity = 1.15;
            }

            // Underwater or Deep Dark (Ancient City) Atmospheric Effects
            if (this.player.headInWater) {
                const waterColor = new THREE.Color(0x15457a);
                this.scene.background = waterColor;
                this.scene.fog.color = waterColor;
                this.scene.fog.density = 0.055;
                this.ambientLight.intensity = 0.45;
            } else if (this.player.y < 16.0) {
                // Deep Dark / Ancient City Atmosphere (Mystical Soul-Cyan & Dark Slate)
                const deepDarkColor = new THREE.Color(0x06121c);
                this.scene.background = deepDarkColor;
                this.scene.fog.color = deepDarkColor;
                this.scene.fog.density = 0.022;
                this.ambientLight.color.setHex(0x75c8e8);
                this.ambientLight.intensity = 0.55;
                this.sunLight.color.setHex(0x44bbee);
                this.sunLight.intensity = 0.45;
            } else {
                this.scene.fog.density = 0.012;
                this.scene.background = skyColor;
                this.scene.fog.color = skyColor;
            }

            // Highlight target block box
            const ray = this.player.raycast(5.0);
            if (ray) {
                this.highlightBox.visible = true;
                this.highlightBox.position.set(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5);
            } else {
                this.highlightBox.visible = false;
            }
        }

        animate() {
            requestAnimationFrame(() => this.animate());

            try {
                const now = performance.now();
                const dt = Math.min((now - this.lastTime) / 1000, 0.1);
                this.lastTime = now;

                // FPS Counter
                this.fpsFrames++;
                this.fpsTime += dt;
                if (this.fpsTime >= 1.0) {
                    this.currentFPS = Math.round(this.fpsFrames / this.fpsTime);
                    this.fpsFrames = 0;
                    this.fpsTime = 0;
                }

                const heldItem = this.inventory.getSelectedItem();
                this.updateHandMesh(heldItem?.item);

                if (this.inventory.openMode === 'none') {
                    this.player.update(dt, this.input, heldItem);
                    this.handleMiningTick(dt);
                    this.itemManager.update(dt, this.player, this.inventory, this.mobManager);
                    this.mobManager.update(dt, this.player, this.timeOfDay);
                    this.inventory.updateFurnace(dt);
                    this.updateEnvironment(dt);

                    // Authentic Hand Bobbing & Swinging Animation
                    const isMoving = (this.input.keys['KeyW'] || this.input.keys['KeyS'] || this.input.keys['KeyA'] || this.input.keys['KeyD']) && this.player.onGround;
                    if (isMoving) {
                        this.walkBobTimer = (this.walkBobTimer || 0) + dt * 11;
                    } else {
                        this.walkBobTimer = (this.walkBobTimer || 0) * 0.9;
                    }
                    const bobX = Math.cos(this.walkBobTimer || 0) * 0.025;
                    const bobY = Math.abs(Math.sin(this.walkBobTimer || 0)) * 0.025;

                    // Attack / Mining swing (Authentic Minecraft Downward Chop & Inward Slash)
                    const isSwinging = this.player.isSwinging;
                    const swingProgress = isSwinging ? (this.player.handSwing / Math.PI) : 0;

                    // Minecraft authentic swing dynamics:
                    // swingArc: smooth arc for translation and horizontal sweep
                    // swingChop: snappy sqrt curve for fast, powerful downward strike
                    const swingArc = Math.sin(swingProgress * Math.PI);
                    const swingChop = Math.sin(Math.sqrt(swingProgress) * Math.PI);

                    const basePosX = 0.36;
                    const basePosY = -0.32;
                    const basePosZ = -0.48;

                    // Positive rotX = chops downward towards crosshair
                    const swingRotX = swingChop * 0.95;
                    // Negative rotY = sweeps inward across screen from right
                    const swingRotY = -swingArc * 0.65;
                    // Blade roll
                    const swingRotZ = swingArc * 0.35;

                    this.handGroup.position.set(
                        basePosX + bobX - (swingArc * 0.14),
                        basePosY - bobY - (swingChop * 0.12),
                        basePosZ + (swingChop * 0.08) - (swingArc * 0.14)
                    );
                    this.handGroup.rotation.set(swingRotX, swingRotY, swingRotZ);

                    // Infinite World chunk streaming & auto unloading
                    this.world.updateChunksAround(this.player.x, this.player.z, 3, 5);
                }

                // Reset one-shot input flags
                this.input.spaceJustPressed = false;

                this.ui.renderHUD();
                this.renderer.render(this.scene, this.camera);
            } catch (frameError) {
                console.warn('Frame render safety guard caught exception:', frameError);
            }
        }
    }

    function launchGame() {
        if (!window.game) {
            try {
                window.game = new Game();
                console.log("NovaCraft Game initialized successfully.");
                if (window.pendingMode && window.game.ui) {
                    console.log("Executing pending mode:", window.pendingMode);
                    window.game.ui.selectGameMode(window.pendingMode);
                    window.pendingMode = null;
                }
            } catch (err) {
                console.error("Critical error during NovaCraft Game initialization:", err);
            }
        }
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', launchGame);
    } else {
        launchGame();
    }

    global.Game = Game;
})(window);
