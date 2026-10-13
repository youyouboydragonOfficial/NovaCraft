// Dropped Items, Projectiles (Astral Slash, Laser), TNT & Particles for NovaCraft
(function(global) {
    class ItemManager {
        constructor(scene, world, sound) {
            this.scene = scene;
            this.world = world;
            this.sound = sound;

            this.droppedItems = [];
            this.projectiles = [];
            this.activeTnts = [];
            this.particles = [];

            // Shared geometries
            this.boxGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
            this.particleGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
        }

        spawnDroppedItem(x, y, z, itemKey, count = 1) {
            if (!itemKey) return;
            const mat = new THREE.MeshLambertMaterial({ color: 0x44dd88 });
            // Color based on item
            if (itemKey.includes('diamond')) mat.color.setHex(0x55eeff);
            else if (itemKey.includes('gold')) mat.color.setHex(0xffdd33);
            else if (itemKey.includes('iron')) mat.color.setHex(0xdddddd);
            else if (itemKey.includes('coal')) mat.color.setHex(0x222222);
            else if (itemKey.includes('astral')) mat.color.setHex(0xdd33ff);
            else if (itemKey.includes('wood') || itemKey.includes('oak')) mat.color.setHex(0xaa7744);
            else if (itemKey.includes('dirt')) mat.color.setHex(0x885522);
            else if (itemKey.includes('stone') || itemKey.includes('cobble')) mat.color.setHex(0x888888);

            const mesh = new THREE.Mesh(this.boxGeo, mat);
            mesh.position.set(x, y + 0.3, z);
            this.scene.add(mesh);

            this.droppedItems.push({
                mesh: mesh,
                item: itemKey,
                count: count,
                x: x, y: y + 0.3, z: z,
                vy: 2.0,
                life: 300 // 5 minutes
            });
        }

        // Shoot Astral Wave Projectile
        shootAstralSlash(origin, direction) {
            const geo = new THREE.BoxGeometry(1.2, 0.2, 0.6);
            const mat = new THREE.MeshBasicMaterial({ color: 0xdd44ff, wireframe: false });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(origin);
            this.scene.add(mesh);

            this.sound.playAstralSlash();

            this.projectiles.push({
                mesh: mesh,
                type: 'astral_slash',
                vel: direction.clone().multiplyScalar(22.0),
                damage: 16,
                life: 2.5
            });
        }

        // Activate TNT
        igniteTnt(x, y, z, isCluster = false) {
            this.world.setBlock(x, y, z, window.BLOCKS.AIR.id);
            const geo = new THREE.BoxGeometry(0.98, 0.98, 0.98);
            const mat = new THREE.MeshLambertMaterial({ color: isCluster ? 0xcc22ee : 0xee2222 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
            this.scene.add(mesh);

            this.sound.playFuse();

            this.activeTnts.push({
                mesh: mesh,
                x: x + 0.5, y: y + 0.5, z: z + 0.5,
                timer: 3.0,
                isCluster: isCluster,
                flashTimer: 0
            });
        }

        explode(x, y, z, radius = 3.5, isCluster = false) {
            this.sound.playExplosion();

            // Destroy blocks in blast radius
            const minX = Math.floor(x - radius);
            const maxX = Math.ceil(x + radius);
            const minY = Math.floor(y - radius);
            const maxY = Math.ceil(y + radius);
            const minZ = Math.floor(z - radius);
            const maxZ = Math.ceil(z + radius);

            const B = window.BLOCKS;

            for (let bx = minX; bx <= maxX; bx++) {
                for (let by = minY; by <= maxY; by++) {
                    for (let bz = minZ; bz <= maxZ; bz++) {
                        const dist = Math.sqrt((bx - x)**2 + (by - y)**2 + (bz - z)**2);
                        if (dist <= radius) {
                            const bId = this.world.getBlock(bx, by, bz);
                            if (bId !== B.AIR.id && bId !== B.BEDROCK.id && bId !== B.OBSIDIAN.id) {
                                const def = window.BLOCK_BY_ID[bId];
                                this.world.setBlock(bx, by, bz, B.AIR.id);
                                if (Math.random() < 0.3 && def && def.drop) {
                                    this.spawnDroppedItem(bx + 0.5, by + 0.5, bz + 0.5, def.drop);
                                }
                                this.spawnBlockParticles(bx + 0.5, by + 0.5, bz + 0.5, 0x888888, 3);
                            }
                        }
                    }
                }
            }

            // Cluster TNT shoots 4 child bombs
            if (isCluster) {
                const spread = [[1, 0.5, 0], [-1, 0.5, 0], [0, 0.5, 1], [0, 0.5, -1]];
                spread.forEach(dir => {
                    const cx = x + dir[0] * 2.5;
                    const cy = y + dir[1] * 2.5;
                    const cz = z + dir[2] * 2.5;
                    setTimeout(() => {
                        this.explode(cx, cy, cz, 3.0, false);
                    }, 400 + Math.random() * 400);
                });
            }
        }

        spawnBlockParticles(x, y, z, hexColor = 0x885522, count = 8) {
            for (let i = 0; i < count; i++) {
                const mat = new THREE.MeshBasicMaterial({ color: hexColor });
                const p = new THREE.Mesh(this.particleGeo, mat);
                p.position.set(x + (Math.random() - 0.5) * 0.4, y + (Math.random() - 0.5) * 0.4, z + (Math.random() - 0.5) * 0.4);
                this.scene.add(p);

                this.particles.push({
                    mesh: p,
                    vx: (Math.random() - 0.5) * 4.0,
                    vy: Math.random() * 4.0 + 1.0,
                    vz: (Math.random() - 0.5) * 4.0,
                    life: 0.5 + Math.random() * 0.3
                });
            }
        }

        update(dt, player, inventory, mobManager) {
            // Update Dropped Items
            for (let i = this.droppedItems.length - 1; i >= 0; i--) {
                const item = this.droppedItems[i];
                item.life -= dt;
                if (item.life <= 0) {
                    this.scene.remove(item.mesh);
                    this.droppedItems.splice(i, 1);
                    continue;
                }

                // Gravity & hovering
                item.vy = Math.max(item.vy - 15.0 * dt, -10.0);
                item.y += item.vy * dt;

                const groundBlock = this.world.getBlock(Math.floor(item.x), Math.floor(item.y), Math.floor(item.z));
                const def = window.BLOCK_BY_ID[groundBlock];
                if (def && def.solid) {
                    item.y = Math.floor(item.y) + 1.1;
                    item.vy = 0;
                }

                // Bob & rotate
                item.mesh.rotation.y += dt * 3.0;
                item.mesh.position.set(item.x, item.y + Math.sin(performance.now() * 0.005) * 0.08, item.z);

                // Magnet pull towards player
                const dx = player.x - item.x;
                const dy = (player.y + 0.5) - item.y;
                const dz = player.z - item.z;
                const distSq = dx * dx + dy * dy + dz * dz;

                if (distSq < 4.0) { // Magnet pull distance
                    item.x += dx * 6.0 * dt;
                    item.y += dy * 6.0 * dt;
                    item.z += dz * 6.0 * dt;

                    if (distSq < 0.6) { // Collect!
                        const added = inventory.addItem(item.item, item.count);
                        if (added) {
                            this.sound.playPop();
                            this.scene.remove(item.mesh);
                            this.droppedItems.splice(i, 1);
                        }
                    }
                }
            }

            // Update Projectiles
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const proj = this.projectiles[i];
                proj.life -= dt;
                proj.mesh.position.addScaledVector(proj.vel, dt);

                // Collision with mobs
                if (mobManager) {
                    const hitMob = mobManager.checkMobHit(proj.mesh.position, 1.2);
                    if (hitMob) {
                        hitMob.takeDamage(proj.damage);
                        this.spawnBlockParticles(proj.mesh.position.x, proj.mesh.position.y, proj.mesh.position.z, 0xee22ff, 12);
                        this.scene.remove(proj.mesh);
                        this.projectiles.splice(i, 1);
                        continue;
                    }
                }

                if (proj.life <= 0) {
                    this.scene.remove(proj.mesh);
                    this.projectiles.splice(i, 1);
                }
            }

            // Update TNTs
            for (let i = this.activeTnts.length - 1; i >= 0; i--) {
                const tnt = this.activeTnts[i];
                tnt.timer -= dt;
                tnt.flashTimer += dt * 8;
                // Flashing white effect
                const isFlash = Math.sin(tnt.flashTimer) > 0;
                tnt.mesh.scale.setScalar(1.0 + Math.sin(tnt.flashTimer) * 0.08);

                if (tnt.timer <= 0) {
                    this.explode(tnt.x, tnt.y, tnt.z, 4.0, tnt.isCluster);
                    this.scene.remove(tnt.mesh);
                    this.activeTnts.splice(i, 1);
                }
            }

            // Update Particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.life -= dt;
                p.vy -= 18.0 * dt;
                p.mesh.position.x += p.vx * dt;
                p.mesh.position.y += p.vy * dt;
                p.mesh.position.z += p.vz * dt;

                if (p.life <= 0) {
                    this.scene.remove(p.mesh);
                    this.particles.splice(i, 1);
                }
            }
        }
    }

    global.ItemManager = ItemManager;
})(window);
