// Mob Entities, AI Behaviors & Custom Astral Phantom for NovaCraft
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

            this.yaw = 0;
            this.health = 20;
            this.maxHealth = 20;
            this.speed = 2.5;
            this.damage = 3;
            this.isHostile = true;
            this.isDead = false;

            this.attackCooldown = 0;
            this.fuseTimer = 0; // for creeper
            this.isFusing = false;

            this.hurtTimer = 0;
            this.walkAnim = 0;

            this.group = new THREE.Group();
            this.buildModel();
            this.group.position.set(x, y, z);
            this.scene.add(this.group);
        }

        buildModel() {
            // Box parts
            const headMat = new THREE.MeshLambertMaterial({ color: 0x55aa55 });
            const bodyMat = new THREE.MeshLambertMaterial({ color: 0x334488 });
            const limbMat = new THREE.MeshLambertMaterial({ color: 0x333366 });

            if (this.type === 'zombie') {
                headMat.color.setHex(0x449944);
                bodyMat.color.setHex(0x3388aa);
            } else if (this.type === 'skeleton') {
                headMat.color.setHex(0xd0d0d0);
                bodyMat.color.setHex(0xb0b0b0);
                limbMat.color.setHex(0xb0b0b0);
                this.health = 16;
            } else if (this.type === 'creeper') {
                headMat.color.setHex(0x33bb44);
                bodyMat.color.setHex(0x22aa33);
                limbMat.color.setHex(0x228833);
                this.health = 16;
            } else if (this.type === 'cow') {
                headMat.color.setHex(0x442211);
                bodyMat.color.setHex(0x442211);
                limbMat.color.setHex(0x221105);
                this.isHostile = false;
                this.health = 10;
            } else if (this.type === 'astral_phantom') {
                // ★ Custom Astral Phantom
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
            this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.2), limbMat);
            this.leftLeg.position.set(-0.15, 0.35, 0);
            this.group.add(this.leftLeg);

            this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.2), limbMat);
            this.rightLeg.position.set(0.15, 0.35, 0);
            this.group.add(this.rightLeg);

            this.leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), limbMat);
            this.leftArm.position.set(-0.38, 1.0, 0);
            this.group.add(this.leftArm);

            this.rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), limbMat);
            this.rightArm.position.set(0.38, 1.0, 0);
            this.group.add(this.rightArm);

            // Zombie arms raised forward
            if (this.type === 'zombie') {
                this.leftArm.rotation.x = -Math.PI / 2.2;
                this.rightArm.rotation.x = -Math.PI / 2.2;
            }
        }

        takeDamage(amount) {
            this.health -= amount;
            this.hurtTimer = 0.25;
            this.sound.playHit();

            // Flash red
            this.setFlashColor(0xff2222);

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
            if (this.type === 'zombie') {
                this.itemManager.spawnDroppedItem(this.x, this.y, this.z, 'raw_iron', 1);
            } else if (this.type === 'creeper') {
                this.itemManager.spawnDroppedItem(this.x, this.y, this.z, 'coal', 2);
            } else if (this.type === 'cow') {
                this.itemManager.spawnDroppedItem(this.x, this.y, this.z, 'raw_beef', 2);
            } else if (this.type === 'astral_phantom') {
                // ★ Rare drop!
                this.itemManager.spawnDroppedItem(this.x, this.y, this.z, 'astral_crystal', 2);
            }

            this.scene.remove(this.group);
        }

        update(dt, player) {
            if (this.isDead) return;

            // Damage flash recovery
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
                // Look at player
                this.yaw = Math.atan2(dx, dz);
                this.group.rotation.y = this.yaw;

                // Move towards player
                if (dist > 1.2) {
                    const vx = Math.sin(this.yaw) * this.speed * dt;
                    const vz = Math.cos(this.yaw) * this.speed * dt;
                    this.x += vx;
                    this.z += vz;

                    // Leg animation
                    this.walkAnim += dt * 8;
                    this.leftLeg.rotation.x = Math.sin(this.walkAnim) * 0.6;
                    this.rightLeg.rotation.x = -Math.sin(this.walkAnim) * 0.6;
                }

                // Creeper fuse & explode
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
                // Idle wander
                this.leftLeg.rotation.x = 0;
                this.rightLeg.rotation.x = 0;
            }

            // Simple terrain height following
            const groundY = Math.floor(this.y);
            const blockBelow = this.world.getBlock(Math.floor(this.x), groundY, Math.floor(this.z));
            if (window.BLOCK_BY_ID[blockBelow]?.solid) {
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
        }

        spawnMob(type, x, y, z) {
            const mob = new Mob(type, x, y, z, this.scene, this.world, this.sound, this.itemManager);
            this.mobs.push(mob);
            return mob;
        }

        checkMobHit(position, radius = 1.2) {
            for (let i = 0; i < this.mobs.length; i++) {
                const mob = this.mobs[i];
                if (mob.isDead) continue;
                const distSq = (mob.x - position.x)**2 + ((mob.y + 1) - position.y)**2 + (mob.z - position.z)**2;
                if (distSq < radius * radius) {
                    return mob;
                }
            }
            return null;
        }

        update(dt, player, timeOfDay) {
            // Spawning logic (Spawn monsters at night, cows in day)
            this.spawnTimer += dt;
            if (this.spawnTimer > 8.0 && this.mobs.length < 15) {
                this.spawnTimer = 0;
                const isNight = (timeOfDay > 0.45 && timeOfDay < 0.95);
                const spawnTypes = isNight ? ['zombie', 'creeper', 'skeleton', 'astral_phantom'] : ['cow'];
                const chosenType = spawnTypes[Math.floor(Math.random() * spawnTypes.length)];

                // Spawn 15-25 blocks away from player
                const angle = Math.random() * Math.PI * 2;
                const dist = 14 + Math.random() * 10;
                const sx = Math.floor(player.x + Math.cos(angle) * dist);
                const sz = Math.floor(player.z + Math.sin(angle) * dist);

                // Find surface height
                let sy = 45;
                while (sy > 2 && !window.BLOCK_BY_ID[this.world.getBlock(sx, sy, sz)]?.solid) {
                    sy--;
                }

                if (sy > 5 && sy < 60) {
                    this.spawnMob(chosenType, sx + 0.5, sy + 1.0, sz + 0.5);
                }
            }

            // Update all mobs
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
