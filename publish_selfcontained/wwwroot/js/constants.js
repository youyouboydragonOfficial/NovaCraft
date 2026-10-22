// Game Constants and Definitions for NovaCraft (Complete Authentic Minecraft Edition)
(function(global) {
    const BLOCKS = {
        AIR: { id: 0, name: 'Air', nameJa: '空気', solid: false, transparent: true },
        GRASS: { id: 1, name: 'Grass Block', nameJa: '草ブロック', solid: true, hardness: 0.6, tool: 'shovel', drop: 'dirt', sound: 'grass' },
        DIRT: { id: 2, name: 'Dirt', nameJa: '土', solid: true, hardness: 0.5, tool: 'shovel', drop: 'dirt', sound: 'gravel' },
        STONE: { id: 3, name: 'Stone', nameJa: '石', solid: true, hardness: 1.5, tool: 'pickaxe', drop: 'cobblestone', sound: 'stone' },
        COBBLESTONE: { id: 4, name: 'Cobblestone', nameJa: '丸石', solid: true, hardness: 2.0, tool: 'pickaxe', drop: 'cobblestone', sound: 'stone' },
        BEDROCK: { id: 5, name: 'Bedrock', nameJa: '岩盤', solid: true, hardness: Infinity, tool: 'none', sound: 'stone' },
        SAND: { id: 6, name: 'Sand', nameJa: '砂', solid: true, hardness: 0.5, tool: 'shovel', drop: 'sand', sound: 'sand' },
        GRAVEL: { id: 7, name: 'Gravel', nameJa: '砂利', solid: true, hardness: 0.6, tool: 'shovel', drop: 'flint', sound: 'gravel' },
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
        FLOWER_RED: { id: 38, name: 'Poppy', nameJa: 'ポピー(赤花)', solid: false, transparent: true, hardness: 0.0, drop: 'flower_red', sound: 'grass', crossModel: true },
        FLOWER_YELLOW: { id: 39, name: 'Dandelion', nameJa: 'タンポポ(黄花)', solid: false, transparent: true, hardness: 0.0, drop: 'flower_yellow', sound: 'grass', crossModel: true },

        // ★ オリジナル特殊ブロック
        ASTRAL_ORE: { id: 40, name: 'Astral Ore', nameJa: 'アストラル鉱石', solid: true, hardness: 5.0, tool: 'pickaxe', drop: 'astral_crystal', light: 0.8, sound: 'stone', custom: true },
        ASTRAL_BLOCK: { id: 41, name: 'Block of Astral', nameJa: 'アストラルブロック', solid: true, hardness: 6.0, tool: 'pickaxe', drop: 'astral_block', light: 1.0, sound: 'metal', custom: true },
        HEALING_TORCH: { id: 42, name: 'Healing Torch', nameJa: 'ヒーリングトーチ', solid: false, transparent: true, hardness: 0.0, drop: 'healing_torch', light: 0.9, sound: 'wood', custom: true, heals: true },
        WAYGATE: { id: 43, name: 'Waygate Teleporter', nameJa: 'ウェイゲート(テレポート)', solid: true, hardness: 4.0, tool: 'pickaxe', drop: 'waygate', light: 0.7, sound: 'metal', custom: true, isInteractive: true },
        CLUSTER_TNT: { id: 44, name: 'Cluster TNT', nameJa: 'クラスターTNT爆薬', solid: true, hardness: 0.0, drop: 'cluster_tnt', sound: 'grass', custom: true, isClusterTnt: true },
        SPEED_PAD: { id: 45, name: 'Speed Boost Pad', nameJa: 'スピード加速パッド', solid: true, hardness: 1.0, drop: 'speed_pad', light: 0.5, sound: 'metal', custom: true, speedBoost: 2.2 },
        JUMP_PAD: { id: 46, name: 'Jump Pad', nameJa: 'スーパージャンプ台', solid: true, hardness: 1.0, drop: 'jump_pad', light: 0.5, sound: 'metal', custom: true, jumpBoost: 18.0 },

        // ★ ディープダーク・古代都市 & 本家バニラ完全網羅ブロック
        DEEPSLATE: { id: 47, name: 'Deepslate', nameJa: '深層岩', solid: true, hardness: 3.0, tool: 'pickaxe', drop: 'deepslate', sound: 'stone' },
        DEEPSLATE_BRICKS: { id: 48, name: 'Deepslate Bricks', nameJa: '深層岩レンガ', solid: true, hardness: 3.5, tool: 'pickaxe', drop: 'deepslate_bricks', sound: 'stone' },
        DEEPSLATE_TILES: { id: 49, name: 'Deepslate Tiles', nameJa: '深層岩タイル', solid: true, hardness: 3.5, tool: 'pickaxe', drop: 'deepslate_tiles', sound: 'stone' },
        REINFORCED_DEEPSLATE: { id: 50, name: 'Reinforced Deepslate', nameJa: '強化された深層岩', solid: true, hardness: 55.0, tool: 'pickaxe', drop: null, sound: 'stone', light: 0.4 },
        SCULK: { id: 51, name: 'Sculk', nameJa: 'スカルク', solid: true, hardness: 0.2, tool: 'shovel', drop: 'sculk', sound: 'grass', light: 0.2 },
        SCULK_CATALYST: { id: 52, name: 'Sculk Catalyst', nameJa: 'スカルクカタリスト', solid: true, hardness: 3.0, tool: 'shovel', drop: 'sculk_catalyst', sound: 'stone', light: 0.6 },
        SCULK_SHRIEKER: { id: 53, name: 'Sculk Shrieker', nameJa: 'スカルクシュリーカー', solid: true, hardness: 3.0, tool: 'shovel', drop: 'sculk_shrieker', sound: 'stone', light: 0.5 },
        SOUL_LANTERN: { id: 54, name: 'Soul Lantern', nameJa: 'ソウルランタン', solid: false, transparent: true, hardness: 0.5, drop: 'soul_lantern', light: 1.0, sound: 'metal' },
        STONE_BRICKS: { id: 55, name: 'Stone Bricks', nameJa: '石レンガ', solid: true, hardness: 1.5, tool: 'pickaxe', drop: 'stone_bricks', sound: 'stone' },
        GLOWSTONE: { id: 56, name: 'Glowstone', nameJa: 'グロウストーン', solid: true, hardness: 0.3, tool: 'pickaxe', drop: 'glowstone', light: 1.0, sound: 'glass' },
        FIRE: { id: 57, name: 'Fire', nameJa: '炎(着火)', solid: false, transparent: true, hardness: 0.0, drop: null, light: 1.0, sound: 'wood', crossModel: true },
        NETHER_PORTAL: { id: 58, name: 'Nether Portal', nameJa: 'ネザーポータル', solid: false, transparent: true, hardness: 0.5, drop: null, light: 0.9, sound: 'glass' },
        WOOL_WHITE: { id: 59, name: 'White Wool', nameJa: '白色の羊毛', solid: true, hardness: 0.8, tool: 'shears', drop: 'wool', sound: 'grass' },
        WOOL_RED: { id: 60, name: 'Red Wool', nameJa: '赤色の羊毛', solid: true, hardness: 0.8, tool: 'shears', drop: 'wool_red', sound: 'grass' },
        WOOL_BLUE: { id: 61, name: 'Blue Wool', nameJa: '青色の羊毛', solid: true, hardness: 0.8, tool: 'shears', drop: 'wool_blue', sound: 'grass' },
        MOSSY_COBBLESTONE: { id: 62, name: 'Mossy Cobblestone', nameJa: '苔むした丸石', solid: true, hardness: 2.0, tool: 'pickaxe', drop: 'mossy_cobblestone', sound: 'stone' },
        SANDSTONE: { id: 63, name: 'Sandstone', nameJa: '砂岩', solid: true, hardness: 1.2, tool: 'pickaxe', drop: 'sandstone', sound: 'stone' },
        NETHERRACK: { id: 64, name: 'Netherrack', nameJa: 'ネザーラック', solid: true, hardness: 0.4, tool: 'pickaxe', drop: 'netherrack', sound: 'stone' },
        SOUL_SAND: { id: 65, name: 'Soul Sand', nameJa: 'ソウルサンド', solid: true, hardness: 0.5, tool: 'shovel', drop: 'soul_sand', sound: 'sand' },
        CRYING_OBSIDIAN: { id: 66, name: 'Crying Obsidian', nameJa: '泣く黒曜石', solid: true, hardness: 10.0, tool: 'pickaxe', drop: 'crying_obsidian', light: 0.7, sound: 'stone' },
        AMETHYST_BLOCK: { id: 67, name: 'Block of Amethyst', nameJa: 'アメジストブロック', solid: true, hardness: 1.5, tool: 'pickaxe', drop: 'amethyst_block', light: 0.5, sound: 'glass' },
        COPPER_BLOCK: { id: 68, name: 'Block of Copper', nameJa: '銅ブロック', solid: true, hardness: 3.0, tool: 'pickaxe', drop: 'copper_block', sound: 'metal' },
        REDSTONE_LAMP: { id: 69, name: 'Redstone Lamp', nameJa: 'レッドストーンランプ', solid: true, hardness: 0.5, drop: 'redstone_lamp', light: 1.0, sound: 'glass' },
        LADDER: { id: 70, name: 'Ladder', nameJa: 'はしご', solid: false, transparent: true, hardness: 0.4, tool: 'axe', drop: 'ladder', sound: 'wood', isClimbable: true },
        SAPLING: { id: 71, name: 'Oak Sapling', nameJa: 'オークの苗木', solid: false, transparent: true, hardness: 0.0, drop: 'sapling', sound: 'grass', crossModel: true },
        BED: { id: 72, name: 'Bed', nameJa: 'ベッド(睡眠・朝にする)', solid: true, hardness: 0.2, drop: 'bed', sound: 'wood', isInteractive: true },
        REDSTONE_BLOCK: { id: 73, name: 'Block of Redstone', nameJa: 'レッドストーンブロック', solid: true, hardness: 5.0, tool: 'pickaxe', drop: 'redstone_block', light: 0.5, sound: 'metal' },
        EMERALD_BLOCK: { id: 74, name: 'Block of Emerald', nameJa: 'エメラルドブロック', solid: true, hardness: 5.0, tool: 'pickaxe', drop: 'emerald_block', sound: 'metal' },
        LAPIS_BLOCK: { id: 75, name: 'Block of Lapis', nameJa: 'ラピスラズリブロック', solid: true, hardness: 3.0, tool: 'pickaxe', drop: 'lapis_block', sound: 'stone' },
        NETHERITE_BLOCK: { id: 76, name: 'Block of Netherite', nameJa: 'ネザライトブロック', solid: true, hardness: 12.0, tool: 'pickaxe', drop: 'netherite_block', sound: 'metal' },

        // ★ エンド (The End) & 要塞 (Stronghold) ブロック
        END_PORTAL_FRAME: { id: 77, name: 'End Portal Frame', nameJa: 'エンドポータルフレーム', solid: true, hardness: Infinity, tool: 'none', sound: 'glass', drop: null },
        END_PORTAL: { id: 78, name: 'End Portal', nameJa: 'エンドポータル', solid: false, transparent: true, hardness: Infinity, light: 1.0, sound: 'glass', drop: null },
        END_STONE: { id: 79, name: 'End Stone', nameJa: 'エンドストーン', solid: true, hardness: 3.0, tool: 'pickaxe', drop: 'end_stone', sound: 'stone' },
        END_STONE_BRICKS: { id: 80, name: 'End Stone Bricks', nameJa: 'エンドストーンレンガ', solid: true, hardness: 3.0, tool: 'pickaxe', drop: 'end_stone_bricks', sound: 'stone' },
        PURPUR_BLOCK: { id: 81, name: 'Purpur Block', nameJa: 'プルプァブロック', solid: true, hardness: 1.5, tool: 'pickaxe', drop: 'purpur_block', sound: 'stone' },
        END_ROD: { id: 82, name: 'End Rod', nameJa: 'エンドロッド', solid: false, transparent: true, hardness: 0.0, drop: 'end_rod', light: 1.0, sound: 'wood' },
        DRAGON_EGG: { id: 83, name: 'Dragon Egg', nameJa: 'ドラゴンの卵', solid: true, hardness: 3.0, drop: 'dragon_egg', sound: 'stone', isDragonEgg: true },
        CRACKED_STONE_BRICKS: { id: 84, name: 'Cracked Stone Bricks', nameJa: 'ひび割れた石レンガ', solid: true, hardness: 1.5, tool: 'pickaxe', drop: 'cracked_stone_bricks', sound: 'stone' },
        IRON_BARS: { id: 85, name: 'Iron Bars', nameJa: '鉄格子', solid: true, transparent: true, hardness: 5.0, tool: 'pickaxe', drop: 'iron_bars', sound: 'metal' }
    };

    // Mapping by block ID
    const BLOCK_BY_ID = {};
    for (let k in BLOCKS) {
        BLOCK_BY_ID[BLOCKS[k].id] = BLOCKS[k];
        BLOCKS[k].key = k.toLowerCase();
    }

    const ITEMS = {
        // 基本素材 (Materials)
        stick: { name: 'Stick', nameJa: '棒', category: 'materials', maxStack: 64 },
        coal: { name: 'Coal', nameJa: '石炭', category: 'materials', fuelTime: 80, maxStack: 64 },
        flint: { name: 'Flint', nameJa: '火打石', category: 'materials', maxStack: 64, desc: '鉄インゴットと合わせて着火石(火打石と打ち金)や矢を作成' },
        raw_iron: { name: 'Raw Iron', nameJa: '鉄の原石', category: 'materials', maxStack: 64 },
        iron_ingot: { name: 'Iron Ingot', nameJa: '鉄インゴット', category: 'materials', maxStack: 64 },
        raw_gold: { name: 'Raw Gold', nameJa: '金の原石', category: 'materials', maxStack: 64 },
        gold_ingot: { name: 'Gold Ingot', nameJa: '金インゴット', category: 'materials', maxStack: 64 },
        diamond: { name: 'Diamond', nameJa: 'ダイヤモンド', category: 'materials', maxStack: 64 },
        netherite_ingot: { name: 'Netherite Ingot', nameJa: 'ネザライトインゴット', category: 'materials', maxStack: 64 },
        emerald: { name: 'Emerald', nameJa: 'エメラルド', category: 'materials', maxStack: 64 },
        redstone: { name: 'Redstone', nameJa: 'レッドストーンダスト', category: 'materials', maxStack: 64 },
        lapis: { name: 'Lapis Lazuli', nameJa: 'ラピスラズリ', category: 'materials', maxStack: 64 },
        snowball: { name: 'Snowball', nameJa: '雪玉', category: 'materials', maxStack: 16, desc: '右クリックで雪玉を投げる' },
        bone: { name: 'Bone', nameJa: '骨', category: 'materials', maxStack: 64 },
        bone_meal: { name: 'Bone Meal', nameJa: '骨粉', category: 'materials', maxStack: 64, desc: '苗木や草ブロックに右クリックで木や花を瞬時に成長させる！' },
        gunpowder: { name: 'Gunpowder', nameJa: '火薬', category: 'materials', maxStack: 64, desc: '砂とクラフトしてTNT爆薬を作成' },
        feather: { name: 'Feather', nameJa: '羽根', category: 'materials', maxStack: 64 },
        wool: { name: 'White Wool', nameJa: '白色の羊毛', category: 'materials', blockId: 59, maxStack: 64 },
        ender_pearl: { name: 'Ender Pearl', nameJa: 'エンダーパール', category: 'materials', maxStack: 16, desc: '右クリックで投げて着弾地点へ瞬間移動！' },
        echo_shard: { name: 'Echo Shard', nameJa: '残響の欠片', category: 'materials', maxStack: 64, desc: '古代都市のチェストに眠るディープダークの結晶' },
        blaze_rod: { name: 'Blaze Rod', nameJa: 'ブレイズロッド', category: 'materials', fuelTime: 120, maxStack: 64, desc: 'ブレイズの炎の棒。クラフトでブレイズパウダーを作成' },
        blaze_powder: { name: 'Blaze Powder', nameJa: 'ブレイズパウダー', category: 'materials', maxStack: 64, desc: 'エンダーパールと調合してエンダーアイを作成' },
        eye_of_ender: { name: 'Eye of Ender', nameJa: 'エンダーアイ', category: 'tools', maxStack: 64, desc: '右クリックで投げて要塞を探索！エンドポータル枠に嵌めてエンドを開く！' },
        dragon_breath: { name: 'Dragon Breath', nameJa: 'ドラゴンブレス', category: 'materials', maxStack: 64, desc: 'エンダードラゴンの紫の残留炎の息吹' },
        elytra: { name: 'Elytra', nameJa: 'エリトラ(滑空翼)', category: 'tools', maxDurability: 432, desc: '空中でジャンプすると大空を滑空飛行できる伝説の翼！' },
        dragon_egg: { name: 'Dragon Egg', nameJa: 'ドラゴンの卵', category: 'blocks', blockId: 83, maxStack: 64, desc: 'エンダードラゴン討伐の証。触れると瞬間移動する神秘の卵' },
        end_stone: { name: 'End Stone', nameJa: 'エンドストーン', category: 'blocks', blockId: 79, maxStack: 64 },
        end_stone_bricks: { name: 'End Stone Bricks', nameJa: 'エンドストーンレンガ', category: 'blocks', blockId: 80, maxStack: 64 },
        purpur_block: { name: 'Purpur Block', nameJa: 'プルプァブロック', category: 'blocks', blockId: 81, maxStack: 64 },
        end_rod: { name: 'End Rod', nameJa: 'エンドロッド', category: 'blocks', blockId: 82, maxStack: 64 },
        end_portal_frame: { name: 'End Portal Frame', nameJa: 'エンドポータルフレーム', category: 'blocks', blockId: 77, maxStack: 64 },
        cracked_stone_bricks: { name: 'Cracked Stone Bricks', nameJa: 'ひび割れた石レンガ', category: 'blocks', blockId: 84, maxStack: 64 },
        iron_bars: { name: 'Iron Bars', nameJa: '鉄格子', category: 'blocks', blockId: 85, maxStack: 64 },

        // ★ 着火石・バケツ・実用ツール (Flint and Steel, Buckets, Shears, Bow, etc.)
        flint_and_steel: { name: 'Flint and Steel', nameJa: '火打石と打ち金(着火石)', category: 'tools', maxDurability: 64, desc: '右クリックでTNT着火・ブロックへの炎着火・ネザーポータル起動！' },
        fire_charge: { name: 'Fire Charge', nameJa: 'ファイヤーチャージ', category: 'combat', maxStack: 64, desc: '右クリックで火球発射・TNTや炎の着火！' },
        bucket: { name: 'Bucket', nameJa: 'バケツ', category: 'tools', maxStack: 16, desc: '水や溶岩に向かって右クリックで汲み取る' },
        water_bucket: { name: 'Water Bucket', nameJa: '水入りバケツ', category: 'tools', maxStack: 1, desc: '右クリックで水を流す' },
        lava_bucket: { name: 'Lava Bucket', nameJa: '溶岩入りバケツ', category: 'tools', maxStack: 1, fuelTime: 1000, desc: '右クリックで溶岩を設置・かまどの超強力燃料' },
        shears: { name: 'Shears', nameJa: 'ハサミ', category: 'tools', toolType: 'shears', speed: 12.0, maxDurability: 238, desc: '羊に右クリックで羊毛を刈り取る・葉ブロック回収' },
        bow: { name: 'Bow', nameJa: '弓', category: 'combat', maxDurability: 384, damage: 8, desc: '右クリックで前方に矢を発射！' },
        arrow: { name: 'Arrow', nameJa: '矢', category: 'combat', maxStack: 64, desc: '弓で発射する矢' },
        fishing_rod: { name: 'Fishing Rod', nameJa: '釣竿', category: 'tools', maxDurability: 64, desc: '水に向かって右クリックで魚や宝を釣る！' },
        spyglass: { name: 'Spyglass', nameJa: '望遠鏡', category: 'tools', maxStack: 1, desc: '右クリックで遠くをズーム観察！' },
        compass: { name: 'Compass', nameJa: 'コンパス', category: 'tools', maxStack: 1, desc: '右クリックで初期地点と古代都市の座標を表示' },
        clock: { name: 'Clock', nameJa: '時計', category: 'tools', maxStack: 1, desc: '右クリックで現在の時刻を確認' },

        // 食べ物 (Food)
        apple: { name: 'Apple', nameJa: 'リンゴ', category: 'food', foodRestore: 4, saturation: 2.4, maxStack: 64 },
        bread: { name: 'Bread', nameJa: 'パン', category: 'food', foodRestore: 5, saturation: 6.0, maxStack: 64 },
        raw_beef: { name: 'Raw Beef', nameJa: '生の牛肉', category: 'food', foodRestore: 3, saturation: 1.8, maxStack: 64 },
        cooked_beef: { name: 'Steak', nameJa: 'ステーキ(焼肉)', category: 'food', foodRestore: 8, saturation: 12.8, maxStack: 64 },
        raw_porkchop: { name: 'Raw Porkchop', nameJa: '生の豚肉', category: 'food', foodRestore: 3, saturation: 1.8, maxStack: 64 },
        cooked_porkchop: { name: 'Cooked Porkchop', nameJa: '焼き豚', category: 'food', foodRestore: 8, saturation: 12.8, maxStack: 64 },
        raw_chicken: { name: 'Raw Chicken', nameJa: '生の鶏肉', category: 'food', foodRestore: 2, saturation: 1.2, maxStack: 64 },
        cooked_chicken: { name: 'Cooked Chicken', nameJa: '焼き鳥', category: 'food', foodRestore: 6, saturation: 7.2, maxStack: 64 },
        raw_fish: { name: 'Raw Cod', nameJa: '生魚(タラ)', category: 'food', foodRestore: 2, saturation: 1.0, maxStack: 64 },
        cooked_fish: { name: 'Cooked Cod', nameJa: '焼き魚', category: 'food', foodRestore: 6, saturation: 6.0, maxStack: 64 },
        carrot: { name: 'Carrot', nameJa: 'ニンジン', category: 'food', foodRestore: 3, saturation: 3.6, maxStack: 64 },
        baked_potato: { name: 'Baked Potato', nameJa: 'ベイクドポテト', category: 'food', foodRestore: 5, saturation: 6.0, maxStack: 64 },
        melon_slice: { name: 'Melon Slice', nameJa: 'スイカの薄切り', category: 'food', foodRestore: 2, saturation: 1.2, maxStack: 64 },
        cookie: { name: 'Cookie', nameJa: 'クッキー', category: 'food', foodRestore: 2, saturation: 0.4, maxStack: 64 },
        pumpkin_pie: { name: 'Pumpkin Pie', nameJa: 'パンプキンパイ', category: 'food', foodRestore: 8, saturation: 4.8, maxStack: 64 },
        rotten_flesh: { name: 'Rotten Flesh', nameJa: '腐った肉', category: 'food', foodRestore: 2, saturation: 0.8, maxStack: 64 },
        golden_apple: { name: 'Golden Apple', nameJa: '金のリンゴ', category: 'food', foodRestore: 10, heal: 10, maxStack: 64 },
        enchanted_golden_apple: { name: 'Enchanted Golden Apple', nameJa: 'エンチャントされた金のリンゴ', category: 'food', foodRestore: 20, heal: 20, maxStack: 64 },

        // ツール (Pickaxes)
        wooden_pickaxe: { name: 'Wooden Pickaxe', nameJa: '木のツルハシ', category: 'tools', toolType: 'pickaxe', tier: 1, speed: 2.0, maxDurability: 60, damage: 2 },
        stone_pickaxe: { name: 'Stone Pickaxe', nameJa: '石のツルハシ', category: 'tools', toolType: 'pickaxe', tier: 2, speed: 4.0, maxDurability: 132, damage: 3 },
        iron_pickaxe: { name: 'Iron Pickaxe', nameJa: '鉄のツルハシ', category: 'tools', toolType: 'pickaxe', tier: 3, speed: 6.0, maxDurability: 250, damage: 4 },
        golden_pickaxe: { name: 'Golden Pickaxe', nameJa: '金のツルハシ', category: 'tools', toolType: 'pickaxe', tier: 3, speed: 12.0, maxDurability: 32, damage: 2 },
        diamond_pickaxe: { name: 'Diamond Pickaxe', nameJa: 'ダイヤのツルハシ', category: 'tools', toolType: 'pickaxe', tier: 4, speed: 8.5, maxDurability: 1561, damage: 5 },
        netherite_pickaxe: { name: 'Netherite Pickaxe', nameJa: 'ネザライトのツルハシ', category: 'tools', toolType: 'pickaxe', tier: 5, speed: 11.0, maxDurability: 2031, damage: 6 },

        // ツール (Axes)
        wooden_axe: { name: 'Wooden Axe', nameJa: '木の斧', category: 'tools', toolType: 'axe', tier: 1, speed: 2.0, maxDurability: 60, damage: 3 },
        stone_axe: { name: 'Stone Axe', nameJa: '石の斧', category: 'tools', toolType: 'axe', tier: 2, speed: 4.0, maxDurability: 132, damage: 4 },
        iron_axe: { name: 'Iron Axe', nameJa: '鉄の斧', category: 'tools', toolType: 'axe', tier: 3, speed: 6.0, maxDurability: 250, damage: 6 },
        golden_axe: { name: 'Golden Axe', nameJa: '金の斧', category: 'tools', toolType: 'axe', tier: 3, speed: 12.0, maxDurability: 32, damage: 3 },
        diamond_axe: { name: 'Diamond Axe', nameJa: 'ダイヤの斧', category: 'tools', toolType: 'axe', tier: 4, speed: 8.5, maxDurability: 1561, damage: 7 },
        netherite_axe: { name: 'Netherite Axe', nameJa: 'ネザライトの斧', category: 'tools', toolType: 'axe', tier: 5, speed: 11.0, maxDurability: 2031, damage: 8 },

        // ツール (Shovels)
        wooden_shovel: { name: 'Wooden Shovel', nameJa: '木のシャベル', category: 'tools', toolType: 'shovel', tier: 1, speed: 2.0, maxDurability: 60, damage: 1 },
        stone_shovel: { name: 'Stone Shovel', nameJa: '石のシャベル', category: 'tools', toolType: 'shovel', tier: 2, speed: 4.0, maxDurability: 132, damage: 2 },
        iron_shovel: { name: 'Iron Shovel', nameJa: '鉄のシャベル', category: 'tools', toolType: 'shovel', tier: 3, speed: 6.0, maxDurability: 250, damage: 3 },
        golden_shovel: { name: 'Golden Shovel', nameJa: '金のシャベル', category: 'tools', toolType: 'shovel', tier: 3, speed: 12.0, maxDurability: 32, damage: 1 },
        diamond_shovel: { name: 'Diamond Shovel', nameJa: 'ダイヤのシャベル', category: 'tools', toolType: 'shovel', tier: 4, speed: 8.5, maxDurability: 1561, damage: 4 },
        netherite_shovel: { name: 'Netherite Shovel', nameJa: 'ネザライトのシャベル', category: 'tools', toolType: 'shovel', tier: 5, speed: 11.0, maxDurability: 2031, damage: 5 },

        // 武器 (Swords)
        wooden_sword: { name: 'Wooden Sword', nameJa: '木の剣', category: 'combat', toolType: 'sword', maxDurability: 60, damage: 4 },
        stone_sword: { name: 'Stone Sword', nameJa: '石の剣', category: 'combat', toolType: 'sword', maxDurability: 132, damage: 5 },
        iron_sword: { name: 'Iron Sword', nameJa: '鉄の剣', category: 'combat', toolType: 'sword', maxDurability: 250, damage: 6 },
        golden_sword: { name: 'Golden Sword', nameJa: '金の剣', category: 'combat', toolType: 'sword', maxDurability: 32, damage: 4 },
        diamond_sword: { name: 'Diamond Sword', nameJa: 'ダイヤの剣', category: 'combat', toolType: 'sword', maxDurability: 1561, damage: 8 },
        netherite_sword: { name: 'Netherite Sword', nameJa: 'ネザライトの剣', category: 'combat', toolType: 'sword', maxDurability: 2031, damage: 10 },

        // ★ オリジナルアイテム
        astral_crystal: { name: 'Astral Crystal', nameJa: 'アストラルクリスタル', category: 'custom', maxStack: 64, desc: '深層から採取された脈動する神秘の結晶' },
        astral_ingot: { name: 'Astral Ingot', nameJa: 'アストラルインゴット', category: 'custom', maxStack: 64, desc: 'アストラルクリスタルを精錬した超合金' },
        astral_blade: { name: 'Astral Blade', nameJa: 'アストラルブレード', category: 'combat', toolType: 'sword', maxDurability: 3000, damage: 14, customAbility: 'shockwave', desc: '右クリックで衝撃波スラッシュを射出する伝説の聖剣' },
        laser_drill: { name: 'Laser Drill', nameJa: '超採掘レーザードリル', category: 'tools', toolType: 'pickaxe', tier: 5, speed: 18.0, maxDurability: 2500, customAbility: 'area_mine', desc: '右クリックで3x3範囲を一気に瞬時粉砕！' },
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
    const RECIPES = [
        // Basic & Shapeless
        { output: { item: 'oak_planks', count: 4 }, ingredients: ['oak_log'] },
        { output: { item: 'birch_planks', count: 4 }, ingredients: ['birch_log'] },
        { output: { item: 'bone_meal', count: 3 }, ingredients: ['bone'] },
        { output: { item: 'stick', count: 4 }, pattern: ['oak_planks', null, 'oak_planks', null] },
        { output: { item: 'crafting_table', count: 1 }, pattern: ['oak_planks', 'oak_planks', 'oak_planks', 'oak_planks'] },
        { output: { item: 'sandstone', count: 1 }, pattern: ['sand', 'sand', 'sand', 'sand'] },
        { output: { item: 'stone_bricks', count: 4 }, pattern: ['stone', 'stone', 'stone', 'stone'] },
        { output: { item: 'deepslate_bricks', count: 4 }, pattern: ['deepslate', 'deepslate', 'deepslate', 'deepslate'] },
        { output: { item: 'deepslate_tiles', count: 4 }, pattern: ['deepslate_bricks', 'deepslate_bricks', 'deepslate_bricks', 'deepslate_bricks'] },
        { output: { item: 'torch', count: 4 }, pattern: ['coal', null, 'stick', null] },
        // ★ Flint and Steel (火打石と打ち金 / 着火石) - Shapeless: Iron Ingot + Flint in ANY slot!
        { output: { item: 'flint_and_steel', count: 1 }, ingredients: ['iron_ingot', 'flint'] },
        { output: { item: 'fire_charge', count: 3 }, ingredients: ['coal', 'gunpowder'] },
        { output: { item: 'shears', count: 1 }, ingredients: ['iron_ingot', 'iron_ingot'] },
        { output: { item: 'spyglass', count: 1 }, ingredients: ['copper_ingot', 'amethyst_shard'] },

        // 3x3 Utility Blocks & Items
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
        { output: { item: 'bucket', count: 1 }, grid: 3, pattern: [
            'iron_ingot', null,         'iron_ingot',
            null,         'iron_ingot', null,
            null,         null,         null
        ]},
        { output: { item: 'compass', count: 1 }, grid: 3, pattern: [
            null,         'iron_ingot', null,
            'iron_ingot', 'redstone',   'iron_ingot',
            null,         'iron_ingot', null
        ]},
        { output: { item: 'clock', count: 1 }, grid: 3, pattern: [
            null,         'gold_ingot', null,
            'gold_ingot', 'redstone',   'gold_ingot',
            null,         'gold_ingot', null
        ]},
        { output: { item: 'fishing_rod', count: 1 }, grid: 3, pattern: [
            null,    null,    'stick',
            null,    'stick', 'string',
            'stick', null,    'string'
        ]},
        { output: { item: 'bed', count: 1 }, grid: 3, pattern: [
            'wool',       'wool',       'wool',
            'oak_planks', 'oak_planks', 'oak_planks',
            null,         null,         null
        ]},
        { output: { item: 'bed', count: 1 }, grid: 3, pattern: [
            'wool_white', 'wool_white', 'wool_white',
            'oak_planks', 'oak_planks', 'oak_planks',
            null,         null,         null
        ]},
        { output: { item: 'ladder', count: 3 }, grid: 3, pattern: [
            'stick', null,    'stick',
            'stick', 'stick', 'stick',
            'stick', null,    'stick'
        ]},
        { output: { item: 'bow', count: 1 }, grid: 3, pattern: [
            null,    'stick', 'feather',
            'stick', null,    'feather',
            null,    'stick', 'feather'
        ]},
        { output: { item: 'arrow', count: 4 }, grid: 3, pattern: [
            'flint',   null, null,
            'stick',   null, null,
            'feather', null, null
        ]},
        // TNT (Both Gunpowder+Sand AND Coal+Sand supported!)
        { output: { item: 'tnt', count: 1 }, grid: 3, pattern: [
            'gunpowder', 'sand',      'gunpowder',
            'sand',      'gunpowder', 'sand',
            'gunpowder', 'sand',      'gunpowder'
        ]},
        { output: { item: 'tnt', count: 1 }, grid: 3, pattern: [
            'sand', 'coal', 'sand',
            'coal', 'sand', 'coal',
            'sand', 'coal', 'sand'
        ]},

        // Swords
        { output: { item: 'wooden_sword', count: 1 }, pattern: ['oak_planks', null, 'oak_planks', null, 'stick', null] },
        { output: { item: 'stone_sword', count: 1 }, pattern: ['cobblestone', null, 'cobblestone', null, 'stick', null] },
        { output: { item: 'iron_sword', count: 1 }, pattern: ['iron_ingot', null, 'iron_ingot', null, 'stick', null] },
        { output: { item: 'golden_sword', count: 1 }, pattern: ['gold_ingot', null, 'gold_ingot', null, 'stick', null] },
        { output: { item: 'diamond_sword', count: 1 }, pattern: ['diamond', null, 'diamond', null, 'stick', null] },
        { output: { item: 'netherite_sword', count: 1 }, pattern: ['netherite_ingot', null, 'diamond_sword', null] },

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
        { output: { item: 'golden_pickaxe', count: 1 }, grid: 3, pattern: [
            'gold_ingot', 'gold_ingot', 'gold_ingot',
            null,         'stick',      null,
            null,         'stick',      null
        ]},
        { output: { item: 'diamond_pickaxe', count: 1 }, grid: 3, pattern: [
            'diamond', 'diamond', 'diamond',
            null,      'stick',   null,
            null,      'stick',   null
        ]},
        { output: { item: 'netherite_pickaxe', count: 1 }, pattern: ['netherite_ingot', null, 'diamond_pickaxe', null] },

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
        { output: { item: 'golden_axe', count: 1 }, grid: 3, pattern: [
            'gold_ingot', 'gold_ingot', null,
            'gold_ingot', 'stick',      null,
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

        // Mineral Blocks
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
        { output: { item: 'emerald_block', count: 1 }, grid: 3, pattern: [
            'emerald', 'emerald', 'emerald',
            'emerald', 'emerald', 'emerald',
            'emerald', 'emerald', 'emerald'
        ]},
        { output: { item: 'redstone_block', count: 1 }, grid: 3, pattern: [
            'redstone', 'redstone', 'redstone',
            'redstone', 'redstone', 'redstone',
            'redstone', 'redstone', 'redstone'
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
        ]},
        // ★ エンド関連レシピ (Blaze Powder, Eye of Ender, End Stone Bricks)
        { output: { item: 'blaze_powder', count: 2 }, grid: 2, pattern: [
            'blaze_rod', null,
            null,        null
        ]},
        { output: { item: 'eye_of_ender', count: 1 }, grid: 2, pattern: [
            'ender_pearl', 'blaze_powder',
            null,          null
        ]},
        { output: { item: 'end_stone_bricks', count: 4 }, grid: 2, pattern: [
            'end_stone', 'end_stone',
            'end_stone', 'end_stone'
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
        'raw_porkchop': { output: 'cooked_porkchop', time: 8 },
        'raw_chicken': { output: 'cooked_chicken', time: 8 },
        'raw_fish': { output: 'cooked_fish', time: 8 },
        'astral_crystal': { output: 'astral_ingot', time: 15 },
        'astral_ore': { output: 'astral_crystal', time: 12 }
    };

    global.BLOCKS = BLOCKS;
    global.BLOCK_BY_ID = BLOCK_BY_ID;
    global.ITEMS = ITEMS;
    global.RECIPES = RECIPES;
    global.SMELTING_RECIPES = SMELTING_RECIPES;
})(window);
