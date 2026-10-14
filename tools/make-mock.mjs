/**
 * 生成 docs/mock-light.html 与 docs/mock-dark.html —— 按 DSH 界面结构搭的
 * **示意图**（内容全部是虚构文案，不含任何真实会话/工作区信息）。
 *
 * 用途：README 的头图。真实截图会暴露工作区名与对话内容，所以仓库里用这份
 * 由 token 表生成的模拟界面；它的颜色直接读 lib/client.js，不会和主题脱节。
 *
 * 用法：
 *   node tools/make-mock.mjs
 *   # 再用无头浏览器渲染（devicePixelRatio=2 更清晰）：
 *   chrome --headless=new --force-device-scale-factor=2 --window-size=1240,820 \
 *          --screenshot=docs/mock-light.png docs/mock-light.html
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTokens } from './load-tokens.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const { tokens } = loadTokens();

const d = (n) => tokens[n];
const SANS = d('--dsw-font-family').light;
const MONO = d('--ds-font-family-code').light;
const SERIF = d('--dsw-font-markdown-h1-font-family').light;

const decls = (scheme) =>
  Object.keys(tokens)
    .map((n) => `  ${n}: ${tokens[n][scheme]};`)
    .join('\n');

/** 让内联 SVG 图标跟随文字颜色。 */
const icon = (paths, size = 14) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

const I = {
  menu: icon('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  plus: icon('<path d="M12 5v14M5 12h14"/>', 13),
  plug: icon('<path d="M9 3v6M15 3v6M6 9h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6z"/><path d="M12 18v3"/>'),
  folder: icon('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', 13),
  chat: icon('<path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6.5A8 8 0 0 1 11 4h2a8 8 0 0 1 8 8z"/>', 13),
  search: icon('<circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5"/>', 13),
  terminal: icon('<path d="m5 8 3 3-3 3M12 14h6"/>', 13),
  file: icon('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>', 13),
  target: icon('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>', 13),
  shield: icon('<path d="M12 3 5 6v6c0 4 3 7 7 8 4-1 7-4 7-8V6z"/>', 13),
  rows: icon('<path d="M4 7h16M4 12h16M4 17h10"/>', 13),
  spark: icon('<path d="M12 4v6M12 14v6M4 12h6M14 12h6"/>', 13),
  check: icon('<path d="m5 13 4 4 10-11"/>', 12),
  warn: icon('<path d="M12 4 3 20h18z"/><path d="M12 10v5M12 18h.01"/>', 12),
  error: icon('<circle cx="12" cy="12" r="8"/><path d="M12 8v5M12 16h.01"/>', 12),
  info: icon('<circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 8h.01"/>', 12),
  panel: icon('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>', 14),
};

const frame = (scheme) => `
<div class="stage">
  <div class="app" data-scheme="${scheme}">
    <!-- 顶部菜单行：整行使用侧栏填充色（DSH 的 title-row 背景） -->
    <div class="titlebar">
      <span class="g">${I.menu}</span><span>应用</span><span>编辑</span>
      <span class="spacer"></span>
      <span class="wctl">–</span><span class="wctl">□</span><span class="wctl">✕</span>
    </div>

    <div class="body">
      <!-- 侧栏 -->
      <aside class="side">
        <div class="brand">
          <span class="mark"></span><span class="name">deepseek</span><span class="badge">HARNESS</span>
        </div>
        <div class="newchat">${I.plus}<span>新会话</span></div>
        <div class="navRow">${I.plug}<span>插件</span></div>

        <div class="sectionLabel"><span>工作区</span><span class="spacer"></span>${I.search}${I.rows}${I.plus}</div>
        <div class="ws">${I.folder}<span>示例工作区</span></div>
        <div class="session active"><span class="dot"></span><span class="ellip">主题效果预览（示例）</span><span class="t">刚刚</span></div>
        <div class="session"><span class="doc"></span><span class="ellip">设计走查：暖砂与赤陶</span><span class="t">12 分钟</span></div>
        <div class="session"><span class="doc"></span><span class="ellip">字体排印对齐说明</span><span class="t">1 小时</span></div>

        <div class="ws" style="margin-top:4px">${I.folder}<span>另一个工作区</span></div>
        <div class="session"><span class="doc"></span><span class="ellip">浅色 / 深色取值核对</span><span class="t">昨天</span></div>

        <div class="sideFoot"><span class="avatar">示</span><span>示例用户</span></div>
      </aside>

      <!-- 主区 -->
      <main class="main">
        <div class="head">
          <span class="title">主题效果预览（示例）</span>
          <span class="chip">${I.target}<span>标准模式</span></span>
          <span class="chip">${I.rows}<span>2 个后台任务</span></span>
          <span class="spacer"></span>
          <span class="chip">${I.panel}</span><span class="chip">···</span>
        </div>

        <div class="tabs">
          <span class="tab on">对话</span>
          <span class="tab">轨迹</span>
        </div>

        <div class="scroll">
          <div class="user">把主题的浅色变体接到暖砂画布上，正文用 <b>Anthropic Sans</b>，标题换衬线。</div>

          <div class="toolrow">${I.terminal}<span>执行了命令，已读取文件，已搜索代码等</span></div>

          <div class="md">
            <h3>主题已应用：暖砂画布 + 赤陶主色</h3>
            <p>浅色取值为画布 <code class="inline">#FFFAF2</code>、侧栏 <code class="inline">#F3EBDD</code>、
              主色 <code class="inline">#B85430</code>；深色切换后同样是这一套语义 token，只是换了一组值。</p>

            <pre><span class="banner"><span>theme-tokens.ts</span><span>副本</span></span><code><i class="k">const</i> tokens = {
  <i class="s">'--dsw-alias-bg-base'</i>: { light: <i class="s">'#FFFAF2'</i>, dark: <i class="s">'#26221E'</i> },
  <i class="s">'--dsw-alias-brand-primary'</i>: { light: <i class="s">'#B85430'</i>, dark: <i class="s">'#DF805B'</i> },
};
<i class="c">// 明暗两套同时注册，由 DSH 的外观偏好决定生效哪一套</i>
ctx.theme.<i class="f">overrideTokens</i>(<i class="s">'claude-desktop'</i>, tokens);</code></pre>

            <div class="filecard">
              <span class="ico">ts</span>
              <span>已编辑 <b>theme-tokens.ts</b></span>
              <span class="add">+38</span><span class="del">−6</span>
              <span class="spacer"></span>
              <span class="muted">刚刚</span>
            </div>

            <div class="states">
              <span class="st ok">${I.check}成功</span>
              <span class="st warn">${I.warn}警告</span>
              <span class="st err">${I.error}错误</span>
              <span class="st biz">${I.info}信息</span>
            </div>
          </div>
        </div>

        <div class="dock">
          <div class="tip">${I.target}<span>进行中的目标：把主题的明暗两套取值接入 DSH token 层</span></div>
          <div class="composer">
            <div class="ph">发消息或创建任务，/ 调用指令，@ 文件或对话</div>
            <div class="crow">
              <span class="plus">${I.plus}</span>
              <span class="perm">${I.shield}<span>完全权限</span><span class="caret">⌄</span></span>
              <span class="model">DeepSeek V4.1 Flash Max<span class="caret">⌄</span></span>
              <span class="send">${icon('<path d="M5 12h13M13 6l6 6-6 6"/>', 14)}</span>
            </div>
          </div>
          <div class="status">
            <span>1 轮 12 步 · 96 tok/s</span>
            <span>3.2M tok · 缓存命中 98%</span>
            <span>上下文 21%</span>
          </div>
        </div>
      </main>
    </div>
  </div>
</div>`;

const page = (scheme) => {
  const isDark = scheme === 'dark';
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>Claude Desktop 主题 · DSH 界面示意图（${scheme}）</title>
<style>
  .app {
${decls(scheme)}
  }

  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { background: ${isDark ? '#111110' : '#e6e1d8'}; padding: 22px;
    font: 14px/22px ${SANS}; }
  .stage { width: 1180px; }
  .app { width: 1180px; height: 744px; display: flex; flex-direction: column;
    background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary);
    border-radius: 14px; overflow: hidden;
    box-shadow: 0 18px 48px ${isDark ? '#00000073' : '#3a2e2429'}, 0 0 0 1px ${isDark ? '#ffffff1a' : '#3a2e241f'}; }
  .spacer { flex: 1; }
  svg { display: block; }
  .ellip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* 顶部菜单行 */
  .titlebar { flex: none; height: 44px; display: flex; align-items: center; gap: 18px;
    padding: 0 16px; background: var(--dsw-specific-sidebar-fill);
    border-bottom: .5px solid var(--dsw-alias-border-l1);
    color: var(--dsw-alias-label-secondary); font-size: 13px; }
  .titlebar .g { color: var(--dsw-alias-label-tertiary); }
  .wctl { color: var(--dsw-alias-label-tertiary); font-size: 12px; }

  .body { flex: 1; display: flex; min-height: 0; }

  /* 侧栏 */
  .side { width: 236px; flex: none; display: flex; flex-direction: column; gap: 6px;
    padding: 10px 10px 8px; background: var(--dsw-specific-sidebar-fill);
    border-right: .5px solid var(--dsw-alias-border-l1); }
  .brand { display: flex; align-items: center; gap: 7px; padding: 2px 6px 10px; font-weight: 600; }
  .brand .mark { width: 18px; height: 18px; border-radius: 5px; background: var(--dsw-alias-brand-primary); }
  .brand .name { letter-spacing: -.01em; }
  .brand .badge { font: 9px/15px ${MONO}; letter-spacing: .06em; padding: 0 4px; border-radius: 3px;
    background: var(--dsw-alias-label-primary); color: var(--dsw-specific-sidebar-fill); }
  .newchat { height: 34px; display: flex; align-items: center; justify-content: center; gap: 6px;
    border-radius: 999px; background: var(--dsw-alias-bg-layer-1);
    border: .5px solid var(--dsw-alias-border-l2); font-size: 13px; }
  .navRow { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 8px;
    margin-top: 8px; font-size: 13px; }
  .sectionLabel { display: flex; align-items: center; gap: 8px; padding: 12px 8px 4px;
    color: var(--dsw-alias-label-tertiary); font-size: 12px; }
  .sectionLabel svg { color: var(--dsw-alias-label-tertiary); }
  .ws, .session { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 8px; font-size: 13px; }
  .ws svg { color: var(--dsw-alias-label-tertiary); }
  .session { color: var(--dsw-alias-label-secondary); }
  .session .dot { width: 9px; height: 9px; flex: none; border-radius: 50%;
    border: 1.5px solid var(--dsw-alias-label-tertiary); }
  .session .doc { width: 9px; height: 11px; flex: none; border-radius: 2px;
    border: 1.5px solid var(--dsw-alias-label-tertiary); }
  .session .t { margin-left: auto; color: var(--dsw-alias-label-caption); font-size: 11px; }
  .session.active { background: var(--dsw-specific-sidebar-nav-item-active);
    color: var(--dsw-alias-label-primary); }
  .sideFoot { margin-top: auto; display: flex; align-items: center; gap: 8px; padding: 8px 6px 2px;
    color: var(--dsw-alias-label-secondary); font-size: 13px; }
  .avatar { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center;
    background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-primary-foreground);
    font-size: 11px; }

  /* 主区 */
  .main { flex: 1; min-width: 0; display: flex; flex-direction: column;
    background: var(--dsw-alias-bg-base); }
  .head { flex: none; height: 52px; display: flex; align-items: center; gap: 14px; padding: 0 18px; }
  .head .title { font-weight: 600; }
  .chip { display: inline-flex; align-items: center; gap: 5px;
    color: var(--dsw-alias-label-tertiary); font-size: 12px; }
  .tabs { flex: none; height: 38px; display: flex; gap: 26px; padding: 0 18px;
    border-bottom: .5px solid var(--dsw-alias-border-l1); }
  .tab { display: flex; align-items: center; position: relative; font-size: 13px;
    color: var(--dsw-alias-label-secondary); }
  .tab.on { color: var(--dsw-alias-brand-primary); }
  .tab.on::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px;
    border-radius: 2px; background: var(--dsw-alias-brand-primary); }

  .scroll { flex: 1; min-height: 0; overflow: hidden; padding: 14px 30px 0;
    display: flex; flex-direction: column; gap: 11px; }
  .user { align-self: flex-end; max-width: 64%; padding: 8px 14px; border-radius: 16px;
    background: var(--dsw-specific-bubble); }
  .toolrow { display: flex; align-items: center; gap: 8px;
    color: var(--dsw-alias-label-tertiary); font-size: 13px; }
  .md { display: flex; flex-direction: column; gap: 9px; }
  .md h3 { margin: 2px 0 0; font: 700 17px/26px ${SERIF}; }
  .md p { margin: 0; }
  code.inline { font: 12px/19px ${MONO}; padding: 1px 5px; border-radius: 5px;
    background: var(--dsw-alias-markdown-inline-code); }
  pre { margin: 0; padding: 0; border-radius: 12px; overflow: hidden;
    background: var(--dsw-alias-markdown-code-block);
    border: .5px solid var(--dsw-alias-border-l2); }
  pre .banner { display: flex; justify-content: space-between; padding: 8px 14px;
    font: 11px/16px ${MONO}; color: var(--dsw-alias-label-tertiary);
    background: var(--dsw-alias-markdown-code-block-banner);
    border-bottom: .5px solid var(--dsw-alias-border-l1); }
  pre code { display: block; padding: 11px 14px; font: 12px/19px ${MONO};
    color: var(--shiki-foreground); white-space: pre; }
  pre i { font-style: normal; }
  .k { color: var(--shiki-token-keyword); }
  .s { color: var(--shiki-token-string); }
  .c { color: var(--shiki-token-comment); }
  .f { color: var(--shiki-token-function); }

  .filecard { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 12px;
    background: var(--dsw-static-neutral-50); border: .5px solid var(--dsw-alias-border-l2); font-size: 13px; }
  /* DSH 的文件卡片在深色下由 body[data-ds-dark-theme] 切到 neutral-850，这里照搬同一套语义 */
  .app[data-scheme="dark"] .filecard { background: var(--dsw-static-neutral-850); }
  .filecard .ico { width: 26px; height: 26px; flex: none; border-radius: 7px; display: grid; place-items: center;
    background: var(--dsw-alias-state-success-tertiary); color: var(--dsw-alias-state-success-primary);
    font: 10px/1 ${MONO}; }
  .filecard .add { color: var(--dsw-alias-state-success-primary); font: 12px/18px ${MONO}; }
  .filecard .del { color: var(--dsw-alias-state-error-primary); font: 12px/18px ${MONO}; }
  .filecard .muted { color: var(--dsw-alias-label-caption); font-size: 12px; }

  .states { display: flex; gap: 8px; }
  .st { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px;
    font-size: 11px; }
  .st.ok { background: var(--dsw-alias-state-success-tertiary); color: var(--dsw-alias-state-success-primary); }
  .st.warn { background: var(--dsw-alias-state-warn-tertiary); color: var(--dsw-alias-state-warn-label); }
  .st.err { background: var(--dsw-alias-interactive-bg-hover-danger); color: var(--dsw-alias-state-error-primary); }
  .st.biz { background: var(--dsw-alias-state-business-tertiary); color: var(--dsw-alias-state-business-primary); }

  /* 底部输入区 */
  .dock { flex: none; padding: 10px 18px 0; display: flex; flex-direction: column; gap: 8px; }
  .tip { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px;
    background: var(--dsw-specific-tip); border: .5px solid var(--dsw-alias-border-l1);
    color: var(--dsw-alias-label-secondary); font-size: 12px; }
  .composer { display: flex; flex-direction: column; gap: 12px; padding: 12px 14px 10px;
    border-radius: 18px; background: var(--dsw-specific-input-major);
    border: .5px solid var(--dsw-alias-border-l2); }
  .composer .ph { color: var(--dsw-alias-label-dimmed); }
  .crow { display: flex; align-items: center; gap: 10px; }
  .plus { width: 26px; height: 26px; flex: none; border-radius: 50%; display: grid; place-items: center;
    background: var(--dsw-specific-selector); }
  .perm { display: inline-flex; align-items: center; gap: 5px;
    color: var(--dsw-alias-label-secondary); font-size: 13px; }
  .model { margin-left: auto; display: inline-flex; align-items: center; gap: 5px;
    color: var(--dsw-alias-label-secondary); font-size: 13px; }
  .caret { color: var(--dsw-alias-label-tertiary); font-size: 11px; }
  .send { width: 30px; height: 30px; flex: none; border-radius: 50%; display: grid; place-items: center;
    background: var(--dsw-alias-button-info-fill); color: var(--dsw-alias-label-primary-foreground); }
  .status { display: flex; justify-content: center; gap: 20px; padding: 6px 0 10px;
    color: var(--dsw-alias-label-tertiary); font-size: 12px; }
</style>
</head>
<body>
${frame(scheme)}
</body>
</html>
`;
};

const outDir = path.join(root, 'docs');
fs.mkdirSync(outDir, { recursive: true });
for (const scheme of ['light', 'dark']) {
  const out = path.join(outDir, `mock-${scheme}.html`);
  fs.writeFileSync(out, page(scheme));
  console.log(`已写入 ${out}`);
}
