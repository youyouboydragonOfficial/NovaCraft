// World Save / Load & JSON Export / Import for NovaCraft
(function(global) {
    class SaveManager {
        constructor(game) {
            this.game = game;
            this.saveKey = 'NovaCraft_Save_v170';
        }

        saveWorld() {
            try {
                const p = this.game.player;
                const inv = this.game.inventory;

                // Collect modified blocks
                const modifiedBlocks = {};
                for (let [key, chunk] of this.game.world.chunks) {
                    // Save chunk block modifications
                    const data = Array.from(chunk.data);
                    // Compress / store non-zero entries or full array
                    modifiedBlocks[key] = data;
                }

                const saveData = {
                    version: '1.0.0',
                    timestamp: Date.now(),
                    player: {
                        x: p.x, y: Math.max(p.y, 3.0), z: p.z,
                        yaw: p.yaw, pitch: p.pitch,
                        health: p.health, food: p.food,
                        gameMode: p.gameMode
                    },
                    inventory: {
                        slots: inv.slots,
                        chestSlots: inv.chestSlots,
                        selectedIndex: inv.selectedHotbarIndex
                    },
                    timeOfDay: this.game.timeOfDay,
                    modifiedChunks: modifiedBlocks
                };

                localStorage.setItem(this.saveKey, JSON.stringify(saveData));
                return true;
            } catch (err) {
                console.warn('Save failed (storage limit or error):', err);
                return false;
            }
        }

        loadWorld() {
            try {
                const raw = localStorage.getItem(this.saveKey);
                if (!raw) return false;
                const data = JSON.parse(raw);

                const p = this.game.player;
                const inv = this.game.inventory;

                // Restore Player
                if (data.player) {
                    p.x = data.player.x;
                    p.y = data.player.y;
                    p.z = data.player.z;
                    p.yaw = data.player.yaw;
                    p.pitch = data.player.pitch;
                    p.health = data.player.health;
                    p.food = data.player.food;
                    p.gameMode = data.player.gameMode || 'survival';

                    // Sanitize position to guarantee surface spawn
                    const surfaceY = this.game.world.getHighestSolidY(Math.floor(p.x), Math.floor(p.z));
                    if (p.y < 3.0 || isNaN(p.y) || p.y < surfaceY - 1.0) {
                        p.y = surfaceY + 1.8;
                        p.velocity.set(0, 0, 0);
                    }
                }

                // Restore Inventory
                if (data.inventory) {
                    inv.slots = data.inventory.slots || inv.slots;
                    inv.chestSlots = data.inventory.chestSlots || inv.chestSlots;
                    inv.selectedHotbarIndex = data.inventory.selectedIndex || 0;
                    if (!inv.slots || inv.slots.slice(0, 9).every(s => !s)) {
                        inv.initDefaultItems();
                    }
                }

                // Restore Time
                if (data.timeOfDay !== undefined) {
                    this.game.timeOfDay = data.timeOfDay;
                }

                // Restore Chunk Data
                if (data.modifiedChunks) {
                    for (let key in data.modifiedChunks) {
                        const [cx, cz] = key.split(',').map(Number);
                        const chunk = this.game.world.getOrCreateChunk(cx, cz);
                        chunk.data.set(data.modifiedChunks[key]);
                        chunk.generated = true;
                        chunk.isDirty = true;
                        this.game.world.rebuildChunkMesh(chunk);
                    }
                }

                return true;
            } catch (err) {
                console.error('Failed to load save:', err);
                return false;
            }
        }

        exportJSON() {
            this.saveWorld();
            const raw = localStorage.getItem(this.saveKey);
            if (!raw) return;

            const blob = new Blob([raw], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `NovaCraft_World_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        importJSON(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    localStorage.setItem(this.saveKey, e.target.result);
                    this.loadWorld();
                    alert('ワールドの読み込みに成功しました！');
                } catch (err) {
                    alert('ファイルの読み込みに失敗しました: ' + err.message);
                }
            };
            reader.readAsText(file);
        }
    }

    global.SaveManager = SaveManager;
})(window);
