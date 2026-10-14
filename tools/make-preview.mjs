/**
 * 从 lib/client.js 的 token 表生成 docs/preview.html —— 一份脱离 DSH 也能打开的
 * 主题预览页（配色样张 + 字体排印样张 + 代码高亮样张），明暗两套同页对照。
 *
 * 用法：
 *   node tools/make-preview.mjs
 *   # 可选：用无头浏览器截图
 *   chrome --headless=new --screenshot=docs/preview.png --window-size=1240,3800 docs/preview.html
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTokens } from './load-tokens.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

/* 加载插件、拿到 token 表（与 tools/validate.mjs 相同的无浏览器宿主） */
const { tokens } = loadTokens();

const names = Object.keys(tokens);
const light = (n) => tokens[n].light;
const dark = (n) => tokens[n].dark;
const SANS = light('--dsw-font-family');
const MONO = light('--ds-font-family-code');
const SERIF = light('--dsw-font-markdown-h1-font-family');

/** 一组 token → CSS 声明块。 */
const decls = (scheme) => names.map((n) => `  ${n}: ${tokens[n][scheme]};`).join('\n');

/** 去掉公共前缀，让色板标签更短。 */
const short = (n) => n.replace(/^--(dsw|ds|shiki)-/, '').replace(/^(alias|specific|static)-/, '');

const SWATCH_GROUPS = [
  [
    '表面 / 画布 / 侧栏',
    'surfaces',
    ['--dsw-alias-bg-base', '--dsw-alias-bg-layer-1', '--dsw-alias-bg-layer-2', '--dsw-alias-bg-layer-3', '--dsw-alias-bg-overlay', '--dsw-specific-sidebar-fill', '--dsw-specific-sidebar-nav-item-hover', '--dsw-specific-sidebar-nav-item-active', '--dsw-specific-sidebar-nav-item-active-accent', '--dsw-specific-input-major', '--dsw-specific-tip', '--dsw-specific-menu'],
  ],
  [
    '主色 / 交互',
    'accent',
    ['--dsw-alias-brand-primary', '--dsw-alias-button-primary-hover', '--dsw-alias-button-primary-dimmed', '--dsw-alias-link', '--dsw-alias-interactive-bg-hover', '--dsw-alias-interactive-bg-hover-accent', '--dsw-alias-interactive-bg-hover-danger', '--dsw-alias-interactive-bg-hover-solid'],
  ],
  [
    '文字',
    'text',
    ['--dsw-alias-label-primary', '--dsw-alias-label-primary-dimmed', '--dsw-alias-label-secondary', '--dsw-alias-label-tertiary', '--dsw-alias-label-caption', '--dsw-alias-label-dimmed', '--dsw-alias-label-primary-foreground'],
  ],
  [
    '描边 / 滚动条',
    'borders',
    ['--dsw-alias-border-l1', '--dsw-alias-border-l2', '--dsw-alias-border-l3', '--dsw-alias-border-l4', '--dsw-alias-scrollbar-bg-l1', '--dsw-alias-scrollbar-hover-l1'],
  ],
  [
    '语义状态',
    'states',
    ['--dsw-alias-state-success-primary', '--dsw-alias-state-warn-primary', '--dsw-alias-state-error-primary', '--dsw-alias-state-business-primary', '--dsw-alias-state-success-tertiary', '--dsw-alias-state-warn-tertiary', '--dsw-alias-state-business-tertiary'],
  ],
  [
    'Markdown / 代码 / 气泡',
    'markdown',
    ['--dsw-alias-markdown-code-block', '--dsw-alias-markdown-code-block-banner', '--dsw-alias-markdown-inline-code', '--dsw-alias-markdown-tag', '--dsw-alias-markdown-citation', '--dsw-specific-bubble', '--dsw-specific-bubble-highlight', '--dsw-alias-toast-bg', '--dsw-alias-tooltip-bg'],
  ],
];

const swatchGrid = (scheme, list) =>
  list
    .map((n) => {
      const value = tokens[n][scheme];
      const solid = /^#[0-9a-f]{3,8}$/i.test(value);
      return `<figure class="sw"${solid ? ` style="background:${value}"` : ''}>
        <figcaption><span class="swName">${short(n)}</span><code>${value}</code></figcaption>
      </figure>`;
    })
    .join('');

const group = (title, id, list) => `
  <section class="group">
    <h3>${title}<span class="id">${id}</span></h3>
    <div class="swatches">${swatchGrid('light', list)}</div>
    <div class="swatches darkScope">${swatchGrid('dark', list)}</div>
  </section>`;

const SHIKI = [
  ['keyword', '--shiki-token-keyword'],
  ['string', '--shiki-token-string'],
  ['comment', '--shiki-token-comment'],
  ['function', '--shiki-token-function'],
  ['constant', '--shiki-token-constant'],
  ['parameter', '--shiki-token-parameter'],
  ['punctuation', '--shiki-token-punctuation'],
  ['link', '--shiki-token-link'],
];

const CODE = `/** 主题覆盖层的注册入口。 */
export function apply(ctx) {
  const tokens = { '--dsw-alias-bg-base': { light: '#FFFAF2', dark: '#26221E' } };
  for (const [name, modes] of Object.entries(tokens)) {
    ctx.theme.overrideTokens(name, modes);   // 133 个 token
  }
  return true;
}`;

/** 极简高亮：只按注释/字符串/关键词/数字/函数上色，足以展示 --shiki-* 的实际取值。 */
const highlight = (code) =>
  code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(\/\*\*[\s\S]*?\*\/|\/\/[^\n]*)/g, '<i class="t-comment">$1</i>')
    .replace(/('[^']*')/g, '<i class="t-string">$1</i>')
    .replace(/\b(export|function|const|for|of|return|new|true|import|from)\b/g, '<i class="t-keyword">$1</i>')
    .replace(/\b(\d+)\b/g, '<i class="t-constant">$1</i>')
    .replace(/\b(apply|Object|entries|overrideTokens|ctx)\b/g, '<i class="t-function">$1</i>');

const schemeBlock = (scheme, label) => `
<article class="scheme" data-scheme="${scheme}">
  <header class="schemeHead">
    <h2>${label}</h2><code>colorScheme: ${scheme}</code>
  </header>
  <div class="typography">
    <h1>Claude Desktop 主题 H1</h1>
    <h2>暖砂与赤陶 H2</h2>
    <h3>Anthropic Serif H3</h3>
    <p>正文使用 Anthropic Sans 栈，中文回退到思源黑体 / 微软雅黑。字号与行高沿用 DSH 的内容字阶，
      因此「设置 → 通用 → 内容字号」的 12–17px 调节依旧生效。行内代码 <code>--dsw-alias-bg-base</code>
      使用等宽栈，代码块底色为暖砂。</p>
    <blockquote>引用块：暖砂 / 暖炭底色 + 赤陶侧边线。</blockquote>
    <ul><li>列表项一</li><li>列表项二</li></ul>
    <p><a href="#">链接（muted blue）</a> · <strong>加粗</strong> · <em>斜体</em> · <del>删除线</del></p>
  </div>
  <pre class="code"><code>${highlight(CODE)}</code></pre>
  <div class="chatDemo">
    <div class="bubble">用户气泡：暖砂填充，正文色文字。</div>
    <div class="composer"><span>发消息或创建任务…</span><b class="send"></b></div>
  </div>
</article>`;

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>Claude Desktop 主题预览 · @gongshiyun/dsh-theme-claude-desktop</title>
<style>
  /* 明色 token 层 = 页面默认（等价于 DSH 把明色取值写在 body 行内变量上） */
  body {
${decls('light')}
  }
  /* 暗色 token 层 = 任意 .darkScope 子树（等价于 DSH 切到深色时的取值） */
  .darkScope, .scheme[data-scheme="dark"] {
${decls('dark')}
  }

  * { box-sizing: border-box; }
  html { background: #121212; }
  body { margin: 0; padding: 0; background: #121212; color: #c9c9c9; font: 14px/22px ${SANS}; }
  .wrap { max-width: 1180px; margin: 0 auto; padding: 34px 24px 64px; }
  .pageTitle { font: 700 27px/38px ${SERIF}; margin: 0 0 6px; color: #f2f2f2; }
  .pageNote { color: #8b8b8b; margin: 0 0 30px; }

  .scheme { border-radius: 18px; overflow: hidden; margin: 0 0 30px; background: var(--dsw-alias-bg-base);
    color: var(--dsw-alias-label-primary); box-shadow: 0 0 0 1px #ffffff14; }
  .schemeHead { display: flex; align-items: baseline; gap: 12px; padding: 16px 26px;
    background: var(--dsw-specific-sidebar-fill); border-bottom: .5px solid var(--dsw-alias-border-l2); }
  .schemeHead h2 { margin: 0; font: 700 18px/26px ${SERIF}; }
  .schemeHead code { color: var(--dsw-alias-label-tertiary); font: 12px/18px ${MONO}; }

  .typography { padding: 26px 26px 6px; }
  .typography h1 { font: 700 21px/30px ${SERIF}; margin: 0 0 16px; }
  .typography h2 { font: 700 19px/28px ${SERIF}; margin: 0 0 16px; }
  .typography h3 { font: 700 18px/26px ${SERIF}; margin: 0 0 16px; }
  .typography p { margin: 0 0 14px; }
  .typography blockquote { margin: 0 0 14px; padding: 6px 14px; border-left: 3px solid var(--dsw-alias-brand-primary);
    color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-markdown-citation); border-radius: 0 8px 8px 0; }
  .typography ul { margin: 0 0 14px 22px; padding: 0; }
  .typography a { color: var(--dsw-alias-link); }
  .typography code { font: 12px/19px ${MONO}; padding: 1px 5px; border-radius: 5px;
    background: var(--dsw-alias-markdown-inline-code); }
  .typography del { color: var(--dsw-alias-label-caption); }

  .code { margin: 10px 26px 0; padding: 14px 16px; border-radius: 12px; overflow: auto;
    background: var(--dsw-alias-markdown-code-block); border: .5px solid var(--dsw-alias-border-l2); }
  .code code { font: 12px/20px ${MONO}; color: var(--shiki-foreground); }
  .code i { font-style: normal; }
  .t-keyword { color: var(--shiki-token-keyword); }
  .t-string { color: var(--shiki-token-string); }
  .t-comment { color: var(--shiki-token-comment); }
  .t-function { color: var(--shiki-token-function); }
  .t-constant { color: var(--shiki-token-constant); }

  .chatDemo { display: flex; flex-direction: column; align-items: flex-end; gap: 14px; padding: 24px 26px 26px; }
  .bubble { max-width: 72%; padding: 10px 14px; border-radius: 16px; background: var(--dsw-specific-bubble); }
  .composer { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 12px 14px; border-radius: 16px; background: var(--dsw-specific-input-major);
    border: .5px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-dimmed); }
  .composer .send { width: 30px; height: 30px; border-radius: 50%; background: var(--dsw-alias-button-info-fill); }

  .board { background: #1b1b1b; border-radius: 18px; padding: 22px 26px 10px; margin: 0 0 24px; }
  .board > h2 { font: 700 19px/28px ${SERIF}; margin: 0 0 4px; color: #f0f0f0; }
  .board > .lead { color: #8b8b8b; margin: 0 0 18px; font-size: 12px; }
  .group { margin: 0 0 8px; }
  .group h3 { font: 600 15px/22px ${SANS}; margin: 0 0 8px; color: #ededed; }
  .group h3 .id { margin-left: 8px; font: 11px/16px ${MONO}; color: #767676; }
  .swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(126px, 1fr)); gap: 10px; margin: 0 0 12px; }
  .darkScope.swatches { margin-bottom: 22px; }
  .sw { margin: 0; height: 68px; border-radius: 10px; border: 1px solid #ffffff1f; position: relative;
    overflow: hidden; background: #2a2a2a; }
  .sw figcaption { position: absolute; inset: auto 0 0 0; padding: 4px 7px; background: #000000b8;
    display: flex; flex-direction: column; gap: 1px; }
  .sw .swName { font: 10px/13px ${MONO}; color: #cfcfcf; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sw code { font: 10px/13px ${MONO}; color: #8f8f8f; }
  .shikiRow { display: flex; flex-wrap: wrap; gap: 10px; margin: 0 0 22px; }
  .shikiRow span { padding: 5px 11px; border-radius: 8px; background: #101010; border: 1px solid #ffffff1f;
    font: 12px/18px ${MONO}; }
  .shikiRow span code { opacity: .55; margin-left: 6px; }
</style>
</head>
<body>
<div class="wrap">
  <h1 class="pageTitle">Claude Desktop 主题预览</h1>
  <p class="pageNote">@gongshiyun/dsh-theme-claude-desktop · 共覆盖 ${names.length} 个 token · 每块色板的第一行是浅色取值，第二行是深色取值</p>

${schemeBlock('light', '浅色 · 暖砂')}
${schemeBlock('dark', '深色 · 暖炭')}

  <div class="board">
    <h2>token 色板</h2>
    <p class="lead">每一组：上排 = 浅色（<code>light</code>），下排 = 深色（<code>dark</code>）</p>
${SWATCH_GROUPS.map(([title, id, list]) => group(title, id, list)).join('\n')}
    <section class="group">
      <h3>代码高亮取值<span class="id">--shiki-*</span></h3>
      <div class="shikiRow">${SHIKI.map(
        ([label, token]) =>
          `<span style="color:${light(token)}">${label}<code>${light(token)}</code></span>` +
          `<span class="darkScope" style="color:${dark(token)};background:#101010">${label}<code>${dark(token)}</code></span>`,
      ).join('')}</div>
    </section>
  </div>
</div>
</body>
</html>
`;

const outDir = path.join(root, 'docs');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'preview.html');
fs.writeFileSync(outPath, html);
console.log(`已写入 ${outPath}（${names.length} 个 token）`);
