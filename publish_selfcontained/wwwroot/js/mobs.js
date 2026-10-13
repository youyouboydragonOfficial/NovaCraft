// Authentic Minecraft Living Mobs (Pig, Cow, Sheep, Chicken, Zombie, Skeleton, Creeper, Astral Phantom)
// Advanced Voxel AI, Procedural Sounds, Physics Stability & Zero-Sink Terrain Alignment
(function(global) {
    class Mob {
        constructor(type, x, y, z, scene, world, sound, itemManager) {
            this.type = type;
            this.x = x;
            this.y = y;
            this.z = z;
            this.vy = 0;
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
            this.isDead = false;

            this.attackCooldown = 0;
            this.fuseTimer = 0;
            this.isFusing = false;
            this.soundTimer = 5.0 + Math.random() * 8.0;

            this.hurtTimer = 0;
            this.walkAnim = 0;
            this.wingAnim = 0;
            this.idleTimer = Math.random() * 2.5;
            this.isWalking = true;
            this.isPanic = false;
            this.panicTimer = 0;

            this.group = new THREE.Group();
            this.buildModel();
            this.group.position.set(x, y, z);
            this.scene.add(this.group);
        }

        buildModel() {
            // Remove existing mesh children
            while (this.group.children.length > 0) {
                this.group.remove(this.group.children[0]);
            }

            const t = this.type;
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
            const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

            if (t === 'pig') {
                // PIG: Pink body, protruding snout, black/white eyes, 4 legs
                this.isHostile = false;
                this.health = 10;
                this.speed = 1.6;
                const pink = new THREE.MeshLambertMaterial({ color: 0xf29b9b });
                const darkPink = new THREE.MeshLambertMaterial({ color: 0xd97575 });

                // Body
                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.9), pink);
                this.body.position.y = 0.55;
                this.group.add(this.body);

                // Head
                this.head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), pink);
                this.head.position.set(0, 0.72, 0.55);

                // Snout
                const snout = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.12), darkPink);
                snout.position.set(0, -0.06, 0.28);
                this.head.add(snout);

                // Eyes
                const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), eyeMat);
                leftEye.position.set(-0.25, 0.08, 0.24);
                const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), eyeMat);
                rightEye.position.set(0.25, 0.08, 0.24);
                this.head.add(leftEye);
                this.head.add(rightEye);
                this.group.add(this.head);

                // 4 Legs
                this.legs = [];
                const legGeo = new THREE.BoxGeometry(0.18, 0.38, 0.18);
                const legPositions = [
                    [-0.22, 0.19, 0.28], [0.22, 0.19, 0.28],
                    [-0.22, 0.19, -0.28], [0.22, 0.19, -0.28]
                ];
                legPositions.forEach(p => {
                    const leg = new THREE.Mesh(legGeo, pink);
                    leg.position.set(p[0], p[1], p[2]);
                    this.group.add(leg);
                    this.legs.push(leg);
                });
            } else if (t === 'cow') {
                // COW: Brown spotted body, horns, snout, 4 legs
                this.isHostile = false;
                this.health = 10;
                this.speed = 1.5;
                const cowBrown = new THREE.MeshLambertMaterial({ color: 0x4a3222 });
                const cowMuzzle = new THREE.MeshLambertMaterial({ color: 0x887766 });
                const cowHorn = new THREE.MeshLambertMaterial({ color: 0xdcdcdc });

                // Body
                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.65, 1.0), cowBrown);
                this.body.position.y = 0.7;
                this.group.add(this.body);

                // Head
                this.head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.5), cowBrown);
                this.head.position.set(0, 0.95, 0.6);

                // Muzzle
                const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.14), cowMuzzle);
                muzzle.position.set(0, -0.12, 0.28);
                this.head.add(muzzle);

                // Horns
                const leftHorn = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), cowHorn);
                leftHorn.position.set(-0.25, 0.25, 0);
                const rightHorn = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), cowHorn);
                rightHorn.position.set(0.25, 0.25, 0);
                this.head.add(leftHorn);
                this.head.add(rightHorn);

                // Eyes
                const le = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), eyeMat);
                le.position.set(-0.25, 0.06, 0.25);
                const re = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), eyeMat);
                re.position.set(0.25, 0.06, 0.25);
                this.head.add(le);
                this.head.add(re);
                this.group.add(this.head);

                // 4 Legs
                this.legs = [];
                const legGeo = new THREE.BoxGeometry(0.2, 0.48, 0.2);
                const legPositions = [
                    [-0.24, 0.24, 0.32], [0.24, 0.24, 0.32],
                    [-0.24, 0.24, -0.32], [0.24, 0.24, -0.32]
                ];
                legPositions.forEach(p => {
                    const leg = new THREE.Mesh(legGeo, cowBrown);
                    leg.position.set(p[0], p[1], p[2]);
                    this.group.add(leg);
                    this.legs.push(leg);
                });
            } else if (t === 'sheep') {
                // SHEEP: Fluffy wool coat, skin face and legs
                this.isHostile = false;
                this.health = 8;
                this.speed = 1.6;
                const woolMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
                const skinMat = new THREE.MeshLambertMaterial({ color: 0xd2b48c });

                // Wool Body
                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.6, 0.95), woolMat);
                this.body.position.y = 0.65;
                this.group.add(this.body);

                // Head
                this.head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.45), skinMat);
                this.head.position.set(0, 0.85, 0.55);

                const woolHat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.35), woolMat);
                woolHat.position.set(0, 0.16, -0.05);
                this.head.add(woolHat);

                const le = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
                le.position.set(-0.2, 0.02, 0.22);
                const re = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
                re.position.set(0.2, 0.02, 0.22);
                this.head.add(le);
                this.head.add(re);
                this.group.add(this.head);

                // 4 Legs
                this.legs = [];
                const legGeo = new THREE.BoxGeometry(0.16, 0.45, 0.16);
                const legPositions = [
                    [-0.22, 0.22, 0.3], [0.22, 0.22, 0.3],
                    [-0.22, 0.22, -0.3], [0.22, 0.22, -0.3]
                ];
                legPositions.forEach(p => {
                    const leg = new THREE.Mesh(legGeo, skinMat);
                    leg.position.set(p[0], p[1], p[2]);
                    this.group.add(leg);
                    this.legs.push(leg);
                });
            } else if (t === 'chicken') {
                // CHICKEN: Small white bird, flapping wings, red wattle & comb
                this.isHostile = false;
                this.health = 4;
                this.speed = 1.3;
                const chickenWhite = new THREE.MeshLambertMaterial({ color: 0xffffff });
                const chickenBeak = new THREE.MeshLambertMaterial({ color: 0xee9911 });
                const chickenRed = new THREE.MeshLambertMaterial({ color: 0xcc2222 });

                // Body
                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.45), chickenWhite);
                this.body.position.y = 0.38;
                this.group.add(this.body);

                // Wings
                this.wings = [];
                const wingGeo = new THREE.BoxGeometry(0.06, 0.26, 0.35);
                const leftWing = new THREE.Mesh(wingGeo, chickenWhite);
                leftWing.position.set(-0.2, 0.4, 0);
                const rightWing = new THREE.Mesh(wingGeo, chickenWhite);
                rightWing.position.set(0.2, 0.4, 0);
                this.group.add(leftWing);
                this.group.add(rightWing);
                this.wings.push(leftWing, rightWing);

                // Head
                this.head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.3, 0.24), chickenWhite);
                this.head.position.set(0, 0.62, 0.22);

                // Beak
                const beak = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.14), chickenBeak);
                beak.position.set(0, -0.02, 0.15);
                this.head.add(beak);

                // Wattle
                const wattle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.08), chickenRed);
                wattle.position.set(0, -0.12, 0.1);
                this.head.add(wattle);

                // Comb
                const comb = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.16), chickenRed);
                comb.position.set(0, 0.18, 0);
                this.head.add(comb);
                this.group.add(this.head);

                // 2 Legs
                this.legs = [];
                const legGeo = new THREE.BoxGeometry(0.07, 0.26, 0.07);
                [-0.09, 0.09].forEach(px => {
                    const leg = new THREE.Mesh(legGeo, chickenBeak);
                    leg.position.set(px, 0.13, 0);
                    this.group.add(leg);
                    this.legs.push(leg);
                });
            } else if (t === 'creeper') {
                // CREEPER: Green camouflage torso, 4 legs, scary face
                this.isHostile = true;
                this.health = 16;
                this.speed = 2.0;
                const creeperGreen = new THREE.MeshLambertMaterial({ color: 0x33aa44 });
                const creeperDark = new THREE.MeshLambertMaterial({ color: 0x228833 });

                // Torso
                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.7, 0.28), creeperGreen);
                this.body.position.y = 0.85;
                this.group.add(this.body);

                // Head
                this.head = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.46), creeperGreen);
                this.head.position.set(0, 1.38, 0);

                // Creeper face
                const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.02), eyeMat);
                eye1.position.set(-0.12, 0.06, 0.24);
                const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.02), eyeMat);
                eye2.position.set(0.12, 0.06, 0.24);
                const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.02), eyeMat);
                mouth.position.set(0, -0.08, 0.24);
                this.head.add(eye1);
                this.head.add(eye2);
                this.head.add(mouth);
                this.group.add(this.head);

                // 4 Legs
                this.legs = [];
                const legGeo = new THREE.BoxGeometry(0.18, 0.5, 0.18);
                const legPositions = [
                    [-0.14, 0.25, 0.15], [0.14, 0.25, 0.15],
                    [-0.14, 0.25, -0.15], [0.14, 0.25, -0.15]
                ];
                legPositions.forEach(p => {
                    const leg = new THREE.Mesh(legGeo, creeperDark);
                    leg.position.set(p[0], p[1], p[2]);
                    this.group.add(leg);
                    this.legs.push(leg);
                });
            } else if (t === 'astral_phantom') {
                // ASTRAL PHANTOM: Floating purple dragon-bird with glowing wings
                this.isHostile = true;
                this.health = 30;
                this.damage = 5;
                this.speed = 3.6;
                const astralMat = new THREE.MeshLambertMaterial({ color: 0x9933ee });
                const cyanGlow = new THREE.MeshBasicMaterial({ color: 0x44eeff });

                // Body
                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.9), astralMat);
                this.body.position.y = 1.0;
                this.group.add(this.body);

                // Head
                this.head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.4), astralMat);
                this.head.position.set(0, 1.15, 0.55);
                const ge1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), cyanGlow);
                ge1.position.set(-0.15, 0.05, 0.21);
                const ge2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), cyanGlow);
                ge2.position.set(0.15, 0.05, 0.21);
                this.head.add(ge1);
                this.head.add(ge2);
                this.group.add(this.head);

                // Large Astral Wings
                this.wings = [];
                const wingGeo = new THREE.BoxGeometry(0.7, 0.08, 0.55);
                const leftWing = new THREE.Mesh(wingGeo, cyanGlow);
                leftWing.position.set(-0.55, 1.1, 0);
                const rightWing = new THREE.Mesh(wingGeo, cyanGlow);
                rightWing.position.set(0.55, 1.1, 0);
                this.group.add(leftWing);
                this.group.add(rightWing);
                this.wings.push(leftWing, rightWing);
            } else {
                // ZOMBIE & SKELETON: Bipedal humanoid
                this.isHostile = true;
                const headMat = new THREE.MeshLambertMaterial({ color: 0x44aa44 });
                const shirtMat = new THREE.MeshLambertMaterial({ color: 0x2288aa });
                const pantsMat = new THREE.MeshLambertMaterial({ color: 0x282866 });

                if (t === 'zombie') {
                    this.health = 20;
                    this.damage = 3;
                    this.speed = 1.8;
                } else if (t === 'skeleton') {
                    this.health = 16;
                    this.damage = 3;
                    this.speed = 1.9;
                    headMat.color.setHex(0xd0d0d0);
                    shirtMat.color.setHex(0xaaaaaa);
                    pantsMat.color.setHex(0xaaaaaa);
                }

                // Head
                this.head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), headMat);
                this.head.position.y = 1.62;
                const e1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), eyeMat);
                e1.position.set(-0.14, 0.06, 0.25);
                const e2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), eyeMat);
                e2.position.set(0.14, 0.06, 0.25);
                this.head.add(e1);
                this.head.add(e2);
                this.group.add(this.head);

                // Torso
                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.72, 0.26), shirtMat);
                this.body.position.y = 1.02;
                this.group.add(this.body);

                // 2 Legs
                this.legs = [];
                const legGeo = new THREE.BoxGeometry(0.2, 0.68, 0.2);
                const leftLeg = new THREE.Mesh(legGeo, pantsMat);
                leftLeg.position.set(-0.14, 0.34, 0);
                const rightLeg = new THREE.Mesh(legGeo, pantsMat);
                rightLeg.position.set(0.14, 0.34, 0);
                this.group.add(leftLeg);
                this.group.add(rightLeg);
                this.legs.push(leftLeg, rightLeg);

                // 2 Arms
                this.arms = [];
                const armGeo = new THREE.BoxGeometry(0.18, 0.68, 0.18);
                const leftArm = new THREE.Mesh(armGeo, shirtMat);
                leftArm.position.set(-0.35, 1.02, 0);
                const rightArm = new THREE.Mesh(armGeo, shirtMat);
                rightArm.position.set(0.35, 1.02, 0);

                if (t === 'zombie') {
                    // Outstretched Zombie arms
                    leftArm.rotation.x = -Math.PI / 2.1;
                    rightArm.rotation.x = -Math.PI / 2.1;
                }
                this.group.add(leftArm);
                this.group.add(rightArm);
                this.arms.push(leftArm, rightArm);
            }
        }

        takeDamage(amount) {
            this.health -= amount;
            this.hurtTimer = 0.25;
            this.sound.playHit();
            this.setFlashColor(0xff2222);

            // Knockback away from player
            this.x -= Math.sin(this.yaw) * 0.6;
            this.z -= Math.cos(this.yaw) * 0.6;
            this.vy = 4.0;

            // Panic for peaceful animals
            if (!this.isHostile) {
                this.isPanic = true;
                this.panicTimer = 4.0;
                this.yaw = Math.random() * Math.PI * 2;
                this.sound.playMobSound(this.type);
            }

            if (this.health <= 0) {
                this.die();
            }
        }

        setFlashColor(hex) {
            this.group.traverse(child => {
                if (child.isMesh && child.material) {
                    if (!child.userData.origColor) {
                        child.userData.origColor = child.material.color.getHex();
                    }
                    child.material.color.setHex(hex);
                }
            });
        }

        restoreColors() {
            this.group.traverse(child => {
                if (child.isMesh && child.material && child.userData.origColor !== undefined) {
                    child.material.color.setHex(child.userData.origColor);
                }
            });
        }

        die() {
            this.isDead = true;
            this.sound.playBreak('gravel');

            // Realistic drops
            const im = this.itemManager;
            if (this.type === 'pig') {
                im.spawnDroppedItem(this.x, this.y + 0.5, this.z, 'raw_beef', 2);
            } else if (this.type === 'cow') {
                im.spawnDroppedItem(this.x, this.y + 0.5, this.z, 'raw_beef', 3);
            } else if (this.type === 'sheep') {
                im.spawnDroppedItem(this.x, this.y + 0.5, this.z, 'oak_planks', 2);
            } else if (this.type === 'chicken') {
                im.spawnDroppedItem(this.x, this.y + 0.5, this.z, 'apple', 2);
            } else if (this.type === 'zombie') {
                im.spawnDroppedItem(this.x, this.y + 0.5, this.z, 'raw_iron', 1);
            } else if (this.type === 'creeper') {
                im.spawnDroppedItem(this.x, this.y + 0.5, this.z, 'coal', 2);
            } else if (this.type === 'astral_phantom') {
                im.spawnDroppedItem(this.x, this.y + 0.5, this.z, 'astral_crystal', 3);
            }

            this.scene.remove(this.group);
        }

        update(dt, player) {
            if (this.isDead) return;

            // Damage flash animation
            if (this.hurtTimer > 0) {
                this.hurtTimer -= dt;
                if (this.hurtTimer <= 0) {
                    this.restoreColors();
                }
            }

            // Periodic authentic mob ambient sounds
            this.soundTimer -= dt;
            if (this.soundTimer <= 0) {
                this.soundTimer = 8.0 + Math.random() * 12.0;
                const pDist = Math.hypot(player.x - this.x, player.z - this.z);
                if (pDist < 24) {
                    this.sound.playMobSound(this.type);
                }
            }

            const dx = player.x - this.x;
            const dz = player.z - this.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            let moveSpeed = 0;

            if (this.isHostile && dist < 22.0 && player.gameMode === 'survival') {
                // Hostile chase
                this.yaw = Math.atan2(dx, dz);
                this.group.rotation.y = this.yaw;
                moveSpeed = this.speed;

                // Creeper hiss and explosive fuse
                if (this.type === 'creeper') {
                    if (dist < 3.5) {
                        if (!this.isFusing) {
                            this.sound.playFuse();
                            this.isFusing = true;
                        }
                        this.fuseTimer += dt;
                        const scale = 1.0 + Math.sin(this.fuseTimer * 16) * 0.2;
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

                // Attack player
                if (dist < 1.6 && this.type !== 'creeper') {
                    this.attackCooldown += dt;
                    if (this.attackCooldown > 1.2) {
                        player.takeDamage(this.damage, this.type);
                        this.attackCooldown = 0;
                    }
                }
            } else {
                // Peaceful Animal Wander / Panic Run
                if (this.isPanic) {
                    this.panicTimer -= dt;
                    moveSpeed = this.speed * 2.2;
                    if (this.panicTimer <= 0) this.isPanic = false;
                } else {
                    this.idleTimer -= dt;
                    if (this.idleTimer <= 0) {
                        this.idleTimer = 2.5 + Math.random() * 4.0;
                        this.isWalking = Math.random() > 0.35;
                        this.yaw += (Math.random() - 0.5) * 2.2;
                    }
                    if (this.isWalking) {
                        moveSpeed = this.speed * 0.7;
                    }
                }
                this.group.rotation.y = this.yaw;
            }

            // Move X & Z
            if (moveSpeed > 0) {
                const stepX = Math.sin(this.yaw) * moveSpeed * dt;
                const stepZ = Math.cos(this.yaw) * moveSpeed * dt;
                this.x += stepX;
                this.z += stepZ;

                // Leg swing walking animation
                this.walkAnim += dt * (moveSpeed * 5);
                if (this.legs) {
                    for (let i = 0; i < this.legs.length; i++) {
                        const sign = (i % 2 === 0) ? 1 : -1;
                        this.legs[i].rotation.x = Math.sin(this.walkAnim) * 0.65 * sign;
                    }
                }
            } else if (this.legs) {
                for (let i = 0; i < this.legs.length; i++) {
                    this.legs[i].rotation.x = 0;
                }
            }

            // Wing flapping (Chickens & Phantoms)
            if (this.wings && this.wings.length >= 2) {
                this.wingAnim += dt * (moveSpeed > 0 ? 14 : 5);
                const wingAngle = Math.sin(this.wingAnim) * 0.5;
                this.wings[0].rotation.z = wingAngle;
                this.wings[1].rotation.z = -wingAngle;
            }

            // Head nodding when grazing
            if (this.head && moveSpeed === 0 && !this.isHostile) {
                this.head.rotation.x = Math.sin(performance.now() * 0.002) * 0.15;
            }

            // ★ BULLETPROOF PHYSICS & ZERO-SINK TERRAIN ALIGNMENT ★
            const groundY = this.world.getHighestSolidY(Math.floor(this.x), Math.floor(this.z));
            const targetY = groundY + 1.0;

            if (this.type === 'astral_phantom') {
                // Flying mob floats above terrain
                this.y = Math.max(targetY + 4.0, targetY + 3.0 + Math.sin(performance.now() * 0.003) * 1.5);
            } else {
                // Ground mobs
                if (this.y < targetY) {
                    // Smoothly step up onto blocks (1 block auto step-climbing)
                    this.y = Math.min(targetY, this.y + 8.0 * dt);
                    this.vy = 0;
                } else if (this.y > targetY) {
                    // Normal gravity fall
                    this.vy = Math.max(-20.0, this.vy - 18.0 * dt);
                    this.y += this.vy * dt;
                    if (this.y <= targetY) {
                        this.y = targetY;
                        this.vy = 0;
                    }
                } else {
                    this.vy = 0;
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
            this.mobs.push(mob);
            return mob;
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
                if (groundY > 15) {
                    this.spawnMob(type, sx + 0.5, groundY + 1.0, sz + 0.5);
                }
            }
        }

        checkMobHit(position, radius = 1.6) {
            for (let i = 0; i < this.mobs.length; i++) {
                const mob = this.mobs[i];
                if (mob.isDead) continue;
                const distSq = (mob.x - position.x)**2 + ((mob.y + 0.7) - position.y)**2 + (mob.z - position.z)**2;
                if (distSq < radius * radius) {
                    return mob;
                }
            }
            return null;
        }

        update(dt, player, timeOfDay) {
            // 1. Initial Animal Guarantee on first frame player is in world
            if (!this.initialSpawnDone) {
                this.initialSpawnDone = true;
                this.spawnAnimalCluster(player.x, player.z, 10);
            }

            // 2. Active Density Maintainer: Guarantee at least 12 mobs around player at all times!
            this.spawnTimer += dt;
            if (this.spawnTimer > 1.5) {
                this.spawnTimer = 0;

                if (this.mobs.length < 14) {
                    const isNight = (timeOfDay > 0.45 && timeOfDay < 0.95);
                    const spawnTypes = isNight 
                        ? ['zombie', 'creeper', 'skeleton', 'astral_phantom'] 
                        : ['cow', 'pig', 'sheep', 'chicken', 'pig', 'cow'];
                    const chosenType = spawnTypes[Math.floor(Math.random() * spawnTypes.length)];

                    const angle = Math.random() * Math.PI * 2;
                    const dist = 10 + Math.random() * 18;
                    const sx = Math.floor(player.x + Math.cos(angle) * dist);
                    const sz = Math.floor(player.z + Math.sin(angle) * dist);

                    const groundY = this.world.getHighestSolidY(sx, sz);
                    if (groundY > 16) {
                        this.spawnMob(chosenType, sx + 0.5, groundY + 1.0, sz + 0.5);
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

                // Despawn if far away (> 50 blocks) to save memory
                const distToPlayer = Math.hypot(player.x - mob.x, player.z - mob.z);
                if (distToPlayer > 55.0) {
                    this.scene.remove(mob.group);
                    this.mobs.splice(i, 1);
                    continue;
                }

                mob.update(dt, player);
            }
        }
    }

    global.MobManager = MobManager;
})(window);
