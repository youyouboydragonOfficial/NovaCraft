// Authentic Minecraft HUD, Pixel-Art Icon Slots, Title Screen Mode Select & Crafting UI for NovaCraft
(function(global) {
    class UIManager {
        constructor(game, inventory, player) {
            this.game = game;
            this.inventory = inventory;
            this.player = player;

            // Cache DOM elements
            this.hud = document.getElementById('hud');
            this.heartsContainer = document.getElementById('hearts');
            this.foodContainer = document.getElementById('food-container');
            this.oxygenContainer = document.getElementById('oxygen-container');
            this.hotbarContainer = document.getElementById('hotbar');
            this.itemTooltip = document.getElementById('item-tooltip');
            this.debugOverlay = document.getElementById('debug-overlay');
            this.crosshair = document.getElementById('crosshair');

            this.modalOverlay = document.getElementById('modal-overlay');
            this.titleModal = document.getElementById('title-modal');
            this.inventoryModal = document.getElementById('inventory-modal');
            this.craftingModal = document.getElementById('crafting-modal');
            this.furnaceModal = document.getElementById('furnace-modal');
            this.chestModal = document.getElementById('chest-modal');
            this.creativeModal = document.getElementById('creative-modal');
            this.pauseModal = document.getElementById('pause-modal');
            this.deathModal = document.getElementById('death-modal');

            this.chatContainer = document.getElementById('chat-container');
            this.chatInput = document.getElementById('chat-input');
            this.chatMessages = document.getElementById('chat-messages');

            this.cursorElement = document.getElementById('cursor-item');

            this.lastSelectedHotbarIndex = -1;
            this.tooltipFadeTimer = null;

            this.initCreativeCatalog();
            this.setupEventHandlers();
        }

        setupEventHandlers() {
            // Mouse move for custom cursor item
            window.addEventListener('mousemove', (e) => {
                if (this.inventory.cursorItem && this.cursorElement) {
                    this.cursorElement.style.display = 'flex';
                    this.cursorElement.style.left = `${e.clientX + 12}px`;
                    this.cursorElement.style.top = `${e.clientY + 12}px`;
                    const iconUrl = this.game.atlas?.getItemIconDataURL(this.inventory.cursorItem.item) || '';
                    this.cursorElement.innerHTML = `
                        <img src="${iconUrl}" class="item-icon-small" alt="">
                        <span class="count">${this.inventory.cursorItem.count > 1 ? this.inventory.cursorItem.count : ''}</span>
                    `;
                } else if (this.cursorElement) {
                    this.cursorElement.style.display = 'none';
                }
            });

            // Chat Enter key
            this.chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const text = this.chatInput.value.trim();
                    if (text.length > 0) {
                        this.handleCommand(text);
                    }
                    this.closeChat();
                } else if (e.key === 'Escape') {
                    this.closeChat();
                }
            });
        }

        getShortName(itemKey) {
            if (!itemKey) return '';
            const shortMap = {
                flint_and_steel: '🔥着火石',
                tnt: '💣TNT爆薬',
                cluster_tnt: '💣クラスター',
                fire_charge: '🔥火炎弾',
                obsidian: '黒曜石',
                crying_obsidian: '泣く黒曜石',
                grass: '草ブロック',
                dirt: '土',
                stone: '石',
                cobblestone: '丸石',
                oak_log: 'オーク原木',
                oak_planks: 'オーク木材',
                birch_log: '白樺の原木',
                birch_planks: '白樺の木材',
                bricks: 'レンガ',
                stone_bricks: '石レンガ',
                glass: 'ガラス',
                sand: '砂',
                gravel: '砂利',
                sandstone: '砂岩',
                water_bucket: '💧水バケツ',
                lava_bucket: '🌋溶岩バケツ',
                bucket: 'バケツ',
                bow: '🏹弓',
                arrow: '矢',
                ender_pearl: '🟣パール',
                bone_meal: '骨粉',
                sapling: '🌲苗木',
                shears: '✂️ハサミ',
                bed: '🛏️ベッド',
                ladder: 'はしご',
                torch: '🔦松明',
                soul_lantern: '魂ランタン',
                glowstone: '発光石',
                crafting_table: '作業台',
                furnace: 'かまど',
                chest: 'チェスト',
                diamond_sword: '⚔️ダイヤ剣',
                netherite_sword: '⚔️ネザライト剣',
                iron_sword: '⚔️鉄の剣',
                golden_sword: '⚔️金の剣',
                stone_sword: '⚔️石の剣',
                wooden_sword: '⚔️木の剣',
                astral_blade: '★聖剣',
                diamond_pickaxe: '⛏️ダイヤ鶴橋',
                netherite_pickaxe: '⛏️ネザライト鶴',
                iron_pickaxe: '⛏️鉄ツルハシ',
                laser_drill: '★ドリル',
                spyglass: '🔭望遠鏡',
                compass: '🧭コンパス',
                clock: '🕒時計',
                fishing_rod: '🎣釣竿',
                golden_apple: '🍎金リンゴ',
                enchanted_golden_apple: '🍎神リンゴ',
                cooked_beef: '🍖焼肉'
            };
            if (shortMap[itemKey]) return shortMap[itemKey];
            const def = window.ITEMS[itemKey];
            const raw = def?.nameJa || def?.name || itemKey;
            return raw.replace(/\(.*?\)|（.*?）/g, '').slice(0, 6);
        }

        renderSlot(item, extraClass = '', isSelected = false, clickHandler = '') {
            if (!item) {
                return `<div class="slot ${isSelected ? 'selected' : ''} ${extraClass}" ${clickHandler ? `onclick="${clickHandler}"` : ''}></div>`;
            }
            const iconUrl = this.game.atlas?.getItemIconDataURL(item.item) || '';
            const shortName = this.getShortName(item.item);
            const def = window.ITEMS[item.item];
            const fullTitle = `${def?.nameJa || item.item}${def?.desc ? ' - ' + def.desc : ''}`;
            return `
                <div class="slot ${isSelected ? 'selected' : ''} ${extraClass}" title="${fullTitle}" ${clickHandler ? `onclick="${clickHandler}"` : ''}>
                    <img src="${iconUrl}" class="item-icon" alt="">
                    <div class="slot-label">${shortName}</div>
                    ${item.count > 1 ? `<div class="count">${item.count}</div>` : ''}
                </div>
            `;
        }

        renderHUD(force = false) {
            // 1 & 2. Health Hearts & Food Icons (Only update DOM when values change!)
            const hp = Math.ceil(this.player.health);
            const food = Math.ceil(this.player.food);
            const vitalsSig = `${this.player.gameMode}:${hp}:${food}`;
            if (force || vitalsSig !== this.lastVitalsSig) {
                this.lastVitalsSig = vitalsSig;
                if (this.player.gameMode === 'survival') {
                    this.heartsContainer.style.display = 'flex';
                    this.foodContainer.style.display = 'flex';

                    let heartsHTML = '';
                    for (let i = 0; i < 10; i++) {
                        const heartVal = hp - i * 2;
                        if (heartVal >= 2) heartsHTML += '<span class="heart full">❤</span>';
                        else if (heartVal === 1) heartsHTML += '<span class="heart half">❤</span>';
                        else heartsHTML += '<span class="heart empty">♡</span>';
                    }
                    this.heartsContainer.innerHTML = heartsHTML;

                    let foodHTML = '';
                    for (let i = 0; i < 10; i++) {
                        const fVal = food - i * 2;
                        if (fVal >= 2) foodHTML += '<span class="food full">🍗</span>';
                        else if (fVal === 1) foodHTML += '<span class="food half">🍗</span>';
                        else foodHTML += '<span class="food empty">🦴</span>';
                    }
                    this.foodContainer.innerHTML = foodHTML;
                } else {
                    // Creative Mode: hide hearts & food like real Minecraft
                    this.heartsContainer.style.display = 'none';
                    this.foodContainer.style.display = 'none';
                }
            }

            // 3. Oxygen bubbles (Only update when bubble count changes)
            const showOxy = (this.player.headInWater || this.player.oxygen < this.player.maxOxygen) && this.player.gameMode === 'survival';
            const bubbleCount = showOxy ? Math.ceil((this.player.oxygen / this.player.maxOxygen) * 10) : -1;
            if (force || bubbleCount !== this.lastBubbleCount) {
                this.lastBubbleCount = bubbleCount;
                if (showOxy) {
                    this.oxygenContainer.style.display = 'flex';
                    let oxyHTML = '';
                    for (let i = 0; i < 10; i++) {
                        oxyHTML += (i < bubbleCount) ? '<span class="bubble">🫧</span>' : '';
                    }
                    this.oxygenContainer.innerHTML = oxyHTML;
                } else {
                    this.oxygenContainer.style.display = 'none';
                }
            }

            // 4. Hotbar Slots (Only rebuild DOM when hotbar items or selected index changes!)
            let hotbarSig = `${this.inventory.selectedHotbarIndex}|`;
            for (let i = 0; i < 9; i++) {
                const s = this.inventory.slots[i];
                hotbarSig += s ? `${s.item}:${s.count},` : '_,';
            }
            if (force || hotbarSig !== this.lastHotbarSig) {
                this.lastHotbarSig = hotbarSig;
                let hotbarHTML = '';
                for (let i = 0; i < 9; i++) {
                    const item = this.inventory.slots[i];
                    const isSelected = (i === this.inventory.selectedHotbarIndex);
                    hotbarHTML += this.renderSlot(item, '', isSelected, `window.game.inventory.selectedHotbarIndex = ${i}; window.game.ui.renderHUD(true);`);
                }
                this.hotbarContainer.innerHTML = hotbarHTML;

                // 5. Always-Clear Tooltip for Selected Item & Action Guide
                const curItem = this.inventory.getSelectedItem();
                if (curItem) {
                    const def = window.ITEMS[curItem.item];
                    const itemName = def?.nameJa || def?.name || curItem.item;
                    let actionHint = '【左クリック / 右クリック: 使用】';
                    if (curItem.item === 'flint_and_steel' || curItem.item === 'fire_charge') {
                        actionHint = '🔥 【左クリック / 右クリック: TNT点火・ブロックに炎着火・黒曜石ポータル起動】';
                    } else if (curItem.item === 'tnt' || curItem.item === 'cluster_tnt') {
                        actionHint = '💣 【左クリック / 右クリック: TNT設置 ➔ 着火石でクリックして点火！】';
                    } else if (def?.blockId) {
                        actionHint = '🧱 【左クリック / 右クリック: ブロック設置 ｜ Shift+左クリック: 破壊】';
                    } else if (def?.toolType || curItem.item.includes('sword') || curItem.item.includes('pickaxe')) {
                        actionHint = '⛏️ 【左クリック: 採掘・破壊・攻撃】';
                    }
                    this.itemTooltip.textContent = `${itemName}  ${actionHint}`;
                    this.itemTooltip.style.opacity = '1';
                } else {
                    this.itemTooltip.textContent = '✋ 素手 【左クリック: 採掘・破壊・攻撃 ｜ Eキー: アイテムカタログ】';
                    this.itemTooltip.style.opacity = '0.85';
                }
            }

            // 6. Debug Info (F3)
            if (this.game.showDebug) {
                this.debugOverlay.style.display = 'block';
                this.debugOverlay.innerHTML = `
                    <b>NovaCraft Infinite v1.6.0</b> (${this.player.gameMode})<br>
                    XYZ: ${this.player.x.toFixed(2)} / ${this.player.y.toFixed(2)} / ${this.player.z.toFixed(2)}<br>
                    Chunk: ${Math.floor(this.player.x / 16)}, ${Math.floor(this.player.z / 16)}<br>
                    Yaw: ${(this.player.yaw * 180 / Math.PI).toFixed(1)}° | Pitch: ${(this.player.pitch * 180 / Math.PI).toFixed(1)}°<br>
                    FPS: ${this.game.currentFPS || 60} | Animals/Mobs: ${this.game.mobManager.mobs.length} | Items: ${this.game.itemManager.droppedItems.length}<br>
                    Time: ${(this.game.timeOfDay * 24).toFixed(1)}:00 | Teleporters: ${this.game.world.teleportWaygates.length}
                `;
            } else {
                this.debugOverlay.style.display = 'none';
            }

            // 7. Death Screen
            if (this.player.isDead) {
                this.deathModal.style.display = 'flex';
                this.modalOverlay.style.display = 'flex';
            } else if (this.inventory.openMode === 'none') {
                this.deathModal.style.display = 'none';
            }
        }

        openModal(mode) {
            this.inventory.openMode = mode;
            this.modalOverlay.style.display = 'flex';
            if (this.game && this.game.input) {
                this.game.input.keys = {};
                this.game.input.mouseButtons = {};
                this.game.input.spaceJustPressed = false;
            }
            document.exitPointerLock();

            // Hide all sub-modals first
            if (this.titleModal) this.titleModal.style.display = 'none';
            this.inventoryModal.style.display = 'none';
            this.craftingModal.style.display = 'none';
            this.furnaceModal.style.display = 'none';
            this.chestModal.style.display = 'none';
            this.creativeModal.style.display = 'none';
            this.pauseModal.style.display = 'none';

            if (mode === 'title') {
                if (this.titleModal) this.titleModal.style.display = 'flex';
            } else if (mode === 'inventory') {
                this.inventoryModal.style.display = 'flex';
                this.renderInventoryModal();
            } else if (mode === 'crafting') {
                this.craftingModal.style.display = 'flex';
                this.renderCraftingModal();
            } else if (mode === 'furnace') {
                this.furnaceModal.style.display = 'flex';
                this.renderFurnaceModal();
            } else if (mode === 'chest') {
                this.chestModal.style.display = 'flex';
                this.renderChestModal();
            } else if (mode === 'creative') {
                this.creativeModal.style.display = 'flex';
                this.renderCreativeCatalog();
            } else if (mode === 'pause') {
                this.pauseModal.style.display = 'flex';
                // Update mode toggle button text
                const toggleBtn = document.getElementById('pause-mode-btn');
                if (toggleBtn) {
                    toggleBtn.textContent = `ゲームモード切替 (現在: ${this.player.gameMode === 'creative' ? 'クリエイティブ' : 'サバイバル'})`;
                }
            }
        }

        closeModal() {
            this.inventory.openMode = 'none';
            if (this.game && this.game.input) {
                this.game.input.keys = {};
                this.game.input.mouseButtons = {};
                this.game.input.spaceJustPressed = false;
            }
            if (this.modalOverlay) this.modalOverlay.style.display = 'none';
            if (this.titleModal) this.titleModal.style.display = 'none';
            if (this.inventoryModal) this.inventoryModal.style.display = 'none';
            if (this.craftingModal) this.craftingModal.style.display = 'none';
            if (this.furnaceModal) this.furnaceModal.style.display = 'none';
            if (this.chestModal) this.chestModal.style.display = 'none';
            if (this.creativeModal) this.creativeModal.style.display = 'none';
            if (this.pauseModal) this.pauseModal.style.display = 'none';
            if (this.deathModal) this.deathModal.style.display = 'none';
            try {
                this.game.requestPointerLock();
            } catch (err) {
                console.warn("Pointer lock request handled:", err);
            }
        }

        equipCreativeStarterHotbar() {
            this.inventory.slots[0] = { item: 'grass', count: 64 };
            this.inventory.slots[1] = { item: 'cobblestone', count: 64 };
            this.inventory.slots[2] = { item: 'oak_planks', count: 64 };
            this.inventory.slots[3] = { item: 'tnt', count: 64 };
            this.inventory.slots[4] = { item: 'flint_and_steel', count: 1 };
            this.inventory.slots[5] = { item: 'obsidian', count: 64 };
            this.inventory.slots[6] = { item: 'water_bucket', count: 1 };
            this.inventory.slots[7] = { item: 'diamond_sword', count: 1 };
            this.inventory.slots[8] = { item: 'bow', count: 1 };
        }

        selectGameMode(mode) {
            if (this.hasSelectedMode) return;
            this.hasSelectedMode = true;
            this.game.gameStarted = true;
            console.log("selectGameMode executing:", mode);
            this.player.setGameMode(mode);

            // Always start game in bright, clear morning daylight (~8:30 AM)!
            this.game.timeOfDay = 0.22;

            // Initialize inventory
            this.inventory.slots = new Array(36).fill(null);
            this.inventory.selectedHotbarIndex = 0;
            if (mode === 'creative') {
                // In Creative Mode, pre-load hotbar with Grass, Cobblestone, Planks, TNT, Flint & Steel (着火石), Obsidian, Water Bucket, Sword, Bow!
                this.equipCreativeStarterHotbar();
            }

            this.closeModal();
            this.renderHUD();
            this.addChatMessage(`★ ゲームモード「${mode === 'creative' ? 'クリエイティブ' : 'サバイバル'}」で開始しました！ (左クリックでブロック設置・着火石使用可能 / Eキーで全アイテムカタログ)`, '#55ff55');
            // Guaranteed animal cluster around player upon starting game
            if (this.game.mobManager) {
                this.game.mobManager.spawnAnimalCluster(this.player.x, this.player.z, 10);
            }
            // Start authentic ambient background music automatically from the beginning!
            if (this.game.sound) {
                this.game.sound.init();
                this.game.sound.startAmbientBGM();
            }
            // Commit fresh clean world state
            if (this.game.saveManager) {
                this.game.saveManager.saveWorld();
            }
        }

        renderInventoryModal() {
            // Render 2x2 Crafting Grid
            const craftGrid = document.getElementById('craft-2x2-grid');
            craftGrid.innerHTML = '';
            for (let i = 0; i < 4; i++) {
                craftGrid.innerHTML += this.renderSlot(this.inventory.craft2x2[i], '', false, `window.game.handleSlotClick('craft2x2', ${i})`);
            }

            // Craft Result
            const craftRes = document.getElementById('craft-2x2-result');
            craftRes.innerHTML = this.renderSlot(this.inventory.craftResult, 'result', false, `window.game.handleCraftResultClick(false)`);

            // Main Inventory Slots (9 to 35)
            const mainGrid = document.getElementById('inv-main-grid');
            mainGrid.innerHTML = '';
            for (let i = 9; i < 36; i++) {
                mainGrid.innerHTML += this.renderSlot(this.inventory.slots[i], '', false, `window.game.handleSlotClick('player', ${i})`);
            }

            // Hotbar Slots (0 to 8)
            const hotbarGrid = document.getElementById('inv-hotbar-grid');
            hotbarGrid.innerHTML = '';
            for (let i = 0; i < 9; i++) {
                hotbarGrid.innerHTML += this.renderSlot(this.inventory.slots[i], '', false, `window.game.handleSlotClick('player', ${i})`);
            }
        }

        renderCraftingModal() {
            // Render 3x3 Crafting Grid
            const craftGrid = document.getElementById('craft-3x3-grid');
            craftGrid.innerHTML = '';
            for (let i = 0; i < 9; i++) {
                craftGrid.innerHTML += this.renderSlot(this.inventory.craft3x3[i], '', false, `window.game.handleSlotClick('craft3x3', ${i})`);
            }

            // Craft Result
            const craftRes = document.getElementById('craft-3x3-result');
            craftRes.innerHTML = this.renderSlot(this.inventory.craftResult, 'result', false, `window.game.handleCraftResultClick(true)`);

            // Render Player Slots Below
            this.renderPlayerSlotsForModal('crafting-player-slots');
        }

        renderFurnaceModal() {
            const f = this.inventory.furnace;
            const inputSlot = document.getElementById('furnace-input');
            const fuelSlot = document.getElementById('furnace-fuel');
            const outputSlot = document.getElementById('furnace-output');
            const flame = document.getElementById('furnace-flame');
            const arrow = document.getElementById('furnace-arrow');

            inputSlot.innerHTML = f.input ? `<img src="${this.game.atlas?.getItemIconDataURL(f.input.item)}" class="item-icon"><div class="count">${f.input.count > 1 ? f.input.count : ''}</div>` : '';
            fuelSlot.innerHTML = f.fuel ? `<img src="${this.game.atlas?.getItemIconDataURL(f.fuel.item)}" class="item-icon"><div class="count">${f.fuel.count > 1 ? f.fuel.count : ''}</div>` : '';
            outputSlot.innerHTML = f.output ? `<img src="${this.game.atlas?.getItemIconDataURL(f.output.item)}" class="item-icon"><div class="count">${f.output.count > 1 ? f.output.count : ''}</div>` : '';

            // Update burning flame animation & progress
            if (f.burnTime > 0) flame.classList.add('active');
            else flame.classList.remove('active');

            const cookPercent = Math.min(100, (f.cookTime / f.cookMax) * 100);
            arrow.style.width = `${cookPercent}%`;

            this.renderPlayerSlotsForModal('furnace-player-slots');
        }

        renderChestModal() {
            const chestGrid = document.getElementById('chest-grid');
            chestGrid.innerHTML = '';
            for (let i = 0; i < 27; i++) {
                chestGrid.innerHTML += this.renderSlot(this.inventory.chestSlots[i], '', false, `window.game.handleSlotClick('chest', ${i})`);
            }
            this.renderPlayerSlotsForModal('chest-player-slots');
        }

        renderPlayerSlotsForModal(targetContainerId) {
            const container = document.getElementById(targetContainerId);
            if (!container) return;
            container.innerHTML = '';
            // Main 27
            for (let i = 9; i < 36; i++) {
                container.innerHTML += this.renderSlot(this.inventory.slots[i], '', false, `window.game.handleSlotClick('player', ${i})`);
            }
            // Hotbar 9
            for (let i = 0; i < 9; i++) {
                container.innerHTML += this.renderSlot(this.inventory.slots[i], 'hotbar-slot', false, `window.game.handleSlotClick('player', ${i})`);
            }
        }

        renderCreativeCatalog() {
            this.initCreativeCatalog(this.currentCatalogFilter || 'all');
        }

        filterCatalog(category, btnEl) {
            this.currentCatalogFilter = category;
            if (btnEl && btnEl.parentElement) {
                const btns = btnEl.parentElement.querySelectorAll('.catalog-tab-btn');
                btns.forEach(b => b.classList.remove('active'));
                btnEl.classList.add('active');
            }
            this.initCreativeCatalog(category);
        }

        initCreativeCatalog(filterCategory = 'all') {
            const catalogGrid = document.getElementById('creative-catalog-grid');
            if (!catalogGrid) return;
            catalogGrid.innerHTML = '';

            const featuredKeys = [
                'flint_and_steel', 'tnt', 'cluster_tnt', 'fire_charge',
                'obsidian', 'grass', 'cobblestone', 'oak_planks',
                'bricks', 'stone_bricks', 'glass', 'glowstone',
                'torch', 'bed', 'water_bucket', 'lava_bucket',
                'bucket', 'bow', 'arrow', 'ender_pearl',
                'bone_meal', 'sapling', 'shears', 'spyglass',
                'diamond_sword', 'netherite_sword', 'diamond_pickaxe', 'netherite_pickaxe',
                'astral_blade', 'laser_drill', 'gravity_boots', 'jetpack'
            ];
            const featuredSet = new Set(featuredKeys);

            const items = window.ITEMS;
            const allKeys = Object.keys(items);

            // Order: 1. Featured items -> 2. Blocks -> 3. Tools/Combat -> 4. Food/Materials
            const orderedKeys = [];
            featuredKeys.forEach(k => {
                if (items[k]) orderedKeys.push(k);
            });
            allKeys.forEach(k => {
                if (!featuredSet.has(k) && items[k]?.blockId) orderedKeys.push(k);
            });
            allKeys.forEach(k => {
                if (!featuredSet.has(k) && !items[k]?.blockId && (items[k]?.category === 'tools' || items[k]?.category === 'combat' || items[k]?.category === 'armor' || items[k]?.category === 'custom')) {
                    orderedKeys.push(k);
                }
            });
            allKeys.forEach(k => {
                if (!orderedKeys.includes(k)) orderedKeys.push(k);
            });

            for (const k of orderedKeys) {
                const item = items[k];
                if (!item) continue;

                const isFeatured = featuredSet.has(k);
                if (filterCategory === 'featured' && !isFeatured) continue;
                if (filterCategory === 'blocks' && !item.blockId) continue;
                if (filterCategory === 'tools' && item.blockId && item.category !== 'tools' && item.category !== 'combat') continue;
                if (filterCategory === 'tools' && !item.blockId && item.category !== 'tools' && item.category !== 'combat' && item.category !== 'armor' && item.category !== 'custom') continue;
                if (filterCategory === 'food' && (item.blockId || (item.category !== 'food' && item.category !== 'materials'))) continue;

                const isCustom = (item.category === 'custom' || item.customAbility);
                const extraCls = isCustom ? 'custom-item' : (isFeatured ? 'featured-item' : '');
                const iconUrl = this.game?.atlas?.getItemIconDataURL(k) || '';
                const shortName = this.getShortName(k);
                catalogGrid.innerHTML += `
                    <div class="slot ${extraCls}" title="${item.nameJa || item.name}${item.desc ? ' - ' + item.desc : ''}" onclick="window.game.pickCreativeItem('${k}')">
                        <img src="${iconUrl}" class="item-icon" alt="">
                        <div class="slot-label">${shortName}</div>
                        ${isCustom ? '<span class="badge">★</span>' : (k === 'flint_and_steel' || k === 'tnt' ? '<span class="badge">🔥</span>' : '')}
                    </div>
                `;
            }
        }

        openChat() {
            this.chatContainer.style.display = 'block';
            this.chatInput.focus();
            document.exitPointerLock();
        }

        closeChat() {
            this.chatContainer.style.display = 'none';
            this.chatInput.value = '';
            this.game.requestPointerLock();
        }

        addChatMessage(text, color = '#ffffff') {
            const msg = document.createElement('div');
            msg.className = 'chat-line';
            msg.style.color = color;
            msg.textContent = text;
            this.chatMessages.appendChild(msg);
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }

        handleCommand(text) {
            this.addChatMessage(`> ${text}`, '#ffff55');
            const parts = text.split(' ');
            const cmd = parts[0].toLowerCase();

            if (cmd === '/gamemode') {
                const mode = parts[1]?.toLowerCase();
                if (mode === 'creative' || mode === 'c' || mode === '1') {
                    this.player.setGameMode('creative');
                    this.addChatMessage('ゲームモードを「クリエイティブ」に変更しました。', '#55ff55');
                } else if (mode === 'survival' || mode === 's' || mode === '0') {
                    this.player.setGameMode('survival');
                    this.addChatMessage('ゲームモードを「サバイバル」に変更しました。', '#55ff55');
                }
            } else if (cmd === '/ancient' || cmd === '/locate') {
                this.game.teleportToAncientCity();
            } else if (cmd === '/time') {
                if (parts[1] === 'set') {
                    if (parts[2] === 'day') {
                        this.game.timeOfDay = 0.25;
                        this.addChatMessage('時間を昼に設定しました。', '#55ff55');
                    } else if (parts[2] === 'night') {
                        this.game.timeOfDay = 0.75;
                        this.addChatMessage('時間を夜に設定しました。', '#55ff55');
                    }
                }
            } else if (cmd === '/give') {
                const item = parts[1];
                const count = parseInt(parts[2] || '64');
                if (window.ITEMS[item]) {
                    this.inventory.addItem(item, count);
                    this.addChatMessage(`${item} を ${count} 個付与しました。`, '#55ff55');
                } else {
                    this.addChatMessage(`アイテム ${item} が見つかりません。`, '#ff5555');
                }
            } else if (cmd === '/tp') {
                const tx = parseFloat(parts[1]);
                const ty = parseFloat(parts[2]);
                const tz = parseFloat(parts[3]);
                if (!isNaN(tx) && !isNaN(ty) && !isNaN(tz)) {
                    this.player.x = tx;
                    this.player.y = ty;
                    this.player.z = tz;
                    this.player.velocity.set(0, 0, 0);
                    this.addChatMessage(`座標 (${tx}, ${ty}, ${tz}) にテレポートしました。`, '#55ff55');
                }
            } else if (cmd === '/help') {
                this.addChatMessage('利用可能なコマンド: /gamemode [creative|survival], /ancient (古代都市へ移動), /time set [day|night], /give [item] [count], /tp [x] [y] [z]', '#aaffaa');
            } else {
                this.addChatMessage(`不明なコマンドです: ${cmd} (/help で一覧表示)`, '#ff5555');
            }
        }
    }

    global.UIManager = UIManager;
})(window);
