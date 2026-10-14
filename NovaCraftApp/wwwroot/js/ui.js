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

        renderSlot(item, extraClass = '', isSelected = false, clickHandler = '') {
            if (!item) {
                return `<div class="slot ${isSelected ? 'selected' : ''} ${extraClass}" ${clickHandler ? `onclick="${clickHandler}"` : ''}></div>`;
            }
            const iconUrl = this.game.atlas?.getItemIconDataURL(item.item) || '';
            return `
                <div class="slot ${isSelected ? 'selected' : ''} ${extraClass}" ${clickHandler ? `onclick="${clickHandler}"` : ''}>
                    <img src="${iconUrl}" class="item-icon" alt="">
                    ${item.count > 1 ? `<div class="count">${item.count}</div>` : ''}
                </div>
            `;
        }

        renderHUD() {
            // 1. Health Hearts (10 hearts = 20 HP)
            if (this.player.gameMode === 'survival') {
                this.heartsContainer.style.display = 'flex';
                this.foodContainer.style.display = 'flex';

                let heartsHTML = '';
                const hp = Math.ceil(this.player.health);
                for (let i = 0; i < 10; i++) {
                    const heartVal = hp - i * 2;
                    if (heartVal >= 2) heartsHTML += '<span class="heart full">❤</span>';
                    else if (heartVal === 1) heartsHTML += '<span class="heart half">❤</span>';
                    else heartsHTML += '<span class="heart empty">♡</span>';
                }
                this.heartsContainer.innerHTML = heartsHTML;

                // 2. Food Icons (10 drumsticks = 20 Food)
                let foodHTML = '';
                const food = Math.ceil(this.player.food);
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

            // 3. Oxygen bubbles (Only if head is in water or recovering breath)
            if ((this.player.headInWater || this.player.oxygen < this.player.maxOxygen) && this.player.gameMode === 'survival') {
                this.oxygenContainer.style.display = 'flex';
                let oxyHTML = '';
                const bubbleCount = Math.ceil((this.player.oxygen / this.player.maxOxygen) * 10);
                for (let i = 0; i < 10; i++) {
                    oxyHTML += (i < bubbleCount) ? '<span class="bubble">🫧</span>' : '';
                }
                this.oxygenContainer.innerHTML = oxyHTML;
            } else {
                this.oxygenContainer.style.display = 'none';
            }

            // 4. Hotbar Slots (Clean Pixel Art Icons Only - NO raw text!)
            let hotbarHTML = '';
            for (let i = 0; i < 9; i++) {
                const item = this.inventory.slots[i];
                const isSelected = (i === this.inventory.selectedHotbarIndex);
                hotbarHTML += this.renderSlot(item, '', isSelected, `window.game.inventory.selectedHotbarIndex = ${i}; window.game.ui.renderHUD();`);
            }
            this.hotbarContainer.innerHTML = hotbarHTML;

            // 5. Tooltip for selected item (Fade in on change, then fade out)
            const curIdx = this.inventory.selectedHotbarIndex;
            if (curIdx !== this.lastSelectedHotbarIndex) {
                this.lastSelectedHotbarIndex = curIdx;
                const curItem = this.inventory.getSelectedItem();
                if (curItem) {
                    const def = window.ITEMS[curItem.item];
                    this.itemTooltip.textContent = `${def?.nameJa || def?.name || curItem.item}`;
                    this.itemTooltip.style.opacity = '1';
                    if (this.tooltipFadeTimer) clearTimeout(this.tooltipFadeTimer);
                    this.tooltipFadeTimer = setTimeout(() => {
                        this.itemTooltip.style.opacity = '0';
                    }, 2200);
                } else {
                    this.itemTooltip.style.opacity = '0';
                }
            }

            // 6. Debug Info (F3)
            if (this.game.showDebug) {
                this.debugOverlay.style.display = 'block';
                this.debugOverlay.innerHTML = `
                    <b>NovaCraft Infinite v1.0.0</b> (${this.player.gameMode})<br>
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

        selectGameMode(mode) {
            console.log("selectGameMode executing:", mode);
            this.player.gameMode = mode;
            if (mode === 'creative') {
                this.player.flying = false;
            }
            this.closeModal();
            this.renderHUD();
            this.addChatMessage(`★ ゲームモード「${mode === 'creative' ? 'クリエイティブ' : 'サバイバル'}」で開始しました！`, '#55ff55');
            // Guaranteed animal cluster around player upon starting game
            if (this.game.mobManager) {
                this.game.mobManager.spawnAnimalCluster(this.player.x, this.player.z, 10);
            }
            // Start authentic ambient background music automatically from the beginning!
            if (this.game.sound) {
                this.game.sound.init();
                this.game.sound.startAmbientBGM();
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

        initCreativeCatalog() {
            const catalogGrid = document.getElementById('creative-catalog-grid');
            if (!catalogGrid) return;
            catalogGrid.innerHTML = '';

            const items = window.ITEMS;
            for (let k in items) {
                const item = items[k];
                const isCustom = (item.category === 'custom' || item.customAbility);
                const iconUrl = this.game?.atlas?.getItemIconDataURL(k) || '';
                catalogGrid.innerHTML += `
                    <div class="slot ${isCustom ? 'custom-item' : ''}" title="${item.nameJa || item.name} - ${item.desc || ''}" onclick="window.game.pickCreativeItem('${k}')">
                        <img src="${iconUrl}" class="item-icon" alt="">
                        ${isCustom ? '<span class="badge">★</span>' : ''}
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
                if (mode === 'creative' || mode === 'c') {
                    this.player.gameMode = 'creative';
                    this.addChatMessage('ゲームモードを「クリエイティブ」に変更しました。', '#55ff55');
                } else if (mode === 'survival' || mode === 's') {
                    this.player.gameMode = 'survival';
                    this.player.flying = false;
                    this.addChatMessage('ゲームモードを「サバイバル」に変更しました。', '#55ff55');
                }
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
                    this.addChatMessage(`座標 (${tx}, ${ty}, ${tz}) にテレポートしました。`, '#55ff55');
                }
            } else if (cmd === '/help') {
                this.addChatMessage('利用可能なコマンド: /gamemode [creative|survival], /time set [day|night], /give [item] [count], /tp [x] [y] [z]', '#aaffaa');
            } else {
                this.addChatMessage(`不明なコマンドです: ${cmd} (/help で一覧表示)`, '#ff5555');
            }
        }
    }

    global.UIManager = UIManager;
})(window);
