# Archive 文件夹说明

此文件夹包含项目中不再使用或已被替换的文件，按类型组织存储。

## 文件夹结构

### old-versions/ - 旧版本文件
包含项目早期版本的文件，按功能分类：

- **favicon/** - 旧版本的网站图标
  - `favicon-old.ico` - 早期使用的网站图标

- **pages/** - 旧版本的页面文件
  - `sponsor-en-old.html` - 旧版英文赞助页面
  - `sponsor-zh-old.html` - 旧版中文赞助页面

- **documentation/** - 旧版本的文档
  - `README-old.md` - 早期版本的说明文档

### unused-resources/ - 未使用的资源文件
包含当前版本中未被引用的资源文件：

- **images/** - 未使用的图片资源
  - **avatar-versions/** - 各版本的头像图片
    - `V1/` - 第一版头像及相关图片（6个文件）
    - `V2/` - 第二版头像及相关图片（6个文件）
    - `V3/` - 第三版头像及相关图片（4个文件）
    - `V4/` - 第四版中未使用的图片（4个文件）
    - `bg.png` - 未使用的背景图片（已有WebP版本）

- **css/** - 未使用的样式文件
  - `datatable.css` - 数据表格样式（未被引用）

- **config/** - 未使用的配置文件
  - `links.example.json` - 链接配置示例文件

- **misc/** - 其他杂项文件
  - `ch.asc` - PGP公钥文件
  - `favicon.ico` - 重复的图标文件（根目录已有）