#!/usr/bin/env node
'use strict';

/**
 * 真实运行时回归测试：在 vm 沙盒里加载 *完整* 的 src/client/app.js，
 * 模拟浏览器调用 render(data)，并直接调用 sv136 系列函数与 Gist upload
 * 表达式，确保不再出现 ReferenceError。
 *
 * 历史背景：sv135/sv136 增强块都把 apply 重写成
 *   apply = function(){ try{ ... } catch(e){ try{_baseApply()}catch(_){} console.log(e) } };
 * 这会把 ReferenceError 静默吞掉，仅通过 console.log 暴露出来。
 * 因此本测试会拦截 console.log，看见 'ReferenceError' 直接判失败。
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const clientPath = path.join(ROOT, 'src', 'client', 'app.js');
const code = fs.readFileSync(clientPath, 'utf8');

function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }

// 拦截 console.log 输出，捕获被静默吞掉的 ReferenceError / TypeError
const swallowedErrors = [];
function trackingLog() {
  for (let i = 0; i < arguments.length; i++) {
    const arg = arguments[i];
    if (arg && typeof arg === 'object' && arg.name && /Error$/.test(arg.name)) {
      swallowedErrors.push(arg.name + ': ' + arg.message);
    } else if (typeof arg === 'string' && /\b(ReferenceError|TypeError|SyntaxError)\b/.test(arg)) {
      swallowedErrors.push(arg);
    }
  }
}

// ---- 最小 DOM 桩 ----
function makeEl(tag) {
  const el = {
    tagName: tag || 'div',
    children: [],
    parentNode: null,
    style: {},
    classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
    dataset: {},
    value: '',
    textContent: '',
    innerHTML: '',
    checked: false,
    attributes: {},
    _listeners: {},
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k]; },
    addEventListener(ev, fn) { (this._listeners[ev] = this._listeners[ev] || []).push(fn); },
    removeEventListener() {},
    appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
    insertBefore(c) { c.parentNode = this; this.children.push(c); return c; },
    closest() { return null; },
    remove() {},
    click() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    select() {}, setSelectionRange() {}
  };
  return el;
}

const els = {};
const doc = {
  body: makeEl('body'),
  head: makeEl('head'),
  createElement(t) { return makeEl(t); },
  createTextNode(t) { return { nodeValue: t }; },
  getElementById(id) {
    if (!els[id]) els[id] = makeEl('?');
    els[id].id = id;
    return els[id];
  },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  addEventListener() {}
};

const win = { addEventListener() {}, location: { href: 'http://subviz.store/' } };

// 假 fetch，避免 loadJSON 真实联网
const fetchCalls = [];
function fakeFetch(url, opts) {
  fetchCalls.push({ url: String(url), opts: opts || {} });
  return Promise.resolve({
    ok: true,
    json() { return Promise.resolve({ ok: true, action: 'created', rawUrl: 'https://raw.example/r' }); },
    text() { return Promise.resolve('{"ok":true,"action":"created","rawUrl":"https://raw.example/r"}'); }
  });
}

const sandbox = {
  window: win,
  document: doc,
  console: { log: trackingLog, warn: trackingLog, error: trackingLog, info: trackingLog },
  setTimeout, clearTimeout,
  navigator: {},
  location: { href: 'http://subviz.store/' },
  fetch: fakeFetch,
  URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} },
  Blob: function () {},
  btoa(s) { return Buffer.from(String(s), 'binary').toString('base64'); },
  atob(s) { return Buffer.from(String(s), 'base64').toString('binary'); },
  encodeURIComponent, decodeURIComponent, escape, unescape,
  JSON, Date, Math, Object, Array, String, Number, Boolean, RegExp, Error, Promise,
  Symbol, Set, Map, parseInt, parseFloat, isNaN, isFinite
};
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'src/client/app.js', timeout: 2000 });

// ---- 1) 关键标识符必须存在（防止再有 sv13X 命名漏改）----
[
  'render', 'apply', 'analyzeURL', 'analyzeText',
  'sv132ById', 'sv133ById', 'sv135ById', 'sv136ById',
  'sv136EnsureDashboard', 'sv136UpdateHealth', 'sv136Refine', 'sv136InstallAutoParse',
  'SV136_PAGE_SIZE', 'sv136ViewLimit', 'sv136LastKey',
  'gistChecked', 'gistById', 'gistVal', 'buildExportPayload'
].forEach(function (name) {
  const t = vm.runInContext('typeof ' + name, sandbox);
  assert(t !== 'undefined', 'expected identifier `' + name + '` to be defined, got typeof ' + t);
});

// ---- 2) render() 真实调用链不抛 / 不静默吞 ReferenceError ----
const data = {
  ok: true,
  nodes: [
    { name: 'JP1', protocol: 'vmess', server: 'jp.example.com', port: '443',
      countryCode: 'JP', country: '日本', network: 'tcp', tls: 'true',
      fingerprint: 'a', extra: { type: 'vmess', uuid: '11111111-1111-1111-1111-111111111111', alterId: 0, cipher: 'auto' } },
    { name: 'US1', protocol: 'trojan', server: 'us.example.com', port: '443',
      countryCode: 'US', country: '美国', network: 'tcp', tls: 'true',
      fingerprint: 'b', extra: { type: 'trojan', password: 'demo' } }
  ],
  summary: { total: 2, unique: 2, duplicates: 0, protocols: 2, countries: 2 },
  stats: {
    byProtocol: [{ key: 'vmess', count: 1 }, { key: 'trojan', count: 1 }],
    byCountry: [{ key: '日本', count: 1 }, { key: '美国', count: 1 }],
    byCountryCode: [{ key: 'JP', count: 1 }, { key: 'US', count: 1 }],
    bySourceFormat: [{ key: 'clash', count: 2 }]
  },
  meta: { version: '0.1.43' }
};

['cards', 'protocols', 'countries', 'tbody', 'count', 'status', 'pf', 'cf',
 'exportType', 'gistName', 'gistFilename', 'gistId', 'gistToken', 'gistPublic',
 'gistUpload', 'gistRawUrl', 'gistPageUrl', 'url', 'raw'].forEach(function (id) {
  doc.getElementById(id);
});

vm.runInContext('render(' + JSON.stringify(data) + ');', sandbox);
assert(swallowedErrors.length === 0,
  'render() leaked errors via console.log: ' + JSON.stringify(swallowedErrors));

assert((els.cards.innerHTML || '').length > 0, 'render did not populate #cards');
assert((els.tbody.innerHTML || '').length > 0, 'render did not populate #tbody');
assert((els.protocols.innerHTML || '').length > 0, 'render did not populate #protocols');

// ---- 3) sv136 dashboard 系列直调不抛 ----
vm.runInContext('sv136EnsureDashboard(); sv136UpdateHealth(filtered()); sv136Refine();', sandbox);
assert(swallowedErrors.length === 0,
  'sv136 dashboard helpers leaked errors: ' + JSON.stringify(swallowedErrors));

// ---- 4) Gist 上传 payload 构造（之前 Bug 2 的核心场景） ----
// 全选当前节点，让 buildExportPayload 不报"未选"
vm.runInContext('if (typeof selectCurrent === "function") selectCurrent();', sandbox);

doc.getElementById('gistName').value = 'my-subs';
doc.getElementById('gistFilename').value = 'subs.yaml';
doc.getElementById('gistToken').value = 'ghp_dummy';
doc.getElementById('exportType').value = 'clash';
doc.getElementById('gistPublic').checked = false;

// 关键：从源码里直接抽出 gistUpload.onclick 的 fetch payload 表达式来跑。
// 这样如果有人把 gistChecked 改回不存在的 checked，测试一定能抓住。
// 匹配片段：gistPost('/api/gist-upload', { ...这段... })
const uploadPayloadMatch = code.match(/gistPost\('\/api\/gist-upload',\s*(\{[\s\S]*?\})\)/);
assert(uploadPayloadMatch, 'unable to locate gistUpload payload literal in app.js');
const payloadLiteral = uploadPayloadMatch[1];

// 模拟 onclick 内部已定义的局部变量
const payload = vm.runInContext([
  '(function(){',
  '  var p = buildExportPayload();',
  '  var name = gistVal("gistName");',
  '  var filename = gistVal("gistFilename") || gistDefaultFile();',
  '  var raw = ' + payloadLiteral + ';',
  '  return {',
  '    token: raw.token,',
  '    gistName: raw.gistName,',
  '    filename: raw.filename,',
  '    gistId: raw.gistId,',
  '    public: raw.public,',
  '    format: raw.format,',
  '    contentLen: (raw.content || "").length,',
  '    label: p.label,',
  '    count: p.count',
  '  };',
  '})()'
].join('\n'), sandbox);

assert(payload.token === 'ghp_dummy', 'gist payload token wrong');
assert(payload.gistName === 'my-subs', 'gist payload name wrong');
assert(payload.filename === 'subs.yaml', 'gist payload filename wrong');
assert(payload.format === 'clash', 'gist payload format wrong');
assert(payload.public === false, 'gist payload public should be false when checkbox unchecked');
assert(payload.contentLen > 0, 'gist payload content empty');
assert(payload.count === 2, 'gist payload count mismatch');

// 勾选后应为 true
doc.getElementById('gistPublic').checked = true;
const payloadChecked = vm.runInContext([
  '(function(){',
  '  var p = buildExportPayload();',
  '  var name = gistVal("gistName");',
  '  var filename = gistVal("gistFilename") || gistDefaultFile();',
  '  return (' + payloadLiteral + ').public;',
  '})()'
].join('\n'), sandbox);
assert(payloadChecked === true, 'gistChecked should return true when checkbox checked');

// ---- 5) 二次 render（模拟用户连点两次分析）也不应漏错 ----
vm.runInContext('render(' + JSON.stringify(data) + ');', sandbox);
assert(swallowedErrors.length === 0,
  'second render() leaked errors: ' + JSON.stringify(swallowedErrors));

console.log = function () {}; // 别污染测试结果输出
process.stdout.write('SubViz client render tests passed.\n');
