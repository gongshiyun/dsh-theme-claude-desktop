/**
 * 在无浏览器的宿主里加载 lib/client.js，取出它注册的 token 表。
 * 供 tools/make-preview.mjs 与 tools/make-mock.mjs 共用。
 *
 * 做法：伪造一个最小可用的 `window.__ModuleLoader__` 与 cordis ctx，
 * 让插件的 `apply()` 以为自己在浏览器里跑，从而拿到 `ctx.theme.overrideTokens()`
 * 收到的那个 token 对象。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @returns {{ tokens: Record<string, {light: string, dark: string}>, source: string, clientPath: string, id: string, inject: string[] }}
 */
export function loadTokens() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const clientPath = path.resolve(here, '..', 'lib', 'client.js');
  const source = fs.readFileSync(clientPath, 'utf8');

  let registration;
  new Function('window', source)({
    __ModuleLoader__: {
      load(reg) {
        registration = reg;
      },
    },
  });
  if (registration === undefined) throw new Error('lib/client.js 没有调用 window.__ModuleLoader__.load');

  const mod = registration.factory(() => {
    throw new Error('主题插件不应 require 任何外部模块');
  });
  if (typeof mod.apply !== 'function') throw new Error('lib/client.js 未导出 apply');

  let tokens = null;
  mod.apply({
    effect: (factory) => {
      factory();
      return () => {};
    },
    theme: {
      overrideTokens: (_source, value) => {
        tokens = value;
        return () => {};
      },
    },
  });
  if (tokens === null) throw new Error('apply() 没有调用 ctx.theme.overrideTokens');

  return { tokens, source, clientPath, id: registration.id, inject: mod.inject };
}
