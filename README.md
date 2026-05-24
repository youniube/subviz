# SubViz Surge

一个运行在 **Surge** 里的订阅节点可视化分析工具。

它不是完整订阅管理器，定位更简单：

> 拉取订阅 → 解析节点 → 看分布 → 清理节点名 → 复制 / 导出可用订阅

适合用来快速检查机场订阅、免费节点订阅、聚合订阅里到底有哪些节点。

---

## 功能

- 支持拉取订阅 URL
- 支持粘贴订阅原文 / Clash YAML
- 展示节点数量、协议分布、国家 / 地区分布
- 支持搜索、协议筛选、地区筛选、唯一节点筛选
- 支持快速 GeoIP 补全
- 支持落地检测
- 支持节点名清理和统一重命名
- 支持复制 / 导出：
  - Clash YAML
  - 通用 URI 订阅
  - Base64 URI 订阅
  - JSON 备份
- 支持上传当前导出到 GitHub Gist，并可将 GitHub Token 保存到 Surge 持久存储

---

## 安装

在 Surge 中添加模块：

```text
https://raw.githubusercontent.com/youniube/subviz/main/subviz.sgmodule
```

安装后访问：

```text
http://subviz.store/
```

如果页面没有刷新到最新版，可以加版本参数（数字随意改一个新值即可绕过缓存）：

```text
http://subviz.store/?v=any
```

健康检查：

```text
http://subviz.store/api/health
```

正常会返回类似：

```json
{
  "ok": true,
  "name": "SubViz Surge",
  "version": "0.1.43"
}
```

---

## 使用方法

### 1. 拉取订阅

在输入框粘贴订阅地址，然后点击：

```text
拉取分析
```

也可以把订阅内容或 Clash YAML 粘贴到文本框，然后点击：

```text
分析粘贴内容
```

---

### 2. 筛选节点

可以按下面条件筛选：

- 节点名
- 服务器地址
- 协议
- 国家 / 地区
- 是否唯一节点

落地检测、复制、导出都会优先使用当前筛选结果。

---

### 3. 快速 GeoIP 补全

点击：

```text
快速 GeoIP 补全
```

它会根据节点配置里的 `server` 查询 IP 归属。

这个速度快，但不一定等于真实落地。

适合快速修正未知地区。

---

### 4. 落地检测

点击：

```text
落地检测
```

它会让当前筛选出来的节点实际访问 IP 查询接口，获取真实出口 IP。

建议先筛选后再检测，例如：

```text
地区筛选：未知 → 落地检测
```

落地检测比 GeoIP 慢，也更容易受节点可用性、协议兼容性、接口限制影响。

---

### 5. 清理节点名

点击：

```text
清理节点名
```

会把混乱节点名统一成类似：

```text
🇭🇰 HK-香港 01 原生 机房
🇺🇸 US-美国 02 商宽
🇯🇵 JP-日本 03
```

会清理掉常见无意义信息，例如：

```text
linuxdo / History / OpenRay / Github / Telegram / 官网 / 过期 / 流量
```

会保留有价值标签，例如：

```text
倍率 / 原生 / 机房 / 商宽 / 家宽 / 住宅 / 广播 / IEPL / IPLC / BGP / CN2 / 中转
```

如果清理效果不满意，可以恢复原始节点名。

---

## 复制和导出

导出区域可以选择：

```text
Clash YAML
通用 URI 订阅
Base64 URI 订阅
JSON 备份
```

然后点击：

```text
复制
```

或：

```text
导出
```

### Clash YAML

适合 Clash Verge、Mihomo、OpenClash 等客户端。

### 通用 URI 订阅

一行一个节点链接，例如：

```text
ss://...
trojan://...
vless://...
vmess://...
```

适合导入到支持 URI 订阅的客户端或订阅转换工具。

### Base64 URI 订阅

把通用 URI 订阅整体 Base64 编码。

### JSON 备份

保留完整分析结果，适合调试、备份、二次处理。

---

## 上传到 Gist

在导出区域展开：

```text
上传到 Gist / 发布远程订阅
```

建议流程：

```text
拉取分析
→ 筛选 / 全选当前 / 清理节点名
→ 选择导出格式，例如 Clash YAML
→ 填写 Gist 名称和文件名
→ 上传当前导出到 Gist
→ 复制 Raw URL 给 Clash Verge / Mihomo / OpenClash 等客户端订阅
```

GitHub Token 可以保存到 Surge 的 `$persistentStore`：

```text
粘贴 GitHub Token
→ 保存/更新 Token
→ 以后上传时 Token 输入框可以留空
```

更换 Token 时，直接粘贴新的 Token 再点“保存/更新 Token”即可覆盖旧 Token。

也可以点击：

```text
测试 Token
清除已保存 Token
```

说明：

- Gist 名称对应 Gist description。上传时会先查找 description 完全相同的 Gist，找到则更新，找不到则创建。
- 文件名必填，避免误改已有 Gist 文件。
- 默认创建 Secret Gist；Secret Gist 不是加密，只是不会公开列出，拿到 Raw URL 的人仍然可以访问。
- 上传内容是实际订阅内容，包含节点密码、UUID、SNI、Host、path 等敏感信息，不建议公开分享。


## 推荐流程

```text
拉取分析
→ 筛选未知节点
→ 落地检测
→ 清理节点名
→ 复制 Clash YAML / 通用 URI 订阅
```

如果只是快速看订阅质量：

```text
拉取分析
→ 看协议分布和地区分布
→ 导出 JSON 备份
```

---

## 常见问题

### 页面打不开

先测试：

```text
http://subviz.store/api/health
```

如果打不开，检查：

- Surge 模块是否启用
- 外部资源是否更新成功
- `script-path` 是否是 GitHub Raw 地址
- 是否使用了旧缓存

---

### 点击按钮没反应

尝试在 URL 后加任意新参数绕过缓存：

```text
http://subviz.store/?v=any
```

或在 Surge 外部资源里更新脚本。

---

### 落地检测全部失败

可能原因：

- 节点本身不可用
- 协议或参数不兼容 Surge 临时策略
- 查询接口被节点阻断
- 请求超时
- 当前筛选结果里不是有效代理节点

落地检测失败不代表订阅解析失败。

---

### GeoIP 和落地检测有什么区别？

```text
快速 GeoIP：查节点 server 的归属
落地检测：查节点真实出口 IP 的归属
```

CDN、中转、伪装域名场景下，落地检测更接近真实情况。

---

## 当前版本

```text
v0.1.43
```

## v0.1.43 修复内容

- 新增“上传到 Gist / 发布远程订阅”面板，可把当前已勾选节点按当前导出格式上传到 GitHub Gist。
- 新增 Surge `$persistentStore` Token 管理：支持保存/更新、测试、清除 GitHub Token；上传时 Token 输入框留空会自动使用已保存 Token。
- 新增 `/api/gist-upload`、`/api/gist-token/status`、`/api/gist-token/save`、`/api/gist-token/test`、`/api/gist-token/delete`。
- 上传时按 Gist description 精确查找同名 Gist，找到则更新，找不到则创建；也支持手动填写 Gist ID 强制更新指定 Gist。
- 上传成功后返回 Gist 页面 URL 和稳定 Raw URL，并支持一键复制 Raw URL。
- 新增 `tools/gist-test.js`，覆盖 Token 存储、Gist 创建、Gist 更新和 Raw URL 规范化的回归测试。
- 远程订阅拉取策略不变，仍保持不限制 URL。

## v0.1.42 修复内容

- 第四轮 QA 收尾：新增 `test/fixtures/` 样本库，覆盖 Clash YAML、URI、Surge `[Proxy]`、Base64 订阅和重复节点场景。
- 新增 `tools/fixture-test.js`，自动验证多协议解析数量、协议覆盖、重复节点统计、Reality 字段展平、gRPC/WS 嵌套字段保真。
- 新增 `tools/client-export-test.js`，自动验证 Clash YAML 导出不会把 `ws-opts` / `grpc-opts` / `reality-opts` 错误转成 JSON 字符串，并验证 Reality / Hysteria2 / TUIC / Snell / AnyTLS 的 URI 导出。
- `npm test` 现在会依次执行 smoke test、fixture regression test、client export test，便于后续每次改动前先跑回归。
- 补充导出安全提示：JSON 备份会包含节点密钥、UUID、密码、SNI、Host、path 等敏感信息，不建议公开分享。
- 没有改变远程订阅拉取限制策略，仍保持不限制 URL。

## v0.1.41 修复内容

- 第三轮结构化重构：新增 `src/` 源码目录，把原来集中在 `subviz.js` 里的后端、解析器、Surge 策略、落地/测活、HTML 路由和前端 UI 拆分为可维护文件。
- 保留 Surge 最终使用方式不变：`subviz.js` 仍然是可直接部署/覆盖的单文件脚本。
- 新增 `tools/build-subviz.js`，可以从 `src/` 一键重新生成 `subviz.js`。
- 新增 `package.json` 脚本：`npm run build`、`npm run check`、`npm test`。
- 新增 `tools/smoke-test.js`，覆盖 health、sample、analyze-text、前端脚本语法、Reality 字段展平和 gRPC flow-style 解析等基础回归。
- 没有改变远程订阅拉取限制策略，仍保持不限制 URL。

## v0.1.40 修复内容

- 第二轮兼容性修复：扩大通用 URI 导出覆盖，新增/增强 `hysteria2` / `tuic` / `snell` / `socks5` / `http` / `https` / `anytls` 等协议的 URI 生成。
- 增强 Clash flow-style 写法解析，支持 `{ grpc-opts: { ... } }`、`{ ws-opts: { headers: { Host: ... } } }`、`alpn: [h3]` 这类内联嵌套结构。
- Clash YAML 导出时继续保留 `ws-opts` / `grpc-opts` / `reality-opts` 嵌套结构，并清理导出中的空字段，避免生成一堆 `cipher: ""`、`path: ""`。
- VLESS Reality URI 导出现在会根据 `reality-opts.public-key` 自动导出 `security=reality`，不再被 `tls: true` 误导成普通 TLS。
- gRPC 节点会自动保留/恢复 `grpc-opts.grpc-service-name`，URI 导出时映射为 `serviceName`。
- 远程订阅拉取仍不做 URL 限制；仅补充 HTTP 4xx/5xx 错误提示和空订阅提醒，方便排查订阅源问题。
- 演示数据扩展为 6 个节点，覆盖 Trojan WS、VLESS Reality、SS、Hysteria2、TUIC、VMess gRPC。


