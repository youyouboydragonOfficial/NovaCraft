// Main Game Engine, Lighting, Input Loops & Interaction for NovaCraft
(function(global) {
    class Game {
        constructor() {
            this.container = document.getElementById('game-container');
            this.showDebug = false;
            this.timeOfDay = 0.25; // 0.0 = sunrise, 0.25 = noon, 0.5 = sunset, 0.75 = midnight
            this.daySpeed = 0.003; // ~5.5 minutes per day-night cycle

            this.input = {
                keys: {},
                mouseButtons: {},
                spaceJustPressed: false,
                sprint: false
            };

            this.lastTime = performance.now();
            this.fpsFrames = 0;
            this.fpsTime = 0;
            this.currentFPS = 60;

            this.initThree();
            this.initComponents();
            this.setupInputs();
            this.initHandMesh();

            // Auto-save every 30 seconds
            setInterval(() => this.saveManager.saveWorld(), 30000);

            // Load existing save or generate fresh
            if (!this.saveManager.loadWorld()) {
                this.world.updateChunksAround(this.player.x, this.player.z, 2);
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
            const wireGeo = new THREE.BoxGeometry(1.005, 1.005, 1.005);
            const wireMat = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
            this.highlightBox = new THREE.Mesh(wireGeo, wireMat);
            this.highlightBox.visible = false;
            this.scene.add(this.highlightBox);

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
        }

        initHandMesh() {
            // First-person hand / tool item model attached to camera
            this.handGroup = new THREE.Group();
            const armGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
            const armMat = new THREE.MeshLambertMaterial({ color: 0xcc8855 });
            this.armMesh = new THREE.Mesh(armGeo, armMat);
            this.armMesh.position.set(0.35, -0.35, -0.6);
            this.armMesh.rotation.set(Math.PI / 4, 0, -Math.PI / 12);
            this.handGroup.add(this.armMesh);
            this.camera.add(this.handGroup);
            this.scene.add(this.camera);
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
                if (!this.isPointerLocked && this.inventory.openMode === 'none' && !this.player.isDead) {
                    this.ui.openModal('pause');
                }
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

                // Escape
                if (e.code === 'Escape') {
                    if (this.inventory.openMode !== 'none') {
                        this.ui.closeModal();
                    }
                }
            });

            window.addEventListener('keyup', (e) => {
                this.input.keys[e.code] = false;
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

            // Mouse Click (Mining & Placing)
            window.addEventListener('mousedown', (e) => {
                if (!this.isPointerLocked) return;
                this.input.mouseButtons[e.button] = true;

                if (e.button === 0) {
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
                this.itemManager.spawnBlockParticles(hitMob.x, hitMob.y + 1, hitMob.z, 0xff2222, 6);
                return;
            }

            // Creative instant break
            if (this.player.gameMode === 'creative' && ray) {
                this.world.setBlock(ray.x, ray.y, ray.z, window.BLOCKS.AIR.id);
                this.sound.playBreak('stone');
                this.itemManager.spawnBlockParticles(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5, 0xaaaaaa, 6);
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
            if (this.player.gameMode === 'creative') return;

            if (this.input.mouseButtons[0]) {
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

                        // Digging sound
                        this.player.breakSoundTimer = (this.player.breakSoundTimer || 0) + dt;
                        if (this.player.breakSoundTimer > 0.22) {
                            this.sound.playDig(def.sound || 'stone');
                            this.player.breakSoundTimer = 0;
                        }

                        if (this.player.miningProgress >= 1.0) {
                            // Break block!
                            this.world.setBlock(ray.x, ray.y, ray.z, window.BLOCKS.AIR.id);
                            this.sound.playBreak(def.sound || 'stone');
                            this.player.miningProgress = 0;

                            // Drop item
                            if (def.drop) {
                                this.itemManager.spawnDroppedItem(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5, def.drop);
                            }
                        }
                        return;
                    }
                }
            }
            this.player.miningProgress = 0;
        }

        // UI Slot Interactions
        handleSlotClick(type, index) {
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
                // Pick up entire stack
                this.inventory.cursorItem = slot;
                targetArr[index] = null;
                this.sound.playPop();
            } else if (cur && !slot) {
                // Place cursor stack into slot
                targetArr[index] = cur;
                this.inventory.cursorItem = null;
                this.sound.playPlace();
            } else if (cur && slot) {
                if (cur.item === slot.item) {
                    // Combine
                    const max = window.ITEMS[cur.item]?.maxStack || 64;
                    const space = max - slot.count;
                    const add = Math.min(space, cur.count);
                    slot.count += add;
                    cur.count -= add;
                    if (cur.count <= 0) this.inventory.cursorItem = null;
                } else {
                    // Swap
                    targetArr[index] = cur;
                    this.inventory.cursorItem = slot;
                }
                this.sound.playPlace();
            }

            if (type.startsWith('craft')) {
                this.inventory.updateCraftResult(type === 'craft3x3');
            }
            this.refreshModalUI();
        }

        handleCraftResultClick(is3x3 = false) {
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
        }

        handleFurnaceClick(slotType) {
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

        respawnPlayer() {
            this.player.isDead = false;
            this.player.health = 20;
            this.player.food = 20;
            this.player.x = 8.5;
            this.player.y = 42.0;
            this.player.z = 8.5;
            this.player.velocity.set(0, 0, 0);
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

            // Sky and Fog Colors
            let skyColor = new THREE.Color(0x78a7ff); // day blue
            if (sy < 0) {
                // Night
                skyColor.setHex(0x080a1a);
                this.ambientLight.intensity = 0.18;
                this.sunLight.intensity = 0.15;
            } else if (sy < 40) {
                // Sunset / Sunrise
                skyColor.setHex(0xe57734);
                this.ambientLight.intensity = 0.45;
                this.sunLight.intensity = 0.6;
            } else {
                // Day
                skyColor.setHex(0x78a7ff);
                this.ambientLight.intensity = 0.55;
                this.sunLight.intensity = 0.95;
            }

            this.scene.background = skyColor;
            this.scene.fog.color = skyColor;

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

            if (this.inventory.openMode === 'none') {
                const heldItem = this.inventory.getSelectedItem();
                this.player.update(dt, this.input, heldItem);
                this.handleMiningTick(dt);
                this.itemManager.update(dt, this.player, this.inventory, this.mobManager);
                this.mobManager.update(dt, this.player, this.timeOfDay);
                this.inventory.updateFurnace(dt);
                this.updateEnvironment(dt);

                // Dynamically load world chunks around player
                this.world.updateChunksAround(this.player.x, this.player.z, 2);
            }

            // Reset one-shot input flags
            this.input.spaceJustPressed = false;

            this.ui.renderHUD();
            this.renderer.render(this.scene, this.camera);
        }
    }

    // Launch game when DOM is ready
    window.addEventListener('DOMContentLoaded', () => {
        window.game = new Game();
    });

    global.Game = Game;
})(window);
