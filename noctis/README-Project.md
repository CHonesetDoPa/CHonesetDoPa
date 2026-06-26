# CH's HomePage

# 更改说明

本项目模板已迁移至 [CyanHomePage](https://github.com/CHonesetDoPa/CyanHomePage)。

本仓库继续以开源形式保留源代码，但**不再提供维护与支持**。

如需模板相关支持与更新，请前往新项目 [CyanHomePage](https://github.com/CHonesetDoPa/CyanHomePage)。

基于原生 JavaScript 和 Vite 构建的轻量交互式个人主页，重构自原项目。

## 技术栈

- 核心: HTML5, CSS3, Vanilla JavaScript (ES Modules)
- 构建工具: Vite 7 + LightningCSS
- 页面: 首页 (`index.html`)、赞助页 (`sponsor.html`)、验证页 (`verify.html`)
- 主要依赖:
  - `typed.js` - 打字动画
  - `sweetalert` - 弹窗美化
  - `@fortawesome/fontawesome-free` - 图标
  - `instant.page` - 链接预加载

（详见 `package.json` 的 `dependencies`）

## 快速开始

### 前置要求

- Node.js >= 18（建议 LTS）
- pnpm（推荐），或 npm/yarn

### 安装

```bash
# 克隆仓库
git clone https://github.com/CHonesetDoPa/CHonesetDoPa.git
cd CHonesetDoPa

# 使用 pnpm 安装依赖（或 npm/yarn）
pnpm install
```

### 可用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动 Vite 开发服务器（自动分配端口） |
| `pnpm build` | 构建生产包，输出到 `dist/` |
| `pnpm preview` | 本地预览构建产物 |
| `pnpm clear` | 清理 `dist/` 目录 |

示例：

```bash
pnpm dev
pnpm build
pnpm preview
```

### 构建优化

生产构建会自动应用以下优化：

- **HTML 压缩** — 移除注释、空白、冗余属性等
- **Gzip + Brotli 压缩** — 对大于 1KB 的资源生成 `.gz` 和 `.br` 文件
- **LightningCSS** — 高速 CSS 压缩与兼容性处理
- **代码分割** — `openpgp` 等大型依赖单独打包为 vendor chunk
- **资源哈希** — 静态资源文件名包含哈希值，便于缓存刷新

## 项目结构

```
src/                            # 源代码根目录（Vite root）
├── index.html                  # 首页入口
├── main.js                    # 首页脚本
├── sponsor.html               # 赞助页入口
├── sponsor.js                 # 赞助页脚本
├── verify.html                # 验证页入口（PGP 身份验证）
├── verify.js                  # 验证页脚本
├── assets/
│   ├── cur/                   # 自定义光标文件
│   └── img/                   # 图片资源
├── config/
│   ├── links.js               # 链接数据配置
│   └── i18n/                  # 国际化语言包
│       ├── en.js
│       ├── zh.js
│       └── vampire.js
├── js/
│   ├── cur-effect.js          # 自定义光标效果
│   ├── dark-mode-manager.js   # 深色模式管理
│   ├── greeting-system.js     # 问候语系统
│   ├── i18n-system.js         # 国际化系统
│   ├── link-manager.js        # 链接管理器入口
│   ├── link-manager/          # 链接管理器子模块
│   │   ├── config-manager.js
│   │   ├── interaction-handler.js
│   │   └── ui-renderer.js
│   ├── sponsorlist.js         # 赞助列表渲染
│   ├── typed-init.js          # Typed.js 初始化
│   ├── utils.js               # 通用工具函数
│   └── verify-challenge.js    # PGP 验证挑战逻辑
├── style/
│   ├── index.css              # 主页样式
│   └── verify.css             # 验证页样式
└── types/                     # JSDoc 类型定义

public/
├── ch.asc                     # PGP 公钥文件
└── ...                         # 其他静态资源
```

## 配置指南

- **管理链接**：编辑 `src/config/links.js`（导出链接数据的 JS 模块），页面会通过站点脚本读取并渲染。
- **语言文件**：在 `src/config/i18n/` 下添加新的语言模块（例如 `fr.js`），模块应导出对应的翻译对象，然后在 `src/js/i18n-system.js` 中注册该语言。
- **PGP 公钥**：替换 `public/ch.asc` 为你的公钥，验证页会自动读取。

示例：添加新语言文件 `src/config/i18n/fr.js`：

```js
export default {
  welcome: 'Bonjour',
  // ...其它键
}
```

然后在国际化系统注册并在语言选择中添加该选项。

## 许可证

本项目主体采用 CC0-1.0（见 [LICENSE](LICENSE)）  
部分非源代码资源另见 [LICENSE-Personal.md](LICENSE-Personal.md)  

---

*Built By CH*
