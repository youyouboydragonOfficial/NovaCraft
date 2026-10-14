// Inventory System, Crafting Table, Furnace, Chest & Creative Palette for NovaCraft
(function(global) {
    class Inventory {
        constructor() {
            // Hotbar (9) + Main (27) = 36 total player slots
            this.slots = new Array(36).fill(null);
            this.selectedHotbarIndex = 0;

            // Crafting grids
            this.craft2x2 = new Array(4).fill(null);
            this.craft3x3 = new Array(9).fill(null);
            this.craftResult = null;

            // Furnace slots: { input, fuel, output, burnTime, burnMax, cookTime, cookMax }
            this.furnace = {
                input: null,
                fuel: null,
                output: null,
                burnTime: 0,
                burnMax: 0,
                cookTime: 0,
                cookMax: 8.0
            };

            // Chest slots (27)
            this.chestSlots = new Array(27).fill(null);

            // Cursor held item for UI drag/drop
            this.cursorItem = null;

            // Current UI open mode: 'none', 'title', 'inventory', 'crafting', 'furnace', 'chest', 'creative'
            this.openMode = 'title';

            this.initDefaultItems();
        }

        initDefaultItems() {
            // Give player some starter items in hotbar
            this.slots[0] = { item: 'wooden_pickaxe', count: 1, durability: 60 };
            this.slots[1] = { item: 'wooden_sword', count: 1, durability: 60 };
            this.slots[2] = { item: 'oak_log', count: 16 };
            this.slots[3] = { item: 'torch', count: 12 };
            this.slots[4] = { item: 'apple', count: 5 };
            // Original starter trial
            this.slots[5] = { item: 'astral_blade', count: 1 };
            this.slots[6] = { item: 'laser_drill', count: 1 };
            this.slots[7] = { item: 'gravity_boots', count: 1 };
            this.slots[8] = { item: 'cluster_tnt', count: 8 };
        }

        getSelectedItem() {
            return this.slots[this.selectedHotbarIndex];
        }

        addItem(itemKey, count = 1) {
            const itemDef = window.ITEMS[itemKey];
            if (!itemDef) return false;
            const maxStack = itemDef.maxStack || 64;

            // 1. Try stacking onto existing non-full slots
            for (let i = 0; i < 36; i++) {
                if (this.slots[i] && this.slots[i].item === itemKey && this.slots[i].count < maxStack) {
                    const space = maxStack - this.slots[i].count;
                    const addAmount = Math.min(space, count);
                    this.slots[i].count += addAmount;
                    count -= addAmount;
                    if (count <= 0) return true;
                }
            }

            // 2. Put into first empty slot
            for (let i = 0; i < 36; i++) {
                if (!this.slots[i]) {
                    this.slots[i] = { item: itemKey, count: count };
                    return true;
                }
            }
            return false; // inventory full
        }

        consumeSelectedItem(amount = 1) {
            const item = this.slots[this.selectedHotbarIndex];
            if (!item) return;
            item.count -= amount;
            if (item.count <= 0) {
                this.slots[this.selectedHotbarIndex] = null;
            }
        }

        // Check Crafting Recipes
        updateCraftResult(is3x3 = false) {
            const grid = is3x3 ? this.craft3x3 : this.craft2x2;
            const size = is3x3 ? 3 : 2;
            this.craftResult = null;

            const recipes = window.RECIPES;
            for (let r = 0; r < recipes.length; r++) {
                const recipe = recipes[r];
                if (recipe.grid === 3 && !is3x3) continue;

                // Shapeless single ingredient match (e.g. log -> 4 planks)
                if (recipe.ingredients && recipe.ingredients.length === 1) {
                    let matchCount = 0;
                    let extraItem = false;
                    for (let g = 0; g < grid.length; g++) {
                        if (grid[g]) {
                            if (grid[g].item === recipe.ingredients[0]) matchCount++;
                            else extraItem = true;
                        }
                    }
                    if (matchCount === 1 && !extraItem) {
                        this.craftResult = { item: recipe.output.item, count: recipe.output.count };
                        return;
                    }
                }

                // Pattern match
                if (recipe.pattern) {
                    let matches = true;
                    const pat = recipe.pattern;
                    for (let p = 0; p < pat.length; p++) {
                        const required = pat[p];
                        const current = grid[p] ? grid[p].item : null;
                        if (required !== current) {
                            matches = false;
                            break;
                        }
                    }
                    if (matches) {
                        this.craftResult = { item: recipe.output.item, count: recipe.output.count };
                        return;
                    }
                }
            }
        }

        takeCraftResult(is3x3 = false) {
            if (!this.craftResult) return;
            const grid = is3x3 ? this.craft3x3 : this.craft2x2;

            // Reduce 1 from all grid slots
            for (let i = 0; i < grid.length; i++) {
                if (grid[i]) {
                    grid[i].count--;
                    if (grid[i].count <= 0) grid[i] = null;
                }
            }
            this.updateCraftResult(is3x3);
        }

        // Furnace Update Tick
        updateFurnace(dt) {
            const f = this.furnace;

            // Burn fuel
            if (f.burnTime > 0) {
                f.burnTime -= dt;
            } else if (f.input && f.fuel) {
                // Ignite fuel if input needs cooking
                const recipe = window.SMELTING_RECIPES[f.input.item];
                if (recipe) {
                    const fuelDef = window.ITEMS[f.fuel.item];
                    const burnPower = fuelDef?.fuelTime || (f.fuel.item.includes('plank') || f.fuel.item.includes('log') ? 15 : 0);
                    if (burnPower > 0) {
                        f.fuel.count--;
                        if (f.fuel.count <= 0) f.fuel = null;
                        f.burnTime = burnPower;
                        f.burnMax = burnPower;
                    }
                }
            }

            // Cook progress
            if (f.burnTime > 0 && f.input) {
                const recipe = window.SMELTING_RECIPES[f.input.item];
                if (recipe) {
                    f.cookTime += dt;
                    if (f.cookTime >= f.cookMax) {
                        // Finished 1 item
                        f.cookTime = 0;
                        f.input.count--;
                        if (f.input.count <= 0) f.input = null;

                        if (!f.output) {
                            f.output = { item: recipe.output, count: 1 };
                        } else if (f.output.item === recipe.output) {
                            f.output.count++;
                        }
                    }
                } else {
                    f.cookTime = 0;
                }
            } else {
                f.cookTime = Math.max(0, f.cookTime - dt);
            }
        }
    }

    global.Inventory = Inventory;
})(window);
