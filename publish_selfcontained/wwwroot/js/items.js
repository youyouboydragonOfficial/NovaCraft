// Dropped Items, Projectiles (Arrows, Ender Pearls, Fireballs, Snowballs, Astral Slash), TNT & Particles for NovaCraft
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
            this.boxGeo = new THREE.BoxGeometry(0.26, 0.26, 0.26);
            this.particleGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
        }

        spawnDroppedItem(x, y, z, itemKey, count = 1) {
            if (!itemKey) return;
            let colorHex = 0x55cc77;
            if (itemKey.includes('diamond')) colorHex = 0x4dedf0;
            else if (itemKey.includes('netherite')) colorHex = 0x483c42;
            else if (itemKey.includes('gold')) colorHex = 0xffd700;
            else if (itemKey.includes('iron') || itemKey.includes('bucket') || itemKey.includes('flint')) colorHex = 0xd8d8d8;
            else if (itemKey.includes('coal')) colorHex = 0x2a2a2a;
            else if (itemKey.includes('redstone')) colorHex = 0xd01818;
            else if (itemKey.includes('emerald')) colorHex = 0x17dd62;
            else if (itemKey.includes('lapis')) colorHex = 0x1d48a8;
            else if (itemKey.includes('astral') || itemKey.includes('amethyst')) colorHex = 0xb555ff;
            else if (itemKey.includes('wood') || itemKey.includes('oak') || itemKey.includes('plank') || itemKey.includes('stick')) colorHex = 0xa07845;
            else if (itemKey.includes('dirt') || itemKey.includes('soul')) colorHex = 0x79553a;
            else if (itemKey.includes('stone') || itemKey.includes('cobble') || itemKey.includes('deepslate')) colorHex = 0x7d7d7d;
            else if (itemKey.includes('sand')) colorHex = 0xdcd3a0;
            else if (itemKey.includes('tnt') || itemKey.includes('apple') || itemKey.includes('beef') || itemKey.includes('pork')) colorHex = 0xd93622;
            else if (itemKey.includes('wool') || itemKey.includes('snow') || itemKey.includes('bone')) colorHex = 0xf0f0f0;

            const mat = new THREE.MeshLambertMaterial({ color: colorHex });
            const mesh = new THREE.Mesh(this.boxGeo, mat);
            mesh.position.set(x, y + 0.3, z);
            this.scene.add(mesh);

            this.droppedItems.push({
                mesh: mesh,
                item: itemKey,
                count: count,
                x: x, y: y + 0.3, z: z,
                vy: 2.2,
                life: 300 // 5 minutes
            });
        }

        // Shoot Arrow (Bow & Arrow)
        shootArrow(origin, direction, power = 1.0) {
            const arrowGroup = new THREE.Group();
            const shaftMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
            const headMat = new THREE.MeshLambertMaterial({ color: 0xc8c8c8 });
            const featherMat = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });

            const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.55), shaftMat);
            const tip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.12), headMat);
            tip.position.set(0, 0, -0.30);
            const fletching = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.10), featherMat);
            fletching.position.set(0, 0, 0.25);

            arrowGroup.add(shaft, tip, fletching);
            arrowGroup.position.copy(origin);
            arrowGroup.lookAt(origin.clone().add(direction));
            this.scene.add(arrowGroup);

            if (this.sound && this.sound.playBowShoot) {
                this.sound.playBowShoot();
            }

            this.projectiles.push({
                mesh: arrowGroup,
                type: 'arrow',
                vel: direction.clone().normalize().multiplyScalar(28.0 * power),
                gravity: 12.0,
                damage: Math.round(9 * power),
                life: 4.0
            });
        }

        // Throw Ender Pearl (Teleports player on impact!)
        throwEnderPearl(origin, direction) {
            const geo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
            const mat = new THREE.MeshLambertMaterial({ color: 0x188f7c });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(origin);
            this.scene.add(mesh);

            if (this.sound && this.sound.playBowShoot) {
                this.sound.playBowShoot();
            }

            this.projectiles.push({
                mesh: mesh,
                type: 'ender_pearl',
                vel: direction.clone().normalize().multiplyScalar(23.0),
                gravity: 14.0,
                damage: 1,
                life: 5.0
            });
        }

        // Throw Eye of Ender (Ascends and glides towards Stronghold portal!)
        shootEyeOfEnder(origin, targetPos) {
            const geo = new THREE.BoxGeometry(0.26, 0.26, 0.26);
            const mat = new THREE.MeshBasicMaterial({ color: 0x1cb88f });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(origin);
            this.scene.add(mesh);

            const toTarget = new THREE.Vector3(targetPos.x - origin.x, 0, targetPos.z - origin.z).normalize();
            toTarget.y = 0.55;
            toTarget.normalize();

            if (this.sound && this.sound.playPop) {
                this.sound.playPop();
            }

            this.projectiles.push({
                mesh: mesh,
                type: 'eye_of_ender',
                vel: toTarget.multiplyScalar(11.0),
                gravity: -0.8, // Gently ascends into the sky
                damage: 0,
                life: 4.2
            });
        }

        // Throw Snowball
        throwSnowball(origin, direction) {
            const geo = new THREE.BoxGeometry(0.20, 0.20, 0.20);
            const mat = new THREE.MeshLambertMaterial({ color: 0xf8fafa });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(origin);
            this.scene.add(mesh);

            if (this.sound && this.sound.playBowShoot) {
                this.sound.playBowShoot();
            }

            this.projectiles.push({
                mesh: mesh,
                type: 'snowball',
                vel: direction.clone().normalize().multiplyScalar(22.0),
                gravity: 14.0,
                damage: 2,
                life: 3.5
            });
        }

        // Shoot Fire Charge (Ignites blocks & burns mobs)
        shootFireball(origin, direction) {
            const geo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(origin);
            this.scene.add(mesh);

            if (this.sound && this.sound.playFlintAndSteel) {
                this.sound.playFlintAndSteel();
            }

            this.projectiles.push({
                mesh: mesh,
                type: 'fireball',
                vel: direction.clone().normalize().multiplyScalar(20.0),
                gravity: 0.0,
                damage: 8,
                life: 3.5
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
                gravity: 0.0,
                damage: 16,
                life: 2.5
            });
        }

        // Activate Primed TNT (Authentic Minecraft: hops up, falls with gravity, flashes white, then explodes!)
        igniteTnt(x, y, z, isCluster = false, customFuse = 3.5) {
            const bx = Math.floor(x);
            const by = Math.floor(y);
            const bz = Math.floor(z);
            this.world.setBlock(bx, by, bz, window.BLOCKS.AIR.id);

            const geo = new THREE.BoxGeometry(0.96, 0.96, 0.96);
            const baseColor = isCluster ? 0xb822e8 : 0xd92b24;
            const mat = new THREE.MeshLambertMaterial({ color: baseColor });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(bx + 0.5, by + 0.5, bz + 0.5);
            this.scene.add(mesh);

            if (this.sound && this.sound.playFuse) {
                this.sound.playFuse();
            }

            this.activeTnts.push({
                mesh: mesh,
                mat: mat,
                baseColor: baseColor,
                x: bx + 0.5,
                y: by + 0.5,
                z: bz + 0.5,
                vx: (Math.random() - 0.5) * 1.6,
                vy: 4.2, // Authentic hop upward when primed!
                vz: (Math.random() - 0.5) * 1.6,
                timer: customFuse,
                isCluster: isCluster,
                flashTimer: 0
            });
        }

        explode(x, y, z, radius = 4.0, isCluster = false, player = null, mobManager = null) {
            if (this.sound && this.sound.playExplosion) {
                this.sound.playExplosion();
            }

            // Spawn explosion fireball & smoke particles
            this.spawnBlockParticles(x, y, z, 0xff7711, 22);
            this.spawnBlockParticles(x, y, z, 0xffdd44, 16);
            this.spawnBlockParticles(x, y, z, 0xdddddd, 18);

            // Destroy blocks in blast radius & chain-ignite nearby TNT!
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
                        const dist = Math.sqrt((bx + 0.5 - x) ** 2 + (by + 0.5 - y) ** 2 + (bz + 0.5 - z) ** 2);
                        if (dist <= radius) {
                            const bId = this.world.getBlock(bx, by, bz);
                            if (bId === B.TNT.id || bId === B.CLUSTER_TNT.id) {
                                // Authentic Minecraft Chain-Reaction TNT!
                                this.igniteTnt(bx, by, bz, bId === B.CLUSTER_TNT.id, 0.5 + Math.random() * 0.7);
                            } else if (
                                bId !== B.AIR.id &&
                                bId !== B.BEDROCK.id &&
                                bId !== B.OBSIDIAN.id &&
                                bId !== (B.REINFORCED_DEEPSLATE ? B.REINFORCED_DEEPSLATE.id : -1)
                            ) {
                                const def = window.BLOCK_BY_ID[bId];
                                this.world.setBlock(bx, by, bz, B.AIR.id);
                                if (Math.random() < 0.3 && def && def.drop) {
                                    this.spawnDroppedItem(bx + 0.5, by + 0.5, bz + 0.5, def.drop);
                                }
                                if (Math.random() < 0.35) {
                                    this.spawnBlockParticles(bx + 0.5, by + 0.5, bz + 0.5, 0x888888, 2);
                                }
                                this.world.applyGravityAbove(bx, by, bz);
                            }
                        }
                    }
                }
            }

            // Blast Damage & Knockback to Mobs
            const entityRadius = radius * 1.75;
            if (mobManager && mobManager.mobs) {
                for (let i = mobManager.mobs.length - 1; i >= 0; i--) {
                    const mob = mobManager.mobs[i];
                    const dx = mob.x - x;
                    const dy = (mob.y + 0.8) - y;
                    const dz = mob.z - z;
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (dist < entityRadius) {
                        const impact = 1.0 - (dist / entityRadius);
                        const dmg = Math.max(2, Math.round(impact * 28));
                        mob.takeDamage(dmg);
                        const len = Math.max(0.1, dist);
                        mob.vx = (dx / len) * impact * 14.0;
                        mob.vy = Math.max(5.0, (dy / len) * impact * 10.0 + 5.0);
                        mob.vz = (dz / len) * impact * 14.0;
                    }
                }
            }

            // Blast Damage & Knockback to Player
            if (player && !player.isDead) {
                const dx = player.x - x;
                const dy = (player.y + 0.9) - y;
                const dz = player.z - z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist < entityRadius) {
                    const impact = 1.0 - (dist / entityRadius);
                    if (player.gameMode === 'survival') {
                        const dmg = Math.max(1, Math.round(impact * 18));
                        player.takeDamage(dmg, 'explosion');
                    }
                    const len = Math.max(0.1, dist);
                    player.velocity.x += (dx / len) * impact * 12.0;
                    player.velocity.y = Math.max(player.velocity.y, impact * 9.0 + 3.0);
                    player.velocity.z += (dz / len) * impact * 12.0;
                }
            }

            // Cluster TNT shoots 4 child bombs
            if (isCluster) {
                const spread = [[1, 0.5, 0], [-1, 0.5, 0], [0, 0.5, 1], [0, 0.5, -1]];
                spread.forEach(dir => {
                    const cx = x + dir[0] * 2.8;
                    const cy = y + dir[1] * 2.0;
                    const cz = z + dir[2] * 2.8;
                    setTimeout(() => {
                        this.explode(cx, cy, cz, 3.2, false, player, mobManager);
                    }, 350 + Math.random() * 350);
                });
            }
        }

        spawnBlockParticles(x, y, z, hexColor = 0x885522, count = 8) {
            for (let i = 0; i < count; i++) {
                const mat = new THREE.MeshBasicMaterial({ color: hexColor });
                const p = new THREE.Mesh(this.particleGeo, mat);
                p.position.set(
                    x + (Math.random() - 0.5) * 0.45,
                    y + (Math.random() - 0.5) * 0.45,
                    z + (Math.random() - 0.5) * 0.45
                );
                this.scene.add(p);

                this.particles.push({
                    mesh: p,
                    vx: (Math.random() - 0.5) * 4.5,
                    vy: Math.random() * 4.2 + 1.0,
                    vz: (Math.random() - 0.5) * 4.5,
                    life: 0.45 + Math.random() * 0.35
                });
            }
        }

        update(dt, player, inventory, mobManager) {
            // 1. Update Dropped Items
            for (let i = this.droppedItems.length - 1; i >= 0; i--) {
                const item = this.droppedItems[i];
                item.life -= dt;
                if (item.life <= 0) {
                    this.scene.remove(item.mesh);
                    this.droppedItems.splice(i, 1);
                    continue;
                }

                // Gravity & landing on solid ground
                item.vy = Math.max(item.vy - 15.0 * dt, -10.0);
                item.y += item.vy * dt;

                const groundBlock = this.world.getBlock(Math.floor(item.x), Math.floor(item.y - 0.15), Math.floor(item.z));
                const def = window.BLOCK_BY_ID[groundBlock];
                if (def && def.solid) {
                    item.y = Math.floor(item.y - 0.15) + 1.15;
                    item.vy = 0;
                }

                // Bob & rotate
                item.mesh.rotation.y += dt * 2.5;
                item.mesh.position.set(item.x, item.y + Math.sin(performance.now() * 0.004) * 0.07, item.z);

                // Magnet pull towards player
                const dx = player.x - item.x;
                const dy = (player.y + 0.6) - item.y;
                const dz = player.z - item.z;
                const distSq = dx * dx + dy * dy + dz * dz;

                if (distSq < 4.5) {
                    item.x += dx * 6.5 * dt;
                    item.y += dy * 6.5 * dt;
                    item.z += dz * 6.5 * dt;

                    if (distSq < 0.65) {
                        const added = inventory.addItem(item.item, item.count);
                        if (added) {
                            this.sound.playPop();
                            this.scene.remove(item.mesh);
                            this.droppedItems.splice(i, 1);
                        }
                    }
                }
            }

            // 2. Update Projectiles (Arrows, Ender Pearls, Fireballs, Snowballs, Astral Slash)
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const proj = this.projectiles[i];
                proj.life -= dt;

                if (proj.gravity) {
                    proj.vel.y -= proj.gravity * dt;
                }

                const nextPos = proj.mesh.position.clone().addScaledVector(proj.vel, dt);
                proj.mesh.position.copy(nextPos);

                if (proj.type === 'arrow') {
                    proj.mesh.lookAt(nextPos.clone().add(proj.vel));
                } else {
                    proj.mesh.rotation.x += dt * 8;
                    proj.mesh.rotation.y += dt * 8;
                }

                // Trail particles for fireball / ender_pearl
                if (proj.type === 'fireball' && Math.random() < 0.5) {
                    this.spawnBlockParticles(nextPos.x, nextPos.y, nextPos.z, 0xff5500, 1);
                } else if (proj.type === 'ender_pearl' && Math.random() < 0.4) {
                    this.spawnBlockParticles(nextPos.x, nextPos.y, nextPos.z, 0xaa33ff, 1);
                } else if (proj.type === 'eye_of_ender' && Math.random() < 0.5) {
                    this.spawnBlockParticles(nextPos.x, nextPos.y, nextPos.z, 0x1cb88f, 1);
                }

                // Check collision with Mobs
                if (mobManager) {
                    const hitMob = mobManager.checkMobHit(proj.mesh.position, 1.15);
                    if (hitMob) {
                        hitMob.takeDamage(proj.damage);
                        if (this.sound && this.sound.playHit) this.sound.playHit();
                        if (proj.type === 'ender_pearl' && player) {
                            player.x = hitMob.x;
                            player.y = hitMob.y + 0.5;
                            player.z = hitMob.z;
                            player.velocity.set(0, 0, 0);
                            player.fallDistance = 0;
                            if (this.sound && this.sound.playWarp) this.sound.playWarp();
                            this.spawnBlockParticles(player.x, player.y + 1, player.z, 0xaa33ff, 16);
                        } else {
                            this.spawnBlockParticles(proj.mesh.position.x, proj.mesh.position.y, proj.mesh.position.z, 0xff3333, 8);
                        }
                        this.scene.remove(proj.mesh);
                        this.projectiles.splice(i, 1);
                        continue;
                    }
                }

                // Check collision with World Blocks
                const bx = Math.floor(proj.mesh.position.x);
                const by = Math.floor(proj.mesh.position.y);
                const bz = Math.floor(proj.mesh.position.z);
                const hitBlockId = this.world.getBlock(bx, by, bz);
                const hitDef = window.BLOCK_BY_ID[hitBlockId];

                if (hitDef && hitDef.solid) {
                    if (proj.type === 'ender_pearl' && player) {
                        // Teleport player to landing spot!
                        player.x = proj.mesh.position.x;
                        player.y = by + 1.05;
                        player.z = proj.mesh.position.z;
                        player.velocity.set(0, 0, 0);
                        player.fallDistance = 0;
                        if (this.sound && this.sound.playWarp) this.sound.playWarp();
                        this.spawnBlockParticles(player.x, player.y + 0.8, player.z, 0xaa33ff, 20);
                        if (player.gameMode === 'survival') {
                            player.takeDamage(2, 'ender_pearl');
                        }
                    } else if (proj.type === 'fireball') {
                        // Ignite TNT or place Fire above hit block
                        if (hitBlockId === window.BLOCKS.TNT.id || hitBlockId === window.BLOCKS.CLUSTER_TNT.id) {
                            this.igniteTnt(bx, by, bz, hitBlockId === window.BLOCKS.CLUSTER_TNT.id);
                        } else if (this.world.getBlock(bx, by + 1, bz) === window.BLOCKS.AIR.id && window.BLOCKS.FIRE) {
                            this.world.setBlock(bx, by + 1, bz, window.BLOCKS.FIRE.id);
                        }
                        this.spawnBlockParticles(proj.mesh.position.x, proj.mesh.position.y, proj.mesh.position.z, 0xff6600, 12);
                    } else if (proj.type === 'arrow') {
                        // Arrow can ignite TNT if it hits TNT!
                        if (hitBlockId === window.BLOCKS.TNT.id || hitBlockId === window.BLOCKS.CLUSTER_TNT.id) {
                            this.igniteTnt(bx, by, bz, hitBlockId === window.BLOCKS.CLUSTER_TNT.id);
                        }
                        this.spawnBlockParticles(proj.mesh.position.x, proj.mesh.position.y, proj.mesh.position.z, 0xc8a060, 4);
                    } else if (proj.type === 'snowball') {
                        this.spawnBlockParticles(proj.mesh.position.x, proj.mesh.position.y, proj.mesh.position.z, 0xffffff, 8);
                    }
                    this.scene.remove(proj.mesh);
                    this.projectiles.splice(i, 1);
                    continue;
                }

                if (proj.life <= 0) {
                    this.scene.remove(proj.mesh);
                    this.projectiles.splice(i, 1);
                }
            }

            // 3. Update Primed TNTs (Gravity, Hop, White Flash, Smoke & Explosion)
            for (let i = this.activeTnts.length - 1; i >= 0; i--) {
                const tnt = this.activeTnts[i];
                tnt.timer -= dt;
                tnt.flashTimer += dt * 10.0;

                // Gravity & solid block collision for primed TNT
                tnt.vy = Math.max(tnt.vy - 18.0 * dt, -20.0);
                tnt.x += tnt.vx * dt;
                tnt.y += tnt.vy * dt;
                tnt.z += tnt.vz * dt;

                const underId = this.world.getBlock(Math.floor(tnt.x), Math.floor(tnt.y - 0.48), Math.floor(tnt.z));
                const underDef = window.BLOCK_BY_ID[underId];
                if (underDef && underDef.solid) {
                    tnt.y = Math.floor(tnt.y - 0.48) + 1.48;
                    tnt.vy = 0;
                    tnt.vx *= 0.75;
                    tnt.vz *= 0.75;
                }

                tnt.mesh.position.set(tnt.x, tnt.y, tnt.z);

                // Fuse smoke particles at top of TNT
                if (Math.random() < 0.35) {
                    this.spawnBlockParticles(tnt.x, tnt.y + 0.55, tnt.z, 0x444444, 1);
                }

                // Authentic Minecraft white flashing effect as fuse runs down
                const isFlash = Math.sin(tnt.flashTimer) > 0;
                if (tnt.mat) {
                    tnt.mat.color.setHex(isFlash ? 0xffffff : tnt.baseColor);
                }
                const swell = tnt.timer < 0.5 ? 1.0 + (0.5 - tnt.timer) * 0.35 : 1.0 + Math.sin(tnt.flashTimer) * 0.04;
                tnt.mesh.scale.setScalar(swell);

                if (tnt.timer <= 0) {
                    this.scene.remove(tnt.mesh);
                    this.activeTnts.splice(i, 1);
                    this.explode(tnt.x, tnt.y, tnt.z, tnt.isCluster ? 5.0 : 4.0, tnt.isCluster, player, mobManager);
                }
            }

            // 4. Update Particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.life -= dt;
                p.vy -= 16.0 * dt;
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
