// Authentic Minecraft Living Mobs (Pig, Cow, Sheep, Chicken, Zombie, Skeleton, Creeper, Warden, Astral Phantom)
// Pixel-Art Canvas Textures, True Joint Pivots (Shoulders & Hips), Sunlight Burning & Underground/Surface AI
(function(global) {
    // Procedural Pixel-Art Texture Helper for Mobs
    const MobTexCache = {};

    function makePixelTexture(name, width, height, drawFn) {
        if (MobTexCache[name]) return MobTexCache[name];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        drawFn(ctx, width, height);
        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        MobTexCache[name] = tex;
        return tex;
    }

    function makeMat(texName, w, h, drawFn, extra = {}) {
        const tex = makePixelTexture(texName, w, h, drawFn);
        return new THREE.MeshLambertMaterial(Object.assign({ map: tex }, extra));
    }

    function getMobMaterials() {
        if (window._mobMats) return window._mobMats;

        // 1. ZOMBIE TEXTURES
        const zombieSkin = makeMat('zombie_skin', 8, 8, (ctx) => {
            const cols = ['#4c7838', '#436c30', '#588542', '#3b6029'];
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    ctx.fillStyle = cols[(x * 3 + y * 5) % cols.length];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        });

        const zombieFace = makeMat('zombie_face', 8, 8, (ctx) => {
            const cols = ['#4c7838', '#436c30', '#588542', '#3b6029'];
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    ctx.fillStyle = cols[(x * 3 + y * 5) % cols.length];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            // Dark hollow zombie eyes
            ctx.fillStyle = '#182812';
            ctx.fillRect(1, 3, 2, 1);
            ctx.fillRect(5, 3, 2, 1);
            // Darker nose & mouth
            ctx.fillStyle = '#2d4b1e';
            ctx.fillRect(3, 4, 2, 1);
            ctx.fillStyle = '#1e3314';
            ctx.fillRect(2, 6, 4, 1);
        });

        const zombieShirt = makeMat('zombie_shirt', 8, 8, (ctx) => {
            const cols = ['#009898', '#008282', '#00a6a6', '#1b6e6e'];
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    ctx.fillStyle = cols[(x * 7 + y * 3) % cols.length];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        });

        const zombiePants = makeMat('zombie_pants', 8, 8, (ctx) => {
            const cols = ['#2f295c', '#26204d', '#38316b'];
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    ctx.fillStyle = cols[(x + y * 3) % cols.length];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        });

        // 2. CREEPER TEXTURES
        const creeperSkin = makeMat('creeper_skin', 8, 8, (ctx) => {
            const cols = ['#48b536', '#3ca12b', '#5cd147', '#328a23', '#66db51'];
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    ctx.fillStyle = cols[(x * 5 + y * 11) % cols.length];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        });

        const creeperFace = makeMat('creeper_face', 8, 8, (ctx) => {
            const cols = ['#48b536', '#3ca12b', '#5cd147', '#328a23'];
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    ctx.fillStyle = cols[(x * 5 + y * 11) % cols.length];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            // Iconic Minecraft Creeper Face
            ctx.fillStyle = '#111811';
            ctx.fillRect(1, 2, 2, 2); // Left Eye
            ctx.fillRect(5, 2, 2, 2); // Right Eye
            ctx.fillRect(3, 4, 2, 2); // Nose bridge
            ctx.fillRect(2, 5, 4, 2); // Mouth center
            ctx.fillRect(2, 7, 1, 1); // Mouth left corner
            ctx.fillRect(5, 7, 1, 1); // Mouth right corner
        });

        // 3. SKELETON TEXTURES
        const skeletonBone = makeMat('skeleton_bone', 8, 8, (ctx) => {
            const cols = ['#dedede', '#cccccc', '#e8e8e8'];
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    ctx.fillStyle = cols[(x * 3 + y * 7) % cols.length];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        });

        const skeletonFace = makeMat('skeleton_face', 8, 8, (ctx) => {
            ctx.fillStyle = '#dcdcdc';
            ctx.fillRect(0, 0, 8, 8);
            ctx.fillStyle = '#c4c4c4';
            ctx.fillRect(0, 0, 8, 2);
            // Eye sockets
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(1, 3, 2, 2);
            ctx.fillRect(5, 3, 2, 2);
            // Nasal cavity
            ctx.fillStyle = '#2b2b2b';
            ctx.fillRect(3, 5, 2, 1);
            // Teeth line
            ctx.fillStyle = '#222222';
            ctx.fillRect(1, 6, 6, 1);
        });

        const skeletonRibs = makeMat('skeleton_ribs', 8, 8, (ctx) => {
            ctx.fillStyle = '#262626';
            ctx.fillRect(0, 0, 8, 8);
            ctx.fillStyle = '#dcdcdc';
            ctx.fillRect(3, 0, 2, 8); // Spine
            for (let y = 1; y <= 6; y += 2) {
                ctx.fillRect(1, y, 6, 1); // Ribs
            }
        });

        // 4. WARDEN TEXTURES (Ancient City Boss)
        const wardenBody = makeMat('warden_body', 8, 8, (ctx) => {
            ctx.fillStyle = '#0c1f29';
            ctx.fillRect(0, 0, 8, 8);
            // Bone ribs
            ctx.fillStyle = '#c9ccb8';
            ctx.fillRect(0, 1, 2, 1); ctx.fillRect(6, 1, 2, 1);
            ctx.fillRect(0, 3, 2, 1); ctx.fillRect(6, 3, 2, 1);
            ctx.fillRect(0, 5, 2, 1); ctx.fillRect(6, 5, 2, 1);
            // Glowing Soul Heart in center
            ctx.fillStyle = '#28e8f5';
            ctx.fillRect(2, 2, 4, 4);
            ctx.fillStyle = '#99ffff';
            ctx.fillRect(3, 3, 2, 2);
        });

        const wardenFace = makeMat('warden_face', 8, 8, (ctx) => {
            ctx.fillStyle = '#0e2430';
            ctx.fillRect(0, 0, 8, 8);
            // Sculk cyan spots
            ctx.fillStyle = '#25d8e8';
            ctx.fillRect(1, 1, 1, 1); ctx.fillRect(6, 2, 1, 1);
            // Bone-lined terrifying mouth
            ctx.fillStyle = '#d0d4be';
            ctx.fillRect(2, 3, 4, 1);
            ctx.fillRect(1, 4, 6, 2);
            ctx.fillStyle = '#071218';
            ctx.fillRect(2, 4, 4, 2);
        });

        const wardenSkin = makeMat('warden_skin', 8, 8, (ctx) => {
            const cols = ['#0c1f29', '#112936', '#081720', '#184252'];
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    ctx.fillStyle = cols[(x * 3 + y * 5) % cols.length];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            ctx.fillStyle = '#28e8f5';
            ctx.fillRect(2, 2, 1, 1);
            ctx.fillRect(5, 5, 1, 1);
        });

        // 5. ANIMAL TEXTURES
        const pigSkin = makeMat('pig_skin', 8, 8, (ctx) => {
            const cols = ['#f29e9e', '#ea9090', '#f7abab'];
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    ctx.fillStyle = cols[(x * 3 + y * 5) % cols.length];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        });

        const pigFace = makeMat('pig_face', 8, 8, (ctx) => {
            ctx.fillStyle = '#f29e9e';
            ctx.fillRect(0, 0, 8, 8);
            // White & black eyes on outer edges
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(1, 3, 1, 1);
            ctx.fillRect(6, 3, 1, 1);
            ctx.fillStyle = '#111111';
            ctx.fillRect(0, 3, 1, 1);
            ctx.fillRect(7, 3, 1, 1);
        });

        const cowHide = makeMat('cow_hide', 8, 8, (ctx) => {
            ctx.fillStyle = '#473121';
            ctx.fillRect(0, 0, 8, 8);
            // White/cream spots
            ctx.fillStyle = '#dedad2';
            ctx.fillRect(1, 1, 3, 2);
            ctx.fillRect(5, 4, 2, 3);
        });

        const cowFace = makeMat('cow_face', 8, 8, (ctx) => {
            ctx.fillStyle = '#473121';
            ctx.fillRect(0, 0, 8, 8);
            ctx.fillStyle = '#dedad2';
            ctx.fillRect(3, 1, 2, 3);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(1, 3, 1, 1); ctx.fillRect(6, 3, 1, 1);
            ctx.fillStyle = '#111111';
            ctx.fillRect(0, 3, 1, 1); ctx.fillRect(7, 3, 1, 1);
        });

        const sheepWool = makeMat('sheep_wool', 8, 8, (ctx) => {
            const cols = ['#f2f2f2', '#e2e2e2', '#ffffff', '#d8d8d8'];
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    ctx.fillStyle = cols[(x * 5 + y * 3) % cols.length];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        });

        const sheepFace = makeMat('sheep_face', 8, 8, (ctx) => {
            ctx.fillStyle = '#d6b898';
            ctx.fillRect(0, 0, 8, 8);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(1, 3, 1, 1); ctx.fillRect(6, 3, 1, 1);
            ctx.fillStyle = '#111111';
            ctx.fillRect(0, 3, 1, 1); ctx.fillRect(7, 3, 1, 1);
            ctx.fillStyle = '#e89898';
            ctx.fillRect(3, 5, 2, 1);
        });

        window._mobMats = {
            zombieSkin, zombieFace, zombieShirt, zombiePants,
            creeperSkin, creeperFace,
            skeletonBone, skeletonFace, skeletonRibs,
            wardenBody, wardenFace, wardenSkin,
            pigSkin, pigFace, cowHide, cowFace, sheepWool, sheepFace
        };
        return window._mobMats;
    }

    // Helper: create a 6-material array for BoxGeometry where front (+Z, index 4) has a face texture
    function makeHeadMaterials(sideMat, frontMat, topMat) {
        const t = topMat || sideMat;
        return [sideMat, sideMat, t, sideMat, frontMat, sideMat];
    }

    // Helper: create a joint-pivoted limb so rotation happens cleanly at the shoulder or hip!
    function createPivotedLimb(w, h, d, mat, pivotX, pivotY, pivotZ) {
        const pivot = new THREE.Group();
        pivot.position.set(pivotX, pivotY, pivotZ);
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.position.set(0, -h / 2, 0);
        pivot.add(mesh);
        return { pivot, mesh };
    }

    class Mob {
        constructor(type, x, y, z, scene, world, sound, itemManager) {
            this.type = type;
            this.x = x;
            this.y = y;
            this.z = z;
            this.vy = 0;
            this.onGround = true;
            this.scene = scene;
            this.world = world;
            this.sound = sound;
            this.itemManager = itemManager;

            this.yaw = Math.random() * Math.PI * 2;
            this.health = 10;
            this.maxHealth = 10;
            this.speed = 1.8;
            this.damage = 2;
            this.isHostile = false;
            this.isUndead = false;
            this.isDead = false;

            this.attackCooldown = 0;
            this.attackSwing = 0;
            this.fuseTimer = 0;
            this.isFusing = false;
            this.soundTimer = 5.0 + Math.random() * 8.0;
            this.burnTimer = 0;
            this.burnParticleTimer = 0;

            this.hurtTimer = 0;
            this.walkAnim = 0;
            this.wingAnim = 0;
            this.idleTimer = Math.random() * 2.5;
            this.isWalking = true;
            this.isPanic = false;
            this.panicTimer = 0;

            this.legs = [];
            this.arms = [];
            this.wings = [];

            this.group = new THREE.Group();
            this.buildModel();
            this.group.position.set(x, y, z);
            this.scene.add(this.group);
        }

        buildModel() {
            while (this.group.children.length > 0) {
                this.group.remove(this.group.children[0]);
            }
            this.legs = [];
            this.arms = [];
            this.wings = [];

            const t = this.type;
            const M = getMobMaterials();

            if (t === 'pig') {
                this.isHostile = false;
                this.health = 10;
                this.maxHealth = 10;
                this.speed = 1.6;
                const darkPink = new THREE.MeshLambertMaterial({ color: 0xd97575 });

                // Body
                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.52, 0.92), M.pigSkin);
                this.body.position.set(0, 0.56, 0);
                this.group.add(this.body);

                // Head (Pivoted at neck)
                this.head = new THREE.Group();
                this.head.position.set(0, 0.72, 0.46);
                const headBox = new THREE.Mesh(
                    new THREE.BoxGeometry(0.48, 0.48, 0.48),
                    makeHeadMaterials(M.pigSkin, M.pigFace)
                );
                headBox.position.set(0, 0, 0.14);
                this.head.add(headBox);

                // Protruding 3D Snout
                const snout = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.10), darkPink);
                snout.position.set(0, -0.06, 0.42);
                this.head.add(snout);
                this.group.add(this.head);

                // 4 Hip-Pivoted Legs
                const legCoords = [
                    [-0.20, 0.34, 0.30], [0.20, 0.34, 0.30],
                    [-0.20, 0.34, -0.30], [0.20, 0.34, -0.30]
                ];
                legCoords.forEach(p => {
                    const limb = createPivotedLimb(0.18, 0.34, 0.18, M.pigSkin, p[0], p[1], p[2]);
                    this.group.add(limb.pivot);
                    this.legs.push(limb.pivot);
                });
            } else if (t === 'cow') {
                this.isHostile = false;
                this.health = 10;
                this.maxHealth = 10;
                this.speed = 1.5;
                const cowMuzzle = new THREE.MeshLambertMaterial({ color: 0x998272 });
                const cowHorn = new THREE.MeshLambertMaterial({ color: 0xdedede });

                // Body
                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.62, 1.02), M.cowHide);
                this.body.position.set(0, 0.74, 0);
                this.group.add(this.body);

                // Head
                this.head = new THREE.Group();
                this.head.position.set(0, 0.94, 0.52);
                const headBox = new THREE.Mesh(
                    new THREE.BoxGeometry(0.48, 0.48, 0.46),
                    makeHeadMaterials(M.cowHide, M.cowFace)
                );
                headBox.position.set(0, 0, 0.14);
                this.head.add(headBox);

                const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.20, 0.10), cowMuzzle);
                muzzle.position.set(0, -0.10, 0.40);
                this.head.add(muzzle);

                const lHorn = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), cowHorn);
                lHorn.position.set(-0.26, 0.22, 0.10);
                const rHorn = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), cowHorn);
                rHorn.position.set(0.26, 0.22, 0.10);
                this.head.add(lHorn, rHorn);
                this.group.add(this.head);

                // 4 Hip-Pivoted Legs
                const legCoords = [
                    [-0.22, 0.46, 0.34], [0.22, 0.46, 0.34],
                    [-0.22, 0.46, -0.34], [0.22, 0.46, -0.34]
                ];
                legCoords.forEach(p => {
                    const limb = createPivotedLimb(0.20, 0.46, 0.20, M.cowHide, p[0], p[1], p[2]);
                    this.group.add(limb.pivot);
                    this.legs.push(limb.pivot);
                });
            } else if (t === 'sheep') {
                this.isHostile = false;
                this.health = 8;
                this.maxHealth = 8;
                this.speed = 1.6;
                const skinMat = new THREE.MeshLambertMaterial({ color: 0xd6b898 });

                // Fluffy Wool Body
                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.60, 0.96), M.sheepWool);
                this.body.position.set(0, 0.68, 0);
                this.group.add(this.body);

                // Head
                this.head = new THREE.Group();
                this.head.position.set(0, 0.86, 0.48);
                const headBox = new THREE.Mesh(
                    new THREE.BoxGeometry(0.40, 0.40, 0.44),
                    makeHeadMaterials(skinMat, M.sheepFace, M.sheepWool)
                );
                headBox.position.set(0, 0, 0.12);
                this.head.add(headBox);

                const woolCap = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.16, 0.38), M.sheepWool);
                woolCap.position.set(0, 0.16, 0.08);
                this.head.add(woolCap);
                this.group.add(this.head);

                // 4 Hip-Pivoted Legs
                const legCoords = [
                    [-0.20, 0.42, 0.30], [0.20, 0.42, 0.30],
                    [-0.20, 0.42, -0.30], [0.20, 0.42, -0.30]
                ];
                legCoords.forEach(p => {
                    const limb = createPivotedLimb(0.16, 0.42, 0.16, skinMat, p[0], p[1], p[2]);
                    this.group.add(limb.pivot);
                    this.legs.push(limb.pivot);
                });
            } else if (t === 'chicken') {
                this.isHostile = false;
                this.health = 4;
                this.maxHealth = 4;
                this.speed = 1.4;
                const chickenBeak = new THREE.MeshLambertMaterial({ color: 0xee9911 });
                const chickenRed = new THREE.MeshLambertMaterial({ color: 0xcc2222 });

                // Body
                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.34, 0.46), M.sheepWool);
                this.body.position.set(0, 0.38, 0);
                this.group.add(this.body);

                // Wings
                const wingGeo = new THREE.BoxGeometry(0.06, 0.24, 0.34);
                const leftWing = new THREE.Mesh(wingGeo, M.sheepWool);
                leftWing.position.set(-0.21, 0.40, 0);
                const rightWing = new THREE.Mesh(wingGeo, M.sheepWool);
                rightWing.position.set(0.21, 0.40, 0);
                this.group.add(leftWing, rightWing);
                this.wings.push(leftWing, rightWing);

                // Head
                this.head = new THREE.Group();
                this.head.position.set(0, 0.56, 0.20);
                const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.24), M.sheepWool);
                headBox.position.set(0, 0.08, 0.04);
                const beak = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12), chickenBeak);
                beak.position.set(0, 0.06, 0.20);
                const wattle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 0.08), chickenRed);
                wattle.position.set(0, -0.02, 0.16);
                const comb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.10, 0.14), chickenRed);
                comb.position.set(0, 0.24, 0.04);
                this.head.add(headBox, beak, wattle, comb);
                this.group.add(this.head);

                // 2 Hip-Pivoted Legs
                [-0.09, 0.09].forEach(px => {
                    const limb = createPivotedLimb(0.06, 0.24, 0.06, chickenBeak, px, 0.24, 0);
                    this.group.add(limb.pivot);
                    this.legs.push(limb.pivot);
                });
            } else if (t === 'zombie') {
                // ★ AUTHENTIC MINECRAFT ZOMBIE (Proper Shoulder-Pivoted Outstretched Green Arms & Pixel Face!)
                this.isHostile = true;
                this.isUndead = true;
                this.health = 20;
                this.maxHealth = 20;
                this.speed = 2.1;
                this.damage = 3;

                // Head (Pivoted at neck y=1.44)
                this.head = new THREE.Group();
                this.head.position.set(0, 1.44, 0);
                const headMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(0.50, 0.50, 0.50),
                    makeHeadMaterials(M.zombieSkin, M.zombieFace)
                );
                headMesh.position.set(0, 0.25, 0);
                this.head.add(headMesh);
                this.group.add(this.head);

                // Torso (Cyan Shirt)
                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.72, 0.26), M.zombieShirt);
                this.body.position.set(0, 1.08, 0);
                this.group.add(this.body);

                // Shoulder-Pivoted Arms (Short Cyan Sleeve at shoulder + Rotten Green Forearm extending FORWARD!)
                [-0.36, 0.36].forEach(px => {
                    const armPivot = new THREE.Group();
                    armPivot.position.set(px, 1.38, 0); // Shoulder joint!

                    // Upper sleeve (cyan shirt sleeve)
                    const sleeveMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), M.zombieShirt);
                    sleeveMesh.position.set(0, -0.08, 0);
                    armPivot.add(sleeveMesh);

                    // Lower arm (green zombie skin)
                    const forearmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.46, 0.20), M.zombieSkin);
                    forearmMesh.position.set(0, -0.40, 0);
                    armPivot.add(forearmMesh);

                    // Rotate around shoulder so arm points cleanly FORWARD (+Z)
                    armPivot.rotation.x = -Math.PI / 2.1;
                    this.group.add(armPivot);
                    this.arms.push(armPivot);
                });

                // Hip-Pivoted Legs (Indigo Pants)
                [-0.13, 0.13].forEach(px => {
                    const limb = createPivotedLimb(0.24, 0.72, 0.24, M.zombiePants, px, 0.72, 0);
                    this.group.add(limb.pivot);
                    this.legs.push(limb.pivot);
                });
            } else if (t === 'skeleton') {
                // ★ AUTHENTIC MINECRAFT SKELETON (Skull Face, Ribcage, Bone Limbs & 3D Bow)
                this.isHostile = true;
                this.isUndead = true;
                this.health = 16;
                this.maxHealth = 16;
                this.speed = 2.2;
                this.damage = 3;

                // Skull Head
                this.head = new THREE.Group();
                this.head.position.set(0, 1.44, 0);
                const headMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(0.48, 0.48, 0.48),
                    makeHeadMaterials(M.skeletonBone, M.skeletonFace)
                );
                headMesh.position.set(0, 0.24, 0);
                this.head.add(headMesh);
                this.group.add(this.head);

                // Ribcage Torso
                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.70, 0.22), M.skeletonRibs);
                this.body.position.set(0, 1.08, 0);
                this.group.add(this.body);

                // Shoulder-Pivoted Bone Arms + 3D Bow in Right Hand
                [-0.31, 0.31].forEach((px, idx) => {
                    const limb = createPivotedLimb(0.12, 0.68, 0.12, M.skeletonBone, px, 1.38, 0);
                    limb.pivot.rotation.x = -Math.PI / 2.3;
                    if (idx === 0) {
                        // Add 3D Wooden Bow to right hand
                        const bowWood = new THREE.MeshLambertMaterial({ color: 0x6e4720 });
                        const bowString = new THREE.MeshBasicMaterial({ color: 0xdddddd });
                        const bowCurve = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.52), bowWood);
                        bowCurve.position.set(0, -0.64, 0.12);
                        const stringMesh = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.50), bowString);
                        stringMesh.position.set(0, -0.58, 0.02);
                        limb.pivot.add(bowCurve, stringMesh);
                    }
                    this.group.add(limb.pivot);
                    this.arms.push(limb.pivot);
                });

                // Hip-Pivoted Bone Legs
                [-0.12, 0.12].forEach(px => {
                    const limb = createPivotedLimb(0.12, 0.72, 0.12, M.skeletonBone, px, 0.72, 0);
                    this.group.add(limb.pivot);
                    this.legs.push(limb.pivot);
                });
            } else if (t === 'creeper') {
                // ★ AUTHENTIC MINECRAFT CREEPER
                this.isHostile = true;
                this.health = 20;
                this.maxHealth = 20;
                this.speed = 2.0;

                // Head
                this.head = new THREE.Group();
                this.head.position.set(0, 1.16, 0);
                const headMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(0.48, 0.48, 0.48),
                    makeHeadMaterials(M.creeperSkin, M.creeperFace)
                );
                headMesh.position.set(0, 0.24, 0);
                this.head.add(headMesh);
                this.group.add(this.head);

                // Body
                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.76, 0.26), M.creeperSkin);
                this.body.position.set(0, 0.78, 0);
                this.group.add(this.body);

                // 4 Hip-Pivoted Creeper Legs
                const legPositions = [
                    [-0.16, 0.40, 0.22], [0.16, 0.40, 0.22],
                    [-0.16, 0.40, -0.22], [0.16, 0.40, -0.22]
                ];
                legPositions.forEach(p => {
                    const limb = createPivotedLimb(0.22, 0.40, 0.22, M.creeperSkin, p[0], p[1], p[2]);
                    this.group.add(limb.pivot);
                    this.legs.push(limb.pivot);
                });
            } else if (t === 'warden') {
                // ★ AUTHENTIC MINECRAFT WARDEN (Guardian Boss of the Ancient City!)
                this.isHostile = true;
                this.health = 100;
                this.maxHealth = 100;
                this.speed = 2.3;
                this.damage = 8;

                const sensorMat = new THREE.MeshBasicMaterial({ color: 0x2ceef8 });

                // Massive Head with Bioluminescent Sculk Tendril Horns
                this.head = new THREE.Group();
                this.head.position.set(0, 2.05, 0);
                const headMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(0.76, 0.72, 0.64),
                    makeHeadMaterials(M.wardenSkin, M.wardenFace)
                );
                headMesh.position.set(0, 0.36, 0);
                this.head.add(headMesh);

                // Glowing Sculk Horns/Ears
                const leftHorn = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.08), sensorMat);
                leftHorn.position.set(-0.52, 0.52, 0);
                const rightHorn = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.08), sensorMat);
                rightHorn.position.set(0.52, 0.52, 0);
                this.head.add(leftHorn, rightHorn);
                this.group.add(this.head);

                // Broad Torso with Glowing Soul Heart Core
                this.body = new THREE.Mesh(
                    new THREE.BoxGeometry(0.86, 1.15, 0.48),
                    makeHeadMaterials(M.wardenSkin, M.wardenBody)
                );
                this.body.position.set(0, 1.48, 0);
                this.group.add(this.body);

                // Massive Shoulder-Pivoted Warden Arms
                [-0.62, 0.62].forEach(px => {
                    const limb = createPivotedLimb(0.36, 1.25, 0.36, M.wardenSkin, px, 1.95, 0);
                    limb.pivot.rotation.x = -0.35;
                    this.group.add(limb.pivot);
                    this.arms.push(limb.pivot);
                });

                // Sturdy Hip-Pivoted Legs
                [-0.24, 0.24].forEach(px => {
                    const limb = createPivotedLimb(0.36, 0.90, 0.36, M.wardenSkin, px, 0.90, 0);
                    this.group.add(limb.pivot);
                    this.legs.push(limb.pivot);
                });
            } else if (t === 'astral_phantom') {
                this.isHostile = true;
                this.health = 25;
                this.maxHealth = 25;
                this.speed = 3.2;
                this.damage = 5;

                const coreMat = new THREE.MeshBasicMaterial({ color: 0xd033ff });
                const wingMat = new THREE.MeshBasicMaterial({ color: 0x33eeff, wireframe: true });

                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), coreMat);
                this.body.position.y = 1.5;
                this.group.add(this.body);

                const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.5), wingMat);
                leftWing.position.set(-0.7, 1.5, 0);
                const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.5), wingMat);
                rightWing.position.set(0.7, 1.5, 0);
                this.group.add(leftWing, rightWing);
                this.wings.push(leftWing, rightWing);
            } else if (t === 'end_crystal') {
                // ★ Authentic End Crystal (Obsidian Base + Nested Rotating Magenta/Ruby Cubes)
                this.isHostile = false;
                this.health = 1;
                this.maxHealth = 1;
                this.speed = 0;

                const obsidianMat = new THREE.MeshLambertMaterial({ color: 0x16121e });
                const crystalGlassMat = new THREE.MeshLambertMaterial({ color: 0xd826b5, transparent: true, opacity: 0.85 });
                const crystalCoreMat = new THREE.MeshBasicMaterial({ color: 0xff3355 });

                // Obsidian base
                const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 1.2), obsidianMat);
                base.position.y = 0.125;
                this.group.add(base);

                // Outer rotating glass cube
                this.crystalOuter = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), crystalGlassMat);
                this.crystalOuter.position.y = 1.0;
                this.group.add(this.crystalOuter);

                // Inner rotating ruby cube
                this.crystalInner = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), crystalCoreMat);
                this.crystalInner.position.y = 1.0;
                this.group.add(this.crystalInner);

            } else if (t === 'ender_dragon') {
                // ★ Authentic Minecraft ENDER DRAGON Boss! (Articulated wings, body, neck, head, tail)
                this.isHostile = true;
                this.health = 200;
                this.maxHealth = 200;
                this.speed = 15.0;
                this.damage = 10;
                this.isBoss = true;
                this.flightAngle = 0;
                this.diveTimer = 14.0;
                this.isDiving = false;

                const dragonDark = new THREE.MeshLambertMaterial({ color: 0x181820 });
                const dragonWingMembrane = new THREE.MeshLambertMaterial({ color: 0x22222a });
                const dragonEyeMat = new THREE.MeshBasicMaterial({ color: 0xcc28ff });
                const dragonSpikeMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });

                // 1. Main Body
                this.body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 4.4), dragonDark);
                this.body.position.y = 1.6;
                this.group.add(this.body);

                // Spine spikes on body
                for (let sz = -1.6; sz <= 1.6; sz += 0.8) {
                    const spike = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.3), dragonSpikeMat);
                    spike.position.set(0, 2.45, sz);
                    this.group.add(spike);
                }

                // 2. Neck & Head
                this.headGroup = new THREE.Group();
                this.headGroup.position.set(0, 1.7, 2.6);

                const neck = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.6), dragonDark);
                neck.position.set(0, 0, 0.8);
                this.headGroup.add(neck);

                const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 1.4), dragonDark);
                head.position.set(0, 0.2, 1.9);
                this.headGroup.add(head);

                // Snout
                const snout = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.0), dragonDark);
                snout.position.set(0, -0.05, 2.8);
                this.headGroup.add(snout);

                // Glowing Purple Eyes
                [-0.45, 0.45].forEach(ex => {
                    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), dragonEyeMat);
                    eye.position.set(ex, 0.45, 2.3);
                    this.headGroup.add(eye);
                });
                this.group.add(this.headGroup);

                // 3. Articulated Left & Right Wings
                this.dragonWings = [];
                [-1, 1].forEach(side => {
                    const wingPivot = new THREE.Group();
                    wingPivot.position.set(side * 0.9, 2.2, 0.2);

                    const innerWing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 1.6), dragonWingMembrane);
                    innerWing.position.set(side * 1.2, 0, 0);
                    wingPivot.add(innerWing);

                    const outerPivot = new THREE.Group();
                    outerPivot.position.set(side * 2.4, 0, 0);
                    const outerWing = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.3), dragonWingMembrane);
                    outerWing.position.set(side * 1.3, 0, 0);
                    outerPivot.add(outerWing);
                    wingPivot.add(outerPivot);

                    this.group.add(wingPivot);
                    this.dragonWings.push({ pivot: wingPivot, outer: outerPivot, side });
                });

                // 4. Segmented Tail
                this.tailGroup = new THREE.Group();
                this.tailGroup.position.set(0, 1.4, -2.2);
                for (let ti = 0; ti < 3; ti++) {
                    const tMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7 - ti * 0.15, 0.6 - ti * 0.1, 1.2), dragonDark);
                    tMesh.position.set(0, 0, -ti * 1.2);
                    this.tailGroup.add(tMesh);
                }
                this.group.add(this.tailGroup);
            }
        }

        takeDamage(amount) {
            if (this.isDead) return;
            this.health -= amount;
            this.hurtTimer = 0.25;
            this.setFlashColor(0xff3333);
            this.sound.playMobSound(this.type);

            // Pushback
            this.vy = 4.5;
            this.onGround = false;

            if (!this.isHostile) {
                this.isPanic = true;
                this.panicTimer = 4.0;
                this.yaw = Math.random() * Math.PI * 2;
            }

            if (this.health <= 0) {
                this.die();
            }
        }

        setFlashColor(hexColor) {
            this.group.traverse(child => {
                if (child.isMesh && child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(m => {
                        if (m.color) {
                            if (m.userData.origColor === undefined) {
                                m.userData.origColor = m.color.getHex();
                            }
                            m.color.setHex(hexColor);
                        }
                    });
                }
            });
        }

        restoreColors() {
            this.group.scale.set(1, 1, 1);
            this.group.traverse(child => {
                if (child.isMesh && child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(m => {
                        if (m.color && m.userData.origColor !== undefined) {
                            m.color.setHex(m.userData.origColor);
                        }
                    });
                }
            });
        }

        die() {
            this.isDead = true;
            this.sound.playHit();
            this.itemManager.spawnBlockParticles(this.x, this.y + 0.6, this.z, 0xffffff, 15);

            const im = this.itemManager;
            if (this.type === 'pig' || this.type === 'cow') {
                im.spawnDroppedItem(this.x, this.y + 0.5, this.z, 'raw_beef', 2);
            } else if (this.type === 'sheep') {
                im.spawnDroppedItem(this.x, this.y + 0.5, this.z, 'wool', 1);
                im.spawnDroppedItem(this.x, this.y + 0.5, this.z, 'raw_beef', 1);
            } else if (this.type === 'chicken') {
                im.spawnDroppedItem(this.x, this.y + 0.5, this.z, 'feather', 2);
            } else if (this.type === 'zombie') {
                im.spawnDroppedItem(this.x, this.y + 0.5, this.z, 'rotten_flesh', 2);
            } else if (this.type === 'skeleton') {
                im.spawnDroppedItem(this.x, this.y + 0.5, this.z, 'bone', 2);
            } else if (this.type === 'creeper') {
                im.spawnDroppedItem(this.x, this.y + 0.5, this.z, 'gunpowder', 2);
            } else if (this.type === 'warden') {
                im.spawnDroppedItem(this.x, this.y + 0.5, this.z, 'echo_shard', 4);
                im.spawnDroppedItem(this.x, this.y + 0.5, this.z, 'diamond', 3);
            } else if (this.type === 'astral_phantom') {
                im.spawnDroppedItem(this.x, this.y + 0.5, this.z, 'astral_crystal', 3);
            } else if (this.type === 'end_crystal') {
                // End Crystal explodes violently upon destruction!
                if (this.sound && this.sound.playExplosion) this.sound.playExplosion();
                im.spawnBlockParticles(this.x, this.y + 1, this.z, 0xff2222, 24);
                im.spawnBlockParticles(this.x, this.y + 1, this.z, 0xffaa00, 16);
                im.spawnBlockParticles(this.x, this.y + 1, this.z, 0xdddddd, 16);
                // Damage dragon if within 32m
                if (this.mobManager) {
                    const dragon = this.mobManager.mobs.find(m => m.type === 'ender_dragon' && !m.isDead);
                    if (dragon) {
                        const dist = Math.hypot(dragon.x - this.x, dragon.y - this.y, dragon.z - this.z);
                        if (dist < 32) {
                            dragon.takeDamage(25);
                        }
                    }
                }
            } else if (this.type === 'ender_dragon') {
                // ★ Legendary Ender Dragon Defeat Sequence!
                if (this.sound && this.sound.playDragonRoar) this.sound.playDragonRoar();
                im.spawnDroppedItem(this.x, this.y + 1, this.z, 'dragon_breath', 4);
                im.spawnDroppedItem(this.x, this.y + 1, this.z, 'elytra', 1);

                // Fountain of radiant XP particles
                for (let i = 0; i < 40; i++) {
                    const rx = (Math.random() - 0.5) * 6;
                    const rz = (Math.random() - 0.5) * 6;
                    im.spawnBlockParticles(this.x + rx, this.y + 2 + Math.random() * 4, this.z + rz, 0x55ff55, 3);
                    im.spawnBlockParticles(this.x + rx, this.y + 2 + Math.random() * 4, this.z + rz, 0xaa22ff, 3);
                }

                // Activate Center Exit Portal in The End! (Fill 3x3 with END_PORTAL)
                const B = window.BLOCKS;
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dz = -1; dz <= 1; dz++) {
                        this.world.setBlock(dx, 62, dz, B.END_PORTAL.id);
                    }
                }
                // Place Dragon Egg on the bedrock pillar!
                this.world.setBlock(0, 67, 0, B.DRAGON_EGG.id);

                if (this.sound && this.sound.playEndPortalOpen) this.sound.playEndPortalOpen();
                const bossBar = document.getElementById('boss-bar-container');
                if (bossBar) bossBar.style.display = 'none';

                if (window.game?.ui) {
                    window.game.ui.addChatMessage('🏆 エンダードラゴンを討伐しました！中央のエンドポータルが起動し、ドラゴンの卵が出現しました！', '#d855ff');
                }
            }

            this.scene.remove(this.group);
        }

        update(dt, player, timeOfDay = 0.25) {
            if (this.isDead) return;

            // 1. Damage flash recovery
            if (this.hurtTimer > 0) {
                this.hurtTimer -= dt;
                if (this.hurtTimer <= 0) {
                    this.restoreColors();
                }
            }

            // 2. ★ Authentic Minecraft Sunlight Burning for Undead (Zombies & Skeletons burn in daytime sun!)
            if (this.isUndead) {
                const isDaylight = (timeOfDay > 0.04 && timeOfDay < 0.46);
                const skyY = this.world.getHighestSolidY(Math.floor(this.x), Math.floor(this.z));
                const underOpenSky = (this.y >= skyY);
                if (isDaylight && underOpenSky) {
                    this.burnTimer += dt;
                    this.burnParticleTimer += dt;
                    if (this.burnParticleTimer > 0.22) {
                        this.burnParticleTimer = 0;
                        this.itemManager.spawnBlockParticles(this.x, this.y + 1.1, this.z, 0xff6600, 3);
                    }
                    if (this.burnTimer >= 1.2) {
                        this.burnTimer = 0;
                        this.takeDamage(2);
                        if (this.isDead) return;
                    }
                }
            }

            // 3. Periodic mob ambient sounds
            this.soundTimer -= dt;
            if (this.soundTimer <= 0) {
                this.soundTimer = 8.0 + Math.random() * 12.0;
                const pDist = Math.hypot(player.x - this.x, player.z - this.z);
                if (pDist < 24) {
                    this.sound.playMobSound(this.type);
                }
            }

            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dz = player.z - this.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            let moveSpeed = 0;

            if (this.isHostile && dist < 22.0 && Math.abs(dy) < 10.0 && player.gameMode === 'survival') {
                // Hostile chase
                this.yaw = Math.atan2(dx, dz);
                this.group.rotation.y = this.yaw;
                moveSpeed = this.speed;

                // Creeper hiss and explosive fuse
                if (this.type === 'creeper') {
                    if (dist < 3.2) {
                        if (!this.isFusing) {
                            this.sound.playFuse();
                            this.isFusing = true;
                        }
                        this.fuseTimer += dt;
                        const scale = 1.0 + Math.sin(this.fuseTimer * 18) * 0.15;
                        this.group.scale.set(scale, scale, scale);
                        this.setFlashColor(0xffffff);

                        if (this.fuseTimer > 1.5) {
                            this.itemManager.explode(this.x, this.y + 0.5, this.z, 4.0, false);
                            this.die();
                            return;
                        }
                    } else {
                        this.isFusing = false;
                        this.fuseTimer = Math.max(0, this.fuseTimer - dt * 2);
                        this.restoreColors();
                    }
                }

                // Melee attack player
                const reach = (this.type === 'warden') ? 2.2 : 1.5;
                if (dist < reach && this.type !== 'creeper') {
                    this.attackCooldown += dt;
                    if (this.attackCooldown > 1.0) {
                        player.takeDamage(this.damage, this.type);
                        this.attackCooldown = 0;
                        this.attackSwing = 0.8;
                    }
                }
            } else {
                // Peaceful Animal Wander / Panic Run
                if (this.isPanic) {
                    this.panicTimer -= dt;
                    moveSpeed = this.speed * 2.1;
                    if (this.panicTimer <= 0) this.isPanic = false;
                } else {
                    this.idleTimer -= dt;
                    if (this.idleTimer <= 0) {
                        this.idleTimer = 2.5 + Math.random() * 4.0;
                        this.isWalking = Math.random() > 0.35;
                        this.yaw += (Math.random() - 0.5) * 2.2;
                    }
                    if (this.isWalking) {
                        moveSpeed = this.speed * 0.65;
                    }
                }
                this.group.rotation.y = this.yaw;
            }

            if (this.attackSwing > 0) {
                this.attackSwing = Math.max(0, this.attackSwing - dt * 3.0);
            }

            // 4. Horizontal Movement with Real Wall & Step Detection (NO teleporting onto trees!)
            const curGroundY = this.world.getGroundYBelow(Math.floor(this.x), this.y + 1.5, Math.floor(this.z));

            if (moveSpeed > 0) {
                const stepX = Math.sin(this.yaw) * moveSpeed * dt;
                const stepZ = Math.cos(this.yaw) * moveSpeed * dt;
                const nextX = this.x + stepX;
                const nextZ = this.z + stepZ;

                const nextGroundY = this.world.getGroundYBelow(Math.floor(nextX), this.y + 2.2, Math.floor(nextZ));
                const stepDiff = (nextGroundY + 1.0) - this.y;

                if (stepDiff <= 0.1) {
                    // Flat or descending ground
                    this.x = nextX;
                    this.z = nextZ;
                } else if (stepDiff <= 1.25) {
                    // 1-block step up: Jump like real Minecraft mobs!
                    this.x = nextX;
                    this.z = nextZ;
                    if (this.onGround) {
                        this.vy = 7.4;
                        this.onGround = false;
                    }
                } else {
                    // 2+ block wall or pillar: turn away instead of clipping through or warping on top!
                    this.yaw += Math.PI * 0.55;
                }

                // Hip-Pivoted Leg Swing Animation
                this.walkAnim += dt * (moveSpeed * 4.8);
                for (let i = 0; i < this.legs.length; i++) {
                    const sign = (i % 2 === 0) ? 1 : -1;
                    this.legs[i].rotation.x = Math.sin(this.walkAnim) * 0.65 * sign;
                }
            } else {
                for (let i = 0; i < this.legs.length; i++) {
                    this.legs[i].rotation.x *= 0.85;
                }
            }

            // 5. Shoulder-Pivoted Arm Animation (Zombie, Skeleton, Warden)
            if (this.arms.length >= 2) {
                if (this.type === 'zombie') {
                    // Iconic outstretched Zombie arms bobbing slightly + downward attack strike
                    const bob = Math.sin(performance.now() * 0.004) * 0.08 + Math.sin(this.walkAnim) * 0.10;
                    this.arms[0].rotation.x = -Math.PI / 2.1 + bob - this.attackSwing;
                    this.arms[1].rotation.x = -Math.PI / 2.1 - bob - this.attackSwing;
                } else if (this.type === 'skeleton') {
                    this.arms[0].rotation.x = -Math.PI / 2.2;
                    this.arms[1].rotation.x = -Math.PI / 2.4 + Math.sin(this.walkAnim) * 0.12;
                } else if (this.type === 'warden') {
                    const swing = Math.sin(this.walkAnim) * 0.45;
                    this.arms[0].rotation.x = -0.3 + swing - this.attackSwing;
                    this.arms[1].rotation.x = -0.3 - swing - this.attackSwing;
                }
            }

            // 6. Wing flapping (Chickens & Phantoms)
            if (this.wings && this.wings.length >= 2) {
                this.wingAnim += dt * (moveSpeed > 0 ? 14 : 5);
                const wingAngle = Math.sin(this.wingAnim) * 0.45;
                this.wings[0].rotation.z = wingAngle;
                this.wings[1].rotation.z = -wingAngle;
            }

            // 7. Vertical Gravity & Floor Alignment (Supports both Underground Ancient City & Surface!)
            const floorY = this.world.getGroundYBelow(Math.floor(this.x), this.y + 1.5, Math.floor(this.z)) + 1.0;

            if (this.type === 'end_crystal') {
                // Floating rotating End Crystal
                if (this.crystalOuter && this.crystalInner) {
                    this.crystalOuter.rotation.y += dt * 1.5;
                    this.crystalOuter.rotation.x += dt * 0.8;
                    this.crystalInner.rotation.y -= dt * 2.2;
                    this.crystalInner.rotation.z += dt * 1.1;
                    const bob = Math.sin(performance.now() * 0.003) * 0.12;
                    this.crystalOuter.position.y = 1.0 + bob;
                    this.crystalInner.position.y = 1.0 + bob;
                }
            } else if (this.type === 'ender_dragon') {
                // ★ Full authentic Ender Dragon Boss AI!
                const bossBar = document.getElementById('boss-bar-container');
                const bossFill = document.getElementById('boss-bar-fill');
                if (bossBar) bossBar.style.display = 'flex';
                if (bossFill) bossFill.style.width = `${Math.max(0, Math.min(100, (this.health / this.maxHealth) * 100))}%`;

                // Wing flapping animation
                this.wingAnim = (this.wingAnim || 0) + dt * 10.0;
                const flap = Math.sin(this.wingAnim) * 0.52;
                if (this.dragonWings) {
                    this.dragonWings.forEach(w => {
                        w.pivot.rotation.z = flap * w.side;
                        w.outer.rotation.z = flap * 0.65 * w.side;
                    });
                }

                // Check End Crystals for Healing Beam
                if (this.mobManager) {
                    const crystals = this.mobManager.mobs.filter(m => m.type === 'end_crystal' && !m.isDead);
                    if (crystals.length > 0) {
                        const nearest = crystals[0];
                        const cDist = Math.hypot(nearest.x - this.x, nearest.y - this.y, nearest.z - this.z);
                        if (cDist < 48) {
                            // Restore 1 HP every second
                            this.healTimer = (this.healTimer || 0) + dt;
                            if (this.healTimer >= 1.0) {
                                this.health = Math.min(this.maxHealth, this.health + 1);
                                this.healTimer = 0;
                            }
                            // Spawn beam particles from crystal to dragon
                            if (Math.random() < 0.6) {
                                const frac = Math.random();
                                const bx = nearest.x + (this.x - nearest.x) * frac;
                                const by = (nearest.y + 1) + (this.y + 1.5 - (nearest.y + 1)) * frac;
                                const bz = nearest.z + (this.z - nearest.z) * frac;
                                this.itemManager.spawnBlockParticles(bx, by, bz, 0xbf30ff, 1);
                            }
                        }
                    }
                }

                // Flight and dive attack AI
                this.diveTimer -= dt;
                if (this.diveTimer <= 0 && !this.isDiving) {
                    this.isDiving = true;
                    this.diveTarget = { x: player.x, y: player.y + 0.5, z: player.z };
                    this.diveDuration = 4.0;
                    if (this.sound && this.sound.playDragonRoar) this.sound.playDragonRoar();
                }

                let targetX = 0, targetY = 78, targetZ = 0;
                if (this.isDiving && this.diveTarget) {
                    targetX = this.diveTarget.x;
                    targetY = this.diveTarget.y;
                    targetZ = this.diveTarget.z;
                    this.diveDuration -= dt;
                    if (this.diveDuration <= 0 || this.y <= player.y + 1.2) {
                        this.isDiving = false;
                        this.diveTimer = 14.0 + Math.random() * 8.0;
                    }
                    // Dive damage to player
                    const pDist = Math.hypot(player.x - this.x, player.y - this.y, player.z - this.z);
                    if (pDist < 4.2) {
                        player.takeDamage(this.damage, 'ender_dragon');
                        player.velocity.y = 8.0;
                        this.isDiving = false;
                        this.diveTimer = 16.0;
                    }
                } else {
                    this.flightAngle += dt * 0.42;
                    targetX = Math.cos(this.flightAngle) * 28;
                    targetZ = Math.sin(this.flightAngle) * 28;
                    targetY = 76 + Math.sin(this.flightAngle * 2.2) * 5.5;

                    // Periodic dragon breath attack
                    this.breathTimer = (this.breathTimer || 0) + dt;
                    if (this.breathTimer >= 8.0) {
                        this.breathTimer = 0;
                        const pDir = new THREE.Vector3(player.x - this.x, (player.y + 1) - (this.y + 1), player.z - this.z).normalize();
                        if (this.itemManager.shootFireball) {
                            this.itemManager.shootFireball(new THREE.Vector3(this.x, this.y + 1.5, this.z), pDir);
                        }
                    }
                }

                const moveDirX = targetX - this.x;
                const moveDirY = targetY - this.y;
                const moveDirZ = targetZ - this.z;
                const distToTarget = Math.hypot(moveDirX, moveDirY, moveDirZ);
                const curSpeed = this.isDiving ? 22.0 : 13.0;
                if (distToTarget > 0.5) {
                    this.x += (moveDirX / distToTarget) * curSpeed * dt;
                    this.y += (moveDirY / distToTarget) * curSpeed * dt;
                    this.z += (moveDirZ / distToTarget) * curSpeed * dt;
                    this.yaw = Math.atan2(moveDirX, moveDirZ);
                    this.group.rotation.y = this.yaw;
                }

            } else if (this.type === 'astral_phantom') {
                this.y = Math.max(floorY + 3.5, floorY + 2.5 + Math.sin(performance.now() * 0.003) * 1.2);
            } else {
                this.vy = Math.max(-24.0, this.vy - 22.0 * dt);
                this.y += this.vy * dt;
                if (this.y <= floorY) {
                    this.y = floorY;
                    this.vy = 0;
                    this.onGround = true;
                } else {
                    this.onGround = false;
                }
            }

            this.group.position.set(this.x, this.y, this.z);
        }
    }

    class MobManager {
        constructor(scene, world, sound, itemManager) {
            this.scene = scene;
            this.world = world;
            this.sound = sound;
            this.itemManager = itemManager;
            this.mobs = [];
            this.spawnTimer = 0;
            this.initialSpawnDone = false;
        }

        spawnMob(type, x, y, z) {
            const mob = new Mob(type, x, y, z, this.scene, this.world, this.sound, this.itemManager);
            mob.mobManager = this;
            this.mobs.push(mob);
            return mob;
        }

        spawnWardenIfNeeded(wx, wy, wz) {
            const hasWarden = this.mobs.some(m => !m.isDead && m.type === 'warden' && Math.hypot(m.x - wx, m.z - wz) < 35);
            if (!hasWarden) {
                this.spawnMob('warden', wx, wy, wz);
            }
        }

        // Spawn cluster of peaceful animals directly on visible terrain
        spawnAnimalCluster(px, pz, count = 8) {
            const animalTypes = ['cow', 'pig', 'sheep', 'chicken'];
            for (let i = 0; i < count; i++) {
                const type = animalTypes[i % animalTypes.length];
                const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
                const dist = 7 + Math.random() * 14;
                const sx = Math.floor(px + Math.cos(angle) * dist);
                const sz = Math.floor(pz + Math.sin(angle) * dist);

                const groundY = this.world.getHighestSolidY(sx, sz);
                if (groundY > 18) {
                    this.spawnMob(type, sx + 0.5, groundY + 1.0, sz + 0.5);
                }
            }
        }

        checkMobHit(position, radius = 1.7) {
            for (let i = 0; i < this.mobs.length; i++) {
                const mob = this.mobs[i];
                if (mob.isDead) continue;
                const hitRadius = (mob.type === 'warden') ? 2.2 : radius;
                const distSq = (mob.x - position.x)**2 + ((mob.y + 0.8) - position.y)**2 + (mob.z - position.z)**2;
                if (distSq < hitRadius * hitRadius) {
                    return mob;
                }
            }
            return null;
        }

        update(dt, player, timeOfDay) {
            // 1. Initial Animal Guarantee
            if (!this.initialSpawnDone) {
                this.initialSpawnDone = true;
                this.spawnAnimalCluster(player.x, player.z, 10);
            }

            // 2. If player is inside the Ancient City (cx 6..7, cz 6..7 -> X: 96..127, Z: 96..127, Y < 16), ensure Warden is present
            this.spawnTimer += dt;
            if (this.spawnTimer > 1.5) {
                this.spawnTimer = 0;

                if (player.y < 16.0 && player.x >= 90 && player.x <= 134 && player.z >= 90 && player.z <= 134) {
                    this.spawnWardenIfNeeded(112.5, 7.0, 112.5);
                }

                if (this.mobs.length < 15) {
                    const isNight = (timeOfDay > 0.45 && timeOfDay < 0.95);
                    const isUnderground = (player.y < 16.0);
                    const spawnTypes = (isNight || isUnderground)
                        ? ['zombie', 'creeper', 'skeleton', 'zombie']
                        : ['cow', 'pig', 'sheep', 'chicken', 'pig', 'cow'];
                    const chosenType = spawnTypes[Math.floor(Math.random() * spawnTypes.length)];

                    const angle = Math.random() * Math.PI * 2;
                    const dist = 10 + Math.random() * 16;
                    const sx = Math.floor(player.x + Math.cos(angle) * dist);
                    const sz = Math.floor(player.z + Math.sin(angle) * dist);

                    if (isUnderground) {
                        const floorY = this.world.getGroundYBelow(sx, player.y + 3, sz);
                        if (floorY >= 4 && floorY <= 14) {
                            this.spawnMob(chosenType, sx + 0.5, floorY + 1.0, sz + 0.5);
                        }
                    } else {
                        const groundY = this.world.getHighestSolidY(sx, sz);
                        if (groundY > 18) {
                            this.spawnMob(chosenType, sx + 0.5, groundY + 1.0, sz + 0.5);
                        }
                    }
                }
            }

            // 3. Update & Despawn distant mobs
            for (let i = this.mobs.length - 1; i >= 0; i--) {
                const mob = this.mobs[i];
                if (mob.isDead) {
                    this.mobs.splice(i, 1);
                    continue;
                }

                const distToPlayer = Math.hypot(player.x - mob.x, player.z - mob.z);
                if (distToPlayer > 65.0 && mob.type !== 'warden') {
                    this.scene.remove(mob.group);
                    this.mobs.splice(i, 1);
                    continue;
                }

                mob.update(dt, player, timeOfDay);
            }
        }
    }

    global.Mob = Mob;
    global.MobManager = MobManager;
})(window);
