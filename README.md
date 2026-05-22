# SubViz Surge v0.1.7

修复点：移除 `#!arguments` 和 `%SCRIPT_URL%` 占位符，`script-path` 改为硬编码 GitHub Raw 地址，避免 Surge 外部资源显示 `%SCRIPT_URL% / 资源不存在`。

上传仓库根目录：
- subviz.sgmodule
- subviz.js

安装模块地址：
https://raw.githubusercontent.com/youniube/subviz/refs/heads/main/subviz.sgmodule

测试：
http://subviz.store/api/health

正常返回版本：0.1.7。
