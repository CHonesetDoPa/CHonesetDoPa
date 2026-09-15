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

| 命令                  | 说明                                                 |
| --------------------- | ---------------------------------------------------- |
| `pnpm noctis:dev`     | 启动 Vite 开发服务器（端口自动分配并自动打开浏览器） |
| `pnpm noctis:build`   | 构建生产包，输出到 `noctis/dist/`                    |
| `pnpm noctis:build:skip-assets` | 跳过头像与背景资源生成，直接执行其余构建步骤 |
| `pnpm noctis:preview` | 本地预览构建产物                                     |
| `pnpm noctis:clear`   | 删除 `noctis/dist/`                                  |
| `pnpm noctis:lint`    | 执行 ESLint 检查                                      |
| `pnpm noctis:format`  | 使用 Prettier 格式化项目文件                         |
| `pnpm noctis:check-i18n` | 检查三种语言包的键是否保持一致                    |
| `pnpm noctis:gen-hero` | 重新生成头像和背景的响应式资源                       |
| `pnpm docs:tips`      | 根据 `docs/tips.md` 生成 GitHub Pages 入口页         |

也可以先 `cd noctis`，再使用不带前缀的等价命令 `pnpm dev` / `pnpm build` / `pnpm preview` / `pnpm clear`。

`docs:tips` 只能在仓库根目录执行；`docs/index.html` 是生成文件，请编辑
`docs/tips.md` 后运行该命令，不要直接修改 HTML。

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
- **资源预处理与校验** — 默认先生成头像/背景资源，再检查三语 i18n 键的完整性；可使用 `pnpm noctis:build:skip-assets` 跳过资源生成
- **LightningCSS** — 高速 CSS 压缩与兼容性处理
- **代码分割** — 按依赖拆分为 `swal` / `typed` / `fa` / `instant` / `other` 分组
- **资源哈希与统一前缀** — 静态资源命名为 `VampireC-[name]-[hash].[ext]`，便于缓存刷新
- **Sourcemap 关闭** — 不输出 sourcemap（`sourcemap: false`）

其他构建相关配置：

- `root` 为 `src/`，`publicDir` 为 `../public`，输出 `dist/`
- 构建目标 `esnext`
- 路径别名 `@` → `src/`
- 生产构建通过 `vite-plugin-remove-console` 移除 `console`（`src/js/utils.js` 除外）

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
│   └── （其他部署时直接拷贝的静态资源）
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
    │   └── img/                # 图片资源（Avatar / BG / V4-Lite）
    ├── config/
    │   ├── links.js            # 链接与站点数据配置
    │   └── i18n/
    │       ├── index.js        # 语言包注册表（以语言码为键）
    │       ├── zh.js
    │       ├── en.js
    │       └── vampire.js
    ├── js/
    │   ├── bootstrap.js          # 页面初始化入口
    │   ├── cur-effect.js        # 自定义光标效果
    │   ├── dark-mode-manager.js  # 深色模式 / 血族模式管理
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

  仓库根目录的 `docs/` 是独立的 GitHub Pages 提示页：`index.html` 由
  `docs/tips.md` 生成，`tips.js` 和 `style.css` 提供页面行为与样式，`robots.txt`
  禁止搜索引擎索引。它不参与 `noctis` 的 Vite 构建。

  三个入口脚本（`main.js` / `sponsor.js` / `verify.js`）均为薄入口，统一调用
  `src/js/bootstrap.js` 的 `bootstrapPage()`。bootstrap 依次引入样式与基础模块，
  再加载 `i18n-system.js`，最后用 `links.js` 配置调用 `window.linkManager.initializeAll()`。

## 配置指南

- **站点数据与链接**：编辑 `src/config/links.js`。它默认导出一个配置对象，包含
  `personal`（邮箱、会话 ID、PGP 公钥地址）、`socialMedia`、`sponsor`、`relatedSites`、
  `meta`（打字机文案）等分组，入口脚本会把它交给 `window.linkManager.initializeAll()` 渲染。
- **国际化**：语言包位于 `src/config/i18n/`，默认语言 `zh`，回退语言 `en`，另含 `vampire`。
  语言切换支持 `localStorage`（键名 `site-language-preference`）与浏览器语言自动检测。
- **PGP 公钥**：替换 `public/ch.asc`，并在 `links.js` 的 `personal.pgpKey` 中同步本地与远端地址。
- **GitHub Pages 提示页**：修改 `docs/tips.md` 后运行 `pnpm docs:tips`。生成页会短暂显示文本，然后跳转到 `https://me.nekoc.cc`。

### 添加一种新语言

语言包由 `src/config/i18n/index.js` 统一注册，`i18n-system.js` 直接 import 该注册表，
因此只需两处配合：

1. 新建 `src/config/i18n/fr.js`，以 `<语言码>Translations` 具名导出与其它语言包
   结构一致的翻译对象：

```js
export const frTranslations = {
  about: {
    title: "À propos",
    // ...其余键保持与 zh.js / en.js 相同的层级
  },
};
```

2. 注册到 `src/config/i18n/index.js`，并在 `i18n-system.js` 的
   `DEFAULT_I18N_CONFIG` 中追加语言码：

```js
// config/i18n/index.js
import { frTranslations } from "./fr.js";
export default {
  zh: zhTranslations,
  en: enTranslations,
  vampire: vampireTranslations,
  fr: frTranslations,
};
```

```js
// js/i18n-system.js
supportedLanguages: ["zh", "en", "vampire", "fr"],
```

语言按钮在 `zh` / `en` 之间循环切换；`vampire` 为隐藏彩蛋（连续点击语言按钮 10 次激活）。

## 许可证

本项目主体采用 CC0-1.0（见 [LICENSE](LICENSE)）  
部分非源代码资源另见 [LICENSE-Personal.md](LICENSE-Personal.md)

---

*Built By CH*
