// Player Entity, First-Person Controller, Survival Stats & Abilities for NovaCraft
(function(global) {
    class Player {
        constructor(camera, world, physics, sound) {
            this.camera = camera;
            this.world = world;
            this.physics = physics;
            this.sound = sound;

            // Spatial properties
            this.x = 8.5;
            this.y = 40.0;
            this.z = 8.5;
            this.yaw = 0;
            this.pitch = 0;
            this.width = 0.6;
            this.height = 1.8;
            this.depth = 0.6;
            this.eyeHeight = 1.62;

            this.velocity = new THREE.Vector3();
            this.onGround = false;
            this.inWater = false;
            this.inLava = false;
            this.flying = false;
            this.spaceLastPress = 0;

            // Survival stats
            this.gameMode = 'survival'; // 'survival' or 'creative'
            this.health = 20;
            this.maxHealth = 20;
            this.food = 20;
            this.maxFood = 20;
            this.saturation = 5.0;
            this.oxygen = 20;
            this.maxOxygen = 20;

            this.fallDistance = 0;
            this.lastY = this.y;
            this.isDead = false;

            // Buffs and timers
            this.speedBoostTimer = 0;
            this.doubleJumpAvailable = false;
            this.equippedBoots = null;
            this.equippedChest = null;
            this.healingCooldown = 0;

            // Mining state
            this.miningProgress = 0; // 0 to 1
            this.targetBlock = null; // {x, y, z, face, normal}
            this.breakSoundTimer = 0;

            // Hand animation
            this.handSwing = 0;
            this.isSwinging = false;
        }

        takeDamage(amount, reason = 'generic') {
            if (this.gameMode === 'creative' || this.isDead) return;
            this.health -= amount;
            this.sound.playPlayerHurt();
            if (this.health <= 0) {
                this.health = 0;
                this.isDead = true;
            }
        }

        heal(amount) {
            this.health = Math.min(this.maxHealth, this.health + amount);
        }

        update(dt, input, hotbarItem) {
            if (this.isDead) return;

            // Check equipped items for custom perks
            const hasGravityBoots = (hotbarItem && hotbarItem.item === 'gravity_boots');
            const hasJetpack = (hotbarItem && hotbarItem.item === 'jetpack');

            // Handle double tap space for creative flight toggle
            if (input.spaceJustPressed) {
                const now = performance.now();
                if (this.gameMode === 'creative') {
                    if (now - this.spaceLastPress < 300) {
                        this.flying = !this.flying;
                        this.velocity.y = 0;
                    }
                } else if (hasGravityBoots && !this.onGround && this.doubleJumpAvailable) {
                    // Double Jump!
                    this.velocity.y = 11.0;
                    this.doubleJumpAvailable = false;
                    this.sound.playPop();
                }
                this.spaceLastPress = now;
            }

            if (this.onGround) {
                this.doubleJumpAvailable = true;
                // Calculate fall damage
                if (this.fallDistance > 3.5 && !hasGravityBoots && this.gameMode === 'survival' && !this.inWater) {
                    const damage = Math.floor(this.fallDistance - 3.0);
                    if (damage > 0) this.takeDamage(damage, 'fall');
                }
                this.fallDistance = 0;
            } else {
                if (this.velocity.y < 0 && !this.flying) {
                    this.fallDistance += Math.abs(this.y - this.lastY);
                }
            }
            this.lastY = this.y;

            // Jetpack thrust (Space key in survival with Jetpack)
            if (hasJetpack && input.keys['Space']) {
                this.velocity.y = Math.min(this.velocity.y + 35.0 * dt, 12.0);
                this.fallDistance = 0;
                if (Math.random() < 0.2) this.sound.playFuse();
            }

            // Movement velocities
            let speed = (input.keys['ControlLeft'] || input.keys['ControlRight'] || input.sprint) ? 7.5 : 4.5;
            if (this.flying) speed *= 2.2;
            if (this.speedBoostTimer > 0) {
                speed *= 1.8;
                this.speedBoostTimer -= dt;
            }

            const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
            const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
            const moveDir = new THREE.Vector3();

            if (input.keys['KeyW']) moveDir.add(forward);
            if (input.keys['KeyS']) moveDir.sub(forward);
            if (input.keys['KeyD']) moveDir.add(right);
            if (input.keys['KeyA']) moveDir.sub(right);

            if (moveDir.lengthSq() > 0) {
                moveDir.normalize();
                this.velocity.x = moveDir.x * speed;
                this.velocity.z = moveDir.z * speed;

                // Step sounds
                if (this.onGround && !this.flying) {
                    this.stepTimer = (this.stepTimer || 0) + dt;
                    if (this.stepTimer > (speed > 5 ? 0.3 : 0.45)) {
                        this.stepTimer = 0;
                        const underBlock = this.world.getBlock(Math.floor(this.x), Math.floor(this.y - 0.5), Math.floor(this.z));
                        const def = window.BLOCK_BY_ID[underBlock];
                        this.sound.playStep(def ? def.sound : 'grass');
                    }
                }
            } else {
                this.velocity.x = 0;
                this.velocity.z = 0;
            }

            // Vertical movement
            if (this.flying) {
                if (input.keys['Space']) this.velocity.y = speed;
                else if (input.keys['ShiftLeft']) this.velocity.y = -speed;
                else this.velocity.y = 0;
            } else {
                // Gravity & jumping
                if (this.inWater) {
                    if (input.keys['Space']) this.velocity.y = 4.0;
                    else this.velocity.y = Math.max(this.velocity.y - 8.0 * dt, -3.0);
                } else {
                    if (input.keys['Space'] && this.onGround) {
                        const jumpPower = hasGravityBoots ? 13.5 : 9.0;
                        this.velocity.y = jumpPower;
                        this.onGround = false;
                        this.sound.playStep('grass');
                    }
                    this.velocity.y = Math.max(this.velocity.y - this.physics.gravity * dt, -this.physics.terminalVelocity);
                }
            }

            // Apply physics
            this.physics.moveEntity(this, this.velocity, dt);

            // Survival mechanics: Hunger & Oxygen
            if (this.gameMode === 'survival') {
                // Oxygen in water
                if (this.inWater) {
                    this.oxygen = Math.max(0, this.oxygen - dt * 2.5);
                    if (this.oxygen <= 0) {
                        this.drownTimer = (this.drownTimer || 0) + dt;
                        if (this.drownTimer > 1.2) {
                            this.takeDamage(2, 'drown');
                            this.drownTimer = 0;
                        }
                    }
                } else {
                    this.oxygen = Math.min(this.maxOxygen, this.oxygen + dt * 10);
                }

                // Healing Torch effect (heal nearby)
                this.healingCooldown += dt;
                if (this.healingCooldown > 2.0) {
                    this.healingCooldown = 0;
                    this.checkHealingAura();
                }

                // Food / Hunger
                if (this.food > 17 && this.health < this.maxHealth) {
                    this.healthTimer = (this.healthTimer || 0) + dt;
                    if (this.healthTimer > 3.0) {
                        this.heal(1);
                        this.food -= 0.5;
                        this.healthTimer = 0;
                    }
                }
            }

            // Update Camera transform
            this.camera.position.set(this.x, this.y + this.eyeHeight, this.z);
            this.camera.rotation.order = 'YXZ';
            this.camera.rotation.y = this.yaw;
            this.camera.rotation.x = this.pitch;

            // Hand animation
            if (this.isSwinging) {
                this.handSwing += dt * 12;
                if (this.handSwing > Math.PI) {
                    this.handSwing = 0;
                    this.isSwinging = false;
                }
            }
        }

        checkHealingAura() {
            const px = Math.floor(this.x);
            const py = Math.floor(this.y);
            const pz = Math.floor(this.z);
            const B = window.BLOCKS;

            for (let dx = -4; dx <= 4; dx++) {
                for (let dy = -2; dy <= 3; dy++) {
                    for (let dz = -4; dz <= 4; dz++) {
                        if (this.world.getBlock(px + dx, py + dy, pz + dz) === B.HEALING_TORCH.id) {
                            if (this.health < this.maxHealth) {
                                this.heal(2);
                                this.sound.playHeal();
                                return;
                            }
                        }
                    }
                }
            }
        }

        swingHand() {
            this.isSwinging = true;
            this.handSwing = 0;
        }

        // Raycast against voxel world
        raycast(maxDistance = 5.5) {
            const origin = new THREE.Vector3(this.x, this.y + this.eyeHeight, this.z);
            const dir = new THREE.Vector3();
            this.camera.getWorldDirection(dir);

            const step = 0.05;
            let current = origin.clone();
            let prevBlock = null;

            for (let d = 0; d < maxDistance; d += step) {
                current.addScaledVector(dir, step);
                const bx = Math.floor(current.x);
                const by = Math.floor(current.y);
                const bz = Math.floor(current.z);

                const blockId = this.world.getBlock(bx, by, bz);
                const blockDef = window.BLOCK_BY_ID[blockId];

                if (blockDef && blockDef.solid) {
                    // Determine normal from prev block
                    let normal = [0, 1, 0];
                    if (prevBlock) {
                        normal = [prevBlock.x - bx, prevBlock.y - by, prevBlock.z - bz];
                    }
                    return {
                        x: bx, y: by, z: bz,
                        blockId: blockId,
                        normal: normal,
                        distance: d
                    };
                }
                prevBlock = { x: bx, y: by, z: bz };
            }
            return null;
        }
    }

    global.Player = Player;
})(window);
