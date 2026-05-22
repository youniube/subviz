# SubViz Surge v0.1.9

Surge 本地浏览器 UI，用于拉取/粘贴机场或代理订阅，解析节点并展示协议、国家/地区、服务器、端口、传输/TLS、重复节点和导出数据。

## v0.1.9 更新

- 增强国家/地区识别：
  - 支持更多国旗 Emoji，例如 🇸🇪、🇫🇮、🇷🇴、🇵🇱、🇨🇿、🇲🇩、🇪🇪、🇿🇦、🇳🇬、🇳🇿 等。
  - 支持节点名中的 ISO 国家代码，例如 `SE_`、`FI-`、`RO_`、`_4US_`。
  - 支持中文国家名，例如 `爱沙尼亚`、`罗马尼亚`、`芬兰`、`瑞典`。
  - 支持 Clash 节点里的 `country` / `countryCode` 字段。
  - 对 `CF中转`、`Cloudflare`、`Anycast`、`CDN` 做单独归类为 `CDN/中转`，避免误识别成中非 `CF`。
- 导出 JSON 增加 `countrySource` 和 `countryConfidence` 字段，方便判断识别来源。
- 修复手机端「仅唯一节点」布局竖排问题。

## 安装

把这两个文件上传覆盖到 GitHub 仓库根目录：

```text
subviz.sgmodule
subviz.js
```

Surge 重新安装模块：

```text
https://raw.githubusercontent.com/youniube/subviz/main/subviz.sgmodule
```

外部资源里更新脚本后，访问：

```text
http://subviz.store/?v=19
```

健康检查：

```text
http://subviz.store/api/health
```

正常返回里应包含：

```json
{
  "version": "0.1.9",
  "marker": "SUBVIZ_SURGE_0_1_9"
}
```

## 说明

v0.1.9 是离线启发式识别，不调用第三方 IP 库。对于节点名没有国旗、ISO 代码、中文国家名，且服务器是纯 IP 的节点，仍然可能显示为「未知」。这类节点需要后续增加在线 GeoIP 补全功能才能继续降低未知数量。
