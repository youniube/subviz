# SubViz Surge v0.1.8

修复点：

- 去掉模块参数占位符，script-path 写死为你的 GitHub Raw 地址。
- 前端按钮增加 type=button + inline onclick 兜底。
- 前端请求改成 fetch / XMLHttpRequest 双通道，点击后状态栏会立即显示“按钮已触发”。
- 建议先点“演示数据”，确认 UI 事件正常，再拉取订阅 URL。

覆盖上传：

- subviz.sgmodule
- subviz.js

Raw 校验：subviz.js 第一行必须是 `var SUBVIZ_SURGE_0_1_8 = true;`。
