/**
 * @module @gongshiyun/dsh-theme-claude-desktop/client
 *
 * Claude Desktop 风格主题（client 半边）。
 *
 * 参考：
 *   - Claude Desktop 界面风格（暖砂画布 + 赤陶主色）
 *   - gongshiyun/openchamber-claude-desktop-theme 的 Light / Dark 两个变体
 *   - 思源主题 frostime/sy-theme-siyaude（砂源）的暖砂 / 赤陶配色
 *
 * 实现方式：调用 `ctx.theme.overrideTokens(source, tokens)` 在当前主题之上叠一层
 * token。该 API 的每个 token 都必须给出 `{ light, dark }` 一对取值，快照会按
 * **当前生效的 colorScheme** 取用其中一个。于是：
 *
 *   - 明、暗两套变体同时注册，切换由 DSH 内置的「设置 → 通用 → 外观」
 *     （浅色 / 深色 / 跟随系统）驱动，不需要本插件持有任何状态；
 *   - `system` 偏好、首屏 bootstrap、`theme-color` 元信息全部沿用 DSH 自己的实现；
 *   - 插件卸载时 `overrideTokens` 的 disposer 自动摘掉整层，界面回到内置配色。
 *
 * 叠加位置是 `document.body` 的行内 CSS 变量（由 ui-layout 的 ThemePresenter 写入），
 * 行内样式优先级高于任何选择器，因此可以覆盖 `:root` / `body` 上定义的同名 token。
 *
 * 需要注意的两个「引用陷阱」（已在下面显式覆盖）：
 *   1. `--shiki-foreground` / `--shiki-background` 定义在 `:root` 上，且值形如
 *      `var(--dsw-alias-...)`。自定义属性的替换发生在**声明它的元素**上，也就是
 *      html 元素 —— 那里的 alias 仍是内置值。所以这两个 token 必须给出具体颜色。
 *   2. `--dsw-font-markdown-h1/h2/h3` 是 `font` 简写，值里带
 *      `var(--dsw-font-family)`。要把标题换成衬线体，必须整条简写重写，
 *      只改 `-font-family` 子 token 不会影响实际渲染。
 */
window.__ModuleLoader__.load({
  id: '@gongshiyun/dsh-theme-claude-desktop',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

    /** 覆盖层的来源标识（正常路径下就是包 id）。 */
    const PLUGIN_ID = '@gongshiyun/dsh-theme-claude-desktop';

    /* ================================================================== *
     * 一、字体排印
     *
     * 三段字体栈都遵循「Anthropic 字体优先 → 本机近似字体 → 通用族」的顺序：
     * 装了 anthropic-fonts（https://github.com/matthieuhuguet/anthropic-fonts）
     * 就自动用上 Anthropic Sans / Serif / Mono，没装则优雅退化到
     * Segoe UI / Georgia / Cascadia Code，中文各自接到思源与系统黑体、宋体。
     * ================================================================== */

    /** 界面正文：Anthropic Sans → 系统 UI 无衬线。 */
    const FONT_SANS = [
      '"Anthropic Sans Text"',
      '"Anthropic Sans"',
      '"Styrene B"',
      '"Segoe UI Variable Text"',
      '"Segoe UI"',
      '-apple-system',
      'BlinkMacSystemFont',
      '"PingFang SC"',
      '"Hiragino Sans GB"',
      '"Microsoft YaHei UI"',
      '"Microsoft YaHei"',
      '"Noto Sans SC"',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(', ');

    /** 标题：Anthropic Serif → 本机衬线（Georgia / 思源宋体）。 */
    const FONT_SERIF = [
      '"Anthropic Serif Text"',
      '"Anthropic Serif"',
      '"Copernicus"',
      '"Tiempos Text"',
      'Georgia',
      '"Noto Serif SC"',
      '"Noto Serif CJK SC"',
      '"Songti SC"',
      '"SimSun"',
      '"Times New Roman"',
      'serif',
    ].join(', ');

    /** 代码：Anthropic Mono → 本机等宽（Cascadia / JetBrains Mono）。 */
    const FONT_MONO = [
      '"Anthropic Mono"',
      '"AnthropicMono"',
      '"Cascadia Code"',
      '"Cascadia Mono"',
      '"JetBrains Mono"',
      '"SF Mono"',
      'Consolas',
      '"Liberation Mono"',
      'Menlo',
      'Courier',
      '"Noto Sans Mono CJK SC"',
      '"Microsoft YaHei UI"',
      'monospace',
    ].join(', ');

    /* ================================================================== *
     * 二、调色板
     *
     * 浅色 = 暖砂画布（#FFFAF2）+ 赤陶主色（#B85430）
     * 深色 = 暖炭画布（#26221E）+ 浅赤陶主色（#DF805B）
     * ================================================================== */

    const LIGHT = {
      /* 表面：画布 → 逐级抬升的面 */
      canvas: '#FFFAF2',
      layer1: '#FFFDF9',
      layer2: '#FFFDF9',
      layer3: '#FFFDF9',
      overlay: '#F1E7D8',
      platform: '#F1E7D8',
      multiselect: '#F3EBDD',
      skeleton: '#56412B14',
      mask1: '#2A20183D',
      mask2: '#2A20181F',
      mask3: '#2A20187A',
      maskPhoto: '#2A2018E0',
      maskDrop: '#FFFAF2B3',
      /* 描边：暖褐透明阶，替代内置的纯黑透明阶 */
      line1: '#56412B12',
      line2: '#56412B26',
      line3: '#56412B2E',
      line4: '#56412B3D',
      lineInverted: '#00000000',
      /* 主色 */
      accent: '#B85430',
      accentHover: '#AA4C2B',
      accentSoft: '#E3C8B6',
      ink: '#3A2E24',
      inkStrong: '#2A2018',
      onAccent: '#FFFAF2',
      /* 文字 */
      text: '#3A2E24',
      text2: '#776450',
      text3: '#8B7A6A',
      caption: '#A08D77',
      dimmed: '#C9BCA9',
      textBluish: '#8C4526',
      accentWash: '#F4E3D8',
      /* 交互态 */
      hover: '#56412B14',
      hoverSolid: '#F1E7D8',
      active: '#56412B1F',
      hoverAccent: '#B8543024',
      hoverDanger: '#A9463614',
      /* 语义 */
      ok: '#4A7350',
      ok2: '#6A9170',
      okWash: '#DEE9DE',
      warn: '#96651C',
      warn2: '#B98A3C',
      warnWash: '#F6E8CF',
      warnLabel: '#7A5314',
      err: '#A94636',
      err2: '#C4675A',
      info: '#3B6A89',
      /* Markdown / 代码 */
      code: '#F8F1E6',
      codeBanner: '#F3EBDD',
      codeTabOn: '#FFFDF9',
      codeTabOff: '#F1E7D8',
      chip: '#F1E7D8',
      placeholder: '#F3EBDD',
      /* 聊天 */
      bubble: '#F6E7D8',
      bubbleHi: '#EFDCC4',
      composer: '#FFFDF9',
      menu: '#FFFDF9',
      tip: '#F6EEE1',
      loginInput: '#F8F1E6',
      sidebar: '#F3EBDD',
      navHover: '#EDE3D2',
      navActive: '#E9DEC9',
      navAccent: '#E1D2B8',
      selector: '#F1E7D8',
      /* 滚动条 */
      bar1: '#DED2C0',
      bar2: '#D6C8B4',
      bar1Hover: '#C4B29B',
      bar2Hover: '#B8A48C',
      /* 浮层 */
      toast: '#2A2018',
      tooltip: '#33281F',
      /* 轻量状态色（工具栏按钮叠在任意底色上） */
      toolbar: '#6B5A4780',
      toolbarHover: '#6B5A4799',
      toolbarInvisible: '#3A2E245C',
      toolGhostBorder: '#C4B29B',
      toolGhost: '#F1E7D8',
      toolGhostHover: '#EBDFCC',
      contrast: '#3A2E24',
      /* 语法高亮 */
      synComment: '#7B6954',
      synKeyword: '#9B452C',
      synString: '#4A7350',
      synNumber: '#785B91',
      synFunction: '#3B6A89',
      synType: '#8F5F1A',
      synPunct: '#8B7A6A',
      /* 渐变 / 阴影（思考块上下缘的淡出遮罩，颜色须与所在底色一致） */
      thinkFromGradient: 'linear-gradient(180deg, #FFFAF2 20.19%, #FFFAF200 100%)',
      thinkSelectGradient: 'linear-gradient(180deg, #F6EEE1 20.19%, #F6EEE100 100%)',
      shadow1: '0 2px 4px 0 #3A2E240D',
      shadow1Blur: '0 4px 12px 0 #3A2E2405',
      shadow2: '0 4px 12px 0 #3A2E2405, 0 2px 8px 0 #3A2E240A',
      shadow3: '0 0 1px 0 #3A2E2433, 0 0 4px 0 #3A2E2405, 0 12px 32px 0 #3A2E2414',
    };

    const DARK = {
      canvas: '#26221E',
      layer1: '#2E2721',
      layer2: '#332C25',
      layer3: '#39312A',
      overlay: '#3A3128',
      platform: '#3A3128',
      multiselect: '#332C25',
      skeleton: '#FFFFFF14',
      mask1: '#120E0B80',
      mask2: '#120E0B03',
      mask3: '#120E0B7A',
      maskPhoto: '#120E0BE0',
      maskDrop: '#1E1A16B3',
      line1: '#EBE1D21A',
      line2: '#EBE1D22E',
      line3: '#EBE1D23D',
      line4: '#EBE1D24D',
      lineInverted: '#FFFFFF14',
      accent: '#DF805B',
      accentHover: '#E8916D',
      accentSoft: '#5A3A2C',
      ink: '#E2D9CC',
      inkStrong: '#F0E7DA',
      onAccent: '#26150E',
      text: '#E2D9CC',
      text2: '#A39684',
      text3: '#938573',
      caption: '#8A7B6B',
      dimmed: '#5A5049',
      textBluish: '#F0C4AC',
      accentWash: '#3A2A22',
      hover: '#EBE1D214',
      hoverSolid: '#332C25',
      active: '#EBE1D224',
      hoverAccent: '#DF805B24',
      hoverDanger: '#E4827026',
      ok: '#A6C896',
      ok2: '#8FB07F',
      okWash: '#2C3A2A',
      warn: '#E3BC72',
      warn2: '#C9A45E',
      warnWash: '#3C3222',
      warnLabel: '#E3BC72',
      err: '#E48270',
      err2: '#C96A59',
      info: '#95BFD0',
      code: '#201B17',
      codeBanner: '#2A241E',
      codeTabOn: '#332C25',
      codeTabOff: '#201B17',
      chip: '#2A241E',
      placeholder: '#2A241E',
      bubble: '#332B24',
      bubbleHi: '#3D342B',
      composer: '#2E2721',
      menu: '#332C25',
      tip: '#2A241E',
      loginInput: '#201B17',
      sidebar: '#1E1A16',
      navHover: '#2A241E',
      navActive: '#332B23',
      navAccent: '#3A3128',
      selector: '#332C25',
      bar1: '#4A4239',
      bar2: '#544B41',
      bar1Hover: '#5E5449',
      bar2Hover: '#6A5F53',
      toast: '#332C25',
      tooltip: '#332C25',
      toolbar: '#6B5A4780',
      toolbarHover: '#6B5A4799',
      toolbarInvisible: '#3A2E245C',
      toolGhostBorder: '#5E5449',
      toolGhost: '#332C25',
      toolGhostHover: '#3D342B',
      contrast: '#E2D9CC',
      synComment: '#938573',
      synKeyword: '#E39371',
      synString: '#A6C896',
      synNumber: '#BAA0D4',
      synFunction: '#95BFD0',
      synType: '#E3BC72',
      synPunct: '#A39684',
      thinkFromGradient: 'linear-gradient(180deg, #26221E 20.19%, #26221E00 100%)',
      thinkSelectGradient: 'linear-gradient(180deg, #2A241E 20.19%, #2A241E00 100%)',
      shadow1: '0 2px 4px 0 #0000002E',
      shadow1Blur: '0 4px 12px 0 #0000001F',
      shadow2: '0 4px 12px 0 #00000024, 0 2px 8px 0 #00000029',
      shadow3: '0 0 1px 0 #00000059, 0 0 4px 0 #0000001F, 0 12px 32px 0 #0000003D',
    };

    /* ================================================================== *
     * 三、token 表
     * ================================================================== */

    /** 同一取值在明暗两套里都成立（颜色本身与配色无关，或字体这类非颜色 token）。 */
    const both = (value) => ({ light: value, dark: value });

    /** 从明/暗两套调色板里各取一个键，组成 { light, dark } 对。 */
    const dual = (key) => ({ light: LIGHT[key], dark: DARK[key] });

    /**
     * 把 `font` 简写里的字体族从无衬线换成给定字体族。
     * @param weight 字重（与内置字阶保持一致）
     * @param sizeExpr 字号表达式（保留 `--dsh-content-font-delta` 增量，使内容字号设置继续生效）
     * @param lineExpr 行高表达式
     * @param family 目标字体族
     */
    const headingFont = (weight, sizeExpr, lineExpr, family) =>
      weight + ' ' + sizeExpr + ' / ' + lineExpr + ' ' + family;

    const H1_SIZE = 'calc(21px + var(--dsh-content-font-delta))';
    const H1_LINE = 'calc(30px + var(--dsh-content-font-delta))';
    const H2_SIZE = 'calc(19px + var(--dsh-content-font-delta))';
    const H2_LINE = 'calc(28px + var(--dsh-content-font-delta))';
    const H3_SIZE = 'calc(18px + var(--dsh-content-font-delta))';
    const H3_LINE = 'calc(26px + var(--dsh-content-font-delta))';

    const TOKENS = {
      /* ---------------- 字体排印（详见文件头说明） ---------------- */
      '--dsw-font-family': both(FONT_SANS),
      '--ds-font-family-code': both(FONT_MONO),
      '--dsw-font-markdown-h1': both(headingFont(700, H1_SIZE, H1_LINE, FONT_SERIF)),
      '--dsw-font-markdown-h1-font-family': both(FONT_SERIF),
      '--dsw-font-markdown-h2': both(headingFont(700, H2_SIZE, H2_LINE, FONT_SERIF)),
      '--dsw-font-markdown-h2-font-family': both(FONT_SERIF),
      '--dsw-font-markdown-h3': both(headingFont(700, H3_SIZE, H3_LINE, FONT_SERIF)),
      '--dsw-font-markdown-h3-font-family': both(FONT_SERIF),

      /* ---------------- 代码高亮（必须给具体色值，见文件头说明） ---------------- */
      '--shiki-foreground': dual('text'),
      '--shiki-background': dual('code'),
      '--shiki-token-constant': dual('synNumber'),
      '--shiki-token-string': dual('synString'),
      '--shiki-token-comment': dual('synComment'),
      '--shiki-token-keyword': dual('synKeyword'),
      '--shiki-token-parameter': dual('synType'),
      '--shiki-token-function': dual('synFunction'),
      '--shiki-token-string-expression': dual('synString'),
      '--shiki-token-punctuation': dual('synPunct'),
      '--shiki-token-link': dual('synFunction'),

      /* ---------------- 表面 ---------------- */
      '--dsw-alias-bg-base': dual('canvas'),
      '--dsw-alias-bg-layer-1': dual('layer1'),
      '--dsw-alias-bg-layer-2': dual('layer2'),
      '--dsw-alias-bg-layer-3': dual('layer3'),
      '--dsw-alias-bg-overlay': dual('overlay'),
      '--dsw-alias-bg-module-platform': dual('platform'),
      '--dsw-alias-bg-multi-select': dual('multiselect'),
      '--dsw-alias-bg-skeleton': dual('skeleton'),
      '--dsw-alias-bg-mask-1': dual('mask1'),
      '--dsw-alias-bg-mask-2': dual('mask2'),
      '--dsw-alias-bg-mask-3': dual('mask3'),
      '--dsw-alias-bg-mask-photo': dual('maskPhoto'),
      '--dsw-alias-bg-mask-drop': dual('maskDrop'),

      /* ---------------- 描边 ---------------- */
      '--dsw-alias-border-l1': dual('line1'),
      '--dsw-alias-border-l2': dual('line2'),
      '--dsw-alias-border-l2-darkmode-thin': dual('line2'),
      '--dsw-alias-border-l3': dual('line3'),
      '--dsw-alias-border-l4': dual('line4'),
      '--dsw-alias-border-inverted': dual('lineInverted'),
      '--dsw-alias-border-inverted2': dual('lineInverted'),

      /* ---------------- 品牌 / 按钮 ---------------- */
      '--dsw-alias-brand-primary': dual('accent'),
      '--dsw-alias-brand-primary-invert': dual('ink'),
      '--dsw-alias-brand-primary-new-colorprimary-new-color': dual('accent'),
      '--dsw-alias-brand-text': dual('inkStrong'),
      '--dsw-alias-button-primary-fill': dual('accent'),
      '--dsw-alias-button-primary-hover': dual('accentHover'),
      '--dsw-alias-button-primary-dimmed': dual('accentSoft'),
      '--dsw-alias-button-contrast-fill': dual('contrast'),
      '--dsw-alias-button-elevated-fill': dual('layer1'),
      '--dsw-alias-button-floating-fill': dual('layer1'),
      '--dsw-alias-button-floating-hover': dual('hoverSolid'),
      '--dsw-alias-button-ghost-active-fill': dual('toolGhost'),
      '--dsw-alias-button-ghost-active-hover': dual('toolGhostHover'),
      '--dsw-alias-button-ghost-active-border': dual('toolGhostBorder'),
      '--dsw-alias-button-info-fill': dual('accent'),
      '--dsw-alias-button-info-hover': dual('accentHover'),
      '--dsw-alias-button-tool-bar-fill': dual('toolbar'),
      '--dsw-alias-button-tool-bar-hover': dual('toolbarHover'),
      '--dsw-alias-button-tool-bar-fill-invisible': dual('toolbarInvisible'),

      /* ---------------- 交互态背景 ---------------- */
      '--dsw-alias-interactive-bg-hover': dual('hover'),
      '--dsw-alias-interactive-bg-hover-solid': dual('hoverSolid'),
      '--dsw-alias-interactive-bg-active': dual('active'),
      '--dsw-alias-interactive-bg-hover-accent': dual('hoverAccent'),
      '--dsw-alias-interactive-bg-hover-danger': dual('hoverDanger'),

      /* ---------------- 文字 ---------------- */
      '--dsw-alias-label-primary': dual('text'),
      '--dsw-alias-label-primary-dimmed': dual('inkStrong'),
      '--dsw-alias-label-primary-foreground': dual('onAccent'),
      '--dsw-alias-label-primary-inverted': dual('onAccent'),
      '--dsw-alias-label-primary-bluish': dual('textBluish'),
      '--dsw-alias-label-secondary': dual('text2'),
      '--dsw-alias-label-tertiary': dual('text3'),
      '--dsw-alias-label-caption': dual('caption'),
      '--dsw-alias-label-dimmed': dual('dimmed'),
      '--dsw-alias-link': dual('info'),

      /* ---------------- Markdown / 代码块 ---------------- */
      '--dsw-alias-markdown-citation': dual('chip'),
      '--dsw-alias-markdown-code-block': dual('code'),
      '--dsw-alias-markdown-code-block-banner': dual('codeBanner'),
      '--dsw-alias-markdown-code-segment-selected': dual('codeTabOn'),
      '--dsw-alias-markdown-code-segment-unselected': dual('codeTabOff'),
      '--dsw-alias-markdown-inline-code': dual('code'),
      '--dsw-alias-markdown-placeholder': dual('placeholder'),
      '--dsw-alias-markdown-tag': dual('chip'),

      /* ---------------- 滚动条 ---------------- */
      '--dsw-alias-scrollbar-bg-l1': dual('bar1'),
      '--dsw-alias-scrollbar-bg-l2': dual('bar2'),
      '--dsw-alias-scrollbar-hover-l1': dual('bar1Hover'),
      '--dsw-alias-scrollbar-hover-l2': dual('bar2Hover'),

      /* ---------------- 状态语义色 ---------------- */
      '--dsw-alias-state-error-primary': dual('err'),
      '--dsw-alias-state-error-secondary': dual('err2'),
      '--dsw-alias-state-success-primary': dual('ok'),
      '--dsw-alias-state-success-secondary': dual('ok2'),
      '--dsw-alias-state-success-tertiary': dual('okWash'),
      '--dsw-alias-state-warn-primary': dual('warn'),
      '--dsw-alias-state-warn-secondary': dual('warn2'),
      '--dsw-alias-state-warn-tertiary': dual('warnWash'),
      '--dsw-alias-state-warn-label': dual('warnLabel'),
      '--dsw-alias-state-business-primary': dual('accent'),
      '--dsw-alias-state-business-tertiary': dual('accentWash'),

      /* ---------------- 浮层 ---------------- */
      '--dsw-alias-toast-bg': dual('toast'),
      '--dsw-alias-tooltip-bg': dual('tooltip'),

      /* ---------------- 具名表面（侧栏 / 输入 / 气泡 / 菜单） ---------------- */
      '--dsw-specific-bubble': dual('bubble'),
      '--dsw-specific-bubble-highlight': dual('bubbleHi'),
      '--dsw-specific-input-major': dual('composer'),
      '--dsw-specific-login-input': dual('loginInput'),
      '--dsw-specific-menu': dual('menu'),
      '--dsw-specific-selector': dual('selector'),
      '--dsw-specific-sidebar-fill': dual('sidebar'),
      '--dsw-specific-sidebar-nav-item-active': dual('navActive'),
      '--dsw-specific-sidebar-nav-item-active-accent': dual('navAccent'),
      '--dsw-specific-sidebar-nav-item-hover': dual('navHover'),
      '--dsw-specific-tip': dual('tip'),

      /* ---------------- 静态色阶中被组件直接消费的少数几个 ----------------
       * 内置的 `--dsw-static-*` 是「与配色无关」的常量，但仍有十几个被组件直接
       * 引用（不经过 alias 层）。这些引用点各自处在明或暗的专属选择器里，
       * 或本身需要在两种配色下都成立，因此下面给的是能同时成立的中性暖值。 */
      '--dsw-static-neutral-50': both('#FBF7F0'),
      '--dsw-static-neutral-100': both('#F4EDE2'),
      '--dsw-static-neutral-200': both('#E6DCCB'),
      '--dsw-static-neutral-700': both('#3A322A'),
      '--dsw-static-neutral-800': both('#332C25'),
      '--dsw-static-neutral-850': both('#2B251F'),
      '--dsw-static-neutral-bluish-00': both('#FFFDF9'),
      '--dsw-static-neutral-bluish-300': both('#D8CDBB'),
      '--dsw-static-neutral-bluish-400': both('#A39684'),
      '--dsw-static-deepseek-200': both('#E8C4B0'),
      '--dsw-static-deepseek-450': both('#D97757'),
      '--dsw-static-deepseek-500': both('#C4623C'),
      '--dsw-static-blue-450': both('#5E8AA6'),
      '--dsw-static-blue-500': both('#3B6A89'),
      '--dsw-static-green-500': both('#5E8A66'),
      '--dsw-static-red-600': both('#B04B3A'),
      '--dsw-static-amber-400': both('#D9A24A'),
      '--dsw-static-amber-500': both('#C08A2E'),

      /* ---------------- 渐变与阴影 ---------------- */
      '--dsw-linear-gradient-think': dual('thinkFromGradient'),
      '--dsw-linear-think-select': dual('thinkSelectGradient'),
      '--dsw-shadow-lv1': dual('shadow1'),
      '--dsw-shadow-lv1-blur': dual('shadow1Blur'),
      '--dsw-shadow-lv2': dual('shadow2'),
      '--dsw-shadow-lv3': dual('shadow3'),
    };

    /* ================================================================== *
     * 四、插件主体
     * ================================================================== */

    /** 只需要 theme 服务：它同时持有偏好状态与覆盖层注册表。 */
    const inject = ['theme'];

    /**
     * 把 Claude Desktop 配色与字体层挂到当前主题之上。
     *
     * 用 `ctx.effect` 承载 `overrideTokens` 返回的 disposer，使插件重载 / 卸载
     * 时整层干净摘除（动态包门面同样会把 disposer 挂到本 fiber 上，两条路径
     * 都幂等）。
     *
     * @param ctx - client cordis 上下文。
     */
    function apply(ctx) {
      ctx.effect(
        () => ctx.theme.overrideTokens(PLUGIN_ID, TOKENS),
        'theme-claude-desktop: 暖砂/赤陶 token 覆盖层',
      );
    }

    exports.inject = inject;
    exports.apply = apply;
    return module.exports;
  },
});
