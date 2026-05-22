var SUBVIZ_SURGE_0_1_8 = true;
var SubViz = (function () {
  'use strict';
  var VERSION = '0.1.8';

  function nowIso() { try { return new Date().toISOString(); } catch (e) { return ''; } }

  function respond(status, body, headers) {
    var h = {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    headers = headers || {};
    Object.keys(headers).forEach(function (k) { h[k] = headers[k]; });
    $done({ response: { status: status || 200, headers: h, body: body || '' } });
  }

  function respondJSON(obj, status) {
    respond(status || 200, JSON.stringify(obj, null, 2), { 'Content-Type': 'application/json; charset=utf-8' });
  }

  function safeDecodeURIComponent(s) {
    if (s == null) return '';
    s = String(s).replace(/\+/g, '%20');
    try { return decodeURIComponent(s); } catch (e) { return String(s); }
  }

  function getPath(url) {
    var m = String(url || '').match(/^https?:\/\/[^\/]+([^?#]*)/i);
    return m ? (m[1] || '/') : '/';
  }

  function parseQuery(url) {
    var q = '';
    var idx = String(url || '').indexOf('?');
    if (idx >= 0) q = String(url).slice(idx + 1).split('#')[0];
    var out = {};
    if (!q) return out;
    q.split('&').forEach(function (part) {
      if (!part) return;
      var p = part.split('=');
      var key = safeDecodeURIComponent(p.shift() || '');
      var val = safeDecodeURIComponent(p.join('=') || '');
      if (key) out[key] = val;
    });
    return out;
  }

  function utf8Decode(bytes) {
    var out = '', i = 0, c, c2, c3, c4, cp;
    while (i < bytes.length) {
      c = bytes[i++];
      if (c < 128) out += String.fromCharCode(c);
      else if (c > 191 && c < 224) {
        c2 = bytes[i++];
        out += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
      } else if (c > 223 && c < 240) {
        c2 = bytes[i++]; c3 = bytes[i++];
        out += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      } else {
        c2 = bytes[i++]; c3 = bytes[i++]; c4 = bytes[i++];
        cp = ((c & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63);
        cp -= 0x10000;
        out += String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 1023));
      }
    }
    return out;
  }

  function base64Decode(input) {
    if (!input) return '';
    var s = String(input).replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    var pad = s.length % 4;
    if (pad) s += new Array(5 - pad).join('=');
    if (typeof atob === 'function') {
      try {
        var bin = atob(s), arr = [];
        for (var i = 0; i < bin.length; i++) arr.push(bin.charCodeAt(i));
        return utf8Decode(arr);
      } catch (e) {}
    }
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var bytes = [], buffer, bc = 0, bs, idx;
    for (var j = 0; j < s.length; j++) {
      idx = chars.indexOf(s.charAt(j));
      if (idx < 0) continue;
      buffer = idx;
      if (buffer === 64) break;
      bs = bc % 4 ? bs * 64 + buffer : buffer;
      if (bc++ % 4) bytes.push(255 & (bs >> ((-2 * bc) & 6)));
    }
    return utf8Decode(bytes);
  }

  function b64(str) {
    if (typeof btoa === 'function') {
      try { return btoa(unescape(encodeURIComponent(str))); } catch (e) {}
    }
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 128) bytes.push(c);
      else if (c < 2048) bytes.push((c >> 6) | 192, (c & 63) | 128);
      else bytes.push((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128);
    }
    var out = '', j = 0;
    while (j < bytes.length) {
      var c1 = bytes[j++], c2 = bytes[j++], c3 = bytes[j++];
      out += chars.charAt(c1 >> 2);
      out += chars.charAt(((c1 & 3) << 4) | ((c2 || 0) >> 4));
      out += isNaN(c2) ? '=' : chars.charAt(((c2 & 15) << 2) | ((c3 || 0) >> 6));
      out += isNaN(c3) ? '=' : chars.charAt(c3 & 63);
    }
    return out;
  }

  function looksLikeBase64(s) {
    s = String(s || '').trim();
    if (s.length < 24) return false;
    if (/^(vmess|vless|trojan|ss|ssr|hysteria2|hy2|tuic|snell):\/\//im.test(s)) return false;
    if (/proxies\s*:/i.test(s)) return false;
    return /^[A-Za-z0-9+/_=\-\r\n]+$/.test(s);
  }

  function maybeDecodeWhole(raw) {
    var s = String(raw || '').trim();
    if (!s) return '';
    if (looksLikeBase64(s)) {
      var decoded = base64Decode(s);
      if (/^(vmess|vless|trojan|ss|ssr|hysteria2|hy2|hysteria|tuic|snell):\/\//im.test(decoded) || /proxies\s*:/i.test(decoded) || decoded.split('\n').length > 2) return decoded;
    }
    return s;
  }

  function trimQuotes(v) {
    v = String(v == null ? '' : v).trim();
    if ((v.charAt(0) === '"' && v.charAt(v.length - 1) === '"') || (v.charAt(0) === "'" && v.charAt(v.length - 1) === "'")) return v.slice(1, -1);
    return v;
  }

  function splitRespectQuotes(s, sep) {
    var parts = [], cur = '', quote = '', depth = 0;
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (quote) { cur += ch; if (ch === quote && s.charAt(i - 1) !== '\\') quote = ''; }
      else if (ch === '"' || ch === "'") { quote = ch; cur += ch; }
      else if (ch === '[' || ch === '{' || ch === '(') { depth++; cur += ch; }
      else if (ch === ']' || ch === '}' || ch === ')') { depth = Math.max(0, depth - 1); cur += ch; }
      else if (ch === sep && depth === 0) { parts.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    if (cur.trim()) parts.push(cur.trim());
    return parts;
  }

  function parseInlineMap(s) {
    var obj = {};
    s = String(s || '').trim();
    if (s.charAt(0) === '{' && s.charAt(s.length - 1) === '}') s = s.slice(1, -1);
    splitRespectQuotes(s, ',').forEach(function (part) {
      var idx = part.indexOf(':');
      if (idx < 0) return;
      var k = trimQuotes(part.slice(0, idx));
      var v = trimQuotes(part.slice(idx + 1));
      obj[k] = v;
    });
    return obj;
  }

  function parseYamlBlockValue(line) {
    var idx = line.indexOf(':');
    if (idx < 0) return null;
    return { key: trimQuotes(line.slice(0, idx)), value: trimQuotes(line.slice(idx + 1).replace(/\s+#.*$/, '')) };
  }

  function parseClashProxies(text) {
    var lines = String(text || '').split(/\r?\n/), start = -1;
    for (var i = 0; i < lines.length; i++) if (/^\s*proxies\s*:\s*$/i.test(lines[i])) { start = i + 1; break; }
    if (start < 0) return [];
    var nodes = [], current = null;
    function pushCurrent() { if (!current) return; if (current.name || current.server || current.type) nodes.push(clashToNode(current)); current = null; }
    for (var j = start; j < lines.length; j++) {
      var line = lines[j];
      if (/^[A-Za-z0-9_\-]+\s*:/.test(line) && !/^\s/.test(line)) break;
      if (/^\s*#/.test(line) || /^\s*$/.test(line)) continue;
      var mInline = line.match(/^\s*-\s*(\{.*\})\s*$/);
      if (mInline) { pushCurrent(); nodes.push(clashToNode(parseInlineMap(mInline[1]))); continue; }
      var mStart = line.match(/^\s*-\s*(.*)$/);
      if (mStart) {
        pushCurrent(); current = {};
        var rest = mStart[1].trim();
        if (rest) {
          if (rest.charAt(0) === '{') current = parseInlineMap(rest);
          else { var kv0 = parseYamlBlockValue(rest); if (kv0) current[kv0.key] = kv0.value; }
        }
        continue;
      }
      if (current) { var kv = parseYamlBlockValue(line.trim()); if (kv) current[kv.key] = kv.value; }
    }
    pushCurrent();
    return nodes.filter(function (n) { return !!n.name || !!n.server; });
  }

  var COUNTRY_RULES = [
    ['HK','香港',/(🇭🇰|香港|港|\bHK\b|Hong\s*Kong|HKG)/i],
    ['TW','台湾',/(🇹🇼|台湾|臺灣|台灣|\bTW\b|Taiwan|TPE)/i],
    ['JP','日本',/(🇯🇵|日本|东京|大阪|\bJP\b|Japan|Tokyo|Osaka|NRT|HND)/i],
    ['SG','新加坡',/(🇸🇬|新加坡|狮城|\bSG\b|Singapore|SIN)/i],
    ['US','美国',/(🇺🇸|美国|美國|洛杉矶|西雅图|硅谷|纽约|\bUS\b|\bUSA\b|United\s*States|America|Los\s*Angeles|Seattle|New\s*York|San\s*Jose)/i],
    ['KR','韩国',/(🇰🇷|韩国|韓國|首尔|\bKR\b|Korea|Seoul|ICN)/i],
    ['GB','英国',/(🇬🇧|英国|英國|伦敦|\bUK\b|\bGB\b|Britain|London)/i],
    ['DE','德国',/(🇩🇪|德国|德國|\bDE\b|Germany|Frankfurt|Berlin)/i],
    ['FR','法国',/(🇫🇷|法国|法國|\bFR\b|France|Paris)/i],
    ['CA','加拿大',/(🇨🇦|加拿大|\bCA\b|Canada|Toronto|Vancouver)/i],
    ['AU','澳大利亚',/(🇦🇺|澳大利亚|澳洲|\bAU\b|Australia|Sydney|Melbourne)/i],
    ['RU','俄罗斯',/(🇷🇺|俄罗斯|俄羅斯|\bRU\b|Russia|Moscow)/i],
    ['NL','荷兰',/(🇳🇱|荷兰|荷蘭|\bNL\b|Netherlands|Amsterdam)/i],
    ['IT','意大利',/(🇮🇹|意大利|\bIT\b|Italy|Milan|Rome)/i],
    ['ES','西班牙',/(🇪🇸|西班牙|\bES\b|Spain|Madrid)/i],
    ['TR','土耳其',/(🇹🇷|土耳其|\bTR\b|Turkey|Istanbul)/i],
    ['IN','印度',/(🇮🇳|印度|\bIN\b|India|Mumbai|Delhi)/i],
    ['TH','泰国',/(🇹🇭|泰国|泰國|\bTH\b|Thailand|Bangkok)/i],
    ['VN','越南',/(🇻🇳|越南|\bVN\b|Vietnam|Hanoi)/i],
    ['MY','马来西亚',/(🇲🇾|马来西亚|馬來西亞|\bMY\b|Malaysia|Kuala)/i],
    ['PH','菲律宾',/(🇵🇭|菲律宾|菲律賓|\bPH\b|Philippines|Manila)/i],
    ['ID','印尼',/(🇮🇩|印尼|印度尼西亚|\bID\b|Indonesia|Jakarta)/i],
    ['MO','澳门',/(🇲🇴|澳门|澳門|\bMO\b|Macau|Macao)/i],
    ['CN','中国大陆',/(🇨🇳|中国|中國|大陆|大陸|\bCN\b|China|Shanghai|Beijing)/i]
  ];
  var CODE_TO_NAME = {};
  COUNTRY_RULES.forEach(function (x) { CODE_TO_NAME[x[0]] = x[1]; });

  function inferCountry(name, server) {
    var text = String(name || '') + ' ' + String(server || '');
    for (var i = 0; i < COUNTRY_RULES.length; i++) if (COUNTRY_RULES[i][2].test(text)) return { code: COUNTRY_RULES[i][0], name: COUNTRY_RULES[i][1] };
    var m = String(server || '').toLowerCase().match(/\.([a-z]{2})(?:\.|$)/);
    if (m) { var tld = m[1].toUpperCase(); if (CODE_TO_NAME[tld]) return { code: tld, name: CODE_TO_NAME[tld] }; }
    return { code: 'UN', name: '未知' };
  }

  function parseHostPort(s) {
    s = String(s || '').trim().split('/')[0];
    if (!s) return { server: '', port: '' };
    if (s.charAt(0) === '[') {
      var end = s.indexOf(']'), host = end >= 0 ? s.slice(1, end) : s, rest = end >= 0 ? s.slice(end + 1) : '';
      return { server: host, port: rest.charAt(0) === ':' ? rest.slice(1) : '' };
    }
    var parts = s.split(':');
    if (parts.length > 1) { var port = parts.pop(); return { server: parts.join(':'), port: port }; }
    return { server: s, port: '' };
  }

  function parseUrlParams(q) {
    var out = {};
    if (!q) return out;
    q.split('&').forEach(function (part) {
      var idx = part.indexOf('='), k = safeDecodeURIComponent(idx >= 0 ? part.slice(0, idx) : part), v = safeDecodeURIComponent(idx >= 0 ? part.slice(idx + 1) : '');
      if (k) out[k] = v;
    });
    return out;
  }

  function fingerprintNode(n) {
    return [n.protocol, String(n.server || '').toLowerCase(), String(n.port || ''), String(n.network || '').toLowerCase(), String(n.tls || '').toLowerCase()].join('|');
  }

  function makeNode(x) {
    x = x || {};
    var country = inferCountry(x.name, x.server);
    var node = {
      id: x.id || '',
      name: x.name || x.ps || x.remarks || x.server || '未命名节点',
      protocol: String(x.protocol || x.type || 'unknown').toLowerCase(),
      server: x.server || x.add || '',
      port: x.port || '',
      network: x.network || x.net || x.transport || '',
      tls: x.tls || x.security || '',
      countryCode: country.code,
      country: country.name,
      sourceFormat: x.sourceFormat || '',
      raw: x.raw || '',
      extra: x.extra || {}
    };
    node.fingerprint = fingerprintNode(node);
    return node;
  }

  function parseVmess(url) {
    var payload = String(url).replace(/^vmess:\/\//i, '').split('#')[0].trim(), json = base64Decode(payload);
    try {
      var obj = JSON.parse(json);
      return makeNode({ protocol: 'vmess', name: obj.ps || obj.name || '', server: obj.add || obj.server || '', port: obj.port || '', network: obj.net || obj.type || '', tls: obj.tls || obj.security || '', sourceFormat: 'uri', raw: url, extra: obj });
    } catch (e) {
      return makeNode({ protocol: 'vmess', name: 'vmess 解析失败', sourceFormat: 'uri', raw: url, extra: { error: String(e), payload: json.slice(0, 120) } });
    }
  }

  function parseSSR(url) {
    var payload = String(url).replace(/^ssr:\/\//i, '').trim(), decoded = base64Decode(payload), parts = decoded.split('/?'), main = parts[0] || '', params = parseUrlParams(parts[1] || ''), seg = main.split(':'), name = params.remarks ? base64Decode(params.remarks) : '';
    return makeNode({ protocol: 'ssr', name: name || seg[0] || 'ssr', server: seg[0] || '', port: seg[1] || '', network: params.obfs || seg[4] || '', tls: '', sourceFormat: 'uri', raw: url, extra: { protocol: seg[2], method: seg[3], obfs: seg[4] } });
  }

  function parseSS(url) {
    var raw = String(url), body = raw.replace(/^ss:\/\//i, ''), hash = '', hidx = body.indexOf('#');
    if (hidx >= 0) { hash = safeDecodeURIComponent(body.slice(hidx + 1)); body = body.slice(0, hidx); }
    var qidx = body.indexOf('?');
    if (qidx >= 0) body = body.slice(0, qidx);
    var main = body;
    if (main.indexOf('@') < 0) { var decoded = base64Decode(main); if (decoded.indexOf('@') >= 0) main = decoded; }
    else {
      var left = main.split('@')[0];
      if (left.indexOf(':') < 0) main = base64Decode(left) + '@' + main.split('@').slice(1).join('@');
    }
    var hp = parseHostPort(main.split('@').pop());
    var extra = {};
    var methodPart = main.indexOf('@') >= 0 ? main.split('@')[0] : '';
    if (methodPart.indexOf(':') >= 0) extra.method = safeDecodeURIComponent(methodPart.split(':')[0]);
    return makeNode({ protocol: 'ss', name: hash || hp.server, server: hp.server, port: hp.port, sourceFormat: 'uri', raw: url, extra: extra });
  }

  function parseGenericUri(url) {
    var raw = String(url), m = raw.match(/^([a-z0-9+.-]+):\/\//i), protocol = m ? m[1].toLowerCase() : 'unknown', body = raw.replace(/^[a-z0-9+.-]+:\/\//i, ''), name = '';
    var hidx = body.indexOf('#');
    if (hidx >= 0) { name = safeDecodeURIComponent(body.slice(hidx + 1)); body = body.slice(0, hidx); }
    var query = '', qidx = body.indexOf('?');
    if (qidx >= 0) { query = body.slice(qidx + 1); body = body.slice(0, qidx); }
    var authority = body.split('/')[0], hostPart = authority.indexOf('@') >= 0 ? authority.split('@').pop() : authority, hp = parseHostPort(hostPart), params = parseUrlParams(query);
    return makeNode({ protocol: protocol === 'hy2' ? 'hysteria2' : protocol, name: name || params.name || hp.server, server: hp.server, port: hp.port, network: params.type || params.network || params.transport || '', tls: params.security || params.tls || '', sourceFormat: 'uri', raw: url, extra: params });
  }

  function parseUri(url) {
    if (/^vmess:\/\//i.test(url)) return parseVmess(url);
    if (/^ssr:\/\//i.test(url)) return parseSSR(url);
    if (/^ss:\/\//i.test(url)) return parseSS(url);
    return parseGenericUri(url);
  }

  function clashToNode(obj) {
    obj = obj || {};
    return makeNode({ protocol: obj.type || obj.protocol || 'unknown', name: obj.name || obj.server || '未命名节点', server: obj.server || obj.add || '', port: obj.port || '', network: obj.network || obj.type_transport || obj.transport || '', tls: obj.tls || obj.security || '', sourceFormat: 'clash-yaml', raw: JSON.stringify(obj), extra: obj });
  }

  function extractUris(text) {
    var re = /\b(vmess|vless|trojan|ssr|ss|hysteria2|hy2|hysteria|tuic|snell|socks5|socks):\/\/[^\s"'<>\\]+/ig, out = [], m;
    while ((m = re.exec(String(text || '')))) out.push(m[0].replace(/[),;]+$/, ''));
    return out;
  }

  function parseSubscription(raw) {
    var normalized = maybeDecodeWhole(raw), nodes = [];
    if (/proxies\s*:/i.test(normalized)) nodes = nodes.concat(parseClashProxies(normalized));
    var lineUris = [];
    normalized.split(/\r?\n/).forEach(function (line) {
      line = line.trim();
      if (!line || line.charAt(0) === '#') return;
      if (/^(vmess|vless|trojan|ssr|ss|hysteria2|hy2|hysteria|tuic|snell|socks5|socks):\/\//i.test(line)) lineUris.push(line);
    });
    var uris = lineUris.length ? lineUris : extractUris(normalized);
    for (var i = 0; i < uris.length; i++) nodes.push(parseUri(uris[i]));
    var seenRaw = {}, clean = [];
    nodes.forEach(function (n) { var key = n.raw || (n.protocol + n.name + n.server + n.port); if (seenRaw[key]) return; seenRaw[key] = true; clean.push(n); });
    return { normalizedText: normalized, nodes: clean };
  }

  function countBy(nodes, key) {
    var map = {};
    nodes.forEach(function (n) { var k = n[key] || '未知'; map[k] = (map[k] || 0) + 1; });
    return Object.keys(map).sort(function (a, b) { return map[b] - map[a] || a.localeCompare(b); }).map(function (k) { return { key: k, count: map[k] }; });
  }

  function duplicateGroups(nodes) {
    var map = {};
    nodes.forEach(function (n) { if (!map[n.fingerprint]) map[n.fingerprint] = []; map[n.fingerprint].push(n); });
    return Object.keys(map).filter(function (k) { return map[k].length > 1; }).sort(function (a, b) { return map[b].length - map[a].length; }).map(function (k) { return { fingerprint: k, count: map[k].length, nodes: map[k] }; });
  }

  function analyze(raw, meta) {
    meta = meta || {};
    var parsed = parseSubscription(raw), nodes = parsed.nodes, dupGroups = duplicateGroups(nodes), uniqueCount = nodes.length - dupGroups.reduce(function (acc, g) { return acc + g.count - 1; }, 0);
    return { ok: true, version: VERSION, generatedAt: nowIso(), source: meta.source || '', size: String(raw || '').length, normalizedSize: parsed.normalizedText.length, summary: { total: nodes.length, unique: uniqueCount, duplicates: nodes.length - uniqueCount, protocols: countBy(nodes, 'protocol').length, countries: countBy(nodes, 'country').length }, stats: { byProtocol: countBy(nodes, 'protocol'), byCountry: countBy(nodes, 'country'), byCountryCode: countBy(nodes, 'countryCode'), bySourceFormat: countBy(nodes, 'sourceFormat') }, duplicates: dupGroups, nodes: nodes };
  }

  function fetchUrl(url, callback) {
    if (typeof $httpClient === 'undefined') { callback(new Error('当前环境没有 $httpClient，仅 Surge 脚本运行时可拉取远程订阅。'), null, null); return; }
    $httpClient.get({ url: url, headers: { 'User-Agent': 'SubViz-Surge/' + VERSION, 'Accept': '*/*' } }, function (err, resp, body) {
      if (err) return callback(err, resp, body);
      var code = resp && (resp.status || resp.statusCode);
      if (code && (code < 200 || code >= 400)) return callback(new Error('订阅请求失败：HTTP ' + code), resp, body);
      callback(null, resp, body || '');
    });
  }

  function handleAnalyzeByUrl(url) {
    if (!/^https?:\/\//i.test(url || '')) { respondJSON({ ok: false, error: '请输入 http/https 订阅链接。' }, 400); return; }
    fetchUrl(url, function (err, resp, body) {
      if (err) { respondJSON({ ok: false, error: String(err.message || err) }, 502); return; }
      try { respondJSON(analyze(body, { source: url })); }
      catch (e) { respondJSON({ ok: false, error: String(e && e.stack || e) }, 500); }
    });
  }

  function handleAnalyzeText(body) {
    try {
      var raw = body || '', source = 'pasted-text';
      if (/^\s*\{/.test(raw)) { var obj = JSON.parse(raw); raw = obj.raw || obj.text || ''; source = obj.sourceName || source; }
      if (!raw) { respondJSON({ ok: false, error: '没有收到订阅内容。' }, 400); return; }
      respondJSON(analyze(raw, { source: source }));
    } catch (e) { respondJSON({ ok: false, error: String(e && e.stack || e) }, 500); }
  }

  function handleSample() {
    var vmess = 'vmess://' + b64(JSON.stringify({ v: '2', ps: 'HK-香港 01', add: 'hk.example.com', port: '443', id: 'demo', aid: '0', net: 'ws', type: 'none', host: '', path: '/ws', tls: 'tls' }));
    var sample = [vmess, 'trojan://password@jp.example.com:443?security=tls#JP-日本 01', 'vless://uuid@sg.example.com:443?encryption=none&security=tls&type=ws#SG-新加坡 01', 'ss://' + b64('aes-128-gcm:pass@us.example.com:8388') + '#US-美国 01', 'trojan://password@jp.example.com:443?security=tls#JP-日本 01 副本'].join('\n');
    respondJSON(analyze(sample, { source: 'demo-sample' }));
  }

  function htmlPage() {
    return [
      '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>SubViz Surge</title>',
      '<style>', css(), '</style></head><body><div class="app">',
      '<header class="hero"><div><div class="eyebrow">Surge Local UI · SubViz</div><h1>订阅节点可视化分析</h1><p class="sub">拉取或粘贴机场/代理订阅，解析节点分布、协议、国家/地区、数量、重复项，并支持筛选与导出。</p></div><div class="badge">v', VERSION, '</div></header>',
      '<section class="panel input-panel"><label>订阅 URL</label><div class="row"><input id="url" placeholder="https://example.com/sub"><button id="analyze" type="button" onclick="window.SubVizApp&&SubVizApp.analyzeUrl()">拉取分析</button><button id="sample" type="button" class="ghost" onclick="window.SubVizApp&&SubVizApp.sample()">演示数据</button></div><details><summary>或粘贴订阅原文 / Clash YAML</summary><textarea id="raw" placeholder="粘贴 vmess/vless/trojan/ss/ssr 或 Clash YAML"></textarea><button id="analyzeText" type="button" class="secondary" onclick="window.SubVizApp&&SubVizApp.analyzeText()">分析粘贴内容</button></details><div id="status" class="status">准备就绪。先点“演示数据”测试前端，再输入订阅 URL 点“拉取分析”。访问域名：<code>http://subviz.store/</code></div></section>',
      '<section id="summary" class="grid cards"></section>',
      '<section class="grid two"><div class="panel"><div class="panel-title">协议分布</div><div id="protocolChart" class="chart"></div></div><div class="panel"><div class="panel-title">国家 / 地区分布</div><div id="countryChart" class="chart"></div></div></section>',
      '<section class="panel"><div class="toolbar"><div><div class="panel-title">节点列表</div><p id="tableHint" class="hint">暂无数据</p></div><div class="filters"><input id="kw" placeholder="搜索节点名 / 服务器 / 地区"><select id="protocolFilter"><option value="">全部协议</option></select><select id="countryFilter"><option value="">全部地区</option></select><label class="check"><input id="uniqueOnly" type="checkbox">仅唯一节点</label><button id="exportCsv" class="ghost">导出 CSV</button><button id="exportJson" class="ghost">导出 JSON</button></div></div><div class="table-wrap"><table><thead><tr><th>#</th><th>节点名</th><th>协议</th><th>国家/地区</th><th>服务器</th><th>端口</th><th>传输/TLS</th><th>重复指纹</th></tr></thead><tbody id="tbody"><tr><td colspan="8">暂无数据</td></tr></tbody></table></div></section>',
      '<section class="panel"><div class="panel-title">去重统计</div><div id="duplicates" class="dups">暂无重复节点。</div></section><footer>本工具仅在 Surge 本地脚本中解析订阅，不提供订阅转换、不保存订阅内容。导出操作发生在浏览器端。</footer></div>',
      '<script>', clientJS(), '</script></body></html>'
    ].join('');
  }

  function css() {
    return ':root{--bg:#0f172a;--card:#111c33;--card2:#0b1220;--line:#24344f;--text:#e5edf8;--muted:#92a2b8;--accent:#7dd3fc;--accent2:#c084fc;--good:#86efac;--warn:#fbbf24}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at top left,#1f3b68 0,#0f172a 38%,#08111f 100%);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif}.app{max-width:1180px;margin:0 auto;padding:28px 18px 48px}.hero{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin:18px 0 24px}.eyebrow{letter-spacing:.15em;text-transform:uppercase;color:var(--accent);font-size:12px}.hero h1{font-size:40px;line-height:1.08;margin:8px 0;background:linear-gradient(90deg,#fff,#bfe9ff,#e9d5ff);-webkit-background-clip:text;color:transparent}.sub{color:var(--muted);max-width:760px;line-height:1.7}.badge{padding:9px 14px;border:1px solid var(--line);border-radius:999px;background:rgba(255,255,255,.06);color:#c7d2fe}.panel{background:linear-gradient(180deg,rgba(17,28,51,.92),rgba(11,18,32,.92));border:1px solid var(--line);box-shadow:0 20px 60px rgba(0,0,0,.24);border-radius:22px;padding:18px;margin-bottom:16px}.input-panel label,.panel-title{font-weight:700;font-size:16px}.row{display:flex;gap:10px;margin-top:10px}input,textarea,select{width:100%;background:#07101f;border:1px solid #263a58;color:var(--text);border-radius:14px;padding:12px 13px;outline:none}textarea{min-height:150px;margin:12px 0;resize:vertical}input:focus,textarea:focus,select:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(125,211,252,.12)}button{border:0;border-radius:14px;padding:12px 16px;background:linear-gradient(135deg,#38bdf8,#a78bfa);color:#06111f;font-weight:800;cursor:pointer;white-space:nowrap}.ghost,.secondary{background:rgba(255,255,255,.07);color:var(--text);border:1px solid var(--line)}button:hover{filter:brightness(1.07)}details{margin-top:12px;color:var(--muted)}summary{cursor:pointer}.status{margin-top:12px;color:var(--muted);font-size:13px}.status.ok{color:var(--good)}.status.err{color:#fca5a5}code{background:#06101f;border:1px solid var(--line);padding:2px 5px;border-radius:6px}.grid{display:grid;gap:16px}.cards{grid-template-columns:repeat(5,minmax(0,1fr));margin-bottom:16px}.card{padding:16px;border-radius:20px;background:rgba(255,255,255,.055);border:1px solid var(--line)}.card .num{font-size:30px;font-weight:900}.card .lab{color:var(--muted);font-size:13px;margin-top:4px}.two{grid-template-columns:1fr 1fr}.chart{display:flex;flex-direction:column;gap:10px;margin-top:14px}.bar{display:grid;grid-template-columns:95px 1fr 46px;gap:10px;align-items:center;font-size:13px}.bar .track{height:12px;border-radius:999px;background:#07101f;overflow:hidden;border:1px solid #263a58}.bar .fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#38bdf8,#c084fc)}.toolbar{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.filters{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.filters input{width:220px}.filters select{width:130px}.check{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:13px}.check input{width:auto}.hint{color:var(--muted);font-size:13px;margin:6px 0 0}.table-wrap{overflow:auto;margin-top:12px;border:1px solid var(--line);border-radius:16px}table{width:100%;border-collapse:collapse;min-width:980px;background:rgba(6,16,31,.42)}th,td{padding:11px 10px;text-align:left;border-bottom:1px solid rgba(36,52,79,.7);font-size:13px;vertical-align:top}th{position:sticky;top:0;background:#101b31;color:#bfdbfe;z-index:1}td.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#c7d2fe}.pill{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;background:rgba(125,211,252,.12);color:#bfdbfe;border:1px solid rgba(125,211,252,.25);font-weight:700;font-size:12px}.dups{display:flex;flex-direction:column;gap:8px;margin-top:12px}.dup{padding:10px;border:1px solid var(--line);background:rgba(255,255,255,.04);border-radius:14px}.dup b{color:var(--warn)}footer{color:var(--muted);text-align:center;font-size:12px;margin-top:20px}@media(max-width:860px){.hero{flex-direction:column}.hero h1{font-size:32px}.cards,.two{grid-template-columns:1fr}.row,.toolbar{flex-direction:column}.filters{justify-content:flex-start}.filters input,.filters select{width:100%}button{width:100%}}';
  }

  function clientJS() {
    return "(function(){\n  var data=null, filtered=[];\n  function $(id){ return document.getElementById(id); }\n  function setStatus(s,c){ var el=$('status'); if(!el) return; el.textContent=s; el.className='status '+(c||''); }\n  function esc(s){ return String(s==null?'':s).replace(/[&<>\"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m];}); }\n  function pct(n,d){ return d?Math.round(n*100/d):0; }\n  function parseJSONText(t){ try{return JSON.parse(t);}catch(e){throw new Error((t||'').slice(0,240)||'接口返回异常');} }\n  function requestJSON(url,opt,cb){\n    opt=opt||{};\n    var done=false;\n    function finish(err,val){ if(done) return; done=true; cb(err,val); }\n    var timer=setTimeout(function(){ finish(new Error('本地 API 请求超时，请看 Surge 最近请求里 /api 是否命中 SubViz。')); }, 60000);\n    function end(err,val){ clearTimeout(timer); finish(err,val); }\n    if (window.fetch) {\n      try {\n        fetch(url,opt).then(function(r){ return r.text().then(function(t){ var j=parseJSONText(t); if(!r.ok||j.ok===false) throw new Error(j.error||('HTTP '+r.status)); return j; }); }).then(function(j){ end(null,j); }).catch(function(e){ end(e); });\n        return;\n      } catch(e) { /* fall through to XHR */ }\n    }\n    try {\n      var xhr=new XMLHttpRequest();\n      xhr.open(opt.method||'GET', url, true);\n      var headers=opt.headers||{};\n      Object.keys(headers).forEach(function(k){ xhr.setRequestHeader(k,headers[k]); });\n      xhr.onreadystatechange=function(){\n        if(xhr.readyState!==4) return;\n        try { var j=parseJSONText(xhr.responseText); if(xhr.status<200||xhr.status>=400||j.ok===false) throw new Error(j.error||('HTTP '+xhr.status)); end(null,j); }\n        catch(e){ end(e); }\n      };\n      xhr.onerror=function(){ end(new Error('XHR 网络错误，请检查 Surge 最近请求。')); };\n      xhr.send(opt.body||null);\n    } catch(e) { end(e); }\n  }\n  function saveLast(){ try{ localStorage.setItem('subviz:lastUrl',$('url').value); }catch(e){} }\n  function loadLast(){ try{ $('url').value=localStorage.getItem('subviz:lastUrl')||''; }catch(e){} }\n  function analyzeUrl(){\n    var url=($('url')&&$('url').value||'').trim();\n    if(!url) return setStatus('请先输入订阅 URL。','err');\n    if(!/^https?:\\/\\//i.test(url)) return setStatus('订阅地址必须以 http:// 或 https:// 开头。','err');\n    saveLast();\n    setStatus('按钮已触发，正在请求本地 API：/api/analyze ...');\n    requestJSON('/api/analyze?url='+encodeURIComponent(url),{},function(err,j){\n      if(err) return setStatus('拉取失败：'+(err.message||err),'err');\n      render(j); setStatus('分析完成：共 '+j.summary.total+' 个节点。','ok');\n    });\n  }\n  function analyzeText(){\n    var raw=($('raw')&&$('raw').value||'');\n    if(!raw.trim()) return setStatus('请先粘贴订阅内容。','err');\n    setStatus('按钮已触发，正在解析粘贴内容……');\n    requestJSON('/api/analyze-text',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({raw:raw})},function(err,j){\n      if(err) return setStatus('解析失败：'+(err.message||err),'err');\n      render(j); setStatus('分析完成：共 '+j.summary.total+' 个节点。','ok');\n    });\n  }\n  function sample(){\n    setStatus('按钮已触发，正在载入演示数据……');\n    requestJSON('/api/sample',{},function(err,j){\n      if(err) return setStatus('演示数据失败：'+(err.message||err),'err');\n      render(j); setStatus('演示数据已载入：共 '+j.summary.total+' 个节点。','ok');\n    });\n  }\n  function render(d){ data=d; renderSummary(); renderCharts(); fillFilters(); applyFilters(); renderDups(); }\n  function renderSummary(){ var s=data.summary; var items=[['总节点',s.total],['唯一节点',s.unique],['重复节点',s.duplicates],['协议数',s.protocols],['地区数',s.countries]]; $('summary').innerHTML=items.map(function(x){return '<div class=\"card\"><div class=\"num\">'+x[1]+'</div><div class=\"lab\">'+x[0]+'</div></div>';}).join(''); }\n  function bars(arr,total){ if(!arr||!arr.length) return '<p class=\"hint\">暂无数据</p>'; return arr.slice(0,12).map(function(x){return '<div class=\"bar\"><span>'+esc(x.key)+'</span><div class=\"track\"><div class=\"fill\" style=\"width:'+pct(x.count,total)+'%\"></div></div><b>'+x.count+'</b></div>';}).join(''); }\n  function renderCharts(){ $('protocolChart').innerHTML=bars(data.stats.byProtocol,data.summary.total); $('countryChart').innerHTML=bars(data.stats.byCountry,data.summary.total); }\n  function fillFilters(){ var ps=data.stats.byProtocol.map(function(x){return x.key;}); var cs=data.stats.byCountry.map(function(x){return x.key;}); $('protocolFilter').innerHTML='<option value=\"\">全部协议</option>'+ps.map(function(x){return '<option>'+esc(x)+'</option>';}).join(''); $('countryFilter').innerHTML='<option value=\"\">全部地区</option>'+cs.map(function(x){return '<option>'+esc(x)+'</option>';}).join(''); }\n  function uniqueNodes(nodes){ var seen={}; return nodes.filter(function(n){ if(seen[n.fingerprint]) return false; seen[n.fingerprint]=1; return true; }); }\n  function applyFilters(){ if(!data) return; var kw=$('kw').value.trim().toLowerCase(), p=$('protocolFilter').value, c=$('countryFilter').value; var nodes=$('uniqueOnly').checked?uniqueNodes(data.nodes):data.nodes; filtered=nodes.filter(function(n){ var hay=[n.name,n.server,n.protocol,n.country,n.countryCode].join(' ').toLowerCase(); return(!kw||hay.indexOf(kw)>=0)&&(!p||n.protocol===p)&&(!c||n.country===c); }); renderTable(); }\n  function renderTable(){ var tb=$('tbody'); $('tableHint').textContent='当前显示 '+filtered.length+' / '+(data?data.nodes.length:0)+' 个节点'; tb.innerHTML=filtered.map(function(n,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(n.name)+'</td><td><span class=\"pill\">'+esc(n.protocol)+'</span></td><td>'+esc(n.country)+' '+esc(n.countryCode)+'</td><td class=\"mono\">'+esc(n.server)+'</td><td>'+esc(n.port)+'</td><td>'+esc([n.network,n.tls].filter(Boolean).join(' / '))+'</td><td class=\"mono\">'+esc(n.fingerprint)+'</td></tr>';}).join('')||'<tr><td colspan=\"8\">没有符合筛选条件的节点。</td></tr>'; }\n  function renderDups(){ if(!data) return; var d=data.duplicates; if(!d.length){ $('duplicates').textContent='暂无重复节点。'; return; } $('duplicates').innerHTML=d.slice(0,30).map(function(g){return '<div class=\"dup\"><b>'+g.count+' 个重复</b><div class=\"mono\">'+esc(g.fingerprint)+'</div><small>'+g.nodes.map(function(n){return esc(n.name);}).join('、')+'</small></div>';}).join(''); }\n  function download(name,type,content){ var blob=new Blob([content],{type:type}); var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(function(){URL.revokeObjectURL(a.href); a.remove();},1000); }\n  function csvCell(v){ v=String(v==null?'':v); return /[,\"\\n]/.test(v)?'\"'+v.replace(/\"/g,'\"\"')+'\"':v; }\n  function exportCsv(){ if(!data) return setStatus('暂无可导出数据。','err'); var rows=[['name','protocol','country','countryCode','server','port','network','tls','fingerprint']].concat(filtered.map(function(n){return [n.name,n.protocol,n.country,n.countryCode,n.server,n.port,n.network,n.tls,n.fingerprint];})); download('subviz-nodes.csv','text/csv;charset=utf-8',rows.map(function(r){return r.map(csvCell).join(',');}).join('\\n')); }\n  function exportJson(){ if(!data) return setStatus('暂无可导出数据。','err'); download('subviz-analysis.json','application/json;charset=utf-8',JSON.stringify({summary:data.summary,stats:data.stats,duplicates:data.duplicates,nodes:filtered},null,2)); }\n  function bind(){\n    loadLast();\n    if($('analyze')) $('analyze').onclick=analyzeUrl;\n    if($('sample')) $('sample').onclick=sample;\n    if($('analyzeText')) $('analyzeText').onclick=analyzeText;\n    if($('kw')) $('kw').oninput=applyFilters;\n    if($('protocolFilter')) $('protocolFilter').onchange=applyFilters;\n    if($('countryFilter')) $('countryFilter').onchange=applyFilters;\n    if($('uniqueOnly')) $('uniqueOnly').onchange=applyFilters;\n    if($('exportCsv')) $('exportCsv').onclick=exportCsv;\n    if($('exportJson')) $('exportJson').onclick=exportJson;\n    setStatus('页面脚本已加载。建议先点“演示数据”，成功后再拉取订阅。','ok');\n  }\n  window.SubVizApp={analyzeUrl:analyzeUrl,analyzeText:analyzeText,sample:sample,applyFilters:applyFilters,exportCsv:exportCsv,exportJson:exportJson};\n  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else bind();\n})();";
  }

  function run() {
    try {
      var method = ($request && $request.method || 'GET').toUpperCase();
      if (method === 'OPTIONS') { respond(204, ''); return; }
      var url = $request.url || '', path = getPath(url);
      if (path === '/api/health') { respondJSON({ ok: true, name: 'SubViz Surge', version: VERSION, marker: 'SUBVIZ_SURGE_0_1_8', time: nowIso() }); return; }
      if (path === '/api/analyze') { handleAnalyzeByUrl(parseQuery(url).url || ''); return; }
      if (path === '/api/analyze-text') { handleAnalyzeText($request.body || ''); return; }
      if (path === '/api/sample') { handleSample(); return; }
      respond(200, htmlPage(), { 'Content-Type': 'text/html; charset=utf-8' });
    } catch (e) {
      respondJSON({ ok: false, version: VERSION, error: String(e && e.stack || e) }, 500);
    }
  }

  return { version: VERSION, run: run, analyze: analyze, parseSubscription: parseSubscription, base64Decode: base64Decode, b64: b64, inferCountry: inferCountry };
})();

if (typeof $request !== 'undefined') SubViz.run();
if (typeof module !== 'undefined' && module.exports) module.exports = SubViz;
