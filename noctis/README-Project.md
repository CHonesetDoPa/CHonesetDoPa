# CH's HomePage

## 更改说明

本项目继续以开源形式保留源代码，但**不再提供维护与功能支持**。

质量和 Bug 报告请使用 [Issues](https://github.com/CHonesetDoPa/CHonesetDoPa/issues)。

基于原生 JavaScript 和 Vite 构建的轻量交互式个人主页，重构自原项目。

> `noctis` 是 `CHonesetDoPa` 仓库中的一个包，构建产物位于 `noctis/dist/`

## 技术栈

- 核心: HTML5, CSS3, Vanilla JavaScript (ES Modules)
- 构建工具: Vite 8 + LightningCSS
- 页面: 首页 (`index.html`)、赞助页 (`sponsor.html`)、验证页 (`verify.html`)，三者各有独立入口脚本
- 运行依赖:
  - `typed.js` - 打字动画
  - `sweetalert2` - 弹窗美化
  - `@fortawesome/fontawesome-svg-core` + `@fortawesome/free-solid-svg-icons` - 图标
  - `instant.page` - 链接预加载

（详见 `package.json` 的 `dependencies`；构建依赖见 `devDependencies`）

## 快速开始

### 前置要求

- Node.js `^20.19.0 || >=22.12.0`（Vite 8 的最低要求）
- pnpm（本仓库按 pnpm workspace 管理，推荐使用）

### 安装

```bash
# 克隆仓库
git clone https://github.com/CHonesetDoPa/CHonesetDoPa.git
cd CHonesetDoPa

# 在仓库根目录安装全部工作区依赖
pnpm install
```

### 可用脚本

在仓库根目录执行

| 命令 | 说明 |
|------|------|
| `pnpm noctis:dev` | 启动 Vite 开发服务器（端口自动分配并自动打开浏览器） |
| `pnpm noctis:build` | 构建生产包，输出到 `noctis/dist/` |
| `pnpm noctis:preview` | 本地预览构建产物 |
| `pnpm noctis:clear` | 删除 `noctis/dist/` |

也可以先 `cd noctis`，再使用不带前缀的等价命令 `pnpm dev` / `pnpm build` / `pnpm preview` / `pnpm clear`。

示例：

```bash
pnpm noctis:dev
pnpm noctis:build
pnpm noctis:preview
```

### 构建优化

生产构建（`vite.config.js`）会自动应用以下优化：

- **HTML 压缩** — 移除注释、空白、空属性与冗余属性等
- **Gzip + Brotli + Zstd 压缩** — 对大于 1KB 的资源额外生成 `.gz` / `.br` / `.zst` 文件（保留原文件）
- **LightningCSS** — 高速 CSS 压缩与兼容性处理
- **代码分割** — 按依赖拆分为 `swal` / `typed` / `fa` / `instant` / `other` 分组
- **资源哈希与统一前缀** — 静态资源命名为 `VampireC-[name]-[hash].[ext]`，便于缓存刷新
- **Sourcemap 关闭** — 不输出 sourcemap（`sourcemap: false`）

其他构建相关配置：

- `root` 为 `src/`，`publicDir` 为 `../public`，输出 `dist/`
- 构建目标 `esnext`
- 路径别名 `@` → `src/`
- 全局常量 `__APP_MODE__`（来自 `MODE`）与 `__API_BASE__`（来自 `VITE_API_BASE`，未设置时为空字符串）

## 项目结构

```
noctis/
├── vite.config.js              # Vite 配置（root 指向 src/）
├── package.json
├── LICENSE                     # CC0-1.0
├── LICENSE-Personal.md         # 非源代码资源许可
├── public/                     # 直接拷贝到构建输出的静态资源
│   ├── 404.html
│   ├── ch.asc                  # PGP 公钥
│   ├── favicon.ico
│   └── og.webp
└── src/                        # 源代码根目录（Vite root）
    ├── index.html              # 首页入口
    ├── main.js                 # 首页脚本
    ├── sponsor.html            # 赞助页入口
    ├── sponsor.js              # 赞助页脚本
    ├── verify.html             # 验证页入口（PGP 身份验证）
    ├── verify.js               # 验证页脚本
    ├── icon.js                 # 图标初始化
    ├── assets/
    │   ├── cur/                # 自定义光标（.cur）
    │   └── img/                # 图片资源（Avatar / BG / app1 / V4-Lite）
    ├── config/
    │   ├── links.js            # 链接与站点数据配置
    │   └── i18n/
    │       ├── zh.js
    │       ├── en.js
    │       └── vampire.js
    ├── js/
    │   ├── cur-effect.js       # 自定义光标效果
    │   ├── dark-mode-manager.js# 深色模式 / 血族模式管理
    │   ├── i18n-system.js      # 国际化系统
    │   ├── link-manager.js     # 链接管理器入口
    │   ├── link-manager/       # 链接管理器子模块
    │   │   ├── config-manager.js
    │   │   ├── interaction-handler.js
    │   │   └── ui-renderer.js
    │   ├── typed-init.js       # Typed.js 初始化
    │   ├── utils.js            # 通用工具函数（生产构建保留 console）
    │   └── verify-challenge.js # PGP 验证挑战逻辑
    └── style/
        ├── index.css           # 主页 / 赞助页样式
        └── verify.css          # 验证页样式
```

三个入口脚本的加载顺序一致：先引入样式与基础模块，再挂载
`window.i18n = { Lang_ZH, Lang_EN, Lang_Vampire }`，之后才加载
`i18n-system.js`，最后用 `links.js` 配置调用 `window.linkManager.initializeAll()`。
新增模块时请保持该顺序，否则国际化会读不到语言包。

## 配置指南

- **站点数据与链接**：编辑 `src/config/links.js`。它默认导出一个配置对象，包含
  `personal`（邮箱、会话 ID、PGP 公钥地址）、`socialMedia`、`sponsor`、`relatedSites`、
  `status`、`meta`（版权、打字机文案）等分组，入口脚本会把它交给 `window.linkManager.initializeAll()` 渲染。
- **国际化**：语言包位于 `src/config/i18n/`，默认语言 `zh`，回退语言 `en`，另含 `vampire`。
  语言切换支持 `localStorage`（键名 `site-language-preference`）与浏览器语言自动检测。
- **PGP 公钥**：替换 `public/ch.asc`，并在 `links.js` 的 `personal.pgpKey` 中同步本地与远端地址。

### 添加一种新语言

语言包是「先挂到 `window.i18n`，再由 i18n 系统读取」的模式，因此需要三处配合：

1. 新建 `src/config/i18n/fr.js`，导出与其它语言包结构一致的默认对象：

```js
export default {
  about: {
    title: "À propos",
    // ...其余键保持与 zh.js / en.js 相同的层级
  },
};
```

2. 在每个入口脚本（`main.js`、`sponsor.js`、`verify.js`）中 import 并挂载：

```js
import Lang_FR from "./config/i18n/fr.js";
window.i18n = { Lang_ZH, Lang_EN, Lang_Vampire, Lang_FR };
```

3. 在 `src/js/i18n-system.js` 的 `DEFAULT_I18N_CONFIG` 中注册：

```js
supportedLanguages: ["zh", "en", "vampire", "fr"],
inlineTranslations: {
  enabled: true,
  mapping: { zh: "Lang_ZH", en: "Lang_EN", vampire: "Lang_Vampire", fr: "Lang_FR" },
},
languageNames: { zh: "中文", en: "English", vampire: "血族古语", fr: "Français" },
```

语言按钮会按 `supportedLanguages` 顺序循环切换。

## 许可证

本项目主体采用 CC0-1.0（见 [LICENSE](LICENSE)）  
部分非源代码资源另见 [LICENSE-Personal.md](LICENSE-Personal.md)  

---

*Built By CH*
