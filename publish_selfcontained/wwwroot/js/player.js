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
            this.oxygen = 15.0; // 15 seconds authentic breath duration
            this.maxOxygen = 15.0;
            this.headInWater = false;
            this.feetInWater = false;

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

        setGameMode(mode) {
            this.gameMode = mode;
            if (mode !== 'creative') {
                this.flying = false;
                if (this.velocity.y > 0) this.velocity.y = 0;
            }
            this.fallDistance = 0;
        }

        update(dt, input, hotbarItem) {
            if (this.isDead) return;

            // ★ Absolute guarantee: Survival mode NEVER flies! Switching from Creative -> Survival immediately drops player to the ground.
            if (this.gameMode !== 'creative') {
                if (this.flying) {
                    this.flying = false;
                    if (this.velocity.y > 0) this.velocity.y = 0;
                }
            }

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

            // Movement keys (Both WASD and Arrow Keys supported!)
            const isForward = !!(input.keys['KeyW'] || input.keys['ArrowUp']);
            const isBackward = !!(input.keys['KeyS'] || input.keys['ArrowDown']);
            const isRight = !!(input.keys['KeyD'] || input.keys['ArrowRight']);
            const isLeft = !!(input.keys['KeyA'] || input.keys['ArrowLeft']);

            // Sprinting condition: Double-tap W/Up, Ctrl key, or mouse double-click
            const wantsSprint = !!(input.keys['ControlLeft'] || input.keys['ControlRight'] || input.sprint || this.isSprinting);
            const isSprinting = wantsSprint && isForward && !this.inWater;

            // Distinct walk vs sprint speeds (Authentic Minecraft feel!)
            let baseSpeed = isSprinting ? 7.2 : 4.3;
            let speed = baseSpeed;
            if (this.flying) speed *= 2.0;
            if (this.speedBoostTimer > 0) {
                speed *= 1.8;
                this.speedBoostTimer -= dt;
            }

            // Dynamic Camera FOV (Spyglass zoom or Widening FOV when sprinting, smooth lerp)
            const isSpyglassZoom = (hotbarItem && hotbarItem.item === 'spyglass' && (input.mouseButtons[2] || this.isZooming));
            const targetFOV = isSpyglassZoom ? 26 : (isSprinting ? 86 : 75);
            if (Math.abs(this.camera.fov - targetFOV) > 0.1) {
                this.camera.fov += (targetFOV - this.camera.fov) * Math.min(1.0, dt * 10.0);
                this.camera.updateProjectionMatrix();
            }

            // Hunger consumption when sprinting in survival
            if (isSprinting && this.gameMode === 'survival') {
                this.food = Math.max(0, this.food - dt * 0.15);
            }

            const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
            const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
            const moveDir = new THREE.Vector3();

            if (isForward) moveDir.add(forward);
            if (isBackward) moveDir.sub(forward);
            if (isRight) moveDir.add(right);
            if (isLeft) moveDir.sub(right);

            if (moveDir.lengthSq() > 0) {
                moveDir.normalize();
                this.velocity.x = moveDir.x * speed;
                this.velocity.z = moveDir.z * speed;

                // Step sounds (Fast cadence when sprinting, relaxed when walking)
                if (this.onGround && !this.flying) {
                    this.stepTimer = (this.stepTimer || 0) + dt;
                    const stepInterval = isSprinting ? 0.28 : 0.44;
                    if (this.stepTimer > stepInterval) {
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

            // Check if player is on a Ladder
            const B = window.BLOCKS;
            const blockAtFeet = this.world.getBlock(Math.floor(this.x), Math.floor(this.y + 0.1), Math.floor(this.z));
            const blockAtWaist = this.world.getBlock(Math.floor(this.x), Math.floor(this.y + 1.0), Math.floor(this.z));
            const onLadder = (B.LADDER && (blockAtFeet === B.LADDER.id || blockAtWaist === B.LADDER.id));

            // Vertical movement
            if (this.flying && this.gameMode === 'creative') {
                if (input.keys['Space']) this.velocity.y = speed;
                else if (input.keys['ShiftLeft'] || input.keys['ShiftRight']) this.velocity.y = -speed;
                else this.velocity.y = 0;
            } else if (onLadder) {
                this.fallDistance = 0;
                if (input.keys['Space'] || isForward) {
                    this.velocity.y = 4.2;
                } else if (input.keys['ShiftLeft'] || input.keys['ShiftRight']) {
                    this.velocity.y = 0;
                } else {
                    this.velocity.y = -3.0;
                }
            } else {
                // Gravity & jumping
                if (this.inWater) {
                    if (input.keys['Space']) this.velocity.y = 4.0;
                    else this.velocity.y = Math.max(this.velocity.y - 8.0 * dt, -3.0);
                } else {
                    const hasElytra = this.inventory?.hasItem('elytra') || this.isGliding;
                    if (input.keys['Space'] && !this.onGround && !this.inWater && hasElytra && this.velocity.y < 0) {
                        this.isGliding = true;
                    }
                    if (this.onGround || this.inWater) {
                        this.isGliding = false;
                    }

                    if (this.isGliding) {
                        // Smooth majestic gliding with pitch and yaw
                        this.fallDistance = 0;
                        const glideSpeed = 16.0;
                        const fwdX = -Math.sin(this.yaw);
                        const fwdZ = -Math.cos(this.yaw);
                        this.velocity.x = fwdX * glideSpeed;
                        this.velocity.z = fwdZ * glideSpeed;
                        this.velocity.y = Math.max(-2.2, Math.sin(this.pitch) * 12.0 - 1.2);
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
            }

            // Apply physics
            this.physics.moveEntity(this, this.velocity, dt);

            // ★ Void Safety Anchor ONLY in Overworld (Allows falling into void in The End!)
            if (this.y < 0.5 || isNaN(this.y)) {
                if (this.game?.currentDimension === 'the_end') {
                    if (this.y < -15) {
                        if (this.gameMode === 'survival') {
                            this.takeDamage(4, 'void');
                        } else {
                            this.y = 66;
                            this.velocity.set(0, 0, 0);
                        }
                    }
                } else {
                    const surfaceY = this.world.getHighestSolidY(Math.floor(this.x), Math.floor(this.z));
                    this.y = surfaceY + 1.8;
                    this.velocity.set(0, 0, 0);
                    this.fallDistance = 0;
                    this.onGround = true;
                }
            }

            // Survival mechanics: Hunger, Oxygen, Fire & Lava
            const inFire = (B.FIRE && (blockAtFeet === B.FIRE.id || blockAtWaist === B.FIRE.id));
            if (this.inLava) {
                this.fireTicks = 300; // 15 seconds from lava
            } else if (inFire) {
                this.fireTicks = Math.max(this.fireTicks || 0, 160); // 8 seconds from fire
            }

            // Water instantly extinguishes fire!
            if (this.inWater && this.fireTicks > 0) {
                this.fireTicks = 0;
                if (this.sound && this.sound.playFireExtinguish) this.sound.playFireExtinguish();
                if (this.game?.itemManager) {
                    this.game.itemManager.spawnBlockParticles(this.x, this.y + 0.6, this.z, 0xdddddd, 14);
                }
                if (this.game?.ui) {
                    this.game.ui.addChatMessage('💧 水に入って火が消えました！', '#55ffff');
                }
            }

            // Burning tick damage and screen overlay
            const fireOverlay = document.getElementById('fire-overlay');
            if (this.fireTicks > 0) {
                this.fireTicks -= dt * 20;
                if (this.gameMode === 'survival') {
                    this.burnTimer = (this.burnTimer || 0) + dt;
                    if (this.burnTimer >= 1.0) {
                        this.takeDamage(this.inLava ? 2 : 1, 'fire');
                        this.burnTimer = 0;
                        if (this.sound) this.sound.playPlayerHurt();
                    }
                }
                if (fireOverlay) fireOverlay.style.display = 'block';
            } else {
                this.burnTimer = 0;
                if (fireOverlay) fireOverlay.style.display = 'none';
            }

            if (this.gameMode === 'survival') {

                // Oxygen in water: ONLY consume when head is actually submerged under water!
                if (this.headInWater) {
                    this.oxygen = Math.max(0, this.oxygen - dt * 1.0); // 15 seconds full breathing time
                    if (this.oxygen <= 0) {
                        this.drownTimer = (this.drownTimer || 0) + dt;
                        if (this.drownTimer > 1.2) {
                            this.takeDamage(1, 'drown');
                            this.drownTimer = 0;
                        }
                    }
                } else {
                    // Head above water: Instantly refill breath bubbles
                    this.oxygen = Math.min(this.maxOxygen, this.oxygen + dt * 15.0);
                    this.drownTimer = 0;
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

            // View Bobbing (Authentic Minecraft Head Bob)
            let bobY = 0;
            if (this.onGround && (moveDir.lengthSq() > 0) && !this.flying) {
                this.cameraBobTimer = (this.cameraBobTimer || 0) + dt * 11;
                bobY = Math.sin(this.cameraBobTimer) * 0.045;
            } else {
                this.cameraBobTimer = 0;
            }

            // Update Camera transform
            this.camera.position.set(this.x, this.y + this.eyeHeight + bobY, this.z);
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

        // Raycast against voxel world using 3D DDA (Amanatides & Woo Fast Voxel Traversal)
        raycast(maxDistance = 7.5, customDir = null) {
            const origin = new THREE.Vector3(this.x, this.y + this.eyeHeight, this.z);
            const dir = new THREE.Vector3();
            if (customDir) {
                dir.copy(customDir).normalize();
            } else {
                this.camera.getWorldDirection(dir);
            }

            let x = Math.floor(origin.x);
            let y = Math.floor(origin.y);
            let z = Math.floor(origin.z);

            const stepX = dir.x > 0 ? 1 : (dir.x < 0 ? -1 : 0);
            const stepY = dir.y > 0 ? 1 : (dir.y < 0 ? -1 : 0);
            const stepZ = dir.z > 0 ? 1 : (dir.z < 0 ? -1 : 0);

            const deltaX = dir.x !== 0 ? Math.abs(1 / dir.x) : Infinity;
            const deltaY = dir.y !== 0 ? Math.abs(1 / dir.y) : Infinity;
            const deltaZ = dir.z !== 0 ? Math.abs(1 / dir.z) : Infinity;

            let maxX = dir.x > 0 ? ((x + 1 - origin.x) * deltaX) : ((origin.x - x) * deltaX);
            let maxY = dir.y > 0 ? ((y + 1 - origin.y) * deltaY) : ((origin.y - y) * deltaY);
            let maxZ = dir.z > 0 ? ((z + 1 - origin.z) * deltaZ) : ((origin.z - z) * deltaZ);

            let normal = [0, 1, 0];
            let distance = 0;
            const B = window.BLOCKS;

            while (distance < maxDistance) {
                const blockId = this.world.getBlock(x, y, z);
                if (blockId !== B.AIR.id && blockId !== B.WATER.id && blockId !== B.LAVA.id) {
                    const blockDef = window.BLOCK_BY_ID[blockId];
                    if (blockDef) {
                        return {
                            x: x, y: y, z: z,
                            blockId: blockId,
                            normal: normal,
                            distance: distance
                        };
                    }
                }

                if (maxX < maxY) {
                    if (maxX < maxZ) {
                        x += stepX;
                        distance = maxX;
                        maxX += deltaX;
                        normal = [-stepX, 0, 0];
                    } else {
                        z += stepZ;
                        distance = maxZ;
                        maxZ += deltaZ;
                        normal = [0, 0, -stepZ];
                    }
                } else {
                    if (maxY < maxZ) {
                        y += stepY;
                        distance = maxY;
                        maxY += deltaY;
                        normal = [0, -stepY, 0];
                    } else {
                        z += stepZ;
                        distance = maxZ;
                        maxZ += deltaZ;
                        normal = [0, 0, -stepZ];
                    }
                }
            }
            return null;
        }

        // Raycast specifically including Water and Lava (for Bucket scooping)
        raycastFluid(maxDistance = 7.5, customDir = null) {
            const origin = new THREE.Vector3(this.x, this.y + this.eyeHeight, this.z);
            const dir = new THREE.Vector3();
            if (customDir) {
                dir.copy(customDir).normalize();
            } else {
                this.camera.getWorldDirection(dir);
            }

            let x = Math.floor(origin.x);
            let y = Math.floor(origin.y);
            let z = Math.floor(origin.z);

            const stepX = dir.x > 0 ? 1 : (dir.x < 0 ? -1 : 0);
            const stepY = dir.y > 0 ? 1 : (dir.y < 0 ? -1 : 0);
            const stepZ = dir.z > 0 ? 1 : (dir.z < 0 ? -1 : 0);

            const deltaX = dir.x !== 0 ? Math.abs(1 / dir.x) : Infinity;
            const deltaY = dir.y !== 0 ? Math.abs(1 / dir.y) : Infinity;
            const deltaZ = dir.z !== 0 ? Math.abs(1 / dir.z) : Infinity;

            let maxX = dir.x > 0 ? ((x + 1 - origin.x) * deltaX) : ((origin.x - x) * deltaX);
            let maxY = dir.y > 0 ? ((y + 1 - origin.y) * deltaY) : ((origin.y - y) * deltaY);
            let maxZ = dir.z > 0 ? ((z + 1 - origin.z) * deltaZ) : ((origin.z - z) * deltaZ);

            let distance = 0;
            const B = window.BLOCKS;

            while (distance < maxDistance) {
                const blockId = this.world.getBlock(x, y, z);
                if (blockId === B.WATER.id || blockId === B.LAVA.id) {
                    return { x: x, y: y, z: z, blockId: blockId, distance: distance };
                }
                if (blockId !== B.AIR.id) {
                    break;
                }

                if (maxX < maxY) {
                    if (maxX < maxZ) {
                        x += stepX;
                        distance = maxX;
                        maxX += deltaX;
                    } else {
                        z += stepZ;
                        distance = maxZ;
                        maxZ += deltaZ;
                    }
                } else {
                    if (maxY < maxZ) {
                        y += stepY;
                        distance = maxY;
                        maxY += deltaY;
                    } else {
                        z += stepZ;
                        distance = maxZ;
                        maxZ += deltaZ;
                    }
                }
            }
            return null;
        }
    }

    global.Player = Player;
})(window);
