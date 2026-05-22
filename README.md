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

如果页面没有刷新到最新版，可以加版本参数：

```text
http://subviz.store/?v=124
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
  "version": "0.1.24"
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

## 重要说明

### 节点名清理不会修改连接参数

SubViz 只清理节点名 `name`。

不会修改这些字段：

```text
server
port
password
uuid
path
Host
SNI
servername
plugin-opts
grpc-service-name
```

有些节点会把推广词写进 `path`，例如：

```yaml
path: "/trTelegram🇨🇳 @WangCai2"
```

虽然看起来像垃圾词，但它可能是连接路径的一部分。

不要随便删除，否则节点可能失效。

---

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

尝试：

```text
http://subviz.store/?v=124
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
v0.1.24
```

