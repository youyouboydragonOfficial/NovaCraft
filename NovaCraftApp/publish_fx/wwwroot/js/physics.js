// AABB Physics Engine, Step Climbing & Collision Detection for NovaCraft
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

        intersects(other) {
            return (
                this.minX < other.maxX && this.maxX > other.minX &&
                this.minY < other.maxY && this.maxY > other.minY &&
                this.minZ < other.maxZ && this.maxZ > other.minZ
            );
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
    }

    class Physics {
        constructor(world) {
            this.world = world;
            this.gravity = 28.0; // blocks / s^2
            this.terminalVelocity = 50.0;
        }

        // Returns all solid block bounding boxes that could collide with target box
        getBlockBoxes(box) {
            const boxes = [];
            const minX = Math.floor(box.minX);
            const maxX = Math.floor(box.maxX);
            const minY = Math.floor(box.minY);
            const maxY = Math.floor(box.maxY);
            const minZ = Math.floor(box.minZ);
            const maxZ = Math.floor(box.maxZ);

            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    for (let x = minX; x <= maxX; x++) {
                        const blockId = this.world.getBlock(x, y, z);
                        const blockDef = window.BLOCK_BY_ID[blockId];
                        if (blockDef && blockDef.solid) {
                            boxes.push({
                                aabb: new AABB(x, y, z, x + 1, y + 1, z + 1),
                                blockId: blockId,
                                x: x, y: y, z: z
                            });
                        }
                    }
                }
            }
            return boxes;
        }

        // Move entity with collision detection and smooth step-up
        moveEntity(entity, velocity, dt) {
            const B = window.BLOCKS;
            let dx = velocity.x * dt;
            let dy = velocity.y * dt;
            let dz = velocity.z * dt;

            // Check if inside water
            const headBlock = this.world.getBlock(Math.floor(entity.x), Math.floor(entity.y + 1.5), Math.floor(entity.z));
            const footBlock = this.world.getBlock(Math.floor(entity.x), Math.floor(entity.y), Math.floor(entity.z));
            entity.inWater = (headBlock === B.WATER.id || footBlock === B.WATER.id);
            entity.inLava = (headBlock === B.LAVA.id || footBlock === B.LAVA.id);

            // Water physics damping
            if (entity.inWater && !entity.flying) {
                dy = Math.max(dy, -4.0 * dt);
                dx *= 0.7;
                dz *= 0.7;
            }

            let box = new AABB(
                entity.x - entity.width / 2,
                entity.y,
                entity.z - entity.depth / 2,
                entity.x + entity.width / 2,
                entity.y + entity.height,
                entity.z + entity.depth / 2
            );

            // Y-axis movement (Vertical)
            const yBox = box.offset(0, dy, 0);
            const yColliders = this.getBlockBoxes(yBox);
            entity.onGround = false;

            for (let i = 0; i < yColliders.length; i++) {
                const c = yColliders[i].aabb;
                if (yBox.intersects(c)) {
                    if (dy > 0) {
                        dy = c.minY - box.maxY;
                        velocity.y = 0;
                    } else if (dy < 0) {
                        dy = c.maxY - box.minY;
                        velocity.y = 0;
                        entity.onGround = true;

                        // Check special floor blocks
                        if (yColliders[i].blockId === B.SPEED_PAD.id) {
                            entity.speedBoostTimer = 1.0;
                        } else if (yColliders[i].blockId === B.JUMP_PAD.id) {
                            velocity.y = 18.0;
                            entity.onGround = false;
                        }
                    }
                }
            }
            box = box.offset(0, dy, 0);

            // X-axis movement
            let xBox = box.offset(dx, 0, 0);
            let xColliders = this.getBlockBoxes(xBox);
            let collidedX = false;
            for (let i = 0; i < xColliders.length; i++) {
                const c = xColliders[i].aabb;
                if (xBox.intersects(c)) {
                    collidedX = true;
                    if (dx > 0) dx = c.minX - box.maxX;
                    else if (dx < 0) dx = c.maxX - box.minX;
                    velocity.x = 0;
                }
            }
            box = box.offset(dx, 0, 0);

            // Z-axis movement
            let zBox = box.offset(0, 0, dz);
            let zColliders = this.getBlockBoxes(zBox);
            let collidedZ = false;
            for (let i = 0; i < zColliders.length; i++) {
                const c = zColliders[i].aabb;
                if (zBox.intersects(c)) {
                    collidedZ = true;
                    if (dz > 0) dz = c.maxZ - box.minZ;
                    else if (dz < 0) dz = c.minZ - box.maxZ;
                    velocity.z = 0;
                }
            }
            box = box.offset(0, 0, dz);

            // Step climbing (Automatic 1-block step up if walking against obstacle)
            if ((collidedX || collidedZ) && entity.onGround && !entity.flying) {
                const stepHeight = 1.05;
                const testStepBox = new AABB(
                    entity.x - entity.width / 2 + (velocity.x * dt),
                    entity.y + stepHeight,
                    entity.z - entity.depth / 2 + (velocity.z * dt),
                    entity.x + entity.width / 2 + (velocity.x * dt),
                    entity.y + entity.height + stepHeight,
                    entity.z + entity.depth / 2 + (velocity.z * dt)
                );
                if (this.getBlockBoxes(testStepBox).length === 0) {
                    entity.y += stepHeight * 0.4; // smoothly hop up step
                }
            }

            // Apply new positions
            entity.x += dx;
            entity.y += dy;
            entity.z += dz;
        }
    }

    global.Physics = Physics;
    global.AABB = AABB;
})(window);
