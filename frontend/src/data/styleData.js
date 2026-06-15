export const STYLE_DATA = [
    // ========================================
    // 1. 日系动漫 (Anime)
    // ========================================
    {
        key: 'anime',
        name: '日系动漫',
        description: '日本动画风格，涵盖从经典手绘到现代数字动画的多种表现形式',
        children: [
            {
                key: 'ghibli',
                name: '吉卜力风',
                description: '宫崎骏式的温暖手绘风格，柔和光影，自然色调，充满治愈感的田园氛围',
                colorTags: ['#7CB342', '#FFB74D', '#81D4FA', '#A5D6A7'],
                promptTemplate: 'Studio Ghibli style, hand-painted watercolor aesthetic, soft natural lighting, warm earthy tones, lush green landscapes, gentle wind effects, whimsical and nostalgic atmosphere, detailed background art, Hayao Miyazaki inspired'
            },
            {
                key: 'makoto_shinkai',
                name: '新海诚风',
                description: '极致光影表现，高饱和度天空，细腻的光线粒子效果，唯美都市与自然场景',
                colorTags: ['#1565C0', '#FF7043', '#CE93D8', '#4FC3F7'],
                promptTemplate: 'Makoto Shinkai style, ultra-detailed sky with dramatic clouds, vibrant saturated colors, golden hour lighting with lens flare, light particles floating in air, photorealistic backgrounds with anime characters, emotional cinematic atmosphere'
            },
            {
                key: 'classic_shonen',
                name: '经典少年漫',
                description: '热血少年漫画风格，强烈的动态线条，夸张的表情和动作，高对比度配色',
                colorTags: ['#F44336', '#FF9800', '#212121', '#FFEB3B'],
                promptTemplate: 'Classic shonen anime style, bold dynamic action lines, high contrast colors, dramatic poses, speed lines and impact effects, expressive facial features, vibrant energy auras, manga-inspired composition'
            },
            {
                key: 'slice_of_life',
                name: '日常系/轻小说风',
                description: '柔和明亮的日常生活风格，粉彩色调，简洁干净的线条，温馨校园氛围',
                colorTags: ['#F48FB1', '#B39DDB', '#80DEEA', '#FFF59D'],
                promptTemplate: 'Slice of life anime style, soft pastel color palette, clean line art, bright and airy lighting, school setting, gentle expressions, light novel illustration aesthetic, warm and cozy atmosphere'
            },
            {
                key: 'cyberpunk_anime',
                name: '赛博朋克动漫',
                description: '融合科幻与动漫的未来都市风格，霓虹灯光，暗色调搭配荧光色',
                colorTags: ['#E040FB', '#00E5FF', '#1A237E', '#76FF03'],
                promptTemplate: 'Cyberpunk anime style, neon-lit futuristic cityscape, dark moody atmosphere with vibrant neon accents, holographic displays, rain-slicked streets reflecting neon lights, high-tech low-life aesthetic, Ghost in the Shell inspired'
            },
            {
                key: 'retro_90s',
                name: '90年代复古',
                description: '赛璐璐质感，EVA/美少女战士风格，怀旧的上色与线条',
                colorTags: ['#FF4081', '#7C4DFF', '#00BCD4', '#FFD54F'],
                promptTemplate: '90s cel-shaded anime style, retro Sailor Moon or Evangelion aesthetic, limited color palette, visible cel paint layers, film grain, VHS-style soft focus, nostalgic 1990s anime production, crisp outlines with flat shading'
            },
            {
                key: 'dark_fantasy',
                name: '暗黑幻想',
                description: '剑风传奇/咒术回战风格，厚重阴影，残酷美学',
                colorTags: ['#212121', '#4A148C', '#B71C1C', '#37474F'],
                promptTemplate: 'Dark fantasy anime style, Berserk or Jujutsu Kaisen inspired, heavy shadows and dramatic chiaroscuro, gritty detailed linework, medieval horror atmosphere, blood and battle wear, ominous mood, high contrast inking'
            },
            {
                key: 'mecha_sci_fi',
                name: '机甲科幻',
                description: '高达/攻壳机动队风格，机械细节，硬核科幻',
                colorTags: ['#37474F', '#78909C', '#00E676', '#2962FF'],
                promptTemplate: 'Mecha sci-fi anime style, Gundam or Ghost in the Shell aesthetic, detailed mechanical design, metallic surfaces with panel lines, military hardware, cockpit views, mechanical joints and hydraulics, hard sci-fi mecha illustration'
            },
            {
                key: 'shojo_manga',
                name: '少女漫画',
                description: '华丽的大眼睛，花朵背景，梦幻浪漫氛围',
                colorTags: ['#F8BBD9', '#E1BEE7', '#B2EBF2', '#FFF9C4'],
                promptTemplate: 'Shojo manga style, large sparkling eyes with star highlights, floral and sparkle backgrounds, soft romantic lighting, flowing hair and ribbons, dreamy pastel palette, rose and cherry blossom motifs, romantic comedy anime aesthetic'
            },
            {
                key: 'chibi_anime',
                name: 'Q版二次元',
                description: '萌系大头身，表情包风格，可爱简化造型',
                colorTags: ['#FF80AB', '#B388FF', '#84FFFF', '#FFFF8D'],
                promptTemplate: 'Chibi anime style, super deformed cute proportions, oversized head with tiny body, big kawaii eyes, emoji-like expressions, sticker or avatar aesthetic, simple clean shapes, pastel or vibrant colors, mascot character design'
            }
        ]
    },

    // ========================================
    // 2. 3D/皮克斯风 (3D/Pixar)
    // ========================================
    {
        key: '3d_pixar',
        name: '3D/皮克斯风',
        description: '三维渲染风格，从卡通化的皮克斯到写实CG，适合角色动画和场景表现',
        children: [
            {
                key: 'pixar_cartoon',
                name: '皮克斯/迪士尼卡通',
                description: '圆润可爱的3D卡通角色，夸张的表情，明亮饱和的色彩，电影级光影',
                colorTags: ['#42A5F5', '#FFA726', '#66BB6A', '#EF5350'],
                promptTemplate: 'Pixar Disney 3D animation style, rounded cute character design, exaggerated expressive features, bright saturated colors, cinematic lighting with soft shadows, subsurface scattering on skin, detailed textures, family-friendly aesthetic'
            },
            {
                key: 'realistic_cg',
                name: '写实CG',
                description: '接近真实的3D渲染效果，精细的材质和光影，适合严肃题材',
                colorTags: ['#78909C', '#8D6E63', '#90A4AE', '#BCAAA4'],
                promptTemplate: 'Photorealistic CG render, physically based rendering, detailed skin textures and pores, realistic hair simulation, accurate material properties, global illumination, ray-traced reflections, cinematic depth of field'
            },
            {
                key: 'stylized_3d',
                name: '风格化3D',
                description: '介于卡通和写实之间的风格化3D，独特的材质处理和艺术化光影',
                colorTags: ['#7E57C2', '#26C6DA', '#FFA000', '#EC407A'],
                promptTemplate: 'Stylized 3D render, semi-realistic proportions with artistic flair, painterly textures, dramatic stylized lighting, vibrant color grading, Fortnite or Arcane inspired aesthetic, clean geometric shapes with organic details'
            },
            {
                key: 'claymation',
                name: '黏土/定格动画风',
                description: '模拟黏土或定格动画的质感，手工制作的温暖感，微缩场景',
                colorTags: ['#FFCC02', '#FF6F00', '#4CAF50', '#FF5252'],
                promptTemplate: 'Claymation stop-motion style, handcrafted clay texture, fingerprint details on surfaces, miniature set design, warm practical lighting, slightly imperfect charming aesthetic, Aardman or Laika studios inspired'
            },
            {
                key: 'low_poly',
                name: 'Low Poly 低多边形',
                description: '几何化的低面数3D风格，扁平化色块，现代简约的数字艺术感',
                colorTags: ['#26A69A', '#AB47BC', '#FFA726', '#42A5F5'],
                promptTemplate: 'Low poly 3D art style, geometric faceted surfaces, flat shading with minimal textures, clean triangular mesh, pastel or vibrant color palette, modern minimalist aesthetic, isometric perspective'
            },
            {
                key: 'lego_brick',
                name: '乐高积木',
                description: '塑料积木拼接效果，块状造型，鲜明色块',
                colorTags: ['#F44336', '#FFEB3B', '#4CAF50', '#2196F3'],
                promptTemplate: 'LEGO brick style, plastic brick construction aesthetic, blocky faceted shapes, primary color palette, clean edges, toy building block aesthetic, isometric or 3/4 view, playful and geometric'
            },
            {
                key: 'stop_motion_felt',
                name: '毛毡定格',
                description: '羊毛毡玩偶质感，柔软手工感，定格动画氛围',
                colorTags: ['#8D6E63', '#A1887F', '#D7CCC8', '#BCAAA4'],
                promptTemplate: 'Wool felt stop-motion style, soft fuzzy texture, handmade craft aesthetic, needle-felted character design, warm muted colors, tactile fabric surfaces, Laika or stop-motion puppet look'
            },
            {
                key: 'dreamworks',
                name: '梦工厂风格',
                description: '怪物史莱克/功夫熊猫式夸张造型与表情',
                colorTags: ['#FF9800', '#8BC34A', '#795548', '#FFEB3B'],
                promptTemplate: 'DreamWorks Animation style, exaggerated character proportions, expressive cartoon faces, lush detailed environments, cinematic lighting, Shrek or Kung Fu Panda aesthetic, bold shapes with refined textures'
            },
            {
                key: 'plastic_toy',
                name: '塑料玩具',
                description: '玩具总动员式高光塑料感，光滑材质',
                colorTags: ['#E91E63', '#00BCD4', '#FFC107', '#4CAF50'],
                promptTemplate: 'Plastic toy style, glossy plastic material like Toy Story, smooth reflective surfaces, bright saturated colors, slight subsurface glow, product-shot lighting, collectible figurine aesthetic'
            },
            {
                key: 'unreal_engine',
                name: 'UE5次世代',
                description: '游戏大作级实时渲染感，高精度光影',
                colorTags: ['#37474F', '#78909C', '#00E676', '#448AFF'],
                promptTemplate: 'Unreal Engine 5 next-gen style, real-time rendering quality, high-fidelity PBR materials, dynamic lighting and Lumen-like global illumination, AAA game cinematic look, detailed environments'
            }
        ]
    },

    // ========================================
    // 3. 国风/水墨 (Chinese Style)
    // ========================================
    {
        key: 'chinese',
        name: '国风/水墨',
        description: '中国传统美学风格，从水墨写意到工笔重彩，展现东方韵味',
        children: [
            {
                key: 'ink_wash',
                name: '水墨写意',
                description: '传统水墨画风格，黑白灰为主调，留白意境，笔触飘逸洒脱',
                colorTags: ['#212121', '#757575', '#EEEEEE', '#D7CCC8'],
                promptTemplate: 'Traditional Chinese ink wash painting style, sumi-e technique, black ink on white rice paper, expressive brush strokes, elegant use of negative space, misty mountains and flowing water, zen minimalist aesthetic, Song Dynasty landscape painting inspired'
            },
            {
                key: 'gongbi',
                name: '工笔重彩',
                description: '精细工整的传统绘画风格，鲜艳矿物颜料色彩，金碧辉煌的装饰感',
                colorTags: ['#C62828', '#F9A825', '#1B5E20', '#01579B'],
                promptTemplate: 'Chinese Gongbi painting style, meticulous fine brushwork, rich mineral pigment colors, detailed line drawing with color fill, gold leaf accents, traditional Chinese court painting aesthetic, Tang Dynasty color palette, ornate and elegant'
            },
            {
                key: 'xianxia',
                name: '仙侠/古风',
                description: '仙侠玄幻风格，飘逸的衣袂，云雾缭绕的仙境，东方奇幻色彩',
                colorTags: ['#7C4DFF', '#00BCD4', '#E8EAF6', '#FFD54F'],
                promptTemplate: 'Chinese Xianxia fantasy style, ethereal immortal realm, flowing silk robes and ribbons, mystical cloud formations, celestial palace architecture, jade and gold ornaments, spiritual energy effects, ancient Chinese mythology inspired'
            },
            {
                key: 'dunhuang',
                name: '敦煌/壁画风',
                description: '敦煌莫高窟壁画风格，飞天造型，矿物质颜料的斑驳质感，宗教艺术美学',
                colorTags: ['#E65100', '#33691E', '#4E342E', '#F57F17'],
                promptTemplate: 'Dunhuang mural painting style, flying Apsara figures, aged fresco texture with mineral pigments, Buddhist art aesthetic, terracotta and ochre color palette, ornate halo and mandala patterns, Silk Road cultural fusion, ancient wall painting patina'
            },
            {
                key: 'modern_chinese',
                name: '新国潮',
                description: '传统中国元素与现代设计融合，潮流配色，国风IP化的时尚表达',
                colorTags: ['#D32F2F', '#FFD600', '#000000', '#FF6D00'],
                promptTemplate: 'Modern Chinese Neo-traditional style, fusion of classical Chinese motifs with contemporary design, bold red and gold palette with modern accents, stylized traditional patterns, trendy street culture meets ancient aesthetics, Chinese pop art'
            },
            {
                key: 'shadow_puppetry',
                name: '皮影戏',
                description: '剪影透光质感，关节节点，传统皮影戏造型',
                colorTags: ['#212121', '#5D4037', '#8D6E63', '#D7CCC8'],
                promptTemplate: 'Chinese shadow puppetry style, silhouette cutout figures, backlit translucent leather, jointed limbs and profile view, traditional Chinese theatre aesthetic, warm amber lighting, ornate decorative cutouts'
            },
            {
                key: 'porcelain',
                name: '青花瓷',
                description: '蓝白配色，瓷器光泽，传统纹样',
                colorTags: ['#1565C0', '#E3F2FD', '#0D47A1', '#B3E5FC'],
                promptTemplate: 'Chinese blue and white porcelain style, cobalt blue on white ceramic glaze, traditional floral and landscape patterns, delicate brushwork, Ming or Qing dynasty ceramic aesthetic, glossy ceramic surface'
            },
            {
                key: 'paper_cutting',
                name: '剪纸艺术',
                description: '红纸镂空，阴阳刻，民间剪纸质感',
                colorTags: ['#C62828', '#F5F5F5', '#FF8A80', '#212121'],
                promptTemplate: 'Chinese paper cutting art style, red paper with intricate cut-out patterns, positive and negative space (yin-yang cut), folk art aesthetic, symmetrical designs, traditional motifs like fish, flowers, characters'
            },
            {
                key: 'republic_era',
                name: '民国风',
                description: '旗袍，旧上海海报风格，复古月份牌',
                colorTags: ['#C62828', '#FFD54F', '#37474F', '#F5F5F5'],
                promptTemplate: 'Republic of China era style, 1920s-40s Shanghai poster aesthetic, cheongsam and period fashion, vintage calendar girl illustration, Art Deco influences, muted sepia and red palette, nostalgic glamour'
            },
            {
                key: 'thangka',
                name: '唐卡艺术',
                description: '藏族宗教画，繁复金线，矿物颜料',
                colorTags: ['#FFD700', '#4A148C', '#C62828', '#1B5E20'],
                promptTemplate: 'Tibetan Thangka painting style, Buddhist religious art, intricate gold line work, mineral pigment colors, mandala and deity imagery, detailed iconography, traditional Himalayan art aesthetic'
            }
        ]
    },

    // ========================================
    // 4. 欧美卡通 (Western Cartoon)
    // ========================================
    {
        key: 'western_cartoon',
        name: '欧美卡通',
        description: '欧美动画和漫画风格，从经典卡通到现代独立动画',
        children: [
            {
                key: 'comic_book',
                name: '美漫/超英风',
                description: 'Marvel/DC式美国漫画风格，粗犷线条，强烈明暗对比，英雄主义构图',
                colorTags: ['#1565C0', '#C62828', '#FDD835', '#212121'],
                promptTemplate: 'American comic book style, bold ink outlines, Ben-Day dots halftone shading, dramatic chiaroscuro lighting, dynamic superhero poses, Marvel DC aesthetic, vibrant primary colors, action-packed composition'
            },
            {
                key: 'cartoon_network',
                name: '现代美式卡通',
                description: '简洁几何化的角色设计，大胆配色，幽默夸张的表现手法',
                colorTags: ['#FF7043', '#66BB6A', '#42A5F5', '#FFCA28'],
                promptTemplate: 'Modern American cartoon style, simplified geometric character design, bold flat colors, thick clean outlines, exaggerated proportions, Cartoon Network or Adventure Time aesthetic, playful and humorous, graphic design influenced'
            },
            {
                key: 'franco_belgian',
                name: '欧洲漫画/BD风',
                description: '法比漫画传统，精细的线条和背景，丰富的色彩层次，叙事性强',
                colorTags: ['#5C6BC0', '#FF8A65', '#AED581', '#FFD54F'],
                promptTemplate: 'Franco-Belgian bande dessinée style, detailed clear line art (ligne claire), rich watercolor-like coloring, Tintin or Moebius inspired, elaborate background scenery, European comic aesthetic, narrative sequential art'
            },
            {
                key: 'rubber_hose',
                name: '复古卡通/橡皮管风',
                description: '1920-30年代早期动画风格，圆润弹性的肢体，黑白或有限色彩',
                colorTags: ['#212121', '#F5F5F5', '#FFEE58', '#EF9A9A'],
                promptTemplate: 'Vintage 1930s rubber hose animation style, Fleischer Studios or early Disney aesthetic, round bouncy limbs, pie-cut eyes, black and white with sepia tones, old film grain texture, vaudeville era charm, Cuphead game inspired'
            },
            {
                key: 'adult_animation',
                name: '成人动画风',
                description: '面向成人的动画风格，讽刺幽默，风格多变，如《瑞克和莫蒂》',
                colorTags: ['#7CB342', '#00BCD4', '#FF5722', '#9C27B0'],
                promptTemplate: 'Adult animation style, Rick and Morty or Bojack Horseman aesthetic, slightly crude but intentional line work, vivid neon-accented palette, satirical and irreverent tone, sci-fi or urban settings, expressive character acting'
            },
            {
                key: 'abstract_upa',
                name: '50年代UPA',
                description: '抽象几何，极简主义，美国动画黄金时代',
                colorTags: ['#FF5722', '#FFC107', '#2196F3', '#212121'],
                promptTemplate: '1950s UPA animation style, limited animation, flat geometric shapes, minimal background, bold graphic design, Mr Magoo or Gerald McBoing-Boing aesthetic, mid-century modern illustration'
            },
            {
                key: 'noir_comic',
                name: '黑色漫画',
                description: '罪恶之城式极致黑白红，硬汉漫画',
                colorTags: ['#212121', '#F5F5F5', '#B71C1C', '#424242'],
                promptTemplate: 'Noir comic style, Sin City aesthetic, high contrast black and white with stark red accents, hard-edged shadows, gritty urban crime atmosphere, Frank Miller inspired inking'
            },
            {
                key: 'graffiti',
                name: '街头涂鸦',
                description: '喷漆质感，嘻哈风格，街头艺术',
                colorTags: ['#E91E63', '#FFEB3B', '#00BCD4', '#212121'],
                promptTemplate: 'Street graffiti style, spray paint texture, bold outlines and drips, hip-hop urban aesthetic, stencil and freehand elements, vibrant neon and primary colors, wall art aesthetic'
            },
            {
                key: 'south_park',
                name: '剪纸拼贴',
                description: '南方公园式粗糙剪纸感，纸片人造型',
                colorTags: ['#8BC34A', '#FF5722', '#FFEB3B', '#2196F3'],
                promptTemplate: 'South Park style, construction paper cutout aesthetic, flat colored shapes, simple geometric characters, paper craft look, satirical cartoon style, minimal shading'
            },
            {
                key: 'disney_renaissance',
                name: '迪士尼复兴',
                description: '90年代狮子王/美女与野兽手绘风',
                colorTags: ['#FF9800', '#8D6E63', '#66BB6A', '#FDD835'],
                promptTemplate: 'Disney Renaissance style, 1990s hand-drawn animation, Lion King or Beauty and the Beast aesthetic, lush painted backgrounds, Broadway-influenced character design, rich color and dramatic lighting'
            }
        ]
    },

    // ========================================
    // 5. 写实/真人混合 (Realistic/Hybrid)
    // ========================================
    {
        key: 'realistic',
        name: '写实/真人混合',
        description: '接近真实影像的风格，适合纪录片、真人短片、数字人等场景',
        children: [
            {
                key: 'photorealistic',
                name: '照片级写实',
                description: '几乎无法区分真假的超写实风格，精确的光影和材质',
                colorTags: ['#78909C', '#8D6E63', '#546E7A', '#A1887F'],
                promptTemplate: 'Photorealistic style, hyperrealistic rendering, accurate skin subsurface scattering, natural lighting conditions, shallow depth of field, 8K resolution detail, shot on Canon EOS R5, professional photography aesthetic'
            },
            {
                key: 'digital_human',
                name: '数字人/虚拟偶像',
                description: '高精度数字人物，介于真实和理想化之间，适合虚拟主播和数字偶像',
                colorTags: ['#E040FB', '#00E5FF', '#F5F5F5', '#FF4081'],
                promptTemplate: 'Digital human virtual idol style, high-fidelity facial features, slightly idealized proportions, flawless skin with realistic pores, studio lighting setup, fashion photography pose, Unreal Engine MetaHuman quality'
            },
            {
                key: 'mixed_media',
                name: '真人+动画混合',
                description: '真实影像与动画元素叠加，如手绘特效覆盖在实拍画面上',
                colorTags: ['#FF6F00', '#1E88E5', '#F5F5F5', '#E91E63'],
                promptTemplate: 'Mixed media style, live action footage combined with hand-drawn animation overlays, rotoscope aesthetic, animated effects on real backgrounds, A-ha Take On Me inspired, blend of photography and illustration'
            },
            {
                key: 'miniature',
                name: '微缩/移轴摄影风',
                description: '模拟微缩模型或移轴镜头效果，让真实场景看起来像玩具世界',
                colorTags: ['#66BB6A', '#FFCA28', '#EF5350', '#42A5F5'],
                promptTemplate: 'Tilt-shift miniature photography style, shallow depth of field making real scenes look like toy models, oversaturated colors, bird eye view perspective, diorama aesthetic, miniature world effect'
            },
            {
                key: 'film_noir',
                name: '黑色电影/复古胶片',
                description: '经典黑色电影的光影美学，高对比度，胶片颗粒感，戏剧性打光',
                colorTags: ['#212121', '#F5F5F5', '#616161', '#D4AF37'],
                promptTemplate: 'Film noir cinematic style, high contrast black and white, dramatic chiaroscuro lighting, venetian blind shadow patterns, vintage film grain, 1940s detective movie aesthetic, moody atmospheric fog, classic Hollywood glamour'
            },
            {
                key: 'vintage_vhs',
                name: '复古录像带',
                description: '故障艺术，磁带噪点，80-90年代VHS质感',
                colorTags: ['#9E9E9E', '#757575', '#BDBDBD', '#E0E0E0'],
                promptTemplate: 'Vintage VHS style, analog tape distortion, scan lines and tracking errors, faded color bleed, 1980s-90s camcorder aesthetic, glitch art elements, nostalgic low-fi video look'
            },
            {
                key: 'cinematic_drone',
                name: '航拍大片',
                description: '广角鸟瞰，壮丽风景，电影级航拍',
                colorTags: ['#37474F', '#26A69A', '#81C784', '#FFB74D'],
                promptTemplate: 'Cinematic drone aerial style, wide angle bird eye view, epic landscape vistas, golden hour or dramatic clouds, film grade color, IMAX or documentary scale, majestic natural scenery'
            },
            {
                key: 'imax_documentary',
                name: 'IMAX纪录片',
                description: '极高清晰度，自然生态，科教大片感',
                colorTags: ['#558B2F', '#78909C', '#8D6E63', '#ECEFF1'],
                promptTemplate: 'IMAX documentary style, ultra high resolution nature footage, wildlife and natural history aesthetic, immersive wide shots, neutral color grade, BBC Earth or Planet Earth quality'
            },
            {
                key: 'underwater',
                name: '水下摄影',
                description: '丁达尔效应，气泡，光线折射',
                colorTags: ['#0097A7', '#4DD0E1', '#B2EBF2', '#006064'],
                promptTemplate: 'Underwater photography style, light rays through water (God rays), bubbles and caustics, blue-green color cast, refraction and distortion, ocean or pool aesthetic, National Geographic underwater look'
            },
            {
                key: 'scifi_realism',
                name: '科幻写实',
                description: '星际穿越式硬核太空，写实科幻',
                colorTags: ['#37474F', '#546E7A', '#78909C', '#ECEFF1'],
                promptTemplate: 'Sci-fi realism style, Interstellar or The Martian aesthetic, hard science fiction, realistic spacecraft and space environments, accurate lighting in vacuum, NASA-inspired technology, cinematic scale'
            }
        ]
    },

    // ========================================
    // 6. 平面/插画 (Illustration)
    // ========================================
    {
        key: 'illustration',
        name: '平面/插画',
        description: '二维插画和平面设计风格，适合信息可视化、绘本、MG动画等',
        children: [
            {
                key: 'flat_design',
                name: '扁平化/MG动画风',
                description: '简洁的几何形状，无阴影或极简阴影，鲜明的色块，适合解说类动画',
                colorTags: ['#42A5F5', '#FF7043', '#66BB6A', '#AB47BC'],
                promptTemplate: 'Flat design motion graphics style, clean geometric shapes, bold solid color blocks, minimal shadows, vector art aesthetic, infographic illustration, Kurzgesagt inspired, modern corporate illustration'
            },
            {
                key: 'watercolor',
                name: '水彩/手绘插画',
                description: '水彩颜料的透明质感，自然晕染效果，温暖柔和的艺术气息',
                colorTags: ['#F48FB1', '#81D4FA', '#A5D6A7', '#FFE082'],
                promptTemplate: 'Watercolor illustration style, transparent paint washes, soft color bleeding and blending, visible paper texture, delicate hand-painted aesthetic, children book illustration quality, gentle and dreamy atmosphere'
            },
            {
                key: 'paper_cut',
                name: '剪纸/拼贴风',
                description: '模拟剪纸或拼贴画的层次感，纸张纹理，手工艺术的质朴美感',
                colorTags: ['#E53935', '#FDD835', '#43A047', '#1E88E5'],
                promptTemplate: 'Paper cut collage art style, layered paper textures with visible edges, torn paper effects, mixed media collage aesthetic, craft paper and cardboard materials, shadow between layers creating depth, Eric Carle or Lotte Reiniger inspired'
            },
            {
                key: 'line_art',
                name: '线描/极简插画',
                description: '以线条为主的极简风格，单色或有限配色，强调构图和线条美感',
                colorTags: ['#212121', '#F5F5F5', '#FF7043', '#26A69A'],
                promptTemplate: 'Minimalist line art illustration, single continuous line drawing, clean monochrome with one accent color, elegant simplicity, negative space composition, modern editorial illustration style, sophisticated and refined'
            },
            {
                key: 'retro_poster',
                name: '复古海报/波普风',
                description: '复古海报和波普艺术风格，大胆的色彩对比，丝网印刷质感',
                colorTags: ['#F44336', '#FFEB3B', '#2196F3', '#FF9800'],
                promptTemplate: 'Retro pop art poster style, Andy Warhol or Roy Lichtenstein inspired, bold primary colors, halftone dot patterns, screen print texture, vintage advertising aesthetic, 1960s graphic design, high contrast and graphic'
            },
            {
                key: 'oil_painting',
                name: '油画/印象派',
                description: '梵高/莫奈风格，厚涂笔触，印象派光色',
                colorTags: ['#FF8F00', '#558B2F', '#1565C0', '#F9A825'],
                promptTemplate: 'Oil painting impressionist style, Van Gogh or Monet inspired, visible brush strokes and impasto, dappled light and color mixing, plein air atmosphere, fine art gallery quality'
            },
            {
                key: 'charcoal_sketch',
                name: '炭笔素描',
                description: '黑白灰，粗糙纸纹，素描质感',
                colorTags: ['#212121', '#757575', '#BDBDBD', '#EEEEEE'],
                promptTemplate: 'Charcoal sketch style, black and white tonal drawing, rough paper texture, smudged shadows and highlights, life drawing or portrait study aesthetic, traditional fine art medium'
            },
            {
                key: 'ukiyo_e',
                name: '浮世绘',
                description: '葛饰北斋，海浪与富士山，日本木版画',
                colorTags: ['#1565C0', '#EF6C00', '#2E7D32', '#F5F5F5'],
                promptTemplate: 'Japanese ukiyo-e woodblock print style, Hokusai Great Wave or Mount Fuji aesthetic, flat color blocks and bold outlines, traditional Japanese printmaking, limited palette, decorative patterns'
            },
            {
                key: 'risograph',
                name: '孔版印刷',
                description: '网点错位，复古双色，Riso印刷感',
                colorTags: ['#E91E63', '#2196F3', '#FF9800', '#4CAF50'],
                promptTemplate: 'Risograph print style, offset dot registration, limited spot colors, slight misalignment texture, zine or indie press aesthetic, warm vintage duotone look'
            },
            {
                key: 'pastel_drawing',
                name: '粉笔画',
                description: '柔和粉彩，磨砂质感，色粉笔艺术',
                colorTags: ['#F8BBD9', '#B2EBF2', '#FFF9C4', '#C5E1A5'],
                promptTemplate: 'Pastel drawing style, soft chalk pastel texture, matte powdery finish, blended colors, portrait or landscape in pastel medium, delicate and dreamy atmosphere'
            }
        ]
    },

    // ========================================
    // 7. 像素/游戏风 (Pixel/Game Art)
    // ========================================
    {
        key: 'pixel_game',
        name: '像素/游戏风',
        description: '电子游戏相关的视觉风格，从复古像素到现代游戏美术',
        children: [
            {
                key: 'pixel_art',
                name: '像素艺术',
                description: '经典像素风格，有限的色彩数量，方块化的图形，8-bit/16-bit怀旧感',
                colorTags: ['#4CAF50', '#2196F3', '#F44336', '#FFC107'],
                promptTemplate: 'Pixel art style, 16-bit retro game aesthetic, limited color palette, crisp pixel-perfect edges, dithering technique for shading, nostalgic SNES or GBA era graphics, sprite-based character design'
            },
            {
                key: 'voxel',
                name: '体素/方块风',
                description: 'Minecraft式的方块3D世界，体素化的角色和场景，可爱的积木感',
                colorTags: ['#8BC34A', '#795548', '#03A9F4', '#FF9800'],
                promptTemplate: 'Voxel art style, Minecraft or Crossy Road inspired, cubic 3D blocks, isometric perspective, bright cheerful colors, blocky character design, magicavoxel aesthetic, charming miniature world'
            },
            {
                key: 'cel_shaded',
                name: '赛璐璐/卡渲风',
                description: '3D模型配合卡通着色的渲染风格，如《塞尔达：旷野之息》',
                colorTags: ['#66BB6A', '#42A5F5', '#FFCA28', '#EF5350'],
                promptTemplate: 'Cel-shaded 3D game art style, toon shading with bold outlines, Breath of the Wild or Genshin Impact inspired, vibrant anime-like coloring on 3D models, clean stylized rendering, hand-painted texture maps'
            },
            {
                key: 'concept_art',
                name: '游戏概念设定',
                description: '游戏开发中的概念设计风格，半写实的角色和场景设定图',
                colorTags: ['#5D4037', '#78909C', '#FF8F00', '#37474F'],
                promptTemplate: 'Game concept art style, professional character design sheet, semi-realistic digital painting, detailed armor and costume design, environment concept with mood lighting, Artstation trending quality, AAA game production value'
            },
            {
                key: 'chibi_game',
                name: 'Q版/SD角色',
                description: '大头小身的Q版变形角色，2-3头身比例，可爱圆润的造型',
                colorTags: ['#FF80AB', '#B388FF', '#84FFFF', '#FFFF8D'],
                promptTemplate: 'Chibi super-deformed character style, 2-3 head tall proportions, oversized cute head, tiny rounded body, big expressive eyes, kawaii aesthetic, gacha game character design, adorable and collectible'
            },
            {
                key: 'ps1_retro',
                name: 'PS1复古3D',
                description: '低模，抖动纹理，早期3D游戏质感',
                colorTags: ['#78909C', '#546E7A', '#37474F', '#90A4AE'],
                promptTemplate: 'PS1 retro 3D style, low polygon count, vertex wobble and texture warping, limited draw distance fog, early 3D console aesthetic, Resident Evil or Tomb Raider era graphics'
            },
            {
                key: 'arcade_vector',
                name: '街机矢量',
                description: '霓虹线框，80年代太空大战矢量风',
                colorTags: ['#00E676', '#E040FB', '#00BCD4', '#212121'],
                promptTemplate: 'Arcade vector style, neon wireframe graphics, 1980s Asteroids or Battlezone aesthetic, vector display CRT look, glowing lines on black, retro sci-fi arcade'
            },
            {
                key: 'isometric_rpg',
                name: '等轴RPG',
                description: '纪念碑谷/哈迪斯式等轴视角',
                colorTags: ['#7E57C2', '#26A69A', '#FFA726', '#EF5350'],
                promptTemplate: 'Isometric RPG style, Monument Valley or Hades perspective, clean isometric view, hand-painted or stylized 3D, puzzle game or action RPG aesthetic'
            },
            {
                key: 'gameboy',
                name: 'GameBoy',
                description: '绿屏四色像素，掌机复古',
                colorTags: ['#8BAC0F', '#306230', '#0F380F', '#9BBC0F'],
                promptTemplate: 'Game Boy style, 4-shade green monochrome pixel art, 160x144 resolution feel, dot matrix display aesthetic, 8-bit handheld nostalgia, Pokemon or Zelda Link Awakening look'
            },
            {
                key: 'glitch_art',
                name: '故障艺术',
                description: '赛博故障，数据损坏，数字失真',
                colorTags: ['#E91E63', '#00BCD4', '#212121', '#76FF03'],
                promptTemplate: 'Glitch art style, digital corruption and data moshing, RGB channel shift, scan line breaks, cyberpunk aesthetic, intentional digital artifacts and noise'
            }
        ]
    },

    // ========================================
    // 8. 新发现 (Discovered from Civitai)
    // ========================================
    {
        key: 'discovered',
        name: '新发现',
        description: '从AI社区发掘的热门新风格',
        children: [
            {
                key: 'blindbox',
                name: '盲盒/手办风',
                description: '3D Q版公仔质感，塑料材质，可爱收藏品风格',
                colorTags: ['#FF80AB', '#B388FF', '#84FFFF', '#FFFF8D'],
                promptTemplate: 'Blind box figure style, chibi 3D figurine, vinyl toy aesthetic, cute collectible character, smooth plastic material, rounded proportions, solid color background, product photography lighting, miniature figure display'
            },
            {
                key: 'tarot_card',
                name: '塔罗牌风',
                description: '神秘华丽的塔罗牌插画风格，金边装饰，对称构图',
                colorTags: ['#FFD700', '#4A148C', '#1A237E', '#E65100'],
                promptTemplate: 'Tarot card art style, ornate golden border frame, mystical symbolism, symmetrical composition, Art Nouveau decorative elements, rich jewel tone colors, detailed illustration, esoteric and magical atmosphere'
            },
            {
                key: 'polaroid',
                name: '拍立得/宝丽来',
                description: '即时成像照片风格，柔和褪色色调，白色边框，怀旧感',
                colorTags: ['#FFCC80', '#BCAAA4', '#F5F5F5', '#A1887F'],
                promptTemplate: 'Polaroid instant photo style, faded warm color tones, white photo border frame, slightly overexposed, vintage nostalgic aesthetic, soft dreamy lighting, candid snapshot feeling, retro film grain'
            },
            {
                key: 'gothic_neon',
                name: '哥特霓虹',
                description: '暗黑哥特美学与霓虹灯光融合，戏剧性色彩对比',
                colorTags: ['#E040FB', '#00E5FF', '#212121', '#FF1744'],
                promptTemplate: 'Gothic neon style, dark atmospheric background, vivid neon lighting accents, dramatic color contrast, Gothic architecture elements, moody cyberpunk undertones, stained glass glow effects, dark fantasy aesthetic'
            },
            {
                key: 'webtoon',
                name: '韩漫/条漫风',
                description: '韩国网络漫画风格，清晰线条，鲜明色彩，竖屏构图',
                colorTags: ['#42A5F5', '#FF7043', '#66BB6A', '#FFCA28'],
                promptTemplate: 'Korean webtoon manhwa style, clean digital line art, vibrant flat coloring, dramatic lighting effects, vertical scroll composition, modern character design, expressive eyes, manhwa illustration aesthetic'
            },
            {
                key: 'manga_lineart',
                name: '漫画线稿风',
                description: '黑白漫画线稿，精细的墨线条，无色彩的纯线条艺术',
                colorTags: ['#212121', '#F5F5F5', '#757575', '#BDBDBD'],
                promptTemplate: 'Manga lineart style, black and white ink drawing, detailed line work, no color, clean monochrome illustration, manga panel aesthetic, professional inking, hatching and cross-hatching shading technique'
            },
            {
                key: 'stained_glass',
                name: '彩色玻璃',
                description: '教堂花窗，透光色块，铅条分割',
                colorTags: ['#C62828', '#1565C0', '#2E7D32', '#FFD54F'],
                promptTemplate: 'Stained glass window style, church cathedral aesthetic, lead line divisions, translucent color panels, backlit glow, religious or decorative motifs, Tiffany glass quality'
            },
            {
                key: 'sticker_art',
                name: '贴纸艺术',
                description: '白边，粗线条，贴纸/徽章感',
                colorTags: ['#FF80AB', '#B388FF', '#69F0AE', '#FFD740'],
                promptTemplate: 'Sticker art style, white border outline, bold thick lines, die-cut sticker or pin badge aesthetic, flat colors, kawaii or street art influence, collectible sticker look'
            },
            {
                key: 'knolling',
                name: '零件平铺',
                description: '强迫症式排列，俯视平铺，产品摄影',
                colorTags: ['#78909C', '#90A4AE', '#ECEFF1', '#546E7A'],
                promptTemplate: 'Knolling style, flat lay arrangement, objects aligned at 90 degrees, overhead view, organized product photography, satisfying grid layout, tools or parts spread neatly'
            },
            {
                key: 'isometric_room',
                name: '等轴小房间',
                description: '温馨的小屋剖面，等轴视角室内',
                colorTags: ['#8D6E63', '#A5D6A7', '#FFCC80', '#90CAF9'],
                promptTemplate: 'Isometric room interior style, cozy room cross-section or dollhouse view, warm interior design, small scale furniture and details, indie game or illustration aesthetic, inviting space'
            }
        ]
    }
]
