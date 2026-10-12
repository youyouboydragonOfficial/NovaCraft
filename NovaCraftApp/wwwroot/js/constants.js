// Game Constants and Definitions for NovaCraft
(function(global) {
    const BLOCKS = {
        AIR: { id: 0, name: 'Air', nameJa: '空気', solid: false, transparent: true },
        GRASS: { id: 1, name: 'Grass Block', nameJa: '草ブロック', solid: true, hardness: 0.6, tool: 'shovel', drop: 'dirt', sound: 'grass' },
        DIRT: { id: 2, name: 'Dirt', nameJa: '土', solid: true, hardness: 0.5, tool: 'shovel', drop: 'dirt', sound: 'gravel' },
        STONE: { id: 3, name: 'Stone', nameJa: '石', solid: true, hardness: 1.5, tool: 'pickaxe', drop: 'cobblestone', sound: 'stone' },
        COBBLESTONE: { id: 4, name: 'Cobblestone', nameJa: '丸石', solid: true, hardness: 2.0, tool: 'pickaxe', drop: 'cobblestone', sound: 'stone' },
        BEDROCK: { id: 5, name: 'Bedrock', nameJa: '岩盤', solid: true, hardness: Infinity, tool: 'none', sound: 'stone' },
        SAND: { id: 6, name: 'Sand', nameJa: '砂', solid: true, hardness: 0.5, tool: 'shovel', drop: 'sand', sound: 'sand' },
        GRAVEL: { id: 7, name: 'Gravel', nameJa: '砂利', solid: true, hardness: 0.6, tool: 'shovel', drop: 'gravel', sound: 'gravel' },
        OAK_LOG: { id: 8, name: 'Oak Log', nameJa: 'オークの原木', solid: true, hardness: 2.0, tool: 'axe', drop: 'oak_log', sound: 'wood' },
        OAK_PLANKS: { id: 9, name: 'Oak Planks', nameJa: 'オークの木材', solid: true, hardness: 2.0, tool: 'axe', drop: 'oak_planks', sound: 'wood' },
        OAK_LEAVES: { id: 10, name: 'Oak Leaves', nameJa: 'オークの葉', solid: true, transparent: true, hardness: 0.2, tool: 'shears', drop: 'sapling', sound: 'grass' },
        BIRCH_LOG: { id: 11, name: 'Birch Log', nameJa: '白樺の原木', solid: true, hardness: 2.0, tool: 'axe', drop: 'birch_log', sound: 'wood' },
        BIRCH_PLANKS: { id: 12, name: 'Birch Planks', nameJa: '白樺の木材', solid: true, hardness: 2.0, tool: 'axe', drop: 'birch_planks', sound: 'wood' },
        BIRCH_LEAVES: { id: 13, name: 'Birch Leaves', nameJa: '白樺の葉', solid: true, transparent: true, hardness: 0.2, tool: 'shears', drop: 'sapling', sound: 'grass' },
        GLASS: { id: 14, name: 'Glass', nameJa: 'ガラス', solid: true, transparent: true, hardness: 0.3, tool: 'none', drop: null, sound: 'stone' },
        COAL_ORE: { id: 15, name: 'Coal Ore', nameJa: '石炭鉱石', solid: true, hardness: 3.0, tool: 'pickaxe', drop: 'coal', sound: 'stone' },
        IRON_ORE: { id: 16, name: 'Iron Ore', nameJa: '鉄鉱石', solid: true, hardness: 3.0, tool: 'pickaxe', drop: 'raw_iron', sound: 'stone' },
        GOLD_ORE: { id: 17, name: 'Gold Ore', nameJa: '金鉱石', solid: true, hardness: 3.0, tool: 'pickaxe', drop: 'raw_gold', sound: 'stone' },
        DIAMOND_ORE: { id: 18, name: 'Diamond Ore', nameJa: 'ダイヤモンド鉱石', solid: true, hardness: 3.5, tool: 'pickaxe', drop: 'diamond', sound: 'stone' },
        REDSTONE_ORE: { id: 19, name: 'Redstone Ore', nameJa: 'レッドストーン鉱石', solid: true, hardness: 3.0, tool: 'pickaxe', drop: 'redstone', light: 0.3, sound: 'stone' },
        EMERALD_ORE: { id: 20, name: 'Emerald Ore', nameJa: 'エメラルド鉱石', solid: true, hardness: 3.5, tool: 'pickaxe', drop: 'emerald', sound: 'stone' },
        LAPIS_ORE: { id: 21, name: 'Lapis Ore', nameJa: 'ラピスラズリ鉱石', solid: true, hardness: 3.0, tool: 'pickaxe', drop: 'lapis', sound: 'stone' },
        IRON_BLOCK: { id: 22, name: 'Block of Iron', nameJa: '鉄ブロック', solid: true, hardness: 5.0, tool: 'pickaxe', drop: 'iron_block', sound: 'metal' },
        GOLD_BLOCK: { id: 23, name: 'Block of Gold', nameJa: '金ブロック', solid: true, hardness: 3.0, tool: 'pickaxe', drop: 'gold_block', sound: 'metal' },
        DIAMOND_BLOCK: { id: 24, name: 'Block of Diamond', nameJa: 'ダイヤブロック', solid: true, hardness: 5.0, tool: 'pickaxe', drop: 'diamond_block', sound: 'metal' },
        BRICKS: { id: 25, name: 'Bricks', nameJa: 'レンガ', solid: true, hardness: 2.0, tool: 'pickaxe', drop: 'bricks', sound: 'stone' },
        BOOKSHELF: { id: 26, name: 'Bookshelf', nameJa: '本棚', solid: true, hardness: 1.5, tool: 'axe', drop: 'bookshelf', sound: 'wood' },
        OBSIDIAN: { id: 27, name: 'Obsidian', nameJa: '黒曜石', solid: true, hardness: 10.0, tool: 'pickaxe', drop: 'obsidian', sound: 'stone' },
        CRAFTING_TABLE: { id: 28, name: 'Crafting Table', nameJa: '作業台', solid: true, hardness: 2.5, tool: 'axe', drop: 'crafting_table', sound: 'wood', isInteractive: true },
        FURNACE: { id: 29, name: 'Furnace', nameJa: 'かまど', solid: true, hardness: 3.5, tool: 'pickaxe', drop: 'furnace', sound: 'stone', isInteractive: true },
        CHEST: { id: 30, name: 'Chest', nameJa: 'チェスト', solid: true, hardness: 2.5, tool: 'axe', drop: 'chest', sound: 'wood', isInteractive: true },
        TORCH: { id: 31, name: 'Torch', nameJa: '松明', solid: false, transparent: true, hardness: 0.0, drop: 'torch', light: 1.0, sound: 'wood' },
        TNT: { id: 32, name: 'TNT', nameJa: 'TNT爆薬', solid: true, hardness: 0.0, drop: 'tnt', sound: 'grass', isTnt: true },
        WATER: { id: 33, name: 'Water', nameJa: '水', solid: false, liquid: true, transparent: true, hardness: 100, sound: 'water' },
        LAVA: { id: 34, name: 'Lava', nameJa: '溶岩', solid: false, liquid: true, transparent: false, hardness: 100, light: 1.0, sound: 'water' },
        SNOW: { id: 35, name: 'Snow Block', nameJa: '雪ブロック', solid: true, hardness: 0.2, tool: 'shovel', drop: 'snowball', sound: 'snow' },
        ICE: { id: 36, name: 'Ice', nameJa: '氷', solid: true, transparent: true, hardness: 0.5, tool: 'pickaxe', drop: null, sound: 'glass' },
        CACTUS: { id: 37, name: 'Cactus', nameJa: 'サボテン', solid: true, hardness: 0.4, drop: 'cactus', sound: 'wood' },
        FLOWER_RED: { id: 38, name: 'Poppy', nameJa: 'ポピー(赤花)', solid: false, transparent: true, hardness: 0.0, drop: 'flower_red', sound: 'grass' },
        FLOWER_YELLOW: { id: 39, name: 'Dandelion', nameJa: 'タンポポ(黄花)', solid: false, transparent: true, hardness: 0.0, drop: 'flower_yellow', sound: 'grass' },
        
        // ★ オリジナル特殊ブロック
        ASTRAL_ORE: { id: 40, name: 'Astral Ore', nameJa: 'アストラル鉱石', solid: true, hardness: 5.0, tool: 'pickaxe', drop: 'astral_crystal', light: 0.8, sound: 'stone', custom: true },
        ASTRAL_BLOCK: { id: 41, name: 'Block of Astral', nameJa: 'アストラルブロック', solid: true, hardness: 6.0, tool: 'pickaxe', drop: 'astral_block', light: 1.0, sound: 'metal', custom: true },
        HEALING_TORCH: { id: 42, name: 'Healing Torch', nameJa: 'ヒーリングトーチ', solid: false, transparent: true, hardness: 0.0, drop: 'healing_torch', light: 0.9, sound: 'wood', custom: true, heals: true },
        WAYGATE: { id: 43, name: 'Waygate Teleporter', nameJa: 'ウェイゲート(テレポート)', solid: true, hardness: 4.0, tool: 'pickaxe', drop: 'waygate', light: 0.7, sound: 'metal', custom: true, isInteractive: true },
        CLUSTER_TNT: { id: 44, name: 'Cluster TNT', nameJa: 'クラスターTNT爆薬', solid: true, hardness: 0.0, drop: 'cluster_tnt', sound: 'grass', custom: true, isClusterTnt: true },
        SPEED_PAD: { id: 45, name: 'Speed Boost Pad', nameJa: 'スピード加速パッド', solid: true, hardness: 1.0, drop: 'speed_pad', light: 0.5, sound: 'metal', custom: true, speedBoost: 2.2 },
        JUMP_PAD: { id: 46, name: 'Jump Pad', nameJa: 'スーパージャンプ台', solid: true, hardness: 1.0, drop: 'jump_pad', light: 0.5, sound: 'metal', custom: true, jumpBoost: 18.0 }
    };

    // Mapping by block ID
    const BLOCK_BY_ID = {};
    for (let k in BLOCKS) {
        BLOCK_BY_ID[BLOCKS[k].id] = BLOCKS[k];
        BLOCKS[k].key = k.toLowerCase();
    }

    const ITEMS = {
        // 基本素材
        stick: { name: 'Stick', nameJa: '棒', category: 'materials', maxStack: 64 },
        coal: { name: 'Coal', nameJa: '石炭', category: 'materials', fuelTime: 80, maxStack: 64 },
        raw_iron: { name: 'Raw Iron', nameJa: '鉄の原石', category: 'materials', maxStack: 64 },
        iron_ingot: { name: 'Iron Ingot', nameJa: '鉄インゴット', category: 'materials', maxStack: 64 },
        raw_gold: { name: 'Raw Gold', nameJa: '金の原石', category: 'materials', maxStack: 64 },
        gold_ingot: { name: 'Gold Ingot', nameJa: '金インゴット', category: 'materials', maxStack: 64 },
        diamond: { name: 'Diamond', nameJa: 'ダイヤモンド', category: 'materials', maxStack: 64 },
        emerald: { name: 'Emerald', nameJa: 'エメラルド', category: 'materials', maxStack: 64 },
        redstone: { name: 'Redstone', nameJa: 'レッドストーンダスト', category: 'materials', maxStack: 64 },
        lapis: { name: 'Lapis Lazuli', nameJa: 'ラピスラズリ', category: 'materials', maxStack: 64 },
        snowball: { name: 'Snowball', nameJa: '雪玉', category: 'materials', maxStack: 16 },
        
        // 食べ物
        apple: { name: 'Apple', nameJa: 'リンゴ', category: 'food', foodRestore: 4, saturation: 2.4, maxStack: 64 },
        bread: { name: 'Bread', nameJa: 'パン', category: 'food', foodRestore: 5, saturation: 6.0, maxStack: 64 },
        raw_beef: { name: 'Raw Beef', nameJa: '生の牛肉', category: 'food', foodRestore: 3, saturation: 1.8, maxStack: 64 },
        cooked_beef: { name: 'Steak', nameJa: 'ステーキ(焼肉)', category: 'food', foodRestore: 8, saturation: 12.8, maxStack: 64 },
        golden_apple: { name: 'Golden Apple', nameJa: '金のリンゴ', category: 'food', foodRestore: 10, heal: 10, maxStack: 64 },

        // ツール (Pickaxes)
        wooden_pickaxe: { name: 'Wooden Pickaxe', nameJa: '木のツルハシ', category: 'tools', toolType: 'pickaxe', tier: 1, speed: 2.0, maxDurability: 60, damage: 2 },
        stone_pickaxe: { name: 'Stone Pickaxe', nameJa: '石のツルハシ', category: 'tools', toolType: 'pickaxe', tier: 2, speed: 4.0, maxDurability: 132, damage: 3 },
        iron_pickaxe: { name: 'Iron Pickaxe', nameJa: '鉄のツルハシ', category: 'tools', toolType: 'pickaxe', tier: 3, speed: 6.0, maxDurability: 250, damage: 4 },
        diamond_pickaxe: { name: 'Diamond Pickaxe', nameJa: 'ダイヤのツルハシ', category: 'tools', toolType: 'pickaxe', tier: 4, speed: 8.5, maxDurability: 1561, damage: 5 },

        // ツール (Axes)
        wooden_axe: { name: 'Wooden Axe', nameJa: '木の斧', category: 'tools', toolType: 'axe', tier: 1, speed: 2.0, maxDurability: 60, damage: 3 },
        stone_axe: { name: 'Stone Axe', nameJa: '石の斧', category: 'tools', toolType: 'axe', tier: 2, speed: 4.0, maxDurability: 132, damage: 4 },
        iron_axe: { name: 'Iron Axe', nameJa: '鉄の斧', category: 'tools', toolType: 'axe', tier: 3, speed: 6.0, maxDurability: 250, damage: 6 },
        diamond_axe: { name: 'Diamond Axe', nameJa: 'ダイヤの斧', category: 'tools', toolType: 'axe', tier: 4, speed: 8.5, maxDurability: 1561, damage: 7 },

        // ツール (Shovels)
        wooden_shovel: { name: 'Wooden Shovel', nameJa: '木のシャベル', category: 'tools', toolType: 'shovel', tier: 1, speed: 2.0, maxDurability: 60, damage: 1 },
        stone_shovel: { name: 'Stone Shovel', nameJa: '石のシャベル', category: 'tools', toolType: 'shovel', tier: 2, speed: 4.0, maxDurability: 132, damage: 2 },
        iron_shovel: { name: 'Iron Shovel', nameJa: '鉄のシャベル', category: 'tools', toolType: 'shovel', tier: 3, speed: 6.0, maxDurability: 250, damage: 3 },
        diamond_shovel: { name: 'Diamond Shovel', nameJa: 'ダイヤのシャベル', category: 'tools', toolType: 'shovel', tier: 4, speed: 8.5, maxDurability: 1561, damage: 4 },

        // 武器 (Swords)
        wooden_sword: { name: 'Wooden Sword', nameJa: '木の剣', category: 'combat', toolType: 'sword', maxDurability: 60, damage: 4 },
        stone_sword: { name: 'Stone Sword', nameJa: '石の剣', category: 'combat', toolType: 'sword', maxDurability: 132, damage: 5 },
        iron_sword: { name: 'Iron Sword', nameJa: '鉄の剣', category: 'combat', toolType: 'sword', maxDurability: 250, damage: 6 },
        diamond_sword: { name: 'Diamond Sword', nameJa: 'ダイヤの剣', category: 'combat', toolType: 'sword', maxDurability: 1561, damage: 8 },

        // ★ オリジナルアイテム
        astral_crystal: { name: 'Astral Crystal', nameJa: 'アストラルクリスタル', category: 'custom', maxStack: 64, desc: '深層から採取された脈動する神秘の結晶' },
        astral_ingot: { name: 'Astral Ingot', nameJa: 'アストラルインゴット', category: 'custom', maxStack: 64, desc: 'アストラルクリスタルを精錬した超合金' },
        astral_blade: { name: 'Astral Blade', nameJa: 'アストラルブレード', category: 'combat', toolType: 'sword', maxDurability: 3000, damage: 14, customAbility: 'shockwave', desc: '右クリックで衝撃波スラッシュを射出する伝説の聖剣' },
        laser_drill: { name: 'Laser Drill', nameJa: '超採掘レーザードリル', category: 'tools', toolType: 'pickaxe', tier: 5, speed: 18.0, maxDurability: 2500, customAbility: 'area_mine', desc: '右クリック長押しで3x3範囲を一気に瞬時粉砕！' },
        gravity_boots: { name: 'Gravity Boots', nameJa: 'グラビティブーツ', category: 'armor', slot: 'boots', customAbility: 'double_jump', desc: '装備時: 落下無効 ＆ 大ジャンプ ＆ 空中2段ジャンプ！' },
        jetpack: { name: 'Jetpack', nameJa: 'ジェットパック', category: 'armor', slot: 'chestplate', customAbility: 'hover_fly', desc: '装備時: Spaceキー長押しで空中高速ジェット噴射！' },
        grappling_hook: { name: 'Grappling Hook', nameJa: 'グラップリングフック', category: 'custom', maxDurability: 500, customAbility: 'hook', desc: '右クリックで目標ブロックに高速ワイヤージャンプ！' }
    };

    // Register all blocks as placeable items as well
    for (let k in BLOCKS) {
        let b = BLOCKS[k];
        if (b.id !== 0 && !ITEMS[b.key]) {
            ITEMS[b.key] = {
                name: b.name,
                nameJa: b.nameJa,
                category: 'blocks',
                blockId: b.id,
                maxStack: 64
            };
        }
    }

    // Crafting Recipes (Grid 2x2 or 3x3)
    // Key format: exact pattern match or shapeless
    const RECIPES = [
        // Shapeless / basic
        { output: { item: 'oak_planks', count: 4 }, ingredients: ['oak_log'] },
        { output: { item: 'birch_planks', count: 4 }, ingredients: ['birch_log'] },
        { output: { item: 'stick', count: 4 }, pattern: ['oak_planks', null, 'oak_planks', null] },
        { output: { item: 'crafting_table', count: 1 }, pattern: ['oak_planks', 'oak_planks', 'oak_planks', 'oak_planks'] },
        { output: { item: 'torch', count: 4 }, pattern: ['coal', null, 'stick', null] },
        { output: { item: 'chest', count: 1 }, grid: 3, pattern: [
            'oak_planks', 'oak_planks', 'oak_planks',
            'oak_planks', null,         'oak_planks',
            'oak_planks', 'oak_planks', 'oak_planks'
        ]},
        { output: { item: 'furnace', count: 1 }, grid: 3, pattern: [
            'cobblestone', 'cobblestone', 'cobblestone',
            'cobblestone', null,          'cobblestone',
            'cobblestone', 'cobblestone', 'cobblestone'
        ]},
        // Swords
        { output: { item: 'wooden_sword', count: 1 }, pattern: ['oak_planks', null, 'oak_planks', null, 'stick', null] },
        { output: { item: 'stone_sword', count: 1 }, pattern: ['cobblestone', null, 'cobblestone', null, 'stick', null] },
        { output: { item: 'iron_sword', count: 1 }, pattern: ['iron_ingot', null, 'iron_ingot', null, 'stick', null] },
        { output: { item: 'diamond_sword', count: 1 }, pattern: ['diamond', null, 'diamond', null, 'stick', null] },
        // Pickaxes (3x3)
        { output: { item: 'wooden_pickaxe', count: 1 }, grid: 3, pattern: [
            'oak_planks', 'oak_planks', 'oak_planks',
            null,         'stick',      null,
            null,         'stick',      null
        ]},
        { output: { item: 'stone_pickaxe', count: 1 }, grid: 3, pattern: [
            'cobblestone', 'cobblestone', 'cobblestone',
            null,          'stick',       null,
            null,          'stick',       null
        ]},
        { output: { item: 'iron_pickaxe', count: 1 }, grid: 3, pattern: [
            'iron_ingot', 'iron_ingot', 'iron_ingot',
            null,         'stick',      null,
            null,         'stick',      null
        ]},
        { output: { item: 'diamond_pickaxe', count: 1 }, grid: 3, pattern: [
            'diamond', 'diamond', 'diamond',
            null,      'stick',   null,
            null,      'stick',   null
        ]},
        // Axes (3x3)
        { output: { item: 'wooden_axe', count: 1 }, grid: 3, pattern: [
            'oak_planks', 'oak_planks', null,
            'oak_planks', 'stick',      null,
            null,         'stick',      null
        ]},
        { output: { item: 'stone_axe', count: 1 }, grid: 3, pattern: [
            'cobblestone', 'cobblestone', null,
            'cobblestone', 'stick',       null,
            null,          'stick',       null
        ]},
        { output: { item: 'iron_axe', count: 1 }, grid: 3, pattern: [
            'iron_ingot', 'iron_ingot', null,
            'iron_ingot', 'stick',      null,
            null,         'stick',      null
        ]},
        { output: { item: 'diamond_axe', count: 1 }, grid: 3, pattern: [
            'diamond', 'diamond', null,
            'diamond', 'stick',   null,
            null,      'stick',   null
        ]},
        // Shovels
        { output: { item: 'wooden_shovel', count: 1 }, grid: 3, pattern: [
            null, 'oak_planks', null,
            null, 'stick',      null,
            null, 'stick',      null
        ]},
        { output: { item: 'stone_shovel', count: 1 }, grid: 3, pattern: [
            null, 'cobblestone', null,
            null, 'stick',       null,
            null, 'stick',       null
        ]},
        { output: { item: 'iron_shovel', count: 1 }, grid: 3, pattern: [
            null, 'iron_ingot', null,
            null, 'stick',      null,
            null, 'stick',      null
        ]},
        { output: { item: 'diamond_shovel', count: 1 }, grid: 3, pattern: [
            null, 'diamond', null,
            null, 'stick',   null,
            null, 'stick',   null
        ]},
        // Blocks
        { output: { item: 'iron_block', count: 1 }, grid: 3, pattern: [
            'iron_ingot', 'iron_ingot', 'iron_ingot',
            'iron_ingot', 'iron_ingot', 'iron_ingot',
            'iron_ingot', 'iron_ingot', 'iron_ingot'
        ]},
        { output: { item: 'gold_block', count: 1 }, grid: 3, pattern: [
            'gold_ingot', 'gold_ingot', 'gold_ingot',
            'gold_ingot', 'gold_ingot', 'gold_ingot',
            'gold_ingot', 'gold_ingot', 'gold_ingot'
        ]},
        { output: { item: 'diamond_block', count: 1 }, grid: 3, pattern: [
            'diamond', 'diamond', 'diamond',
            'diamond', 'diamond', 'diamond',
            'diamond', 'diamond', 'diamond'
        ]},
        { output: { item: 'tnt', count: 1 }, grid: 3, pattern: [
            'sand', 'coal', 'sand',
            'coal', 'sand', 'coal',
            'sand', 'coal', 'sand'
        ]},
        // ★ オリジナルアイテムレシピ
        { output: { item: 'astral_blade', count: 1 }, grid: 3, pattern: [
            'astral_ingot', null,           null,
            'astral_ingot', 'diamond_sword',null,
            'diamond',      null,           null
        ]},
        { output: { item: 'laser_drill', count: 1 }, grid: 3, pattern: [
            'astral_ingot',    'diamond_pickaxe', 'astral_ingot',
            'redstone',        'diamond_block',   'redstone',
            null,              'iron_block',      null
        ]},
        { output: { item: 'gravity_boots', count: 1 }, grid: 3, pattern: [
            'astral_ingot', null,         'astral_ingot',
            'gold_ingot',   'diamond',    'gold_ingot',
            'feather',      null,         'feather'
        ]},
        { output: { item: 'jetpack', count: 1 }, grid: 3, pattern: [
            'iron_ingot',   'astral_ingot', 'iron_ingot',
            'iron_ingot',   'diamond_block','iron_ingot',
            'torch',        'coal',         'torch'
        ]},
        { output: { item: 'healing_torch', count: 4 }, grid: 3, pattern: [
            null,    'astral_crystal', null,
            null,    'torch',          null,
            null,    'gold_ingot',     null
        ]},
        { output: { item: 'waygate', count: 1 }, grid: 3, pattern: [
            'obsidian',       'astral_block', 'obsidian',
            'astral_crystal', 'diamond_block','astral_crystal',
            'obsidian',       'obsidian',     'obsidian'
        ]},
        { output: { item: 'cluster_tnt', count: 1 }, grid: 3, pattern: [
            'tnt',            'astral_crystal', 'tnt',
            'astral_crystal', 'diamond',        'astral_crystal',
            'tnt',            'astral_crystal', 'tnt'
        ]},
        { output: { item: 'speed_pad', count: 2 }, grid: 3, pattern: [
            'iron_ingot', 'gold_ingot', 'iron_ingot',
            'redstone',   'astral_crystal', 'redstone',
            'stone',      'stone',      'stone'
        ]},
        { output: { item: 'jump_pad', count: 2 }, grid: 3, pattern: [
            'iron_ingot', 'diamond',    'iron_ingot',
            'redstone',   'astral_crystal', 'redstone',
            'stone',      'stone',      'stone'
        ]},
        { output: { item: 'astral_block', count: 1 }, grid: 3, pattern: [
            'astral_ingot', 'astral_ingot', 'astral_ingot',
            'astral_ingot', 'astral_ingot', 'astral_ingot',
            'astral_ingot', 'astral_ingot', 'astral_ingot'
        ]}
    ];

    // Smelting (Furnace) Recipes
    const SMELTING_RECIPES = {
        'raw_iron': { output: 'iron_ingot', time: 10 },
        'iron_ore': { output: 'iron_ingot', time: 10 },
        'raw_gold': { output: 'gold_ingot', time: 10 },
        'gold_ore': { output: 'gold_ingot', time: 10 },
        'sand': { output: 'glass', time: 8 },
        'cobblestone': { output: 'stone', time: 8 },
        'raw_beef': { output: 'cooked_beef', time: 8 },
        'astral_crystal': { output: 'astral_ingot', time: 15 },
        'astral_ore': { output: 'astral_crystal', time: 12 }
    };

    global.BLOCKS = BLOCKS;
    global.BLOCK_BY_ID = BLOCK_BY_ID;
    global.ITEMS = ITEMS;
    global.RECIPES = RECIPES;
    global.SMELTING_RECIPES = SMELTING_RECIPES;
})(window);
