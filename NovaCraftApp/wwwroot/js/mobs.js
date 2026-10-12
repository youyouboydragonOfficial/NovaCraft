// Authentic Minecraft Mobs (Pig, Sheep, Cow, Chicken, Zombie, Skeleton, Creeper, Astral Phantom)
(function(global) {
    class Mob {
        constructor(type, x, y, z, scene, world, sound, itemManager) {
            this.type = type;
            this.x = x;
            this.y = y;
            this.z = z;
            this.scene = scene;
            this.world = world;
            this.sound = sound;
            this.itemManager = itemManager;

            this.yaw = Math.random() * Math.PI * 2;
            this.health = 10;
            this.maxHealth = 10;
            this.speed = 1.6;
            this.damage = 2;
            this.isHostile = false;
            this.isDead = false;

            this.attackCooldown = 0;
            this.fuseTimer = 0;
            this.isFusing = false;

            this.hurtTimer = 0;
            this.walkAnim = 0;
            this.idleTimer = Math.random() * 3.0;

            this.group = new THREE.Group();
            this.buildModel();
            this.group.position.set(x, y, z);
            this.scene.add(this.group);
        }

        buildModel() {
            // Clear existing children
            while (this.group.children.length > 0) {
                this.group.remove(this.group.children[0]);
            }

            const t = this.type;

            if (t === 'pig') {
                // PIG: Pink 4-legged animal with snout
                this.isHostile = false;
                this.health = 10;
                const pinkMat = new THREE.MeshLambertMaterial({ color: 0xf0a0a0 });
                const darkPink = new THREE.MeshLambertMaterial({ color: 0xd88888 });

                // Body (horizontal)
                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.8), pinkMat);
                this.body.position.y = 0.55;
                this.group.add(this.body);

                // Head
                this.head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), pinkMat);
                this.head.position.set(0, 0.75, 0.5);
                // Snout
                const snout = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.12), darkPink);
                snout.position.set(0, -0.05, 0.26);
                this.head.add(snout);
                this.group.add(this.head);

                // 4 Legs
                this.legs = [];
                const legGeo = new THREE.BoxGeometry(0.18, 0.4, 0.18);
                const pos = [[-0.2, 0.2, 0.25], [0.2, 0.2, 0.25], [-0.2, 0.2, -0.25], [0.2, 0.2, -0.25]];
                pos.forEach(p => {
                    const leg = new THREE.Mesh(legGeo, pinkMat);
                    leg.position.set(p[0], p[1], p[2]);
                    this.group.add(leg);
                    this.legs.push(leg);
                });
            } else if (t === 'sheep') {
                // SHEEP: Fluffy white wool, skin face & legs
                this.isHostile = false;
                this.health = 8;
                const woolMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
                const skinMat = new THREE.MeshLambertMaterial({ color: 0xd2b48c });

                // Wool Body
                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.85), woolMat);
                this.body.position.y = 0.65;
                this.group.add(this.body);

                // Head
                this.head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.45), skinMat);
                this.head.position.set(0, 0.85, 0.5);
                this.group.add(this.head);

                // 4 Legs
                this.legs = [];
                const legGeo = new THREE.BoxGeometry(0.15, 0.45, 0.15);
                const pos = [[-0.2, 0.22, 0.28], [0.2, 0.22, 0.28], [-0.2, 0.22, -0.28], [0.2, 0.22, -0.28]];
                pos.forEach(p => {
                    const leg = new THREE.Mesh(legGeo, skinMat);
                    leg.position.set(p[0], p[1], p[2]);
                    this.group.add(leg);
                    this.legs.push(leg);
                });
            } else if (t === 'cow') {
                // COW: Brown spotted body, horns
                this.isHostile = false;
                this.health = 10;
                const cowMat = new THREE.MeshLambertMaterial({ color: 0x4a3222 });
                const hornMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });

                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 0.9), cowMat);
                this.body.position.y = 0.68;
                this.group.add(this.body);

                this.head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.45), cowMat);
                this.head.position.set(0, 0.9, 0.55);
                // Horns
                const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.08), hornMat);
                h1.position.set(-0.2, 0.22, 0);
                const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.08), hornMat);
                h2.position.set(0.2, 0.22, 0);
                this.head.add(h1);
                this.head.add(h2);
                this.group.add(this.head);

                this.legs = [];
                const legGeo = new THREE.BoxGeometry(0.18, 0.5, 0.18);
                const pos = [[-0.22, 0.25, 0.3], [0.22, 0.25, 0.3], [-0.22, 0.25, -0.3], [0.22, 0.25, -0.3]];
                pos.forEach(p => {
                    const leg = new THREE.Mesh(legGeo, cowMat);
                    leg.position.set(p[0], p[1], p[2]);
                    this.group.add(leg);
                    this.legs.push(leg);
                });
            } else if (t === 'chicken') {
                // CHICKEN: Small white bird with beak and red wattle
                this.isHostile = false;
                this.health = 4;
                this.speed = 1.2;
                const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
                const yellowMat = new THREE.MeshLambertMaterial({ color: 0xeeaa22 });
                const redMat = new THREE.MeshLambertMaterial({ color: 0xee2222 });

                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.4), whiteMat);
                this.body.position.y = 0.35;
                this.group.add(this.body);

                this.head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.2), whiteMat);
                this.head.position.set(0, 0.55, 0.2);
                // Beak & Wattle
                const beak = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.12), yellowMat);
                beak.position.set(0, 0, 0.12);
                const wattle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.06), redMat);
                wattle.position.set(0, -0.1, 0.08);
                this.head.add(beak);
                this.head.add(wattle);
                this.group.add(this.head);

                this.legs = [];
                const legGeo = new THREE.BoxGeometry(0.06, 0.25, 0.06);
                const pos = [[-0.08, 0.12, 0], [0.08, 0.12, 0]];
                pos.forEach(p => {
                    const leg = new THREE.Mesh(legGeo, yellowMat);
                    leg.position.set(p[0], p[1], p[2]);
                    this.group.add(leg);
                    this.legs.push(leg);
                });
            } else {
                // MONSTERS: Bipedal (Zombie, Skeleton, Creeper, Astral Phantom)
                this.isHostile = true;
                const headMat = new THREE.MeshLambertMaterial({ color: 0x44aa44 });
                const bodyMat = new THREE.MeshLambertMaterial({ color: 0x3388aa });
                const limbMat = new THREE.MeshLambertMaterial({ color: 0x333366 });

                if (t === 'zombie') {
                    this.health = 20;
                    this.damage = 3;
                } else if (t === 'skeleton') {
                    headMat.color.setHex(0xd0d0d0);
                    bodyMat.color.setHex(0xb0b0b0);
                    limbMat.color.setHex(0xb0b0b0);
                    this.health = 16;
                } else if (t === 'creeper') {
                    headMat.color.setHex(0x33bb44);
                    bodyMat.color.setHex(0x22aa33);
                    limbMat.color.setHex(0x228833);
                    this.health = 16;
                } else if (t === 'astral_phantom') {
                    headMat.color.setHex(0xee44ff);
                    bodyMat.color.setHex(0x8822cc);
                    limbMat.color.setHex(0x55eeff);
                    this.health = 35;
                    this.damage = 6;
                    this.speed = 3.5;
                }

                // Head
                this.head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), headMat);
                this.head.position.y = 1.6;
                this.group.add(this.head);

                // Body
                this.body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.3), bodyMat);
                this.body.position.y = 1.0;
                this.group.add(this.body);

                // Limbs
                this.legs = [];
                const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.2), limbMat);
                leftLeg.position.set(-0.15, 0.35, 0);
                const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.2), limbMat);
                rightLeg.position.set(0.15, 0.35, 0);
                this.group.add(leftLeg);
                this.group.add(rightLeg);
                this.legs.push(leftLeg, rightLeg);

                const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), limbMat);
                leftArm.position.set(-0.38, 1.0, 0);
                const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), limbMat);
                rightArm.position.set(0.38, 1.0, 0);
                this.group.add(leftArm);
                this.group.add(rightArm);
                this.arms = [leftArm, rightArm];

                if (t === 'zombie') {
                    leftArm.rotation.x = -Math.PI / 2.2;
                    rightArm.rotation.x = -Math.PI / 2.2;
                }
            }
        }

        takeDamage(amount) {
            this.health -= amount;
            this.hurtTimer = 0.25;
            this.sound.playHit();
            this.setFlashColor(0xff2222);

            // Knockback away from player
            const dx = Math.sin(this.yaw) * 1.5;
            const dz = Math.cos(this.yaw) * 1.5;
            this.x -= dx * 0.4;
            this.z -= dz * 0.4;

            if (this.health <= 0) {
                this.die();
            }
        }

        setFlashColor(hex) {
            this.group.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.color.setHex(hex);
                }
            });
        }

        die() {
            this.isDead = true;
            this.sound.playBreak('gravel');

            // Drops
            const im = this.itemManager;
            if (this.type === 'pig') {
                im.spawnDroppedItem(this.x, this.y, this.z, 'raw_beef', 2);
            } else if (this.type === 'cow') {
                im.spawnDroppedItem(this.x, this.y, this.z, 'raw_beef', 3);
            } else if (this.type === 'sheep') {
                im.spawnDroppedItem(this.x, this.y, this.z, 'oak_planks', 2);
            } else if (this.type === 'chicken') {
                im.spawnDroppedItem(this.x, this.y, this.z, 'apple', 1);
            } else if (this.type === 'zombie') {
                im.spawnDroppedItem(this.x, this.y, this.z, 'raw_iron', 1);
            } else if (this.type === 'creeper') {
                im.spawnDroppedItem(this.x, this.y, this.z, 'coal', 2);
            } else if (this.type === 'astral_phantom') {
                im.spawnDroppedItem(this.x, this.y, this.z, 'astral_crystal', 2);
            }

            this.scene.remove(this.group);
        }

        update(dt, player) {
            if (this.isDead) return;

            if (this.hurtTimer > 0) {
                this.hurtTimer -= dt;
                if (this.hurtTimer <= 0) {
                    this.buildModel(); // restore normal colors
                }
            }

            const dx = player.x - this.x;
            const dz = player.z - this.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (this.isHostile && dist < 18.0 && player.gameMode === 'survival') {
                // Hostile pursuit
                this.yaw = Math.atan2(dx, dz);
                this.group.rotation.y = this.yaw;

                if (dist > 1.2) {
                    this.x += Math.sin(this.yaw) * this.speed * dt;
                    this.z += Math.cos(this.yaw) * this.speed * dt;

                    this.walkAnim += dt * 8;
                    if (this.legs && this.legs.length >= 2) {
                        this.legs[0].rotation.x = Math.sin(this.walkAnim) * 0.6;
                        this.legs[1].rotation.x = -Math.sin(this.walkAnim) * 0.6;
                    }
                }

                // Creeper fuse
                if (this.type === 'creeper') {
                    if (dist < 3.2) {
                        if (!this.isFusing) {
                            this.sound.playFuse();
                            this.isFusing = true;
                        }
                        this.fuseTimer += dt;
                        const scale = 1.0 + Math.sin(this.fuseTimer * 14) * 0.15;
                        this.group.scale.set(scale, scale, scale);

                        if (this.fuseTimer > 1.6) {
                            this.itemManager.explode(this.x, this.y + 0.5, this.z, 3.5, false);
                            this.die();
                            return;
                        }
                    } else {
                        this.isFusing = false;
                        this.fuseTimer = Math.max(0, this.fuseTimer - dt);
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
                // Peaceful Animals & Idle Mob Wander
                this.idleTimer -= dt;
                if (this.idleTimer <= 0) {
                    this.idleTimer = 2.0 + Math.random() * 4.0;
                    this.isWalking = Math.random() > 0.4;
                    this.yaw += (Math.random() - 0.5) * 1.8;
                    this.group.rotation.y = this.yaw;
                }

                if (this.isWalking) {
                    this.x += Math.sin(this.yaw) * this.speed * 0.5 * dt;
                    this.z += Math.cos(this.yaw) * this.speed * 0.5 * dt;

                    this.walkAnim += dt * 6;
                    if (this.legs) {
                        for (let i = 0; i < this.legs.length; i++) {
                            const sign = (i % 2 === 0) ? 1 : -1;
                            this.legs[i].rotation.x = Math.sin(this.walkAnim) * 0.5 * sign;
                        }
                    }
                } else if (this.legs) {
                    for (let i = 0; i < this.legs.length; i++) {
                        this.legs[i].rotation.x = 0;
                    }
                }
            }

            // Ground alignment
            const groundY = Math.floor(this.y);
            const bBelow = this.world.getBlock(Math.floor(this.x), groundY, Math.floor(this.z));
            if (window.BLOCK_BY_ID[bBelow]?.solid) {
                this.y = groundY + 1.0;
            } else {
                this.y = Math.max(2, this.y - 12.0 * dt);
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

        // Spawn guaranteed peaceful animals (Pigs, Sheep, Cows, Chickens) around spawn point!
        spawnInitialAnimals(px, pz) {
            if (this.initialSpawnDone) return;
            this.initialSpawnDone = true;

            const animals = ['cow', 'cow', 'pig', 'pig', 'sheep', 'sheep', 'chicken', 'chicken'];
            animals.forEach((type, idx) => {
                const angle = (idx / animals.length) * Math.PI * 2;
                const dist = 6 + Math.random() * 8;
                const sx = Math.floor(px + Math.cos(angle) * dist);
                const sz = Math.floor(pz + Math.sin(angle) * dist);

                let sy = 50;
                while (sy > 2 && !window.BLOCK_BY_ID[this.world.getBlock(sx, sy, sz)]?.solid) {
                    sy--;
                }
                if (sy > 5 && sy < 60) {
                    this.spawnMob(type, sx + 0.5, sy + 1.0, sz + 0.5);
                }
            });
        }

        checkMobHit(position, radius = 1.3) {
            for (let i = 0; i < this.mobs.length; i++) {
                const mob = this.mobs[i];
                if (mob.isDead) continue;
                const distSq = (mob.x - position.x)**2 + ((mob.y + 0.8) - position.y)**2 + (mob.z - position.z)**2;
                if (distSq < radius * radius) {
                    return mob;
                }
            }
            return null;
        }

        update(dt, player, timeOfDay) {
            // Initial animals spawn guarantee
            if (!this.initialSpawnDone) {
                this.spawnInitialAnimals(player.x, player.z);
            }

            // Periodic Spawning (Night monsters, Day extra animals)
            this.spawnTimer += dt;
            if (this.spawnTimer > 10.0 && this.mobs.length < 20) {
                this.spawnTimer = 0;
                const isNight = (timeOfDay > 0.45 && timeOfDay < 0.95);
                const spawnTypes = isNight 
                    ? ['zombie', 'creeper', 'skeleton', 'astral_phantom'] 
                    : ['cow', 'pig', 'sheep', 'chicken'];
                const chosenType = spawnTypes[Math.floor(Math.random() * spawnTypes.length)];

                const angle = Math.random() * Math.PI * 2;
                const dist = 16 + Math.random() * 12;
                const sx = Math.floor(player.x + Math.cos(angle) * dist);
                const sz = Math.floor(player.z + Math.sin(angle) * dist);

                let sy = 50;
                while (sy > 2 && !window.BLOCK_BY_ID[this.world.getBlock(sx, sy, sz)]?.solid) {
                    sy--;
                }

                if (sy > 5 && sy < 60) {
                    this.spawnMob(chosenType, sx + 0.5, sy + 1.0, sz + 0.5);
                }
            }

            for (let i = this.mobs.length - 1; i >= 0; i--) {
                const mob = this.mobs[i];
                if (mob.isDead) {
                    this.mobs.splice(i, 1);
                    continue;
                }
                mob.update(dt, player);
            }
        }
    }

    global.MobManager = MobManager;
})(window);
