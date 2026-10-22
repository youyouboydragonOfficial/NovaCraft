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
            } else if (itemKey === 'flint_and_steel') {
                // Authentic 3D Flint and Steel (着火石) with glowing spark in hand
                const fsGroup = new THREE.Group();
                const steelMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
                const flintMat = new THREE.MeshLambertMaterial({ color: 0x26262e });
                const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
                const coreMat = new THREE.MeshBasicMaterial({ color: 0xffff55 });
                const strikerTop = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.05), steelMat);
                strikerTop.position.set(-0.02, 0.28, 0);
                const strikerSide = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.05), steelMat);
                strikerSide.position.set(-0.07, 0.20, 0);
                const flintPiece = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.12, 0.06), flintMat);
                flintPiece.position.set(0.05, 0.18, 0);
                const sparkFlame = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.07), sparkMat);
                sparkFlame.position.set(0.02, 0.30, 0);
                const sparkCore = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.08), coreMat);
                sparkCore.position.set(0.02, 0.29, 0);
                fsGroup.add(strikerTop, strikerSide, flintPiece, sparkFlame, sparkCore);
                fsGroup.rotation.set(0.3, 0.2, -0.1);
                armRig.add(fsGroup);
            } else if (itemKey === 'bow') {
                // Authentic 3D Bow & String in hand
                const bowGroup = new THREE.Group();
                const woodMat = new THREE.MeshLambertMaterial({ color: 0x7a4e25 });
                const stringMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee });
                const limbMid = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.05), woodMat);
                limbMid.position.set(0, 0.30, -0.06);
                const limbTop = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.20, 0.045), woodMat);
                limbTop.position.set(0, 0.48, 0.02);
                limbTop.rotation.x = -0.45;
                const limbBot = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.20, 0.045), woodMat);
                limbBot.position.set(0, 0.12, 0.02);
                limbBot.rotation.x = 0.45;
                const bowString = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.52, 0.015), stringMat);
                bowString.position.set(0, 0.30, 0.09);
                bowGroup.add(limbMid, limbTop, limbBot, bowString);
                bowGroup.rotation.set(0.2, 0.1, 0);
                armRig.add(bowGroup);
            } else if (itemKey?.includes('bucket')) {
                // 3D Iron Bucket (Empty, Water, or Lava)
                const bucketGroup = new THREE.Group();
                const ironMat = new THREE.MeshLambertMaterial({ color: 0xc8ccd0 });
                const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.20, 0.18), ironMat);
                body.position.set(0, 0.22, 0);
                bucketGroup.add(body);
                if (itemKey === 'water_bucket' || itemKey === 'lava_bucket') {
                    const liquidColor = (itemKey === 'water_bucket') ? 0x2268e8 : 0xff5500;
                    const liquid = new THREE.Mesh(
                        new THREE.BoxGeometry(0.15, 0.04, 0.15),
                        new THREE.MeshBasicMaterial({ color: liquidColor })
                    );
                    liquid.position.set(0, 0.31, 0);
                    bucketGroup.add(liquid);
                }
                armRig.add(bucketGroup);
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
                else if (itemKey?.includes('netherite')) bladeColor = 0x483c42;
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
                // Tools (Pickaxe, Axe, Shovel, Shears, Spyglass, Fishing Rod)
                const toolGroup = new THREE.Group();
                const stickMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
                const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.50, 0.05), stickMat);
                handle.position.set(0, 0.25, 0);
                toolGroup.add(handle);

                let headColor = 0x888888;
                if (itemKey?.includes('wood')) headColor = 0x8a6035;
                else if (itemKey?.includes('iron') || itemKey === 'shears') headColor = 0xd8d8d8;
                else if (itemKey?.includes('gold') || itemKey === 'spyglass') headColor = 0xffb833;
                else if (itemKey?.includes('diamond') || itemKey?.includes('laser')) headColor = 0x44eeff;
                else if (itemKey?.includes('netherite')) headColor = 0x483c42;

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
                // Generic items (Food, Ender Pearl, Fire Charge, etc.)
                let itemColor = 0xffaa44;
                if (itemKey === 'ender_pearl') itemColor = 0x188f7c;
                else if (itemKey === 'fire_charge') itemColor = 0xff5500;
                else if (itemKey === 'snowball' || itemKey === 'bone_meal') itemColor = 0xf5f5f5;
                const itemIcon = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.20, 0.08), new THREE.MeshLambertMaterial({ color: itemColor }));
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

            // Prevent browser right-click context menu from interrupting block placement or item use
            window.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });

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
                if (!this.isPointerLocked) {
                    this.lastCursorDir = this.getCursorRayDir(e.clientX, e.clientY);
                    return;
                }
                this.lastCursorDir = null;
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

                // KeyR: Instant Block Placement Shortcut!
                if (e.code === 'KeyR' && this.inventory.openMode === 'none' && this.gameStarted && !this.player.isDead) {
                    this.handleRightClick();
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

            // Mouse wheel for hotbar (Works both when pointer locked and when cursor is over game canvas)
            window.addEventListener('wheel', (e) => {
                if (this.inventory.openMode === 'none' && this.gameStarted) {
                    if (e.deltaY > 0) {
                        this.inventory.selectedHotbarIndex = (this.inventory.selectedHotbarIndex + 1) % 9;
                    } else {
                        this.inventory.selectedHotbarIndex = (this.inventory.selectedHotbarIndex + 8) % 9;
                    }
                    this.ui.renderHUD();
                }
            });

            // Mouse Click (Left Click: Instant Break in Creative / Mining & Attack in Survival | Right Click: Place Block / Use Item)
            window.addEventListener('mousedown', (e) => {
                if (this.inventory.openMode !== 'none' || !this.gameStarted) return;
                if (!this.isPointerLocked && e.target !== this.renderer.domElement) return;

                this.sound.init();
                this.sound.startAmbientBGM();
                const customDir = this.getCursorRayDir(e.clientX, e.clientY);
                if (!this.isPointerLocked && e.target === this.renderer.domElement) {
                    this.requestPointerLock();
                }

                this.input.mouseButtons[e.button] = true;

                if (e.button === 0) {
                    // Double-click mouse to toggle sprint
                    const now = performance.now();
                    if (now - this.lastClickTime < 300) {
                        this.player.isSprinting = !this.player.isSprinting;
                    }
                    this.lastClickTime = now;

                    this.player.swingHand();
                    this.handleLeftClick(customDir);
                } else if (e.button === 2) {
                    this.player.swingHand();
                    this.handleRightClick(customDir);
                }
            });

            window.addEventListener('mouseup', (e) => {
                this.input.mouseButtons[e.button] = false;
                if (e.button === 0) {
                    this.player.miningProgress = 0;
                    this.miningTarget = null;
                    if (this.crackBox) this.crackBox.visible = false;
                }
            });
        }

        getCursorRayDir(clientX, clientY) {
            if (this.isPointerLocked || clientX === undefined || clientY === undefined) {
                return null;
            }
            const rect = this.renderer.domElement.getBoundingClientRect();
            if (!rect.width || !rect.height) return null;
            // Ensure camera transform matches current player eye position & rotation
            this.camera.position.set(this.player.x, this.player.y + this.player.eyeHeight, this.player.z);
            this.camera.rotation.order = 'YXZ';
            this.camera.rotation.y = this.player.yaw;
            this.camera.rotation.x = this.player.pitch;
            this.camera.updateMatrixWorld();

            const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
            const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
            const vec = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(this.camera);
            return vec.sub(this.camera.position).normalize();
        }

        requestPointerLock() {
            if (this.sound) {
                this.sound.init();
                this.sound.startAmbientBGM();
            }
            this.renderer.domElement.requestPointerLock();
        }

        handleLeftClick(customDir = null) {
            const cameraDir = customDir ? customDir.clone().normalize() : new THREE.Vector3();
            if (!customDir) this.camera.getWorldDirection(cameraDir);
            const origin = new THREE.Vector3(this.player.x, this.player.y + this.player.eyeHeight, this.player.z);

            const ray = this.player.raycast(6.5, customDir);

            // Melee mob check along look vector
            let hitMob = null;
            let closestMobDist = Infinity;
            const maxReach = 3.6;
            for (let step = 1.0; step <= maxReach; step += 0.8) {
                const checkPos = origin.clone().addScaledVector(cameraDir, step);
                const mob = this.mobManager.checkMobHit(checkPos, 1.3);
                if (mob) {
                    const d = Math.hypot(mob.x - origin.x, mob.y - origin.y, mob.z - origin.z);
                    if (d < closestMobDist) {
                        closestMobDist = d;
                        hitMob = mob;
                    }
                }
            }

            // Block occlusion: if a block is closer than mob, attack is absorbed by block
            if (hitMob && ray && ray.distance < closestMobDist - 0.4) {
                hitMob = null;
            }

            if (hitMob) {
                const heldItem = this.inventory.getSelectedItem();
                const itemDef = window.ITEMS[heldItem?.item];
                const damage = itemDef?.damage || 4;
                hitMob.takeDamage(damage);
                this.sound.playHit();
                this.itemManager.spawnBlockParticles(hitMob.x, hitMob.y + 1, hitMob.z, 0xff2222, 6);
                return;
            }

            if (ray) {
                const bId = ray.blockId;
                const def = window.BLOCK_BY_ID[bId];
                const B = window.BLOCKS;

                if (!def || def.hardness === Infinity) return; // Bedrock is unbreakable

                // Instant break in Creative OR for 0-hardness blocks (Fire, Torch, Flowers, Sapling, TNT in creative)
                if (this.player.gameMode === 'creative' || def.hardness === 0.0) {
                    this.world.setBlock(ray.x, ray.y, ray.z, B.AIR.id);
                    if (B.FIRE && bId === B.FIRE.id) {
                        this.sound.playFuse();
                        this.itemManager.spawnBlockParticles(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5, 0x555555, 6);
                    } else {
                        this.sound.playBreak(def?.sound || 'stone');
                        this.itemManager.spawnBlockParticles(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5, 0xaaaaaa, 8);
                        if (this.player.gameMode !== 'creative' && def?.drop) {
                            this.itemManager.spawnDroppedItem(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5, def.drop);
                        }
                    }
                    this.world.applyGravityAbove(ray.x, ray.y, ray.z);
                } else {
                    if (def && def.sound) {
                        this.sound.playDig(def.sound);
                    }
                }
            }
        }

        handleRightClick(customDir = null) {
            const heldItem = this.inventory.getSelectedItem();
            const itemKey = heldItem ? heldItem.item : null;
            const itemDef = itemKey ? window.ITEMS[itemKey] : null;
            const ray = this.player.raycast(7.5, customDir);
            const B = window.BLOCKS;
            const isSneaking = !!(this.input.keys['ShiftLeft'] || this.input.keys['ShiftRight']);

            const dir = customDir ? customDir.clone().normalize() : new THREE.Vector3();
            if (!customDir) this.camera.getWorldDirection(dir);
            const eyeOrigin = new THREE.Vector3(this.player.x, this.player.y + this.player.eyeHeight, this.player.z);

            // ★ 1. Flint and Steel (火打石と打ち金 / 着火石) & Fire Charge (ファイヤーチャージ)
            if (itemKey === 'flint_and_steel' || itemKey === 'fire_charge') {
                this.player.swingHand();
                if (this.sound.playFlintAndSteel) this.sound.playFlintAndSteel();

                if (ray) {
                    const bId = ray.blockId;
                    // 1a. Ignite TNT or Cluster TNT (direct hit OR adjacent to clicked block face)!
                    if (bId === B.TNT.id || bId === B.CLUSTER_TNT.id) {
                        this.itemManager.igniteTnt(ray.x, ray.y, ray.z, bId === B.CLUSTER_TNT.id);
                        if (itemKey === 'fire_charge' && this.player.gameMode !== 'creative') {
                            this.inventory.consumeSelectedItem(1);
                        }
                        return;
                    }
                    const adjOffsets = [
                        [ray.normal[0], ray.normal[1], ray.normal[2]],
                        [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]
                    ];
                    for (const [ox, oy, oz] of adjOffsets) {
                        const tx = ray.x + ox, ty = ray.y + oy, tz = ray.z + oz;
                        const tbId = this.world.getBlock(tx, ty, tz);
                        if (tbId === B.TNT.id || tbId === B.CLUSTER_TNT.id) {
                            this.itemManager.igniteTnt(tx, ty, tz, tbId === B.CLUSTER_TNT.id);
                            if (itemKey === 'fire_charge' && this.player.gameMode !== 'creative') {
                                this.inventory.consumeSelectedItem(1);
                            }
                            return;
                        }
                    }
                    // 1b. Ignite Obsidian -> Activate Nether Portal!
                    if (bId === B.OBSIDIAN.id && B.NETHER_PORTAL) {
                        const px = ray.x + ray.normal[0];
                        const py = ray.y + ray.normal[1];
                        const pz = ray.z + ray.normal[2];
                        for (let dy = 0; dy < 3; dy++) {
                            for (let dx = 0; dx < 2; dx++) {
                                if (this.world.getBlock(px + dx, py + dy, pz) === B.AIR.id) {
                                    this.world.setBlock(px + dx, py + dy, pz, B.NETHER_PORTAL.id);
                                }
                            }
                        }
                        this.sound.playWarp();
                        this.itemManager.spawnBlockParticles(px + 0.5, py + 1.0, pz + 0.5, 0xb533ff, 24);
                        this.ui.addChatMessage('🔥 黒曜石に着火し、ネザーポータルが起動しました！', '#d066ff');
                        if (itemKey === 'fire_charge' && this.player.gameMode !== 'creative') {
                            this.inventory.consumeSelectedItem(1);
                        }
                        return;
                    }
                    // 1c. Ignite Fire on the clicked block face!
                    if (B.FIRE) {
                        const fx = ray.x + ray.normal[0];
                        const fy = ray.y + ray.normal[1];
                        const fz = ray.z + ray.normal[2];
                        if (this.world.getBlock(fx, fy, fz) === B.AIR.id) {
                            this.world.setBlock(fx, fy, fz, B.FIRE.id);
                            this.itemManager.spawnBlockParticles(fx + 0.5, fy + 0.3, fz + 0.5, 0xff7711, 10);
                            if (itemKey === 'fire_charge' && this.player.gameMode !== 'creative') {
                                this.inventory.consumeSelectedItem(1);
                            }
                            return;
                        }
                    }
                } else if (itemKey === 'fire_charge') {
                    // Shoot Fireball into the air!
                    this.itemManager.shootFireball(eyeOrigin.clone().addScaledVector(dir, 0.8), dir);
                    if (this.player.gameMode !== 'creative') {
                        this.inventory.consumeSelectedItem(1);
                    }
                    return;
                } else if (itemKey === 'flint_and_steel' && B.FIRE) {
                    // Fallback: if player clicked slightly above the ground, ignite fire on the ground 2.5m in front of them!
                    const fx = Math.floor(this.player.x + dir.x * 2.5);
                    const fz = Math.floor(this.player.z + dir.z * 2.5);
                    const baseY = Math.floor(this.player.y);
                    for (let dy = 1; dy >= -2; dy--) {
                        const belowId = this.world.getBlock(fx, baseY + dy - 1, fz);
                        const curId = this.world.getBlock(fx, baseY + dy, fz);
                        if (belowId === B.TNT.id || belowId === B.CLUSTER_TNT.id) {
                            this.itemManager.igniteTnt(fx, baseY + dy - 1, fz, belowId === B.CLUSTER_TNT.id);
                            return;
                        }
                        if (belowId !== B.AIR.id && curId === B.AIR.id) {
                            this.world.setBlock(fx, baseY + dy, fz, B.FIRE.id);
                            this.itemManager.spawnBlockParticles(fx + 0.5, baseY + dy + 0.3, fz + 0.5, 0xff7711, 10);
                            return;
                        }
                    }
                }
                return;
            }

            // ★ 2. Bow & Arrow (弓矢の発射)
            if (itemKey === 'bow') {
                // In survival, check if player has arrows (or allow shooting if creative)
                let canShoot = (this.player.gameMode === 'creative');
                if (!canShoot) {
                    for (let i = 0; i < 36; i++) {
                        if (this.inventory.slots[i] && this.inventory.slots[i].item === 'arrow') {
                            this.inventory.slots[i].count--;
                            if (this.inventory.slots[i].count <= 0) this.inventory.slots[i] = null;
                            canShoot = true;
                            break;
                        }
                    }
                    // Even if out of arrows, allow shooting basic arrows so bow is always fun & usable!
                    canShoot = true;
                }
                if (canShoot) {
                    this.itemManager.shootArrow(eyeOrigin.clone().addScaledVector(dir, 0.8), dir, 1.0);
                    this.player.swingHand();
                }
                return;
            }

            // ★ 3. Ender Pearl (エンダーパール瞬間移動)
            if (itemKey === 'ender_pearl') {
                this.itemManager.throwEnderPearl(eyeOrigin.clone().addScaledVector(dir, 0.8), dir);
                this.player.swingHand();
                if (this.player.gameMode !== 'creative') {
                    this.inventory.consumeSelectedItem(1);
                }
                return;
            }

            // ★ 3b. Eye of Ender (エンダーアイ: 要塞探索投擲 & エンドポータル枠への挿入)
            if (itemKey === 'eye_of_ender') {
                this.player.swingHand();
                if (ray && ray.blockId === B.END_PORTAL_FRAME?.id) {
                    const frameKey = `${ray.x},${ray.y},${ray.z}`;
                    if (!this.filledPortalFrames) this.filledPortalFrames = new Set();
                    if (!this.filledPortalFrames.has(frameKey)) {
                        this.filledPortalFrames.add(frameKey);
                        this.sound.playPop();
                        this.itemManager.spawnBlockParticles(ray.x + 0.5, ray.y + 0.9, ray.z + 0.5, 0x1cb88f, 16);
                        if (this.player.gameMode !== 'creative') {
                            this.inventory.consumeSelectedItem(1);
                        }
                        this.checkAndActivateEndPortal(ray.x, ray.y, ray.z);
                    }
                    return;
                } else {
                    // Throw Eye of Ender floating towards Stronghold portal (59, 15, 59)!
                    this.itemManager.shootEyeOfEnder(eyeOrigin.clone().addScaledVector(dir, 0.8), new THREE.Vector3(59, 15, 59));
                    if (this.player.gameMode !== 'creative') {
                        this.inventory.consumeSelectedItem(1);
                    }
                    return;
                }
            }

            // ★ 4. Snowball (雪玉の投擲)
            if (itemKey === 'snowball') {
                this.itemManager.throwSnowball(eyeOrigin.clone().addScaledVector(dir, 0.8), dir);
                this.player.swingHand();
                if (this.player.gameMode !== 'creative') {
                    this.inventory.consumeSelectedItem(1);
                }
                return;
            }

            // ★ 5. Buckets (空のバケツ・水バケツ・溶岩バケツ)
            if (itemKey === 'bucket') {
                const fluidHit = this.player.raycastFluid(7.5, customDir);
                if (fluidHit) {
                    this.world.setBlock(fluidHit.x, fluidHit.y, fluidHit.z, B.AIR.id);
                    const newBucket = (fluidHit.blockId === B.WATER.id) ? 'water_bucket' : 'lava_bucket';
                    if (this.player.gameMode !== 'creative') {
                        this.inventory.consumeSelectedItem(1);
                        this.inventory.addItem(newBucket, 1);
                    } else {
                        this.inventory.slots[this.inventory.selectedHotbarIndex] = { item: newBucket, count: 1 };
                    }
                    this.sound.playPop();
                    this.player.swingHand();
                    return;
                }
            } else if ((itemKey === 'water_bucket' || itemKey === 'lava_bucket') && ray) {
                const px = ray.x + ray.normal[0];
                const py = ray.y + ray.normal[1];
                const pz = ray.z + ray.normal[2];
                const fluidBlockId = (itemKey === 'water_bucket') ? B.WATER.id : B.LAVA.id;
                this.world.setBlock(px, py, pz, fluidBlockId);
                if (this.player.gameMode !== 'creative') {
                    this.inventory.slots[this.inventory.selectedHotbarIndex] = { item: 'bucket', count: 1 };
                }
                this.sound.playPlace();
                this.player.swingHand();
                return;
            }

            // ★ 6. Bone Meal (骨粉: 苗木の即座成長＆草花生成)
            if (itemKey === 'bone_meal' && ray) {
                const bId = ray.blockId;
                if (B.SAPLING && bId === B.SAPLING.id) {
                    this.world.setBlock(ray.x, ray.y, ray.z, B.AIR.id);
                    this.world.generateTree(ray.x, ray.y, ray.z);
                    this.world.updateChunksAround(ray.x, ray.z, 1);
                    this.itemManager.spawnBlockParticles(ray.x + 0.5, ray.y + 1.5, ray.z + 0.5, 0x44ff44, 20);
                    this.sound.playHeal();
                    this.player.swingHand();
                    if (this.player.gameMode !== 'creative') this.inventory.consumeSelectedItem(1);
                    return;
                } else if (bId === B.GRASS.id || bId === B.DIRT.id) {
                    this.world.setBlock(ray.x, ray.y, ray.z, B.GRASS.id);
                    for (let dx = -2; dx <= 2; dx++) {
                        for (let dz = -2; dz <= 2; dz++) {
                            const gx = ray.x + dx;
                            const gz = ray.z + dz;
                            if (this.world.getBlock(gx, ray.y, gz) === B.GRASS.id && this.world.getBlock(gx, ray.y + 1, gz) === B.AIR.id) {
                                if (Math.random() < 0.35) {
                                    const flowerId = (Math.random() < 0.5) ? B.FLOWER_RED.id : B.FLOWER_YELLOW.id;
                                    this.world.setBlock(gx, ray.y + 1, gz, flowerId);
                                }
                            }
                        }
                    }
                    this.itemManager.spawnBlockParticles(ray.x + 0.5, ray.y + 1.1, ray.z + 0.5, 0x44ff44, 15);
                    this.sound.playPop();
                    this.player.swingHand();
                    if (this.player.gameMode !== 'creative') this.inventory.consumeSelectedItem(1);
                    return;
                }
            }

            // ★ 7. Shears (ハサミ: 羊の毛刈り＆葉ブロック採取)
            if (itemKey === 'shears') {
                const hitMob = this.mobManager.checkMobHit(eyeOrigin.clone().addScaledVector(dir, 2.2), 1.8);
                if (hitMob && hitMob.type === 'sheep') {
                    const woolCount = 2 + Math.floor(Math.random() * 2);
                    this.itemManager.spawnDroppedItem(hitMob.x, hitMob.y + 0.6, hitMob.z, 'wool_white', woolCount);
                    this.itemManager.spawnBlockParticles(hitMob.x, hitMob.y + 0.6, hitMob.z, 0xffffff, 10);
                    this.sound.playPop();
                    this.player.swingHand();
                    return;
                }
                if (ray && ray.blockId === B.OAK_LEAVES.id) {
                    this.world.setBlock(ray.x, ray.y, ray.z, B.AIR.id);
                    this.itemManager.spawnDroppedItem(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5, 'oak_leaves', 1);
                    this.sound.playBreak('grass');
                    this.player.swingHand();
                    return;
                }
            }

            // ★ 8. Fishing Rod, Compass, Clock, Spyglass
            if (itemKey === 'fishing_rod') {
                this.player.swingHand();
                this.sound.playBowShoot();
                const catches = ['raw_cod', 'raw_salmon', 'raw_cod', 'raw_salmon', 'golden_apple'];
                const caught = catches[Math.floor(Math.random() * catches.length)];
                this.inventory.addItem(caught, 1);
                this.sound.playPop();
                this.ui.addChatMessage(`🎣 釣り竿で「${window.ITEMS[caught]?.nameJa || caught}」を釣り上げました！`, '#66ddff');
                return;
            } else if (itemKey === 'compass') {
                const distAncient = Math.round(Math.hypot(32.5 - this.player.x, 32.5 - this.player.z));
                this.ui.addChatMessage(`🧭 コンパス: 初期スポーン地点 (8, 8) / 古代都市 (32, 32 - 距離 ${distAncient}m)`, '#55ffaa');
                return;
            } else if (itemKey === 'clock') {
                const totalHours = Math.floor(this.timeOfDay * 24);
                const mins = Math.floor((this.timeOfDay * 24 - totalHours) * 60);
                const hh = String(totalHours).padStart(2, '0');
                const mm = String(mins).padStart(2, '0');
                this.ui.addChatMessage(`🕒 時計: 現在時刻 ${hh}:${mm} (${this.timeOfDay < 0.5 ? '昼間 ☀️' : '夜間 🌙'})`, '#ffdd55');
                return;
            } else if (itemKey === 'spyglass') {
                this.player.isZooming = !this.player.isZooming;
                this.sound.playPop();
                return;
            }

            // ★ 9. Custom Item: Astral Blade (Shockwave Slash!)
            if (itemKey === 'astral_blade') {
                this.itemManager.shootAstralSlash(eyeOrigin.clone().addScaledVector(dir, 1.0), dir);
                this.player.swingHand();
                return;
            }

            // ★ 10. Custom Item: Laser Drill (Area Mine 3x3x3!)
            if (itemKey === 'laser_drill' && ray) {
                this.sound.playLaser();
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dz = -1; dz <= 1; dz++) {
                            const bx = ray.x + dx;
                            const by = ray.y + dy;
                            const bz = ray.z + dz;
                            const bId = this.world.getBlock(bx, by, bz);
                            const def = window.BLOCK_BY_ID[bId];
                            if (def && def.solid && def.id !== B.BEDROCK.id) {
                                this.world.setBlock(bx, by, bz, B.AIR.id);
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

            // ★ 11. Eat Food
            if (itemDef?.category === 'food' && (this.player.food < this.player.maxFood || itemDef.heal || this.player.gameMode === 'creative')) {
                this.player.food = Math.min(this.player.maxFood, this.player.food + (itemDef.foodRestore || 4));
                if (itemDef.heal) this.player.heal(itemDef.heal);
                if (this.player.gameMode !== 'creative') {
                    this.inventory.consumeSelectedItem(1);
                }
                this.sound.playPop();
                this.player.swingHand();
                return;
            }

            // ★ 12. Block Interaction & Block Placement
            if (ray) {
                const bId = ray.blockId;

                // Functional blocks (unless sneaking with a block in hand to build onto them)
                if (!isSneaking) {
                    if (bId === B.CRAFTING_TABLE.id) {
                        this.ui.openModal('crafting');
                        return;
                    } else if (bId === B.FURNACE.id) {
                        this.ui.openModal('furnace');
                        return;
                    } else if (bId === B.CHEST.id) {
                        this.ui.openModal('chest');
                        return;
                    } else if (B.BED && bId === B.BED.id) {
                        this.timeOfDay = 0.22; // Bright morning!
                        this.player.heal(20);
                        this.sound.playHeal();
                        this.ui.addChatMessage('🛏️ ベッドで眠り、体力が全回復して爽やかな朝を迎えました！', '#ffdd55');
                        return;
                    } else if (bId === B.WAYGATE.id) {
                        this.teleportToNextWaygate(ray.x, ray.y, ray.z);
                        return;
                    }
                }

                // ★ 13. Place Block in World
                const placeItemDef = (itemDef && itemDef.blockId) ? itemDef : null;
                if (placeItemDef && placeItemDef.blockId) {
                    const clickedDef = window.BLOCK_BY_ID[bId];
                    const isReplaceable = (clickedDef && (bId === B.FIRE?.id || (clickedDef.hardness === 0.0 && !clickedDef.solid)));
                    const px = isReplaceable ? ray.x : (ray.x + ray.normal[0]);
                    const py = isReplaceable ? ray.y : (ray.y + ray.normal[1]);
                    const pz = isReplaceable ? ray.z : (ray.z + ray.normal[2]);

                    // Height boundary check only (supports infinite X & Z coordinates)
                    if (py <= 1 || py >= 126) return;

                    // Existing block check (allow placing into AIR, WATER, LAVA, or FIRE, or replaceable blocks)
                    const curTargetId = this.world.getBlock(px, py, pz);
                    const curTargetDef = window.BLOCK_BY_ID[curTargetId];
                    if (curTargetId !== B.AIR.id && curTargetId !== B.WATER.id && curTargetId !== B.LAVA.id && curTargetId !== B.FIRE?.id && !isReplaceable) {
                        return;
                    }

                    const targetBlockDef = window.BLOCK_BY_ID[placeItemDef.blockId];
                    const placeBox = new AABB(px, py, pz, px + 1, py + 1, pz + 1);

                    const pRadius = 0.20;
                    const playerBox = new AABB(
                        this.player.x - pRadius, this.player.y, this.player.z - pRadius,
                        this.player.x + pRadius, this.player.y + 1.75, this.player.z + pRadius
                    );

                    const isUnderFeet = (px === Math.floor(this.player.x) && pz === Math.floor(this.player.z) && py <= Math.floor(this.player.y + 0.95));
                    if (targetBlockDef?.solid && placeBox.intersects(playerBox)) {
                        if (isUnderFeet) {
                            // Smoothly boost player up on top of newly placed block (towering up)
                            this.player.y = py + 1.01;
                            this.player.velocity.y = Math.max(0, this.player.velocity.y);
                        } else {
                            // Push player horizontally away from block center so placement NEVER fails!
                            const dx = this.player.x - (px + 0.5);
                            const dz = this.player.z - (pz + 0.5);
                            if (Math.abs(dx) > Math.abs(dz)) {
                                this.player.x = px + 0.5 + Math.sign(dx || 1) * (0.5 + pRadius + 0.05);
                            } else {
                                this.player.z = pz + 0.5 + Math.sign(dz || 1) * (0.5 + pRadius + 0.05);
                            }
                        }
                    }

                    this.world.setBlock(px, py, pz, placeItemDef.blockId);
                    this.sound.playPlace();
                    this.player.swingHand();

                    if (this.player.gameMode !== 'creative') {
                        this.inventory.consumeSelectedItem(1);
                    }
                    if (placeItemDef.blockId === B.TNT.id || placeItemDef.blockId === B.CLUSTER_TNT.id) {
                        this.ui.addChatMessage('💣 TNTを設置しました！（[🔥着火石]で右クリック、または[💥起爆ボタン]で爆発します！）', '#ffaa44');
                    }
                    if (placeItemDef.blockId === B.SAND.id || placeItemDef.blockId === B.GRAVEL.id) {
                        this.world.applyGravityAbove(px, py - 1, pz);
                    }
                    return;
                }
            }
        }

        detonateAllPlacedTnt() {
            const B = window.BLOCKS;
            const px = Math.floor(this.player.x);
            const py = Math.floor(this.player.y);
            const pz = Math.floor(this.player.z);
            let count = 0;

            for (let dx = -24; dx <= 24; dx++) {
                for (let dy = -12; dy <= 16; dy++) {
                    for (let dz = -24; dz <= 24; dz++) {
                        const bx = px + dx, by = py + dy, bz = pz + dz;
                        const bId = this.world.getBlock(bx, by, bz);
                        if (bId === B.TNT.id || bId === B.CLUSTER_TNT.id) {
                            this.itemManager.igniteTnt(bx, by, bz, bId === B.CLUSTER_TNT.id);
                            count++;
                        }
                    }
                }
            }

            if (count === 0) {
                // If no TNT is currently placed in the world, place & immediately ignite one 3.5m in front of the player!
                const dir = new THREE.Vector3();
                this.camera.getWorldDirection(dir);
                const tx = Math.floor(this.player.x + dir.x * 3.5);
                const ty = Math.max(2, Math.floor(this.player.y + 0.5));
                const tz = Math.floor(this.player.z + dir.z * 3.5);
                this.world.setBlock(tx, ty, tz, B.TNT.id);
                this.itemManager.igniteTnt(tx, ty, tz, false);
                count = 1;
            }

            if (this.sound.playFlintAndSteel) this.sound.playFlintAndSteel();
            this.player.swingHand();
            this.ui.addChatMessage(`💥 ${count}個のTNTを一斉に着火・起爆しました！`, '#ff5555');
            return count;
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
                if (this.crackBox) this.crackBox.visible = false;
                this.miningTarget = null;
                this.player.miningProgress = 0;
                return;
            }

            if (this.input.mouseButtons[0]) {
                if (!this.player.isSwinging) {
                    this.player.swingHand();
                }

                const ray = this.player.raycast(6.5);
                if (!ray) {
                    this.player.miningProgress = 0;
                    this.miningTarget = null;
                    if (this.crackBox) this.crackBox.visible = false;
                    return;
                }

                // If target block changed, reset progress to 0!
                if (!this.miningTarget || this.miningTarget.x !== ray.x || this.miningTarget.y !== ray.y || this.miningTarget.z !== ray.z) {
                    this.miningTarget = { x: ray.x, y: ray.y, z: ray.z };
                    this.player.miningProgress = 0;
                }

                const bId = ray.blockId;
                const def = window.BLOCK_BY_ID[bId];
                if (!def || def.hardness === Infinity) {
                    this.player.miningProgress = 0;
                    if (this.crackBox) this.crackBox.visible = false;
                    return;
                }

                // Blocks with hardness 0 break instantly
                if (def.hardness === 0.0) {
                    this.world.setBlock(ray.x, ray.y, ray.z, window.BLOCKS.AIR.id);
                    this.sound.playBreak(def.sound || 'stone');
                    if (def.drop) this.itemManager.spawnDroppedItem(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5, def.drop);
                    this.itemManager.spawnBlockParticles(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5, 0xaaaaaa, 6);
                    this.world.applyGravityAbove(ray.x, ray.y, ray.z);
                    this.player.miningProgress = 0;
                    this.miningTarget = null;
                    if (this.crackBox) this.crackBox.visible = false;
                    return;
                }

                const heldItem = this.inventory.getSelectedItem();
                const toolDef = heldItem ? window.ITEMS[heldItem.item] : null;

                const isCorrectTool = Boolean(toolDef && toolDef.toolType && toolDef.toolType === def.tool);

                // Authentic Minecraft break time calculation:
                // Base break time = hardness * 1.5 seconds.
                // If using correct tool: breakTime = (hardness * 1.5) / toolSpeed.
                // If using wrong tool on pickaxe-required blocks (stone, ores, obsidian): breakTime = hardness * 5.0 seconds.
                let breakTime;
                if (isCorrectTool) {
                    const speed = toolDef.speed || 2.0;
                    breakTime = (def.hardness * 1.5) / speed;
                } else {
                    if (def.tool === 'pickaxe') {
                        breakTime = def.hardness * 5.0;
                    } else {
                        breakTime = def.hardness * 1.5;
                    }
                }
                breakTime = Math.max(0.06, breakTime);

                this.player.miningProgress += dt / breakTime;

                // Crack Overlay Box (0 to 9 stages)
                const stage = Math.min(9, Math.floor(this.player.miningProgress * 10));
                this.crackBox.visible = true;
                this.crackBox.position.set(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5);
                this.atlas.applyCrackUVs(this.crackBox.geometry, stage);

                // Dig sound and particles during mining
                this.player.breakSoundTimer = (this.player.breakSoundTimer || 0) + dt;
                if (this.player.breakSoundTimer > 0.22) {
                    this.sound.playDig(def.sound || 'stone');
                    this.itemManager.spawnBlockParticles(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5, 0x888888, 2);
                    this.player.breakSoundTimer = 0;
                }

                // Completed mining!
                if (this.player.miningProgress >= 1.0) {
                    this.world.setBlock(ray.x, ray.y, ray.z, window.BLOCKS.AIR.id);
                    this.sound.playBreak(def.sound || 'stone');
                    this.player.miningProgress = 0;
                    this.miningTarget = null;
                    if (this.crackBox) this.crackBox.visible = false;

                    // Drops: pickaxe blocks only drop if mined with a pickaxe
                    let canDrop = true;
                    if (def.tool === 'pickaxe' && (!toolDef || toolDef.toolType !== 'pickaxe')) {
                        canDrop = false;
                    }

                    if (canDrop) {
                        if (bId === window.BLOCKS.GRAVEL.id && Math.random() < 0.35) {
                            this.itemManager.spawnDroppedItem(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5, 'flint');
                        } else if (def.drop) {
                            this.itemManager.spawnDroppedItem(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5, def.drop);
                        }
                    }

                    this.itemManager.spawnBlockParticles(ray.x + 0.5, ray.y + 0.5, ray.z + 0.5, 0x888888, 8);
                    this.world.applyGravityAbove(ray.x, ray.y, ray.z);

                    // Durability consumption for tools
                    if (heldItem && toolDef && toolDef.maxDurability) {
                        heldItem.durability = (heldItem.durability !== undefined ? heldItem.durability : toolDef.maxDurability) - 1;
                        if (heldItem.durability <= 0) {
                            this.inventory.slots[this.inventory.selectedHotbarIndex] = null;
                            this.sound.playBreak('stone');
                            this.ui.addChatMessage(`💥 ${toolDef.nameJa || toolDef.name}が壊れてしまいました！`, '#ff6666');
                        }
                        this.ui.renderHUD();
                    }
                }
            } else {
                this.player.miningProgress = 0;
                this.miningTarget = null;
                if (this.crackBox) this.crackBox.visible = false;
            }
        }

        // UI Slot Interactions
        handleSlotClick(type, index) {
            try {
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
            const def = window.ITEMS[itemKey];
            const maxStack = def?.maxStack || 64;

            // 1. Check if item is already in hotbar (slots 0..8)
            let hotbarIdx = -1;
            for (let i = 0; i < 9; i++) {
                if (this.inventory.slots[i] && this.inventory.slots[i].item === itemKey) {
                    hotbarIdx = i;
                    this.inventory.slots[i].count = maxStack;
                    break;
                }
            }

            // 2. Otherwise find an empty hotbar slot (0..8)
            if (hotbarIdx === -1) {
                for (let i = 0; i < 9; i++) {
                    if (!this.inventory.slots[i]) {
                        hotbarIdx = i;
                        this.inventory.slots[i] = { item: itemKey, count: maxStack };
                        break;
                    }
                }
            }

            // 3. If all 9 hotbar slots are full, place into currently selected hotbar slot (and move old item to main inventory)
            if (hotbarIdx === -1) {
                hotbarIdx = this.inventory.selectedHotbarIndex;
                const prev = this.inventory.slots[hotbarIdx];
                if (prev) {
                    for (let j = 9; j < 36; j++) {
                        if (!this.inventory.slots[j]) {
                            this.inventory.slots[j] = prev;
                            break;
                        }
                    }
                }
                this.inventory.slots[hotbarIdx] = { item: itemKey, count: maxStack };
            }

            this.inventory.selectedHotbarIndex = hotbarIdx;
            this.sound.playPop();
            this.ui.renderHUD();
            this.ui.addChatMessage(`📦 「${def?.nameJa || itemKey}」をホットバー[${hotbarIdx + 1}]にセットしました！（左クリックで設置・使用）`, '#ffdd55');
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
            if (newMode === 'creative') {
                const hasHotbarItems = this.inventory.slots.slice(0, 9).some(s => s !== null);
                if (!hasHotbarItems && this.ui && this.ui.equipCreativeStarterHotbar) {
                    this.ui.equipCreativeStarterHotbar();
                }
            }
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
            this.world.updateChunksAround(112, 112, 3);
            this.player.x = 112.5;
            this.player.y = 7.2;
            this.player.z = 104.5; // Facing the giant central Reinforced Deepslate Portal at Z=112
            this.player.yaw = 0;
            this.player.pitch = 0.05;
            this.player.velocity.set(0, 0, 0);
            this.player.fallDistance = 0;
            this.input.keys = {};
            if (this.mobManager && this.mobManager.spawnWardenIfNeeded) {
                this.mobManager.spawnWardenIfNeeded(112.5, 7.0, 112.5);
            }
            this.sound.playWarp();
            this.ui.closeModal();
            this.ui.addChatMessage('🏛️ ディープダーク「古代都市 (Ancient City)」の祭壇前へ移動しました！', '#44eeff');
        }

        teleportToStronghold() {
            // Stronghold End Portal Room is at wx: 59, wy: 15, wz: 59
            this.world.updateChunksAround(59, 59, 2);
            this.player.x = 59.5;
            this.player.y = 16.2;
            this.player.z = 54.5;
            this.player.yaw = 0;
            this.player.pitch = 0.1;
            this.player.velocity.set(0, 0, 0);
            this.player.fallDistance = 0;
            this.sound.playWarp();
            this.ui.closeModal();
            this.ui.addChatMessage('🏰 地下要塞「エンドポータル部屋」へ移動しました！', '#aa55ff');
        }

        checkAndActivateEndPortal(fx, fy, fz) {
            const B = window.BLOCKS;
            if (!B.END_PORTAL) return;

            let centerX = -1, centerZ = -1, centerY = fy;
            for (let dx = -3; dx <= 3; dx++) {
                for (let dz = -3; dz <= 3; dz++) {
                    const cx = fx + dx;
                    const cz = fz + dz;
                    const nFrame = this.world.getBlock(cx, centerY, cz - 2) === B.END_PORTAL_FRAME?.id;
                    const sFrame = this.world.getBlock(cx, centerY, cz + 2) === B.END_PORTAL_FRAME?.id;
                    const wFrame = this.world.getBlock(cx - 2, centerY, cz) === B.END_PORTAL_FRAME?.id;
                    const eFrame = this.world.getBlock(cx + 2, centerY, cz) === B.END_PORTAL_FRAME?.id;
                    if (nFrame && sFrame && wFrame && eFrame) {
                        centerX = cx;
                        centerZ = cz;
                        break;
                    }
                }
                if (centerX !== -1) break;
            }

            if (centerX === -1) {
                centerX = 59;
                centerZ = 59;
                centerY = 15;
            }

            // Fill 3x3 center with END_PORTAL blocks
            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    this.world.setBlock(centerX + dx, centerY, centerZ + dz, B.END_PORTAL.id);
                    this.itemManager.spawnBlockParticles(centerX + dx + 0.5, centerY + 0.5, centerZ + dz + 0.5, 0xbf28ff, 12);
                }
            }

            if (this.sound && this.sound.playEndPortalOpen) this.sound.playEndPortalOpen();
            this.ui.addChatMessage('🌌 エンドポータルが起動しました！飛び込んでエンド世界へ向かいましょう！', '#bf28ff');
        }

        enterTheEndDimension() {
            this.currentDimension = 'the_end';
            if (this.sound && this.sound.playEndPortalOpen) this.sound.playEndPortalOpen();
            this.ui.addChatMessage('🌌 エンド世界へ突入しました！エンダードラゴンが待ち受けています！', '#bf28ff');

            // Dark cosmic End sky & fog
            this.scene.background = new THREE.Color(0x06020c);
            this.scene.fog = new THREE.FogExp2(0x080312, 0.012);

            // Clear old overworld chunk meshes
            this.world.chunks.forEach(chunk => {
                if (chunk.mesh) this.scene.remove(chunk.mesh);
                if (chunk.waterMesh) this.scene.remove(chunk.waterMesh);
            });
            this.world.chunks.clear();

            // Generate End Island
            this.world.generateTheEndIsland();

            // Rebuild chunk meshes
            this.world.chunks.forEach(chunk => {
                this.world.rebuildChunkMesh(chunk);
            });

            // Teleport player onto End Island platform
            this.player.x = 0.5;
            this.player.y = 66.2;
            this.player.z = 22.5;
            this.player.velocity.set(0, 0, 0);
            this.player.fallDistance = 0;

            // Spawn End Crystals on top of obsidian pillars
            if (this.mobManager && this.world.endCrystalPositions) {
                this.world.endCrystalPositions.forEach(cp => {
                    this.mobManager.spawnMob('end_crystal', cp.x, cp.y, cp.z);
                });
            }

            // Spawn Ender Dragon boss!
            if (this.mobManager) {
                this.mobManager.spawnMob('ender_dragon', 0, 80, 0);
            }
        }

        returnToOverworld() {
            this.currentDimension = 'overworld';
            if (this.sound && this.sound.playWarp) this.sound.playWarp();
            this.ui.addChatMessage('✨ オーバーワールドへ無事帰還しました！', '#55ff55');

            // Reset normal sky & fog
            this.scene.background = new THREE.Color(0x87ceeb);
            this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.008);

            // Clear End chunks
            this.world.chunks.forEach(chunk => {
                if (chunk.mesh) this.scene.remove(chunk.mesh);
                if (chunk.waterMesh) this.scene.remove(chunk.waterMesh);
            });
            this.world.chunks.clear();

            // Teleport player back to surface spawn
            this.player.x = 8.5;
            this.player.z = 8.5;
            this.world.updateChunksAround(this.player.x, this.player.z, 2);
            const surfaceY = this.world.getHighestSolidY(Math.floor(this.player.x), Math.floor(this.player.z));
            this.player.y = surfaceY + 1.8;
            this.player.velocity.set(0, 0, 0);
            this.player.fallDistance = 0;

            // Hide Boss Bar
            const bossBar = document.getElementById('boss-bar-container');
            if (bossBar) bossBar.style.display = 'none';
        }

        handleEndPortalTeleport() {
            if (this.portalTeleportCooldown && (performance.now() - this.portalTeleportCooldown < 3000)) return;
            this.portalTeleportCooldown = performance.now();

            if (this.currentDimension === 'the_end') {
                this.returnToOverworld();
            } else {
                this.enterTheEndDimension();
            }
        }

        updateFireSimulation(dt) {
            this.fireSimTimer = (this.fireSimTimer || 0) + dt;
            if (this.fireSimTimer < 0.6) return;
            this.fireSimTimer = 0;

            const B = window.BLOCKS;
            if (!B.FIRE) return;

            const px = Math.floor(this.player.x);
            const py = Math.floor(this.player.y);
            const pz = Math.floor(this.player.z);

            const flammableBlockIds = new Set([
                B.OAK_LOG?.id, B.BIRCH_LOG?.id, B.OAK_PLANKS?.id, B.BIRCH_PLANKS?.id,
                B.OAK_LEAVES?.id, B.BIRCH_LEAVES?.id, B.BOOKSHELF?.id, B.CRAFTING_TABLE?.id,
                B.WOOL_WHITE?.id, B.WOOL_RED?.id, B.WOOL_BLUE?.id
            ]);

            const radius = 14;
            for (let x = px - radius; x <= px + radius; x += 2) {
                for (let z = pz - radius; z <= pz + radius; z += 2) {
                    for (let y = Math.max(2, py - 6); y <= Math.min(120, py + 8); y++) {
                        if (this.world.getBlock(x, y, z) === B.FIRE.id) {
                            if (Math.random() < 0.35) {
                                this.itemManager.spawnBlockParticles(x + 0.5, y + 0.8, z + 0.5, 0x555555, 1);
                            }

                            const neighbors = [
                                [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]
                            ];
                            for (const [ox, oy, oz] of neighbors) {
                                const nx = x + ox, ny = y + oy, nz = z + oz;
                                const nbId = this.world.getBlock(nx, ny, nz);

                                if (nbId === B.TNT?.id || nbId === B.CLUSTER_TNT?.id) {
                                    this.itemManager.igniteTnt(nx, ny, nz, nbId === B.CLUSTER_TNT?.id);
                                }

                                if (flammableBlockIds.has(nbId)) {
                                    if (Math.random() < 0.35) {
                                        for (const [sox, soy, soz] of neighbors) {
                                            const sx = nx + sox, sy = ny + soy, sz = nz + soz;
                                            if (this.world.getBlock(sx, sy, sz) === B.AIR.id) {
                                                this.world.setBlock(sx, sy, sz, B.FIRE.id);
                                                break;
                                            }
                                        }
                                    }
                                    if (Math.random() < 0.15) {
                                        this.world.setBlock(nx, ny, nz, B.AIR.id);
                                        this.itemManager.spawnBlockParticles(nx + 0.5, ny + 0.5, nz + 0.5, 0x444444, 8);
                                        this.sound.playBreak('wool');
                                    }
                                }
                            }

                            const belowId = this.world.getBlock(x, y - 1, z);
                            if (belowId !== B.NETHERRACK?.id && Math.random() < 0.08) {
                                this.world.setBlock(x, y, z, B.AIR.id);
                            }
                        }
                    }
                }
            }
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

            // Highlight target block box (follows center crosshair when locked, or mouse cursor when unlocked)
            const highlightDir = this.isPointerLocked ? null : this.lastCursorDir;
            const ray = this.player.raycast(7.5, highlightDir);
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
                    this.updateFireSimulation(dt);

                    // Dynamic texture animation for flickering fire & cosmic portals
                    if (this.atlas && this.atlas.updateAnimatedTextures) {
                        this.atlas.updateAnimatedTextures();
                    }

                    // Check End Portal entry
                    const blockAtFeet = this.world.getBlock(Math.floor(this.player.x), Math.floor(this.player.y + 0.1), Math.floor(this.player.z));
                    const blockAtWaist = this.world.getBlock(Math.floor(this.player.x), Math.floor(this.player.y + 1.0), Math.floor(this.player.z));
                    const B = window.BLOCKS;
                    if (B.END_PORTAL && (blockAtFeet === B.END_PORTAL.id || blockAtWaist === B.END_PORTAL.id)) {
                        this.handleEndPortalTeleport();
                    }

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
