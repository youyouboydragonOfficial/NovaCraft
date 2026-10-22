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
            this.slots = new Array(36).fill(null);
            this.slots[0] = { item: 'grass', count: 64 };
            this.slots[1] = { item: 'cobblestone', count: 64 };
            this.slots[2] = { item: 'oak_planks', count: 64 };
            this.slots[3] = { item: 'tnt', count: 64 };
            this.slots[4] = { item: 'flint_and_steel', count: 1 };
            this.slots[5] = { item: 'obsidian', count: 64 };
            this.slots[6] = { item: 'water_bucket', count: 1 };
            this.slots[7] = { item: 'diamond_sword', count: 1 };
            this.slots[8] = { item: 'bow', count: 1 };

            // Populate Chest loot (found in Ancient City shrines & Village houses!)
            this.chestSlots = new Array(27).fill(null);
            this.chestSlots[0] = { item: 'echo_shard', count: 5 };
            this.chestSlots[1] = { item: 'flint_and_steel', count: 1 };
            this.chestSlots[2] = { item: 'golden_apple', count: 3 };
            this.chestSlots[3] = { item: 'tnt', count: 16 };
            this.chestSlots[4] = { item: 'diamond_sword', count: 1 };
            this.chestSlots[5] = { item: 'bow', count: 1 };
            this.chestSlots[6] = { item: 'diamond_pickaxe', count: 1 };
            this.chestSlots[7] = { item: 'arrow', count: 32 };
            this.chestSlots[8] = { item: 'soul_lantern', count: 16 };
            this.chestSlots[9] = { item: 'ender_pearl', count: 8 };
            this.chestSlots[10] = { item: 'water_bucket', count: 1 };
            this.chestSlots[11] = { item: 'netherite_sword', count: 1 };
            this.chestSlots[12] = { item: 'diamond', count: 8 };
            this.chestSlots[13] = { item: 'astral_blade', count: 1 };
            this.chestSlots[14] = { item: 'bread', count: 12 };
        }

        getSelectedItem() {
            return this.slots[this.selectedHotbarIndex];
        }

        hasItem(itemKey) {
            for (let i = 0; i < 36; i++) {
                if (this.slots[i] && this.slots[i].item === itemKey) return true;
            }
            return false;
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
                const itemKey = item.item;
                this.slots[this.selectedHotbarIndex] = null;
                // Auto-refill hotbar slot from inventory if more of same item exists!
                for (let i = 9; i < 36; i++) {
                    if (this.slots[i] && this.slots[i].item === itemKey) {
                        this.slots[this.selectedHotbarIndex] = this.slots[i];
                        this.slots[i] = null;
                        break;
                    }
                }
            }
        }

        // Check Crafting Recipes (Supports 1..N shapeless recipes, 2x2 in 3x3, and 3x3 patterns)
        updateCraftResult(is3x3 = false) {
            const grid = is3x3 ? this.craft3x3 : this.craft2x2;
            this.craftResult = null;

            // Collect non-empty items currently in grid
            const presentItems = [];
            for (let g = 0; g < grid.length; g++) {
                if (grid[g] && grid[g].item) {
                    presentItems.push(grid[g].item);
                }
            }
            if (presentItems.length === 0) return;

            const recipes = window.RECIPES;
            for (let r = 0; r < recipes.length; r++) {
                const recipe = recipes[r];
                if (recipe.grid === 3 && !is3x3) continue;

                // 1. Shapeless ingredient match (1, 2, or more ingredients anywhere in grid!)
                if (recipe.ingredients && recipe.ingredients.length >= 1) {
                    if (presentItems.length === recipe.ingredients.length) {
                        const sortedPresent = presentItems.slice().sort();
                        const sortedReq = recipe.ingredients.slice().sort();
                        let allMatch = true;
                        for (let i = 0; i < sortedReq.length; i++) {
                            if (sortedPresent[i] !== sortedReq[i]) {
                                allMatch = false;
                                break;
                            }
                        }
                        if (allMatch) {
                            this.craftResult = { item: recipe.output.item, count: recipe.output.count };
                            return;
                        }
                    }
                }

                // 2. Pattern match
                if (recipe.pattern) {
                    const pat = recipe.pattern;
                    if (pat.length === grid.length) {
                        let matches = true;
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
                    } else if (pat.length === 4 && grid.length === 9) {
                        // Allow 2x2 pattern recipes inside any 2x2 sub-grid of the 3x3 Crafting Table!
                        for (let rowOff = 0; rowOff <= 1; rowOff++) {
                            for (let colOff = 0; colOff <= 1; colOff++) {
                                let matches = true;
                                for (let rIdx = 0; rIdx < 3; rIdx++) {
                                    for (let cIdx = 0; cIdx < 3; cIdx++) {
                                        const gItem = grid[rIdx * 3 + cIdx] ? grid[rIdx * 3 + cIdx].item : null;
                                        const inSub = (rIdx >= rowOff && rIdx < rowOff + 2 && cIdx >= colOff && cIdx < colOff + 2);
                                        const req = inSub ? pat[(rIdx - rowOff) * 2 + (cIdx - colOff)] : null;
                                        if (gItem !== req) {
                                            matches = false;
                                            break;
                                        }
                                    }
                                    if (!matches) break;
                                }
                                if (matches) {
                                    this.craftResult = { item: recipe.output.item, count: recipe.output.count };
                                    return;
                                }
                            }
                        }
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
