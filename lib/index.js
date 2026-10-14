/**
 * @module @gongshiyun/dsh-theme-claude-desktop
 *
 * Claude Desktop 风格主题（host 半边）。
 *
 * 本包是「双半边」插件：host 半边不注册任何 Host 服务、不产生模型可见的工具、
 * 不影响 KV 缓存；它存在的意义是让 dsh 的 Loader 有一条可挂载的组合条目
 * （`dsh.profile.bundles` 或 cordis.patch.yml 的 insert 都需要一个 host 入口）。
 *
 * 全部主题逻辑在同包的 client 半边（`exports["./client"]` → `lib/client.js`）：
 * 它通过 `ctx.theme.overrideTokens()` 把暖砂/赤陶调色板与 Anthropic 字体排印层
 * 叠在当前主题之上。明、暗两套取值同时注册，由 DSH 内置的「外观」偏好
 * （浅色 / 深色 / 跟随系统）决定实际生效哪一套 —— 因此系统主题切换、托盘跟随、
 * 首屏 bootstrap 全部沿用 DSH 自己的实现，本插件不持有任何主题状态。
 */

/** 组合树里的条目名。 */
export const name = 'theme-claude-desktop';

/** 无 Host 依赖：不需要任何 Service 就绪即可挂载。 */
export const inject = [];

/**
 * Host 半边无事可做；主题在浏览器侧由 client 半边完成。
 * @returns {void}
 */
export function apply() {}
