// Authentic Minecraft AABB Physics Engine, Continuous Collision & Zero-Penetration
(function(global) {
    class AABB {
        constructor(minX, minY, minZ, maxX, maxY, maxZ) {
            this.minX = minX;
            this.minY = minY;
            this.minZ = minZ;
            this.maxX = maxX;
            this.maxY = maxY;
            this.maxZ = maxZ;
        }

        clone() {
            return new AABB(this.minX, this.minY, this.minZ, this.maxX, this.maxY, this.maxZ);
        }

        offset(dx, dy, dz) {
            return new AABB(
                this.minX + dx, this.minY + dy, this.minZ + dz,
                this.maxX + dx, this.maxY + dy, this.maxZ + dz
            );
        }

        // Expand in movement directions
        expand(dx, dy, dz) {
            let minX = this.minX;
            let minY = this.minY;
            let minZ = this.minZ;
            let maxX = this.maxX;
            let maxY = this.maxY;
            let maxZ = this.maxZ;

            if (dx < 0) minX += dx;
            if (dx > 0) maxX += dx;
            if (dy < 0) minY += dy;
            if (dy > 0) maxY += dy;
            if (dz < 0) minZ += dz;
            if (dz > 0) maxZ += dz;

            return new AABB(minX, minY, minZ, maxX, maxY, maxZ);
        }

        // Authentic Minecraft Axis-Aligned Collision Clipping
        clipXCollide(c, dx) {
            if (this.maxY <= c.minY || this.minY >= c.maxY) return dx;
            if (this.maxZ <= c.minZ || this.minZ >= c.maxZ) return dx;
            if (dx > 0.0 && this.maxX <= c.minX) {
                const max = c.minX - this.maxX;
                if (max < dx) dx = max;
            } else if (dx < 0.0 && this.minX >= c.maxX) {
                const max = c.maxX - this.minX;
                if (max > dx) dx = max;
            }
            return dx;
        }

        clipYCollide(c, dy) {
            if (this.maxX <= c.minX || this.minX >= c.maxX) return dy;
            if (this.maxZ <= c.minZ || this.minZ >= c.maxZ) return dy;
            if (dy > 0.0 && this.maxY <= c.minY) {
                const max = c.minY - this.maxY;
                if (max < dy) dy = max;
            } else if (dy < 0.0 && this.minY >= c.maxY) {
                const max = c.maxY - this.minY;
                if (max > dy) dy = max;
            }
            return dy;
        }

        clipZCollide(c, dz) {
            if (this.maxX <= c.minX || this.minX >= c.maxX) return dz;
            if (this.maxY <= c.minY || this.minY >= c.maxY) return dz;
            if (dz > 0.0 && this.maxZ <= c.minZ) {
                const max = c.minZ - this.maxZ;
                if (max < dz) dz = max;
            } else if (dz < 0.0 && this.minZ >= c.maxZ) {
                const max = c.maxZ - this.minZ;
                if (max > dz) dz = max;
            }
            return dz;
        }
    }

    class Physics {
        constructor(world) {
            this.world = world;
            this.gravity = 28.0;
            this.terminalVelocity = 45.0;
        }

        // Gather all colliding solid block boxes in the broadphase sweep box
        getSurroundingBoxes(box) {
            const boxes = [];
            const minX = Math.floor(box.minX - 0.5);
            const maxX = Math.ceil(box.maxX + 0.5);
            const minY = Math.floor(box.minY - 0.5);
            const maxY = Math.ceil(box.maxY + 0.5);
            const minZ = Math.floor(box.minZ - 0.5);
            const maxZ = Math.ceil(box.maxZ + 0.5);

            const B = window.BLOCKS;

            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    for (let x = minX; x <= maxX; x++) {
                        const bId = this.world.getBlock(x, y, z);
                        const def = window.BLOCK_BY_ID[bId];
                        if (def && def.solid) {
                            boxes.push({
                                aabb: new AABB(x, y, z, x + 1, y + 1, z + 1),
                                blockId: bId,
                                x, y, z
                            });
                        }
                    }
                }
            }
            return boxes;
        }

        moveEntity(entity, velocity, dt) {
            const B = window.BLOCKS;

            let origDx = velocity.x * dt;
            let origDy = velocity.y * dt;
            let origDz = velocity.z * dt;

            // Liquid checks (Distinguish head submerged vs feet in water)
            const eyeY = entity.eyeHeight ? (entity.y + entity.eyeHeight) : (entity.y + 1.5);
            const headB = this.world.getBlock(Math.floor(entity.x), Math.floor(eyeY), Math.floor(entity.z));
            const feetB = this.world.getBlock(Math.floor(entity.x), Math.floor(entity.y + 0.1), Math.floor(entity.z));
            entity.headInWater = (headB === B.WATER.id);
            entity.feetInWater = (feetB === B.WATER.id);
            entity.inWater = (entity.headInWater || entity.feetInWater);
            entity.inLava = (headB === B.LAVA.id || feetB === B.LAVA.id);

            if (entity.inWater && !entity.flying) {
                origDy = Math.max(origDy, -4.0 * dt);
                origDx *= 0.65;
                origDz *= 0.65;
            }

            // Substepping for fast motion (prevent tunneling)
            const maxStepDist = 0.35;
            const moveLen = Math.sqrt(origDx * origDx + origDy * origDy + origDz * origDz);
            const steps = Math.max(1, Math.ceil(moveLen / maxStepDist));

            const subDx = origDx / steps;
            const subDy = origDy / steps;
            const subDz = origDz / steps;

            for (let s = 0; s < steps; s++) {
                this.moveSubstep(entity, velocity, subDx, subDy, subDz);
            }
        }

        moveSubstep(entity, velocity, dx, dy, dz) {
            const halfW = entity.width / 2;
            const halfD = entity.depth / 2;
            const h = entity.height;

            let box = new AABB(
                entity.x - halfW, entity.y, entity.z - halfD,
                entity.x + halfW, entity.y + h, entity.z + halfD
            );

            // Broadphase sweep box
            const sweepBox = box.expand(dx, dy, dz);
            const colliders = this.getSurroundingBoxes(sweepBox);

            const initialDx = dx;
            const initialDy = dy;
            const initialDz = dz;

            // 1. Clip Y (Vertical)
            for (let i = 0; i < colliders.length; i++) {
                dy = box.clipYCollide(colliders[i].aabb, dy);
            }
            box = box.offset(0, dy, 0);

            // 2. Clip X (Horizontal)
            for (let i = 0; i < colliders.length; i++) {
                dx = box.clipXCollide(colliders[i].aabb, dx);
            }
            box = box.offset(dx, 0, 0);

            // 3. Clip Z (Horizontal)
            for (let i = 0; i < colliders.length; i++) {
                dz = box.clipZCollide(colliders[i].aabb, dz);
            }
            box = box.offset(0, 0, dz);

            // Ground and ceiling collision response
            entity.onGround = (initialDy < 0.0 && dy !== initialDy);
            if (dy !== initialDy) {
                velocity.y = 0.0;
            }
            if (dx !== initialDx) {
                velocity.x = 0.0;
            }
            if (dz !== initialDz) {
                velocity.z = 0.0;
            }

            // Step Climbing (Auto-step 0.6 block height when colliding with obstacle)
            if (entity.onGround && (dx !== initialDx || dz !== initialDz) && !entity.flying) {
                const stepHeight = 0.6;
                let stepBox = new AABB(
                    entity.x - halfW, entity.y + stepHeight, entity.z - halfD,
                    entity.x + halfW, entity.y + h + stepHeight, entity.z + halfD
                );

                let stepDx = initialDx;
                let stepDz = initialDz;

                for (let i = 0; i < colliders.length; i++) {
                    stepDx = stepBox.clipXCollide(colliders[i].aabb, stepDx);
                }
                stepBox = stepBox.offset(stepDx, 0, 0);

                for (let i = 0; i < colliders.length; i++) {
                    stepDz = stepBox.clipZCollide(colliders[i].aabb, stepDz);
                }

                // If stepping up allowed us to move further, accept step
                if (stepDx * stepDx + stepDz * stepDz > dx * dx + dz * dz) {
                    dx = stepDx;
                    dz = stepDz;
                    dy += stepHeight;
                }
            }

            // Apply displacement
            entity.x += dx;
            entity.y += dy;
            entity.z += dz;

            // Check floor triggers (Speed pad & Jump pad)
            if (entity.onGround) {
                const B = window.BLOCKS;
                const underId = this.world.getBlock(Math.floor(entity.x), Math.floor(entity.y - 0.2), Math.floor(entity.z));
                if (underId === B.SPEED_PAD.id) {
                    entity.speedBoostTimer = 1.0;
                } else if (underId === B.JUMP_PAD.id) {
                    velocity.y = 18.0;
                    entity.onGround = false;
                }
            }
        }
    }

    global.Physics = Physics;
    global.AABB = AABB;
})(window);
