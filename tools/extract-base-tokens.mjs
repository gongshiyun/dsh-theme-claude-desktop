/**
 * 从本机安装的 @deepseek-ai/dsh-client-ui-theme 客户端 bundle 里抽出 `--dsw-*` /
 * `--dsh-*` token 的完整清单，写成 tools/tokens-by-selector.json。
 *
 * 用途：lib/client.js 的 token 名对照表（validate.mjs 用它抓拼写错误），以及
 * 升级 DSH 后重新核对内置 token 有没有增删。
 *
 * 用法：
 *   node tools/extract-base-tokens.mjs [ui-theme 包的 lib/client.js 路径]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

const candidates = [
  process.argv[2],
  path.join(
    process.env.USERPROFILE ?? '',
    '.dsh/profiles/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js',
  ),
  path.join(
    process.env.USERPROFILE ?? '',
    '.dsh/profiles/desktop/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js',
  ),
].filter(Boolean);

const bundlePath = candidates.find((p) => fs.existsSync(p));
if (bundlePath === undefined) {
  console.error('找不到 dsh-client-ui-theme 的 lib/client.js，请把路径作为第一个参数传入。');
  process.exit(1);
}
console.log('读取：', bundlePath);

const source = fs.readFileSync(bundlePath, 'utf8');

/* 1. 从 bundle 里抠出内联样式表：var <name>_css[_default] = "<css>" */
const sheetRe = /var\s+(\w+_css(?:_default)?)\s*=\s*"((?:[^"\\]|\\.)*)"/g;
const sheets = [];
let m;
while ((m = sheetRe.exec(source))) {
  let css;
  try {
    css = JSON.parse('"' + m[2] + '"');
  } catch {
    continue;
  }
  if (css.includes('--dsw-') || css.includes('--dsh-')) sheets.push([m[1], css]);
}
console.log('样式表：', sheets.map(([name]) => name).join(', '));

/* 2. 按选择器收集 token → 值（同名 token 首次出现优先） */
const bySelector = {};
for (const [, css] of sheets) {
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  let r;
  while ((r = ruleRe.exec(css))) {
    const selector = r[1].trim();
    for (const v of r[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) {
      bySelector[selector] ??= {};
      bySelector[selector][v[1]] ??= v[2].trim();
    }
  }
}

const outPath = path.join(here, 'tokens-by-selector.json');
fs.writeFileSync(outPath, JSON.stringify(bySelector, null, 2) + '\n');

const total = new Set();
for (const vars of Object.values(bySelector)) for (const name of Object.keys(vars)) total.add(name);
console.log('选择器：', Object.keys(bySelector).join(' | '));
console.log('token 总数：', total.size);
console.log('已写入：', outPath);
