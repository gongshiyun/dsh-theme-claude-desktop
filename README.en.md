# @gongshiyun/dsh-theme-claude-desktop

A **DeepSeek Harness (DSH)** client theme plugin modelled on the
[Claude Desktop](https://claude.ai) look, ported from
[gongshiyun/openchamber-claude-desktop-theme](https://github.com/gongshiyun/openchamber-claude-desktop-theme)
(whose palette in turn comes from the SiYuan theme
[frostime/sy-theme-siyaude](https://github.com/frostime/sy-theme-siyaude)):

**warm-sand canvas + terracotta accent, in both a light and a dark variant, plus a full
Anthropic typography layer.**

![Light](docs/mock-light.png)

![Dark](docs/mock-dark.png)

> Both images above are **generated mock-ups** of the DSH layout
> (`node tools/make-mock.mjs` → `docs/mock-*.html`) with entirely fictional copy. Their colours
> are read straight from the token table in `lib/client.js`, so they cannot drift from the theme.
> Real screenshots would expose workspace names and conversation content, so this repo ships
> none.

---

## What you get

| | |
|---|---|
| **Both variants at once** | Light and dark values are registered together; switching is driven by DSH's own *Settings → General → Appearance* (Light / Dark / Follow system). The plugin holds no theme state, so `system` following, the pre-plugin bootstrap and the `theme-color` metadata keep working untouched. |
| **Complete coverage** | 133 tokens: all 90 `--dsw-alias-*` semantic tokens, 11 `--dsw-specific-*`, the 18 `--dsw-static-*` values that components consume directly, 11 `--shiki-*` syntax colours, and the typography layer. |
| **Typography** | Anthropic Sans for UI, Anthropic Serif for H1–H3, Anthropic Mono for code — with graceful fallbacks to Segoe UI / Georgia / Cascadia Code, and CJK fallbacks to Noto Sans/Serif SC and the system Song/Hei faces. |
| **Font-size setting preserved** | The heading ladder keeps its `--dsh-content-font-delta` increments, so the 12–17 px *Content font size* setting still works. |
| **No residue** | The disposer returned by `overrideTokens` is attached to the plugin fiber: disabling or unloading the plugin restores the built-in palette immediately. |

---

## Install

The plugin is an ordinary two-halved npm package: the host half (`lib/index.js`) only
contributes a mountable composition entry; all the work is in the client half
(`lib/client.js`).

### A. As a bundle dependency

```bash
cd "$DSH_HOME/profiles/desktop"        # Windows: C:\Users\<you>\.dsh\profiles\desktop
pnpm add @gongshiyun/dsh-theme-claude-desktop
```

The package declares `dsh.bundle.patch`, so a profile listing it in
`dsh.profile.bundles` inserts the entry automatically.

### B. One entry in a profile (what this repo was verified with)

Add to that profile's `cordis.patch.yml`:

```yaml
- insert:
    - id: theme-claude-desktop
      name: '@gongshiyun/dsh-theme-claude-desktop'
```

DSH hot-loads the patch — no restart needed. `Settings → Plugins` (or
`plugin_manager list_plugins`) then shows `include:theme-claude-desktop` as `active`.

### C. Development (use this repo as the live source)

Junction/symlink the repo into the profile's `node_modules`; edits to `lib/client.js`
take effect immediately (DSH watches client bundles and HMR reloads the module):

```powershell
New-Item -ItemType Junction `
  -Path "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\@gongshiyun\dsh-theme-claude-desktop" `
  -Target "D:\ai-code\dsh-claude-theme"
```

---

## Switching light / dark

**Settings → General → Appearance** → *Light / Dark / Follow system*.

This is exactly why the plugin uses a **token override layer** instead of registering two
third-party themes: third-party theme ids never enter the built-in Appearance settings
schema and are lost on restart, whereas an override layer rides the built-in preference
and gets light/dark/system for free.

To go back to the default palette, disable the plugin (`Settings → Plugins`) or remove the
entry from `cordis.patch.yml`.

---

## Fonts

All three stacks prefer the Anthropic faces, then local lookalikes, then generic families:

| Role | Preferred | Fallback chain |
|---|---|---|
| UI text | Anthropic Sans Text / Anthropic Sans | Styrene B → Segoe UI Variable Text → Segoe UI → PingFang SC → Microsoft YaHei UI → Noto Sans SC |
| Headings (H1–H3) | Anthropic Serif Text / Anthropic Serif | Copernicus → Tiempos Text → Georgia → Noto Serif SC → SimSun |
| Code | Anthropic Mono | Cascadia Code → JetBrains Mono → SF Mono → Consolas |

**Install the Anthropic fonts and they are picked up automatically** — no configuration
needed. See
[matthieuhuguet/anthropic-fonts](https://github.com/matthieuhuguet/anthropic-fonts);
on Windows install the TTFs "for all users" and restart DSH.

For **all-sans headings**, replace `FONT_SERIF` with `FONT_SANS` in the three
`--dsw-font-markdown-h1/h2/h3` entries of `lib/client.js` (those are `font` shorthands, so
the whole value must be rewritten — overriding only the `-font-family` sub-token has no
effect, as noted in the file header).

---

## Palette

| Role | Light | Dark |
|---|---|---|
| Canvas `bg-base` | `#FFFAF2` | `#26221E` |
| Sidebar `sidebar-fill` | `#F3EBDD` | `#1E1A16` |
| Composer `input-major` | `#FFFDF9` | `#2E2721` |
| User bubble `bubble` | `#F6E7D8` | `#332B24` |
| Body text `label-primary` | `#3A2E24` | `#E2D9CC` |
| Secondary text `label-secondary` | `#776450` | `#A39684` |
| Accent `brand-primary` | `#B85430` | `#DF805B` |
| Link | `#3B6A89` | `#95BFD0` |
| Success / warning / error | `#4A7350` / `#96651C` / `#A94636` | `#A6C896` / `#E3BC72` / `#E48270` |
| Code block `markdown-code-block` | `#F8F1E6` | `#201B17` |

The full board — every token with both values, semantic states and syntax colours — is in
**[docs/preview.html](docs/preview.html)** (open it in a browser) or the rendered
[docs/preview.png](docs/preview.png):

![Palette preview](docs/preview.png)

---

## Known limitations

- **First paint still uses the built-in palette.** The loading page's `--dsh-boot-*` values
  are injected by the host into the index response and are out of reach for a third-party
  plugin, so there is a very brief (usually single-frame) colour shift between startup and
  this plugin mounting. After that, the `theme-color` metadata follows the rendered body.
- **A few hard-coded colours do not follow the theme** — e.g. the hovercard's `#2C2C2E` is a
  constant in a component stylesheet, not a token.
- **`--dsw-static-*` are scheme-invariant constants.** Only the 18 that components consume
  directly are overridden (e.g. the deliverables card's `neutral-50/850`), and they get
  mid-tone warm values that hold up in both schemes rather than per-scheme values.
- **Third-party theme ids never enter the built-in Appearance schema**, which is why this
  plugin calls `overrideTokens()` rather than `ctx.theme.register()`.

---

## Development
```bash
node tools/validate.mjs             # token table: paired values, known names, no unused palette keys, alias coverage
node tools/make-preview.mjs         # regenerate docs/preview.html (the colour board)
node tools/make-mock.mjs            # regenerate docs/mock-light.html / docs/mock-dark.html (the README mock-ups)
node tools/extract-base-tokens.mjs  # re-extract the built-in token list from the local ui-theme bundle (after a DSH upgrade)

# Windows: capture the running DSH desktop window (the Web GUI needs its tokenised URL; a bare request gets 401)
.\tools\capture-dsh-window.ps1 -Out shot.png
```

Render either HTML with headless Chrome (2× device scale for the mock-ups):

```bash
chrome --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=1224,788 \
  --screenshot=docs/mock-light.png docs/mock-light.html
```

`lib/client.js` reads top-down as: font stacks → light/dark palette constants → token table →
`apply()`. Retheming means editing the palette constants only; `tools/validate.mjs` catches
mistyped keys.

---

## Compatibility

- DSH `>= 0.1.5-rc.1` (needs `ctx.theme.overrideTokens()` and the `dsh.client` two-halved
  package convention)
- Platform: `web`
- Dependencies: the `theme` client service only — no external module is `require`d, not even
  React

## License

MIT
