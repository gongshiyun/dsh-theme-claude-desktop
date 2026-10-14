/**
 * 校验 lib/client.js 的 token 覆盖层：
 *   1. 能在模拟的 __ModuleLoader__ 环境里加载，导出 inject / apply；
 *   2. apply() 注册的每个 token 都是 { light, dark } 字符串对；
 *   3. 明/暗两套调色板里没有被 dual() 引用却写错名字的键（取到 undefined 会在这里报错）；
 *   4. 每个被覆盖的 token 名都确实存在于 DSH 内置样式表中（防止拼写错误）；
 *   5. 打印没被用到的调色板键（提示冗余）。
 *
 * 用法：node tools/validate.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const clientPath = path.join(root, 'lib', 'client.js');
const refPath = path.join(here, 'tokens-by-selector.json');

let registration;
const fakeWindow = {
  __ModuleLoader__: {
    load(reg) {
      registration = reg;
    },
  },
};

const source = fs.readFileSync(clientPath, 'utf8');
new Function('window', source)(fakeWindow);

if (registration === undefined) throw new Error('client.js 没有调用 window.__ModuleLoader__.load');
console.log('✔ 注册 id：', registration.id);

const mod = registration.factory(() => {
  throw new Error('本主题插件不应 require 任何外部模块');
});
if (typeof mod.apply !== 'function') throw new Error('client.js 未导出 apply');
if (!Array.isArray(mod.inject)) throw new Error('client.js 未导出 inject 数组');
console.log('✔ inject：', JSON.stringify(mod.inject));

let captured = null;
const fakeCtx = {
  effect(factory) {
    factory();
    return () => {};
  },
  theme: {
    overrideTokens(source, tokens) {
      captured = { source, tokens };
      return () => {};
    },
  },
};
mod.apply(fakeCtx);
if (captured === null || captured.tokens === undefined) throw new Error('apply() 没有调用 theme.overrideTokens');
console.log('✔ 覆盖来源：', captured.source, '| token 数：', Object.keys(captured.tokens).length);

const problems = [];
for (const [name, modes] of Object.entries(captured.tokens)) {
  if (typeof modes !== 'object' || modes === null) problems.push(`${name}: 不是对象`);
  else if (typeof modes.light !== 'string') problems.push(`${name}: light 不是字符串（调色板键写错了？）`);
  else if (typeof modes.dark !== 'string') problems.push(`${name}: dark 不是字符串（调色板键写错了？）`);
}
if (problems.length > 0) {
  console.error('✘ token 取值有问题：');
  for (const p of problems) console.error('   ' + p);
  process.exitCode = 1;
} else {
  console.log('✔ 全部 token 都是 { light, dark } 字符串对');
}

// 4. 调色板键与 dual() 引用的双向核对
const usedKeys = new Set([...source.matchAll(/dual\('([^']+)'\)/g)].map((m) => m[1]));
const declaredKeys = new Set([...source.matchAll(/^\s{6}([A-Za-z][\w]*):\s/gm)].map((m) => m[1]));
const missing = [...usedKeys].filter((k) => !declaredKeys.has(k));
const unused = [...declaredKeys].filter((k) => !usedKeys.has(k));
if (missing.length > 0) {
  console.error('✘ dual() 引用了未声明的调色板键：' + missing.join(' '));
  process.exitCode = 1;
} else {
  console.log('✔ dual() 引用的调色板键全部已声明');
}
if (unused.length > 0) {
  console.error('✘ 声明但未被 dual() 使用（冗余）的调色板键：' + unused.join(' '));
  process.exitCode = 1;
} else {
  console.log('✔ 调色板无冗余键');
}

// 5. 与内置样式表的 token 名对照
if (fs.existsSync(refPath)) {
  const bySelector = JSON.parse(fs.readFileSync(refPath, 'utf8'));
  const known = new Set();
  for (const vars of Object.values(bySelector)) for (const name of Object.keys(vars)) known.add(name);
  const unknown = Object.keys(captured.tokens).filter((name) => !known.has(name));
  if (unknown.length > 0) {
    console.error('✘ 下列 token 不在内置样式表里（拼写错误？新增 token？）：');
    for (const name of unknown) console.error('   ' + name);
    process.exitCode = 1;
  } else {
    console.log('✔ 所有 token 名都能在内置样式表里找到');
  }

  const overridden = new Set(Object.keys(captured.tokens));
  const untouched = [...known].filter(
    (n) => (n.startsWith('--dsw-alias') || n.startsWith('--dsw-specific')) && !overridden.has(n),
  );
  console.log(
    untouched.length === 0
      ? '✔ alias / specific 层已 100% 覆盖'
      : '△ 未覆盖的 alias / specific token：' + untouched.join(' '),
  );
} else {
  console.log('△ 跳过内置样式表对照（未找到 tools/tokens-by-selector.json）');
}
