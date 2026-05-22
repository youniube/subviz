var SUBVIZ_SURGE_0_1_33 = true;
var SubViz = (function () {
  'use strict';
  var VERSION = '0.1.33';
  var MARKER = 'SUBVIZ_SURGE_0_1_33';

  function safeStringify(obj, space) {
    return JSON.stringify(obj, null, space || 0).replace(/[\u007f-\uffff]/g, function (c) {
      var s = c.charCodeAt(0).toString(16);
      return '\\u' + ('0000' + s).slice(-4);
    });
  }
  function respond(status, body, headers) {
    var h = {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    headers = headers || {};
    Object.keys(headers).forEach(function (k) { h[k] = headers[k]; });
    $done({ response: { status: status || 200, headers: h, body: body || '' } });
  }
  function respondJSON(obj, status) {
    respond(status || 200, safeStringify(obj, 2), { 'Content-Type': 'application/json; charset=utf-8' });
  }
  function nowIso() { try { return new Date().toISOString(); } catch (e) { return ''; } }
  function getURL() { return ($request && $request.url) || ''; }
  function getPath(url) { try { return url.replace(/^https?:\/\/[^\/]+/i, '').split('?')[0] || '/'; } catch (e) { return '/'; } }
  function getQuery(url, key) {
    var q = (url.split('?')[1] || '').split('#')[0];
    var arr = q.split('&');
    for (var i = 0; i < arr.length; i++) {
      var kv = arr[i].split('=');
      if (decodeURIComponent(kv[0] || '') === key) return decodeURIComponent((kv.slice(1).join('=') || '').replace(/\+/g, ' '));
    }
    return '';
  }
  function clean(v) {
    if (v === null || v === undefined) return '';
    v = String(v).trim();
    if ((v[0] === '"' && v[v.length - 1] === '"') || (v[0] === "'" && v[v.length - 1] === "'")) v = v.slice(1, -1);
    return v;
  }
  function decodeURIComponentSafe(s) { try { return decodeURIComponent(s); } catch (e) { return s || ''; } }
  function atobSafe(input) {
    input = String(input || '').trim().replace(/\s+/g, '');
    if (!input) return '';
    input = input.replace(/-/g, '+').replace(/_/g, '/');
    while (input.length % 4) input += '=';
    try {
      var bin = atob(input);
      try { return decodeURIComponent(escape(bin)); } catch (e1) { return bin; }
    } catch (e2) { return ''; }
  }
  function maybeDecodeBase64(text) {
    var t = String(text || '').trim();
    if (!t) return t;
    if (/^(vmess|vless|trojan|ss|ssr|hysteria2|hy2|hysteria|tuic|snell|socks5?|http):\/\//im.test(t)) return t;
    if (/proxies\s*:/i.test(t)) return t;
    if (/^[A-Za-z0-9+/_=-]+$/.test(t) && t.length > 40) {
      var d = atobSafe(t);
      if (d && d.length > 10) return d;
    }
    return t;
  }

  var COUNTRY = {
    HK:['Hong Kong','\u9999\u6e2f',['HK','HKG'],['\u9999\u6e2f','Hong Kong']],
    TW:['Taiwan','\u53f0\u6e7e',['TW','TWN'],['\u53f0\u6e7e','\u81fa\u7063','Taiwan']],
    MO:['Macau','\u6fb3\u95e8',['MO','MAC'],['\u6fb3\u95e8','\u6fb3\u9580','Macau','Macao']],
    US:['United States','\u7f8e\u56fd',['US','USA'],['\u7f8e\u56fd','\u7f8e\u897f','\u7f8e\u4e1c','\u7f8e\u5357','\u7f8e\u5317','United States','USA','America']],
    JP:['Japan','\u65e5\u672c',['JP','JPN'],['\u65e5\u672c','Japan','Tokyo','\u4e1c\u4eac','\u5927\u962a']],
    SG:['Singapore','\u65b0\u52a0\u5761',['SG','SGP'],['\u65b0\u52a0\u5761','\u72ee\u57ce','Singapore']],
    KR:['Korea','\u97e9\u56fd',['KR','KOR'],['\u97e9\u56fd','\u9996\u5c14','Korea','Seoul']],
    GB:['United Kingdom','\u82f1\u56fd',['GB','UK','GBR'],['\u82f1\u56fd','\u4f26\u6566','United Kingdom','Britain','London']],
    DE:['Germany','\u5fb7\u56fd',['DE','DEU'],['\u5fb7\u56fd','Germany','Frankfurt']],
    FR:['France','\u6cd5\u56fd',['FR','FRA'],['\u6cd5\u56fd','France','Paris']],
    NL:['Netherlands','\u8377\u5170',['NL','NLD'],['\u8377\u5170','Netherlands','Holland']],
    CA:['Canada','\u52a0\u62ff\u5927',['CA','CAN'],['\u52a0\u62ff\u5927','Canada']],
    AU:['Australia','\u6fb3\u5927\u5229\u4e9a',['AU','AUS'],['\u6fb3\u5927\u5229\u4e9a','\u6fb3\u6d32','Australia']],
    RU:['Russia','\u4fc4\u7f57\u65af',['RU','RUS'],['\u4fc4\u7f57\u65af','Russia','Moscow']],
    IN:['India','\u5370\u5ea6',['IN','IND'],['\u5370\u5ea6','India']],
    VN:['Vietnam','\u8d8a\u5357',['VN','VNM'],['\u8d8a\u5357','Vietnam']],
    TH:['Thailand','\u6cf0\u56fd',['TH','THA'],['\u6cf0\u56fd','Thailand']],
    MY:['Malaysia','\u9a6c\u6765\u897f\u4e9a',['MY','MYS'],['\u9a6c\u6765\u897f\u4e9a','Malaysia']],
    PH:['Philippines','\u83f2\u5f8b\u5bbe',['PH','PHL'],['\u83f2\u5f8b\u5bbe','Philippines']],
    TR:['Turkey','\u571f\u8033\u5176',['TR','TUR'],['\u571f\u8033\u5176','Turkey']],
    ES:['Spain','\u897f\u73ed\u7259',['ES','ESP'],['\u897f\u73ed\u7259','Spain']],
    IT:['Italy','\u610f\u5927\u5229',['IT','ITA'],['\u610f\u5927\u5229','Italy']],
    SE:['Sweden','\u745e\u5178',['SE','SWE'],['\u745e\u5178','Sweden']],
    FI:['Finland','\u82ac\u5170',['FI','FIN'],['\u82ac\u5170','Finland','Helsinki','\u8d6b\u5c14\u8f9b\u57fa']],
    RO:['Romania','\u7f57\u9a6c\u5c3c\u4e9a',['RO','ROU'],['\u7f57\u9a6c\u5c3c\u4e9a','Romania']],
    PL:['Poland','\u6ce2\u5170',['PL','POL'],['\u6ce2\u5170','Poland']],
    CZ:['Czechia','\u6377\u514b',['CZ','CZE'],['\u6377\u514b','Czech','Czechia']],
    CH:['Switzerland','\u745e\u58eb',['CH','CHE'],['\u745e\u58eb','Switzerland']],
    LV:['Latvia','\u62c9\u8131\u7ef4\u4e9a',['LV','LVA'],['\u62c9\u8131\u7ef4\u4e9a','Latvia']],
    EE:['Estonia','\u7231\u6c99\u5c3c\u4e9a',['EE','EST'],['\u7231\u6c99\u5c3c\u4e9a','Estonia']],
    MD:['Moldova','\u6469\u5c14\u591a\u74e6',['MD','MDA'],['\u6469\u5c14\u591a\u74e6','Moldova']],
    AR:['Argentina','\u963f\u6839\u5ef7',['AR','ARG'],['\u963f\u6839\u5ef7','Argentina']],
    ZA:['South Africa','\u5357\u975e',['ZA','ZAF'],['\u5357\u975e','South Africa']],
    NG:['Nigeria','\u5c3c\u65e5\u5229\u4e9a',['NG','NGA'],['\u5c3c\u65e5\u5229\u4e9a','Nigeria']],
    NZ:['New Zealand','\u65b0\u897f\u5170',['NZ','NZL'],['\u65b0\u897f\u5170','New Zealand']]
  };
  function flagToCC(s) {
    s = String(s || '');
    for (var i = 0; i < s.length - 3; i++) {
      var a = s.charCodeAt(i), b = s.charCodeAt(i + 1), c = s.charCodeAt(i + 2), d = s.charCodeAt(i + 3);
      if (a === 0xD83C && c === 0xD83C && b >= 0xDDE6 && b <= 0xDDFF && d >= 0xDDE6 && d <= 0xDDFF) {
        return String.fromCharCode(65 + b - 0xDDE6) + String.fromCharCode(65 + d - 0xDDE6);
      }
    }
    return '';
  }
  function countryInfo(code, source, confidence) {
    var c = COUNTRY[code] || null;
    if (!c) return { countryCode: 'UN', country: '\u672a\u77e5', countrySource: 'none', countryConfidence: 0 };
    return { countryCode: code, country: c[1], countrySource: source || 'rule', countryConfidence: confidence || 80 };
  }
  function isCFServer(server) {
    server = String(server || '').toLowerCase();
    if (/cloudflare|workers\.dev|pages\.dev/.test(server)) return true;
    if (/^(104\.(1[6-9]|2[0-9]|3[0-1])\.|172\.(6[4-9]|7[0-1])\.|162\.158\.|190\.93\.|188\.114\.|141\.101\.|108\.162\.|198\.41\.)/.test(server)) return true;
    return false;
  }
  function detectCountry(name, server, extra) {
    name = String(name || ''); server = String(server || ''); extra = extra || {};
    var text = [name, server, extra.country, extra.countryCode, extra.sni, extra.servername, extra.Host, extra.host].join(' ');
    var explicit = flagToCC(text);
    if (explicit && COUNTRY[explicit]) return countryInfo(explicit, 'flag', 98);
    var upper = text.toUpperCase();
    var keys = Object.keys(COUNTRY);
    for (var i = 0; i < keys.length; i++) {
      var code = keys[i];
      var arr = COUNTRY[code][2];
      for (var j = 0; j < arr.length; j++) {
        var token = arr[j].toUpperCase();
        var re = new RegExp('(?:^|[^A-Z0-9])' + token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:[^A-Z0-9]|$)');
        if (re.test(upper)) return countryInfo(code, 'iso', 92);
      }
      var names = COUNTRY[code][3];
      for (var k = 0; k < names.length; k++) {
        if (text.indexOf(names[k]) >= 0 || upper.indexOf(String(names[k]).toUpperCase()) >= 0) return countryInfo(code, 'name', 90);
      }
    }
    if (/CF\s*\u4e2d\u8f6c|\u4e2d\u8f6c|Cloudflare|Anycast|CDN/i.test(text) || isCFServer(server)) {
      return { countryCode: 'CDN', country: 'CDN/\u4e2d\u8f6c', countrySource: 'cdn', countryConfidence: 60 };
    }
    return { countryCode: 'UN', country: '\u672a\u77e5', countrySource: 'none', countryConfidence: 0 };
  }

  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function pickObj(o, keys) {
    o = o || {};
    for (var i = 0; i < keys.length; i++) {
      var v = o[keys[i]];
      if (v !== null && v !== undefined && String(v) !== '') return v;
    }
    return '';
  }
  function normalizeProxyObject(obj) {
    obj = obj || {};
    var o = {};
    Object.keys(obj).forEach(function (k) { o[k] = obj[k]; });
    var ws = obj['ws-opts'] || obj.wsOpts || obj.ws || obj.ws_opts;
    if (isObj(ws)) {
      if (!o.path && ws.path) o.path = ws.path;
      if (!o.host && ws.host) o.host = ws.host;
      if (!o.Host && ws.Host) o.Host = ws.Host;
      if (isObj(ws.headers)) {
        if (!o.Host && ws.headers.Host) o.Host = ws.headers.Host;
        if (!o.host && ws.headers.host) o.host = ws.headers.host;
        if (!o['User-Agent'] && ws.headers['User-Agent']) o['User-Agent'] = ws.headers['User-Agent'];
      }
    }
    var h = obj.headers;
    if (isObj(h)) {
      if (!o.Host && h.Host) o.Host = h.Host;
      if (!o.host && h.host) o.host = h.host;
      if (!o['User-Agent'] && h['User-Agent']) o['User-Agent'] = h['User-Agent'];
    }
    var plugin = obj['plugin-opts'] || obj.pluginOpts || obj.plugin_opts;
    if (isObj(plugin)) {
      if (!o.mode && plugin.mode) o.mode = plugin.mode;
      if (!o.host && plugin.host) o.host = plugin.host;
      if (!o.Host && plugin.Host) o.Host = plugin.Host;
      if (!o.path && plugin.path) o.path = plugin.path;
      if (!o.tls && plugin.tls) o.tls = plugin.tls;
    }
    o.type = clean(o.type || o.protocol || '');
    o.server = clean(o.server || o.add || o.address || o.hostname || '');
    o.port = clean(o.port || '');
    o.name = clean(o.name || o.ps || o.remarks || o.remark || o.tag || '');
    o.network = clean(o.network || o.net || o.transport || '');
    if (String(o.network).toLowerCase() === 'websocket') o.network = 'ws';
    o.tls = clean(o.tls || o.security || '');
    o.cipher = clean(o.cipher || o.method || o['encrypt-method'] || o.encrypt_method || o.scy || '');
    o.password = clean(o.password || o.pass || o.passwd || o.psk || '');
    o.uuid = clean(o.uuid || o.id || o.username || '');
    o.sni = clean(o.sni || o.servername || o.serverName || o['server-name'] || o.server_name || '');
    o.Host = clean(o.Host || o.host || o['ws-host'] || '');
    o.path = clean(o.path || o['ws-path'] || '');
    return o;
  }

  function buildNode(obj, format, raw) {
    obj = normalizeProxyObject(obj || {});
    var name = clean(obj.name || obj.ps || obj.remarks || obj.remark || obj.tag || '');
    var protocol = clean((obj.type || obj.protocol || '')).toLowerCase();
    if (protocol === 'socks') protocol = 'socks5';
    if (protocol === 'hy2') protocol = 'hysteria2';
    var server = clean(obj.server || obj.add || obj.host || obj.address || obj.hostname || '');
    var port = clean(obj.port || '');
    var network = clean(obj.network || obj.net || obj.transport || '');
    var tls = clean(obj.tls || obj.security || '');
    if (!protocol && raw) {
      var m = String(raw).match(/^([a-z0-9+.-]+):\/\//i);
      if (m) protocol = m[1].toLowerCase();
    }
    var c = detectCountry(name, server, obj);
    return {
      id: clean(obj.uuid || obj.id || obj.username || obj.password || ''), name: name || server || 'node', protocol: protocol || 'unknown',
      server: server, port: port, network: network, tls: tls, countryCode: c.countryCode, country: c.country,
      countrySource: c.countrySource, countryConfidence: c.countryConfidence,
      sourceFormat: format || 'unknown', raw: raw || safeStringify(obj, 0), extra: obj,
      fingerprint: ''
    };
  }
  function setFingerprint(n) {
    var e = (n && n.extra) || {};
    var sni = clean(e.sni || e.servername || e.serverName || e['server-name'] || e.server_name || '');
    var host = clean(e.Host || e.host || e['ws-host'] || '');
    var path = clean(e.path || e['ws-path'] || '');
    var cipher = clean(e.cipher || e.method || e['encrypt-method'] || e.encrypt_method || '');
    var auth = clean(e.uuid || n.id || e.password || e.passwd || e.pass || '');
    n.fingerprint = [n.protocol, n.server, n.port, n.network, n.tls, sni, host, path, cipher, auth].join('|').toLowerCase();
    return n;
  }

  function parseFlowObject(s) {
    var obj = {};
    s = String(s || '').trim();
    if (s[0] === '{') s = s.slice(1);
    if (s[s.length - 1] === '}') s = s.slice(0, -1);
    var parts = [], cur = '', quote = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (quote) { if (ch === quote && s[i-1] !== '\\') quote = ''; cur += ch; }
      else if (ch === '"' || ch === "'") { quote = ch; cur += ch; }
      else if (ch === ',') { parts.push(cur); cur = ''; }
      else cur += ch;
    }
    if (cur) parts.push(cur);
    parts.forEach(function (p) {
      var idx = p.indexOf(':'); if (idx < 0) return;
      var k = clean(p.slice(0, idx)); var v = clean(p.slice(idx + 1));
      obj[k] = v;
    });
    return obj;
  }
  var REAL_PROXY_TYPES = { ss:1, ssr:1, vmess:1, vless:1, trojan:1, hysteria:1, hysteria2:1, hy2:1, tuic:1, snell:1, socks:1, socks5:1, http:1, https:1, anytls:1 };
  var GROUP_TYPES = { select:1, 'url-test':1, fallback:1, 'load-balance':1, relay:1, smart:1, direct:1, reject:1, pass:1 };
  function isRealProxyObject(obj) {
    obj = normalizeProxyObject(obj || {});
    var t = clean(obj.type || obj.protocol || '').toLowerCase();
    if (t === 'socks') t = 'socks5';
    if (!t || GROUP_TYPES[t] || !REAL_PROXY_TYPES[t]) return false;
    var server = clean(obj.server || obj.add || obj.host || obj.address || obj.hostname || '');
    var port = clean(obj.port || '');
    if (!server || !port) return false;
    return true;
  }
  function parseClash(text) {
    var nodes = [], lines = String(text || '').split(/\r?\n/), cur = null, inProxies = false, stack = [];
    var hasProxiesSection = /^\s*proxies\s*:\s*$/im.test(text);
    if (!hasProxiesSection && /^\s*-\s*(?:name\s*:|\{)/m.test(text)) inProxies = true;
    function push() {
      if (cur && isRealProxyObject(cur)) nodes.push(setFingerprint(buildNode(cur, 'clash-yaml', safeStringify(cur, 0))));
      cur = null; stack = [];
    }
    function setAt(indent, key, val, makeObj) {
      while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
      var parent = stack.length ? stack[stack.length - 1].obj : cur;
      if (!parent) return;
      if (makeObj) { var child = {}; parent[key] = child; stack.push({ indent: indent, obj: child }); }
      else parent[key] = clean(val);
    }
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (/^\s*proxies\s*:\s*$/i.test(line)) { push(); inProxies = true; continue; }
      if (inProxies && /^\S[^:]*\s*:\s*(?:#.*)?$/i.test(line) && !/^proxies\s*:/i.test(line)) { push(); inProxies = false; continue; }
      if (!inProxies) continue;
      var mFlow = line.match(/^\s*-\s*(\{.*\})\s*$/);
      if (mFlow) {
        push();
        var fo = parseFlowObject(mFlow[1]);
        if (isRealProxyObject(fo)) nodes.push(setFingerprint(buildNode(fo, 'clash-yaml', mFlow[1])));
        continue;
      }
      var mName = line.match(/^(\s*)-\s*name\s*:\s*(.*)$/i);
      if (mName) { push(); cur = { name: clean(mName[2]) }; stack = [{ indent: mName[1].length, obj: cur }]; continue; }
      var mStart = line.match(/^(\s*)-\s*([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
      if (mStart) { push(); cur = {}; stack = [{ indent: mStart[1].length, obj: cur }]; setAt(mStart[1].length + 2, mStart[2], mStart[3], clean(mStart[3]) === ''); continue; }
      if (!cur) continue;
      var m = line.match(/^(\s+)([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
      if (m) setAt(m[1].length, m[2], m[3], clean(m[3]) === '');
    }
    push(); return nodes;
  }
  var URI_PROXY_TYPES = { ss:1, ssr:1, vmess:1, vless:1, trojan:1, hysteria:1, hysteria2:1, hy2:1, tuic:1, snell:1, socks:1, socks5:1, http:1, https:1, anytls:1 };
  function parseURI(line) {
    line = clean(line); if (!line) return null;
    var m = line.match(/^([a-z0-9+.-]+):\/\//i); if (!m) return null;
    var proto = m[1].toLowerCase();
    if (!URI_PROXY_TYPES[proto]) return null;
    var rest = line.slice(m[0].length), obj = { type: proto };
    try {
      if (proto === 'vmess') {
        var json = atobSafe(rest); obj = JSON.parse(json); obj.type = 'vmess';
        obj.name = obj.ps || obj.name || obj.remarks || '';
        obj.server = obj.add || obj.server || '';
        obj.port = obj.port || '';
        obj.network = obj.net || obj.network || '';
        obj.tls = obj.tls || obj.security || '';
        return setFingerprint(buildNode(obj, 'uri', line));
      }
      var name = '';
      var hash = rest.indexOf('#'); if (hash >= 0) { name = decodeURIComponentSafe(rest.slice(hash + 1)); rest = rest.slice(0, hash); }
      var query = ''; var qi = rest.indexOf('?'); if (qi >= 0) { query = rest.slice(qi + 1); rest = rest.slice(0, qi); }
      function applyQuery(qs) {
        qs.split('&').forEach(function (p) {
          if (!p) return;
          var kv = p.split('='), k = decodeURIComponentSafe(kv[0] || ''), v = decodeURIComponentSafe(kv.slice(1).join('='));
          if (!k) return;
          if (k === 'type') obj.network = v;
          else if (k === 'host') obj.host = v;
          else if (k === 'path') obj.path = v;
          else obj[k] = v;
        });
      }
      if (proto === 'ss') {
        applyQuery(query);
        var decoded = rest, at = rest.lastIndexOf('@'), userinfo = '', hp = '';
        if (at >= 0) {
          userinfo = decodeURIComponentSafe(rest.slice(0, at));
          hp = rest.slice(at + 1);
          // SIP002 commonly writes ss://base64(method:password)@host:port#name.
          // If the userinfo part itself has no colon, decode that part only.
          if (userinfo.indexOf(':') < 0) {
            var du = atobSafe(userinfo);
            if (du) userinfo = du;
          }
        } else {
          decoded = atobSafe(rest) || rest;
          at = decoded.lastIndexOf('@');
          userinfo = at >= 0 ? decoded.slice(0, at) : '';
          hp = at >= 0 ? decoded.slice(at + 1) : decoded;
        }
        var cidx = userinfo.indexOf(':');
        if (cidx >= 0) {
          obj.cipher = decodeURIComponentSafe(userinfo.slice(0, cidx));
          obj.password = decodeURIComponentSafe(userinfo.slice(cidx + 1));
        }
        obj.server = hp.split(':')[0]; obj.port = hp.split(':')[1] || ''; obj.name = name; obj.type = 'ss';
        return setFingerprint(buildNode(obj, 'uri', line));
      }
      var at2 = rest.lastIndexOf('@');
      if (at2 >= 0) {
        var user = decodeURIComponentSafe(rest.slice(0, at2));
        if (proto === 'trojan' || proto === 'hysteria2' || proto === 'hy2' || proto === 'hysteria' || proto === 'anytls') obj.password = user;
        else if (proto === 'vless' || proto === 'tuic') obj.uuid = user;
        else obj.username = user;
      }
      var hp2 = at2 >= 0 ? rest.slice(at2 + 1) : rest;
      obj.server = hp2.split(':')[0]; obj.port = hp2.split(':')[1] || ''; obj.name = name; obj.type = proto;
      applyQuery(query);
      obj.type = proto;
      obj.network = obj.network || obj.net || '';
      obj.tls = obj.tls || obj.security || '';
      return setFingerprint(buildNode(obj, 'uri', line));
    } catch (e) { return null; }
  }

  function parseSurge(text) {
    var nodes = [], inProxy = false;
    String(text || '').split(/\r?\n/).forEach(function(line){
      var rawLine = String(line || '').trim();
      if (!rawLine || /^#|^;/.test(rawLine)) return;
      if (/^\[Proxy\]/i.test(rawLine)) { inProxy = true; return; }
      if (/^\[[^\]]+\]/.test(rawLine)) { inProxy = false; return; }
      if (!inProxy && rawLine.indexOf(' = ') < 0) return;
      var eq = rawLine.indexOf('='); if (eq < 0) return;
      var name = clean(rawLine.slice(0, eq)); var rhs = clean(rawLine.slice(eq + 1));
      var parts = splitProxyParts(rhs); if (parts.length < 3) return;
      var type = clean(parts[0]).toLowerCase();
      if (type === 'socks') type = 'socks5';
      if (!REAL_PROXY_TYPES[type] || GROUP_TYPES[type]) return;
      var obj = parseKeyValueParts(parts, 3);
      obj.name = name; obj.type = type; obj.server = clean(parts[1]); obj.port = clean(parts[2]);
      if (obj['encrypt-method'] && !obj.cipher) obj.cipher = obj['encrypt-method'];
      if (obj.username && (type === 'vmess' || type === 'vless' || type === 'tuic')) obj.uuid = obj.username;
      if (obj['ws-path'] && !obj.path) obj.path = obj['ws-path'];
      if (obj['ws-headers'] && !obj.Host) {
        var mh = String(obj['ws-headers']).match(/Host\s*:\s*([^;]+)/i);
        if (mh) obj.Host = clean(mh[1]);
      }
      if (obj.ws === 'true' || obj.ws === '1') obj.network = 'ws';
      if (isRealProxyObject(obj)) nodes.push(setFingerprint(buildNode(obj, 'surge-conf', rawLine)));
    });
    return nodes;
  }
  function parseSubscription(text) {
    text = maybeDecodeBase64(text);
    var nodes = [];
    if (/proxies\s*:/i.test(text) || /^\s*-\s*name\s*:/m.test(text)) nodes = nodes.concat(parseClash(text));
    if (/\[Proxy\]/i.test(text) || /^\s*[^=\n]+\s*=\s*(?:ss|trojan|vmess|vless|hysteria2|hy2|tuic|snell|socks5|http|https)\s*,/im.test(text)) nodes = nodes.concat(parseSurge(text));
    String(text || '').split(/\r?\n/).forEach(function (line) { var n = parseURI(line); if (n) nodes.push(n); });
    return analyzeNodes(nodes);
  }
  function analyzeNodes(nodes) {
    nodes = nodes || [];
    var seen = {}, dupMap = {}, unique = [];
    nodes.forEach(function (n) { setFingerprint(n); if (!seen[n.fingerprint]) { seen[n.fingerprint] = true; unique.push(n); } else { if (!dupMap[n.fingerprint]) dupMap[n.fingerprint] = [n]; dupMap[n.fingerprint].push(n); } });
    var byP = {}, byC = {}, byCC = {}, byF = {};
    nodes.forEach(function (n) { byP[n.protocol] = (byP[n.protocol] || 0) + 1; byC[n.country] = (byC[n.country] || 0) + 1; byCC[n.countryCode] = (byCC[n.countryCode] || 0) + 1; byF[n.sourceFormat] = (byF[n.sourceFormat] || 0) + 1; });
    function toArr(o) { return Object.keys(o).map(function (k) { return { key: k, count: o[k] }; }).sort(function (a,b) { return b.count - a.count; }); }
    var dups = Object.keys(dupMap).map(function (k) { return { fingerprint: k, count: dupMap[k].length, nodes: dupMap[k] }; });
    return { summary: { total: nodes.length, unique: unique.length, duplicates: nodes.length - unique.length, protocols: Object.keys(byP).length, countries: Object.keys(byC).length }, stats: { byProtocol: toArr(byP), byCountry: toArr(byC), byCountryCode: toArr(byCC), bySourceFormat: toArr(byF) }, duplicates: dups, nodes: nodes, meta: { version: VERSION, marker: MARKER, generatedAt: nowIso() } };
  }
  function fetchURL(url) {
    if (!url) return respondJSON({ ok: false, error: 'missing url' }, 400);
    $httpClient.get({ url: url, timeout: 30, headers: { 'User-Agent': 'SubViz/' + VERSION } }, function (err, resp, data) {
      if (err) return respondJSON({ ok: false, error: String(err) }, 502);
      try { var result = parseSubscription(data || ''); result.ok = true; result.sourceUrl = url; respondJSON(result); }
      catch (e) { respondJSON({ ok: false, error: String(e && e.stack || e) }, 500); }
    });
  }
  function sampleText() {
    return 'proxies:\n' +
      '  - name: "\\ud83c\\uddf8\\ud83c\\uddecSG_1|demo"\n    type: trojan\n    server: ppg-sg.example.com\n    port: 443\n    network: ws\n    tls: true\n' +
      '  - name: "\\ud83c\\uddfa\\ud83c\\uddf8US_1|demo"\n    type: vless\n    server: 104.19.1.1\n    port: 443\n    network: ws\n    tls: true\n' +
      '  - name: "SE_1 demo"\n    type: ss\n    server: 1.2.3.4\n    port: 8388\n';
  }


  function normalizeGeoResult(obj, provider, host) {
    obj = obj || {};
    provider = String(provider || '').toLowerCase();
    var ok = false, code = '', country = '', city = '', region = '', isp = '', org = '', asn = '', query = host || '';
    if (provider.indexOf('ip-api') >= 0) {
      ok = obj.status === 'success';
      code = clean(obj.countryCode || '').toUpperCase();
      country = clean(obj.country || '');
      city = clean(obj.city || '');
      region = clean(obj.regionName || '');
      isp = clean(obj.isp || '');
      org = clean(obj.org || '');
      asn = clean(obj.as || '');
      query = clean(obj.query || host || '');
    } else if (provider.indexOf('ipinfo') >= 0) {
      ok = !!(obj.ip && obj.country);
      code = clean(obj.country || '').toUpperCase();
      country = '';
      city = clean(obj.city || '');
      region = clean(obj.region || '');
      org = clean(obj.org || '');
      isp = org;
      asn = org;
      query = clean(obj.ip || host || '');
    } else if (provider.indexOf('myip') >= 0) {
      ok = !!(obj.ip && (obj.cc || obj.country));
      code = clean(obj.cc || obj.country_code || obj.countryCode || '').toUpperCase();
      country = clean(obj.country || '');
      query = clean(obj.ip || host || '');
    } else if (provider.indexOf('ip.sb') >= 0 || provider.indexOf('ipsb') >= 0) {
      ok = !!(obj.ip && (obj.country_code || obj.country));
      code = clean(obj.country_code || obj.countryCode || '').toUpperCase();
      country = clean(obj.country || '');
      city = clean(obj.city || '');
      region = clean(obj.region || '');
      isp = clean(obj.isp || obj.organization || obj.org || '');
      org = clean(obj.organization || obj.org || '');
      asn = clean((obj.asn && (obj.asn.asn || obj.asn)) || obj.as || '');
      query = clean(obj.ip || host || '');
    } else if (provider.indexOf('internal') >= 0) {
      ok = !!(obj.ip && obj.countryCode);
      code = clean(obj.countryCode || '').toUpperCase();
      country = clean(obj.country || '');
      isp = clean(obj.isp || obj.aso || '');
      org = clean(obj.org || obj.aso || '');
      asn = clean(obj.asn || '');
      query = clean(obj.ip || host || '');
    } else {
      ok = obj.success !== false && (obj.ip || obj.country_code || obj.country || obj.countryCode);
      code = clean(obj.country_code || obj.countryCode || obj.cc || '').toUpperCase();
      country = clean(obj.country || obj.country_name || '');
      city = clean(obj.city || '');
      region = clean(obj.region || obj.regionName || '');
      isp = clean((obj.connection && obj.connection.isp) || obj.isp || obj.organization || '');
      org = clean((obj.connection && obj.connection.org) || obj.org || obj.organization || '');
      asn = clean((obj.connection && obj.connection.asn) || obj.asn || obj.as || '');
      query = clean(obj.ip || obj.query || host || '');
    }
    if (!ok || !code) return null;
    var ci = COUNTRY[code] ? countryInfo(code, 'geoip', 78) : { countryCode: code, country: country || code, countrySource: 'geoip', countryConfidence: 70 };
    return { ok: true, host: host, query: query, countryCode: code, country: ci.country || country || code, countrySource: 'geoip', countryConfidence: ci.countryConfidence || 78, provider: provider, city: city, region: region, isp: isp, org: org, asn: asn };
  }
  function fallbackGeoLookup(host, reason) {
    var u = 'https://ipwho.is/' + encodeURIComponent(host) + '?lang=zh-CN';
    $httpClient.get({ url: u, timeout: 12, headers: { 'User-Agent': 'SubViz/' + VERSION } }, function (err, resp, data) {
      if (err) return respondJSON({ ok:false, host: host, error: String(err), fallbackReason: reason || '' }, 502);
      try {
        var obj = JSON.parse(data || '{}');
        var r = normalizeGeoResult(obj, 'ipwho.is', host);
        if (!r) return respondJSON({ ok:false, host: host, error: obj.message || 'geoip lookup failed', fallbackReason: reason || '' }, 502);
        return respondJSON(r);
      } catch (e) { return respondJSON({ ok:false, host: host, error: String(e), fallbackReason: reason || '' }, 500); }
    });
  }
  function geoLookup(host) {
    host = clean(host || '').replace(/^\[/, '').replace(/\]$/, '');
    if (!host) return respondJSON({ ok:false, error:'missing host' }, 400);
    var u = 'http://ip-api.com/json/' + encodeURIComponent(host) + '?lang=zh-CN&fields=status,message,country,countryCode,regionName,city,isp,org,as,query';
    $httpClient.get({ url: u, timeout: 12, headers: { 'User-Agent': 'SubViz/' + VERSION } }, function (err, resp, data) {
      if (err) return fallbackGeoLookup(host, String(err));
      try {
        var obj = JSON.parse(data || '{}');
        var r = normalizeGeoResult(obj, 'ip-api', host);
        if (!r) return fallbackGeoLookup(host, obj.message || 'ip-api failed');
        return respondJSON(r);
      } catch (e) { return fallbackGeoLookup(host, String(e)); }
    });
  }


  function isPlainIPv4(host) {
    return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(String(host || ''));
  }
  function surgeBool(v) {
    v = String(v || '').toLowerCase();
    return v === 'true' || v === '1' || v === 'yes' || v === 'on';
  }
  function surgeTLS(v) {
    v = String(v || '').toLowerCase();
    return v === 'true' || v === '1' || v === 'yes' || v === 'on' || v === 'tls' || v === 'reality';
  }
  function policyEscape(val) {
    val = String(val);
    return val.replace(/[,#\r\n]/g, function (ch) { return encodeURIComponent(ch); }).replace(/ /g, '%20');
  }
  function addParam(arr, key, val) {
    if (val === null || val === undefined || val === '') return;
    val = String(val);
    if (/[\r\n]/.test(val)) return;
    arr.push(key + '=' + policyEscape(val));
  }
  function addBoolParam(arr, key, val) {
    if (val === null || val === undefined || val === '') return;
    arr.push(key + '=' + (surgeBool(val) ? 'true' : 'false'));
  }
  function firstOf(obj, keys) {
    obj = obj || {};
    for (var i = 0; i < keys.length; i++) {
      var v = obj[keys[i]];
      if (v !== null && v !== undefined && String(v) !== '') return clean(v);
    }
    return '';
  }

  function splitProxyParts(line) {
    var out = [], cur = '', quote = '';
    line = String(line || '');
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (quote) { if (ch === quote && line[i-1] !== '\\') quote = ''; cur += ch; }
      else if (ch === '"' || ch === "'") { quote = ch; cur += ch; }
      else if (ch === ',') { out.push(clean(cur)); cur = ''; }
      else cur += ch;
    }
    if (cur || line.endsWith(',')) out.push(clean(cur));
    return out;
  }
  function parseKeyValueParts(parts, startIndex) {
    var o = {};
    for (var i = startIndex || 0; i < parts.length; i++) {
      var p = clean(parts[i]); if (!p) continue;
      var eq = p.indexOf('=');
      if (eq > 0) {
        var k = clean(p.slice(0, eq)); var v = clean(p.slice(eq + 1));
        o[k] = v;
      }
    }
    return o;
  }
  function recoverSSFromRaw(node, e) {
    e = e || {};
    var raw = String((node && (node.raw || node.rawName || node.originalName)) || e.raw || '');
    if (!raw) return e;
    try {
      if (raw[0] === '{') {
        var obj = JSON.parse(raw);
        Object.keys(obj || {}).forEach(function(k){ if (e[k] === undefined || e[k] === '') e[k] = obj[k]; });
      }
    } catch (ex) {}
    var m;
    if (!e.cipher && !e.method && !e['encrypt-method']) {
      m = raw.match(/(?:cipher|method|encrypt-method|encrypt_method)\s*[:=]\s*["']?([^,"'\n}]+)/i);
      if (m) e.cipher = clean(m[1]);
    }
    if (!e.password && !e.passwd && !e.pass) {
      m = raw.match(/(?:password|passwd|pass)\s*[:=]\s*["']?([^,"'\n}]+)/i);
      if (m) e.password = clean(m[1]);
    }
    return e;
  }
  function nodePolicyDescriptor(node) {
    node = node || {};
    var e = normalizeProxyObject(node.extra || {});
    var type = clean(node.protocol || e.type || '').toLowerCase();
    if (type === 'socks') type = 'socks5';
    if (type === 'hy2') type = 'hysteria2';
    var server = clean(node.server || e.server || e.add || e.address || e.host || '');
    var port = clean(node.port || e.port || '');
    if (!type || !server || !port) return { ok:false, error:'missing protocol/server/port' };
    var params = [], desc = '';
    var sni = firstOf(e, ['sni','servername','serverName','server-name','server_name']);
    var skip = firstOf(e, ['skip-cert-verify','skipCertVerify','allowInsecure']);
    var udp = firstOf(e, ['udp','udp-relay','udpRelay']);
    var network = clean(node.network || e.network || e.net || '');
    var host = firstOf(e, ['Host','host','ws-host']);
    var path = firstOf(e, ['path','ws-path']);
    if (type === 'ss') {
      e = recoverSSFromRaw(node, e);
      var method = firstOf(e, ['cipher','method','encrypt-method','encrypt_method']);
      var password = firstOf(e, ['password','passwd','pass']);
      if (!method || !password) return { ok:false, error:'SS 节点缺少加密方式或密码：通常是解析器没有识别该订阅格式，或该节点本身字段不完整', errorCode:'ss_missing_cipher_password' };
      desc = ['ss', server, port].join(', ');
      addParam(params, 'encrypt-method', method);
      addParam(params, 'password', password);
      if (udp) addBoolParam(params, 'udp-relay', udp);
      if (/^ws$/i.test(network) || /v2ray-plugin|gost-plugin/i.test(firstOf(e, ['plugin']))) {
        addParam(params, 'ws', 'true');
        addParam(params, 'ws-path', path || '/');
        if (host) addParam(params, 'ws-headers', 'Host:' + host);
        if (sni) addParam(params, 'sni', sni);
        if (skip) addBoolParam(params, 'skip-cert-verify', skip);
      }
    } else if (type === 'trojan') {
      var tpw = firstOf(e, ['password','passwd']);
      if (!tpw) return { ok:false, error:'trojan missing password' };
      desc = ['trojan', server, port].join(', ');
      addParam(params, 'password', tpw);
      if (sni) addParam(params, 'sni', sni);
      if (skip) addBoolParam(params, 'skip-cert-verify', skip);
      if (udp) addBoolParam(params, 'udp-relay', udp);
      if (/^ws$/i.test(network)) {
        addParam(params, 'ws', 'true');
        addParam(params, 'ws-path', path || '/');
        if (host) addParam(params, 'ws-headers', 'Host:' + host);
      }
    } else if (type === 'vmess') {
      var uuid = firstOf(e, ['uuid','id','username']);
      if (!uuid) return { ok:false, error:'vmess missing uuid' };
      desc = ['vmess', server, port].join(', ');
      addParam(params, 'username', uuid);
      var vmCipher = firstOf(e, ['cipher','security','scy']);
      if (!vmCipher || String(vmCipher).toLowerCase() === 'auto') addParam(params, 'encrypt-method', 'aes-128-gcm');
      else addParam(params, 'encrypt-method', vmCipher);
      var aid = firstOf(e, ['alterId','alterid','aid']);
      if (aid && aid !== '0') {
        addParam(params, 'alter-id', aid);
        addParam(params, 'vmess-aead', 'false');
      } else {
        addParam(params, 'vmess-aead', 'true');
      }
      if (surgeTLS(firstOf(e, ['tls','security']))) addParam(params, 'tls', 'true');
      if (sni) addParam(params, 'sni', sni);
      if (skip) addBoolParam(params, 'skip-cert-verify', skip);
      if (/^ws$/i.test(network)) {
        addParam(params, 'ws', 'true');
        addParam(params, 'ws-path', path || '/');
        if (host) addParam(params, 'ws-headers', 'Host:' + host);
      }
      if (udp) addBoolParam(params, 'udp-relay', udp);
    } else if (type === 'vless') {
      var vuuid = firstOf(e, ['uuid','id','username']);
      if (!vuuid) return { ok:false, error:'vless missing uuid' };
      desc = ['vless', server, port].join(', ');
      addParam(params, 'username', vuuid);
      if (surgeTLS(firstOf(e, ['tls','security']))) addParam(params, 'tls', 'true');
      if (sni) addParam(params, 'sni', sni);
      if (skip) addBoolParam(params, 'skip-cert-verify', skip);
      if (/^ws$/i.test(network)) {
        addParam(params, 'ws', 'true');
        addParam(params, 'ws-path', path || '/');
        if (host) addParam(params, 'ws-headers', 'Host:' + host);
      }
      var flow = firstOf(e, ['flow','vless-flow']);
      if (flow) addParam(params, 'vless-flow', flow);
      var pbk = firstOf(e, ['reality-public-key','public-key','publicKey','pbk']);
      var sid = firstOf(e, ['reality-short-id','short-id','shortId','sid']);
      var fp = firstOf(e, ['client-fingerprint','fingerprint','fp']);
      if (pbk) addParam(params, 'reality-public-key', pbk);
      if (sid) addParam(params, 'reality-short-id', sid);
      if (fp) addParam(params, 'client-fingerprint', fp);
      if (udp) addBoolParam(params, 'udp-relay', udp);
    } else if (type === 'tuic') {
      desc = ['tuic', server, port].join(', ');
      var token = firstOf(e, ['token']);
      if (token) addParam(params, 'token', token);
      else {
        addParam(params, 'uuid', firstOf(e, ['uuid','id']));
        addParam(params, 'password', firstOf(e, ['password','passwd']));
      }
      if (sni) addParam(params, 'sni', sni);
      if (skip) addBoolParam(params, 'skip-cert-verify', skip);
      addParam(params, 'alpn', firstOf(e, ['alpn']) || 'h3');
    } else if (type === 'hysteria2' || type === 'hysteria') {
      desc = ['hysteria2', server, port].join(', ');
      addParam(params, 'password', firstOf(e, ['password','auth','auth-str','auth_str']));
      if (sni) addParam(params, 'sni', sni);
      if (skip || firstOf(e, ['insecure'])) addBoolParam(params, 'skip-cert-verify', skip || firstOf(e, ['insecure']));
      if (udp) addBoolParam(params, 'udp-relay', udp);
      addParam(params, 'download-bandwidth', firstOf(e, ['download-bandwidth','downloadBandwidth','down']));
      addParam(params, 'upload-bandwidth', firstOf(e, ['upload-bandwidth','uploadBandwidth','up']));
      addParam(params, 'obfs', firstOf(e, ['obfs']));
      addParam(params, 'obfs-password', firstOf(e, ['obfs-password','obfsPassword']));
    } else if (type === 'anytls') {
      desc = ['anytls', server, port].join(', ');
      addParam(params, 'password', firstOf(e, ['password','passwd']));
      if (sni) addParam(params, 'sni', sni);
      if (skip) addBoolParam(params, 'skip-cert-verify', skip);
      if (udp) addBoolParam(params, 'udp-relay', udp);
    } else if (type === 'snell') {
      desc = ['snell', server, port].join(', ');
      addParam(params, 'psk', firstOf(e, ['psk','password']));
      addParam(params, 'version', firstOf(e, ['version']) || '4');
      if (udp) addBoolParam(params, 'udp-relay', udp);
    } else if (type === 'socks5' || type === 'http' || type === 'https') {
      desc = [type, server, port].join(', ');
      addParam(params, 'username', firstOf(e, ['username','user']));
      addParam(params, 'password', firstOf(e, ['password','pass']));
      if (skip) addBoolParam(params, 'skip-cert-verify', skip);
      if (sni) addParam(params, 'sni', sni);
    } else {
      return { ok:false, error:'不支持该协议进行落地检测：' + type, errorCode:'unsupported_protocol', protocol:type };
    }
    if (params.length) desc += ', ' + params.join(', ');
    var descriptors = [];
    function addDescriptorVariant(d) { if (d && descriptors.indexOf(d) < 0) descriptors.push(d); }
    function setDescriptorParam(d, key, val) {
      var escaped = policyEscape(val);
      var re = new RegExp('(,\\s*' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=)[^,]+');
      if (re.test(d)) return d.replace(re, '$1' + escaped);
      return d + ', ' + key + '=' + escaped;
    }
    addDescriptorVariant(desc);
    if (type === 'vmess') {
      addDescriptorVariant(setDescriptorParam(desc, 'vmess-aead', 'true'));
      addDescriptorVariant(setDescriptorParam(desc, 'vmess-aead', 'false'));
      if (host && sni && String(host).toLowerCase() !== String(sni).toLowerCase()) {
        addDescriptorVariant(setDescriptorParam(setDescriptorParam(desc, 'sni', host), 'vmess-aead', 'true'));
        addDescriptorVariant(setDescriptorParam(setDescriptorParam(desc, 'sni', host), 'vmess-aead', 'false'));
      }
      if (!sni && host) addDescriptorVariant(setDescriptorParam(desc, 'sni', host));
    }
    var namedDescriptors = descriptors.map(function (d) { return 'SubVizTemp = ' + d; });
    return { ok:true, descriptor: descriptors[0], namedDescriptor: namedDescriptors[0], descriptors: descriptors, namedDescriptors: namedDescriptors, protocol:type, server:server, port:port };
  }
  function landingApiName(url) {
    url = String(url || '').toLowerCase();
    if (url.indexOf('ip-api.com') >= 0) return 'ip-api';
    if (url.indexOf('ipwho.is') >= 0) return 'ipwho.is';
    if (url.indexOf('api.ip.sb') >= 0 || url.indexOf('ip.sb') >= 0) return 'ip.sb';
    if (url.indexOf('ipinfo.io') >= 0) return 'ipinfo.io';
    if (url.indexOf('api.myip.com') >= 0) return 'api.myip.com';
    if (url.indexOf('checkip.amazonaws.com') >= 0) return 'internal-checkip';
    return 'custom';
  }
  function splitLandingApis(s) {
    return String(s || '').split(/[\n|,]+/).map(function (x) { return clean(x); }).filter(Boolean);
  }
  function landingDefaultApis() {
    return [
      'https://ipwho.is/?lang=zh-CN',
      'http://ip-api.com/json?lang=zh-CN&fields=status,message,country,countryCode,regionName,city,isp,org,as,query',
      'https://api.ip.sb/geoip',
      'https://ipinfo.io/json',
      'https://api.myip.com'
    ];
  }
  function landingTimeoutSeconds() {
    var n = Number(getQuery(getURL(), 'timeout') || 5000);
    if (!n || n < 1) n = 5000;
    if (n >= 1000) n = n / 1000;
    if (n < 2) n = 2;
    if (n > 30) n = 30;
    return n;
  }
  function getBodyIP(data) {
    var t = clean(String(data || ''));
    try {
      var obj = JSON.parse(t);
      return clean(obj.ip || obj.query || obj.origin || obj.address || '');
    } catch (e) {}
    var m = t.match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/);
    return m ? m[0] : '';
  }
  function internalGeoFromIP(ip, provider) {
    if (typeof $utils === 'undefined' || typeof $utils.geoip === 'undefined') return null;
    var code = clean($utils.geoip(ip) || '').toUpperCase();
    if (!code) return null;
    var aso = '';
    var asn = '';
    try { if (typeof $utils.ipaso !== 'undefined') aso = clean($utils.ipaso(ip) || ''); } catch (e) {}
    try { if (typeof $utils.ipasn !== 'undefined') asn = clean($utils.ipasn(ip) || ''); } catch (e) {}
    return normalizeGeoResult({ ip: ip, countryCode: code, aso: aso, asn: asn }, provider || 'internal', ip);
  }
  function getObjPath(o, path) {
    var cur = o || {}, parts = String(path || '').split('.');
    for (var i = 0; i < parts.length; i++) {
      if (!parts[i]) continue;
      cur = cur[parts[i]];
      if (cur === undefined || cur === null) return '';
    }
    return cur;
  }
  function formatLandingName(format, proxy, api) {
    if (!format) return '';
    return String(format).replace(/\{\{\s*([^}]+?)\s*\}\}/g, function (_, key) {
      key = String(key || '').trim();
      if (key.indexOf('api.') === 0) return clean(getObjPath(api, key.slice(4)));
      if (key.indexOf('proxy.') === 0) return clean(getObjPath(proxy, key.slice(6)));
      return '';
    }).trim();
  }
  function landingLookup() {
    var body = ($request && $request.body) || '';
    var node = null;
    try { node = JSON.parse(body || '{}'); } catch (e) { return respondJSON({ ok:false, error:'节点数据不是有效 JSON：'+String(e), errorCode:'invalid_node_json' }, 400); }
    var built = nodePolicyDescriptor(node);
    if (!built.ok) return respondJSON(built, 400);
    var internal = getQuery(getURL(), 'internal') === '1' || getQuery(getURL(), 'internal') === 'true';
    var timeout = landingTimeoutSeconds();
    var retries = Math.max(0, Math.min(3, parseInt(getQuery(getURL(), 'retries') || '1', 10) || 0));
    var retryDelay = Math.max(0, Math.min(5000, parseInt(getQuery(getURL(), 'retry_delay') || '800', 10) || 0));
    var format = getQuery(getURL(), 'format') || '';
    var customApis = splitLandingApis(getQuery(getURL(), 'api'));
    var apis = internal ? (customApis.length ? customApis : ['http://checkip.amazonaws.com']) : (customApis.length ? customApis : landingDefaultApis());
    var errors = [];
    var attemptNo = 0;
    var startedAll = Date.now();
    var descriptorList = [].concat(built.descriptors || [built.descriptor], built.namedDescriptors || [built.namedDescriptor]).filter(function (x, i, a) { return x && a.indexOf(x) === i; });
    function tryAPI(apiIndex, retryNo, descIndex) {
      descIndex = descIndex || 0;
      if (apiIndex >= apis.length) return respondJSON({ ok:false, error:'落地查询失败：所有备用接口或临时代理尝试均失败', errorCode:'landing_lookup_failed', errors: errors.slice(-10), attempts: attemptNo, descriptorProtocol: built.protocol, server: built.server, port: built.port, descriptor: built.descriptor }, 502);
      if (descIndex >= descriptorList.length) return tryAPI(apiIndex + 1, 0, 0);
      var api = apis[apiIndex];
      var provider = internal ? 'internal' : landingApiName(api);
      var started = Date.now();
      var descUse = descriptorList[descIndex];
      var opt = { url: api, timeout: timeout, insecure: true, headers: { 'User-Agent': 'SubViz/' + VERSION }, 'policy-descriptor': descUse, node: descUse };
      attemptNo++;
      $httpClient.get(opt, function (err, resp, data) {
        var status = Number((resp && (resp.status || resp.statusCode)) || 0);
        if (err || (status && status >= 400)) {
          errors.push({ api: api, provider: provider, descriptorMode: descIndex === 0 ? 'raw' : 'named', error: String(err || ('HTTP ' + status)), retry: retryNo });
          if (retryNo < retries) return setTimeout(function () { tryAPI(apiIndex, retryNo + 1, descIndex); }, retryDelay || 0);
          return tryAPI(apiIndex, 0, descIndex + 1);
        }
        try {
          var r = null, rawObj = null;
          if (internal) {
            var ip = getBodyIP(data);
            r = internalGeoFromIP(ip, provider);
            if (!r) errors.push({ api: api, provider: provider, descriptorMode: descIndex === 0 ? 'raw' : 'named', error: '内部 GEOIP 查询失败：当前环境可能不支持 $utils.geoip 或没有 GEOIP 数据库', ip: ip });
          } else {
            try { rawObj = JSON.parse(data || '{}'); } catch (e1) { rawObj = { ip: getBodyIP(data) }; }
            r = normalizeGeoResult(rawObj, provider, built.server);
            if (!r) errors.push({ api: api, provider: provider, descriptorMode: descIndex === 0 ? 'raw' : 'named', error: (rawObj && (rawObj.message || rawObj.error)) || '查询接口返回内容解析失败', raw: String(data || '').slice(0, 160) });
          }
          if (!r) {
            if (retryNo < retries) return setTimeout(function () { tryAPI(apiIndex, retryNo + 1, descIndex); }, retryDelay || 0);
            return tryAPI(apiIndex, 0, descIndex + 1);
          }
          r.landing = true;
          r.landingIP = r.query;
          r.entryServer = built.server;
          r.entryPort = built.port;
          r.descriptorProtocol = built.protocol;
          r.usedAPI = api;
          r.landingAPI = api;
          r.attempts = attemptNo;
          r.latency = Date.now() - started;
          r.totalLatency = Date.now() - startedAll;
          r.format = format;
          r.formattedName = formatLandingName(format, node, r);
          return respondJSON(r);
        } catch (e) {
          errors.push({ api: api, provider: provider, descriptorMode: descIndex === 0 ? 'raw' : 'named', error: String(e), raw: String(data || '').slice(0, 160) });
          if (retryNo < retries) return setTimeout(function () { tryAPI(apiIndex, retryNo + 1, descIndex); }, retryDelay || 0);
          return tryAPI(apiIndex, 0, descIndex + 1);
        }
      });
    }
    tryAPI(0, 0);
  }



  function availabilityStatusOK(status, expr) {
    status = Number(status || 0);
    expr = clean(expr || '204');
    if (!expr) expr = '204';
    var parts = expr.split(/[|,，\s]+/).filter(Boolean);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (/^\d{3}$/.test(p) && status === Number(p)) return true;
      if (/^\dxx$/i.test(p) && Math.floor(status / 100) === Number(p[0])) return true;
      var m = p.match(/^(\d{3})-(\d{3})$/);
      if (m && status >= Number(m[1]) && status <= Number(m[2])) return true;
    }
    return false;
  }
  function availabilityLookup() {
    var body = ($request && $request.body) || '';
    var node = null;
    try { node = JSON.parse(body || '{}'); } catch (e) { return respondJSON({ ok:false, alive:false, error:'节点数据不是有效 JSON：'+String(e), errorCode:'invalid_node_json' }, 400); }
    var built = nodePolicyDescriptor(node);
    if (!built.ok) return respondJSON({ ok:false, alive:false, error: built.error || '当前协议不支持测活', errorCode: built.errorCode || 'descriptor_failed', protocol: built.protocol || node.protocol }, 400);
    var url = getQuery(getURL(), 'url') || 'http://connectivitycheck.platform.hicloud.com/generate_204';
    var statusExpr = getQuery(getURL(), 'status') || '204';
    var timeout = Number(getQuery(getURL(), 'timeout') || 3000);
    if (!timeout || timeout < 200) timeout = 3000;
    if (timeout > 30000) timeout = 30000;
    var retries = Math.max(0, Math.min(3, parseInt(getQuery(getURL(), 'retries') || '1', 10) || 0));
    var retryDelay = Math.max(0, Math.min(5000, parseInt(getQuery(getURL(), 'retry_delay') || '1000', 10) || 0));
    var startedAll = Date.now();
    var attempts = 0;
    var descriptors = [].concat(built.descriptors || [built.descriptor], built.namedDescriptors || [built.namedDescriptor]).filter(function (x, i, a) { return x && a.indexOf(x) === i; });
    function tryOnce(descIndex, retryNo) {
      descIndex = descIndex || 0;
      if (descIndex >= descriptors.length) return respondJSON({ ok:false, alive:false, error:'Surge 临时代理策略创建失败：该节点参数可能不兼容', errorCode:'policy_descriptor_failed', attempts: attempts, latency: Date.now()-startedAll, protocol: built.protocol, server: built.server, port: built.port }, 502);
      attempts++;
      var started = Date.now();
      var descUse = descriptors[descIndex];
      var opt = { url: url, timeout: timeout/1000, insecure: true, headers: { 'User-Agent': 'SubViz/' + VERSION }, 'policy-descriptor': descUse, node: descUse };
      $httpClient.get(opt, function (err, resp, data) {
        var latency = Date.now() - started;
        var totalLatency = Date.now() - startedAll;
        var status = Number((resp && (resp.status || resp.statusCode)) || 0);
        if (!err && availabilityStatusOK(status, statusExpr)) return respondJSON({ ok:true, alive:true, status:status, latency:latency, totalLatency:totalLatency, attempts:attempts, protocol:built.protocol, server:built.server, port:built.port, url:url });
        var msg = err ? String(err) : ('状态码不匹配：返回 '+status+'，期望 '+statusExpr);
        if (retryNo < retries) return setTimeout(function(){ tryOnce(descIndex, retryNo+1); }, retryDelay || 0);
        if (descIndex + 1 < descriptors.length) return tryOnce(descIndex+1, 0);
        return respondJSON({ ok:false, alive:false, error: msg, status:status, expected:statusExpr, latency:latency, totalLatency:totalLatency, attempts:attempts, protocol:built.protocol, server:built.server, port:built.port, url:url }, 502);
      });
    }
    tryOnce(0,0);
  }
  var CLIENT_JS = "var DATA=null;\nvar GEO_CACHE={};\nvar GEO_RUNNING=false;\nvar SELECTED={};\nfunction selectedCount(){return Object.keys(SELECTED).filter(function(k){return SELECTED[k]}).length}\nfunction selectedNodes(){if(!DATA)return[];return (DATA.nodes||[]).filter(function(n){return n&&n._sid&&SELECTED[n._sid]})}\nfunction operationNodes(action){var a=selectedNodes();if(!a.length){st('请先勾选要'+action+'的节点，或点击“全选当前”。');return []}return a}\nfunction updateSelectUI(){var c=selectedCount();var el=$('selCount');if(el)el.textContent='已选 '+c+' 个'}\nfunction toggleSelect(sid,checked){if(!sid)return;if(checked)SELECTED[sid]=1;else delete SELECTED[sid];updateSelectUI()}\nwindow.toggleSelect=toggleSelect;\nfunction selectCurrent(){var a=filtered();a.forEach(function(n){if(n._sid)SELECTED[n._sid]=1});apply();st('已全选当前筛选结果：'+a.length+' 个节点')}\nfunction invertCurrent(){filtered().forEach(function(n){if(!n._sid)return;if(SELECTED[n._sid])delete SELECTED[n._sid];else SELECTED[n._sid]=1});apply();st('已反选当前筛选结果')}\nfunction clearSelected(){SELECTED={};apply();st('已清空选择')}\nwindow.selectCurrent=selectCurrent;window.invertCurrent=invertCurrent;window.clearSelected=clearSelected;\nfunction $(id){return document.getElementById(id)}\nfunction esc(s){return String(s==null?'':s).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]||c})}\nfunction st(s){$('status').textContent=s}\nfunction zhErr(s){s=String(s||'');var raw=s;var lower=s.toLowerCase();if(!s)return '';if(s.indexOf('不支持该协议')>=0||lower.indexOf('unsupported protocol')>=0)return '不支持该协议进行落地检测';if(s.indexOf('落地查询失败')>=0||lower.indexOf('landing lookup failed')>=0)return '落地查询失败：所有备用接口或临时代理尝试均失败';if(lower.indexOf('timeout')>=0||s.indexOf('超时')>=0)return '请求超时：节点不可用、速度过慢，或查询接口被阻断';if(lower.indexOf('websocket closed')>=0)return 'WebSocket 被服务端关闭：通常是 Host/SNI/path 不匹配，或 CDN/服务端拒绝握手';if(lower.indexOf('ss missing cipher')>=0||s.indexOf('SS 节点缺少')>=0)return 'SS 节点缺少加密方式或密码：多半是解析没有识别 cipher/password';if(lower.indexOf('policy descriptor')>=0)return 'Surge 临时代理策略创建失败：该节点参数可能不兼容';if(lower.indexOf('http 403')>=0)return '查询接口返回 403：接口拒绝访问，或该节点出口被限制';var m=s.match(/HTTP\\s*(\\d+)/i);if(m)return '查询接口返回 HTTP '+m[1];if(s.indexOf('节点数据不是有效 JSON')>=0||lower.indexOf('invalid node json')>=0)return '节点数据格式异常';if(s.indexOf('内部 GEOIP')>=0||lower.indexOf('internal geoip')>=0)return '内部 GEOIP 查询失败：当前 Surge 可能不支持 $utils.geoip 或没有 GEOIP 数据库';if(s.indexOf('查询接口返回内容解析失败')>=0||lower.indexOf('parse failed')>=0)return '查询接口返回内容解析失败';if(lower==='failed')return '检测失败';return raw}\nfunction bar(it,max){return '<div class=\"bar\"><div>'+esc(it.key)+'</div><div class=\"track\"><div class=\"fill\" style=\"width:'+(max?Math.round(it.count/max*100):0)+'%\"></div></div><b>'+it.count+'</b></div>'}\nfunction uniq(nodes){var m={},a=[];(nodes||[]).forEach(function(n){var k=n.fingerprint||[n.protocol,n.server,n.port,n.network,n.tls].join('|').toLowerCase();if(!m[k]){m[k]=1;a.push(n)}});return a}\nfunction addCount(m,k){k=k||'未知';m[k]=(m[k]||0)+1}\nfunction toArr(m){return Object.keys(m).map(function(k){return{key:k,count:m[k]}}).sort(function(a,b){return b.count-a.count})}\nfunction recalc(d){var ns=d.nodes||[],byP={},byC={},byCC={},byF={},seen={},dups=0;ns.forEach(function(n){addCount(byP,n.protocol);addCount(byC,n.country);addCount(byCC,n.countryCode||'UN');addCount(byF,n.sourceFormat||'unknown');var fp=n.fingerprint||[n.protocol,n.server,n.port,n.network,n.tls].join('|').toLowerCase();if(seen[fp])dups++;else seen[fp]=1});d.summary={total:ns.length,unique:Object.keys(seen).length,duplicates:dups,protocols:Object.keys(byP).length,countries:Object.keys(byC).length};d.stats={byProtocol:toArr(byP),byCountry:toArr(byC),byCountryCode:toArr(byCC),bySourceFormat:toArr(byF)};return d}\nfunction render(d){var isNew=(d!==DATA);if(isNew)SELECTED={};(d.nodes||[]).forEach(function(n,i){if(!n._sid)n._sid='sv_'+i;if(!n.originalName)n.originalName=n.name});DATA=recalc(d);var s=DATA.summary||{};var labels=['总节点','唯一节点','重复节点','协议数','国家/地区'];var vals=[s.total,s.unique,s.duplicates,s.protocols,s.countries];$('cards').innerHTML=labels.map(function(l,i){return '<div class=\"stat\"><span class=\"muted\">'+l+'</span><b>'+(vals[i]||0)+'</b></div>'}).join('');var p=DATA.stats.byProtocol||[],c=DATA.stats.byCountry||[];$('protocols').innerHTML=p.length?p.map(function(x){return bar(x,p[0].count)}).join(''):'暂无数据';$('countries').innerHTML=c.length?c.slice(0,30).map(function(x){return bar(x,c[0].count)}).join(''):'暂无数据';fillSelect('pf',p);fillSelect('cf',c);apply()}\nfunction fillSelect(id,arr){var old=$(id).value;$(id).innerHTML='<option value=\"\">'+(id=='pf'?'全部协议':'全部地区')+'</option>'+(arr||[]).map(function(x){return '<option value=\"'+esc(x.key)+'\">'+esc(x.key)+' ('+x.count+')</option>'}).join('');$(id).value=old}\nfunction filtered(){if(!DATA)return[];var ns=$('unique').checked?uniq(DATA.nodes):DATA.nodes;var q=$('q').value.toLowerCase(),pf=$('pf').value,cf=$('cf').value;return ns.filter(function(n){return(!pf||n.protocol==pf)&&(!cf||n.country==cf)&&(!q||(String(n.name)+String(n.server)+String(n.country)+String(n.protocol)+String(n.port)).toLowerCase().indexOf(q)>=0)})}\nfunction meta(n){var a=[];if(n.country)a.push(n.country);if(n.network)a.push(n.network);if(String(n.tls)==='true')a.push('TLS');if(n.geoCity)a.push(n.geoCity);if(n.aliveOK===true)a.push('可用 '+n.aliveLatency+'ms');else if(n.aliveOK===false)a.push('不可用:'+aliveErr(n.aliveError));if(n.landingError)a.push('失败:'+zhErr(n.landingError));return a.join(' · ')}\nfunction apply(){var a=filtered(),sc=selectedCount();$('count').textContent='当前显示 '+a.length+' / '+((DATA&&DATA.summary&&DATA.summary.total)||0)+' 个节点，已选 '+sc+' 个';updateSelectUI();$('tbody').innerHTML=a.map(function(n,i){var chk=SELECTED[n._sid]?' checked':'';return '<tr><td><input type=\"checkbox\" class=\"rowchk\" data-sid=\"'+esc(n._sid||'')+'\" onchange=\"window.toggleSelect&&window.toggleSelect(this.dataset.sid,this.checked)\"'+chk+'></td><td>'+(i+1)+'</td><td>'+esc(n.name)+'<div class=\"small\">'+esc(meta(n))+'</div></td><td><span class=\"tag\">'+esc(n.protocol)+'</span></td><td>'+esc(n.server)+'</td><td>'+esc(n.port)+'</td></tr>'}).join('')||'<tr><td colspan=\"6\" class=\"muted\">暂无数据</td></tr>'}\nfunction loadJSON(url,opt){return fetch(url,opt).then(function(r){return r.text()}).then(function(t){try{return JSON.parse(t)}catch(e){throw new Error(t.slice(0,200)||e)}})}\nfunction analyzeURL(){var u=$('url').value.trim();if(!u){st('请先输入订阅 URL');return}st('按钮已触发，正在拉取分析…');loadJSON('/api/analyze?url='+encodeURIComponent(u)+'&t='+Date.now()).then(function(d){if(!d.ok)throw new Error(d.error||'error');render(d);st('分析完成：'+d.summary.total+' 个节点')}).catch(function(e){st('失败：'+e.message)})}\nfunction sample(){st('正在载入演示数据…');loadJSON('/api/sample?t='+Date.now()).then(render).then(function(){st('演示数据已加载')}).catch(function(e){st('失败：'+e.message)})}\nfunction analyzeText(){var t=$('raw').value;if(!t.trim()){st('请先粘贴订阅内容');return}st('正在分析粘贴内容…');loadJSON('/api/analyze-text?t='+Date.now(),{method:'POST',body:t,headers:{'Content-Type':'text/plain;charset=utf-8'}}).then(function(d){if(!d.ok)throw new Error(d.error||'error');render(d);st('分析完成：'+d.summary.total+' 个节点')}).catch(function(e){st('失败：'+e.message)})}\nfunction flag(cc){cc=String(cc||'').toUpperCase();if(cc==='CDN')return '\\uD83D\\uDD00';if(!/^[A-Z]{2}$/.test(cc))return '\\uD83C\\uDFC1';return cc.replace(/./g,function(ch){return String.fromCodePoint(127397+ch.charCodeAt(0))})}\nfunction suffix(n,i){var nm=String(n.name||'');var m=nm.match(/[-_ ]([A-Fa-f0-9]{4,10})\\b/);if(m)return m[1].toUpperCase();var base=String(n.server||'')+':'+String(n.port||'')+':'+i;var h=0;for(var x=0;x<base.length;x++){h=((h<<5)-h)+base.charCodeAt(x);h|=0}return ('00000000'+(h>>>0).toString(16).toUpperCase()).slice(-8)}\nfunction isUnknown(n){return !n.countryCode||n.countryCode==='UN'||n.country==='未知'||n.countrySource==='none'}\nfunction applyGeoToServer(server,geo){(DATA.nodes||[]).forEach(function(n,idx){if(n.server!==server||!isUnknown(n)||!geo||!geo.countryCode)return;n.countryCode=geo.countryCode;n.country=geo.country||n.country;n.countrySource='geoip';n.countryConfidence=geo.countryConfidence||78;n.geoProvider=geo.provider;n.geoQuery=geo.query;n.geoCity=geo.city||'';n.geoRegion=geo.region||'';n.geoISP=geo.isp||'';n.geoASN=geo.asn||'';n.name=flag(n.countryCode)+' '+n.country+'-'+suffix(n,idx)})}\nfunction applyGeoToTargets(server,geo,targets){(targets||[]).forEach(function(n,idx){if(n.server!==server||!isUnknown(n)||!geo||!geo.countryCode)return;n.countryCode=geo.countryCode;n.country=geo.country||n.country;n.countrySource='geoip';n.countryConfidence=geo.countryConfidence||78;n.geoProvider=geo.provider;n.geoQuery=geo.query;n.geoCity=geo.city||'';n.geoRegion=geo.region||'';n.geoISP=geo.isp||'';n.geoASN=geo.asn||'';n.name=flag(n.countryCode)+' '+n.country+'-'+suffix(n,idx);if(n.extra)n.extra.name=n.name})}\nfunction geoFill(){if(!DATA){st('请先拉取或分析订阅');return}if(GEO_RUNNING){st('已有 GeoIP / 落地检测任务正在运行；如果刚才点过落地检测没继续，请刷新页面后重试。');return}var targets=operationNodes('GeoIP 补全');if(!targets.length)return;var set={},servers=[];targets.forEach(function(n){if(isUnknown(n)&&n.server&&!set[n.server]){set[n.server]=1;servers.push(n.server)}});if(!servers.length){st('选中节点里没有需要 GeoIP 补全的未知节点');return}GEO_RUNNING=true;var total=servers.length,done=0,ok=0,fail=0,idx=0,con=3;st('开始对选中节点做在线 IP 归属补全：0 / '+total);function next(){while(con>0&&idx<servers.length){(function(sv){idx++;con--;var p=GEO_CACHE[sv]?Promise.resolve(GEO_CACHE[sv]):loadJSON('/api/geoip?host='+encodeURIComponent(sv)+'&t='+Date.now()).then(function(g){GEO_CACHE[sv]=g;return g});p.then(function(g){if(g&&g.ok&&g.countryCode){applyGeoToTargets(sv,g,targets);ok++}else fail++}).catch(function(){fail++}).then(function(){done++;con++;if(done%5===0||done===total){recalc(DATA);apply();st('在线 IP 归属补全：'+done+' / '+total+'，成功 '+ok+'，失败 '+fail)}if(done>=total){GEO_RUNNING=false;render(DATA);st('补全完成：成功 '+ok+'，失败 '+fail+'。已将选中的未知节点按 GeoIP 重命名。')}else next()})})(servers[idx])}}next()}\nvar DEFAULT_DROP='linuxdo,History,OpenRay,Telegram,TG,GitHub,Github,DeltaKroneckerGithub,WangCai,官网,官方,网站,主页,频道,群组,订阅,免费,公益,剩余,流量,到期,过期,有效期,套餐,重置,expire,expiry,traffic,reset,GB,MB,TB,官网地址,永久官网,域名,网址,节点,机场,订阅链接,欢迎,加入,关注';\nvar DEFAULT_KEEP='倍率,原生,机房,商宽,家宽,住宅,广播,专线,中转,直连,隧道,IEPL,IPLC,BGP,CN2,CMI,9929,4837,0.2x,0.5x,1x,2x,3x,5x,10x';\nfunction codeName(n){var cc=String(n.countryCode||'').toUpperCase();var cn=String(n.country||'');if(!cc||cc==='UN'){cc='UN';cn=cn&&cn!=='未知'?cn:'未知'}if(cc==='CDN'){cn='中转'}return {cc:cc,cn:cn,key:cc+'|'+cn}}\nfunction padNum(n,w){n=String(n||'');while(n.length<w)n='0'+n;return n}\nfunction splitRules(v,def){v=String(v||'').trim();if(!v)v=def||'';return v.split(/[\\n,，;；]+/).map(function(x){return String(x||'').trim()}).filter(Boolean)}\nfunction escRe(s){return String(s||'').replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')}\nfunction ruleValue(id,def){var el=$(id);return el?el.value:def}\nfunction cleanupOptions(){return {drop:splitRules(ruleValue('dropWords',DEFAULT_DROP),DEFAULT_DROP),keep:splitRules(ruleValue('keepTags',DEFAULT_KEEP),DEFAULT_KEEP),tpl:String(ruleValue('nameTpl','{flag} {code}-{country} {index} {tags}')||'{flag} {code}-{country} {index} {tags}')}}\nfunction stripNoise(t,drop){t=String(t||'');t=t.replace(/https?:\\/\\/\\S+/ig,' ');t=t.replace(/www\\.[^\\s|]+/ig,' ');t=t.replace(/[A-Za-z0-9._%+-]+\\.[A-Za-z]{2,}(?:[\\/\\w?=&%.:+-]*)?/g,' ');t=t.replace(/@\\w+/g,' ');t=t.replace(/[\\uD83C-\\uDBFF][\\uDC00-\\uDFFF]/g,' ');(drop||[]).forEach(function(w){if(!w)return;var re=new RegExp(escRe(w),'ig');t=t.replace(re,' ')});return t.replace(/[\\[\\]【】()（）{}<>《》]/g,' ').replace(/[|｜/\\\\]+/g,' ').replace(/[_-]+/g,' ').replace(/\\s+/g,' ').trim()}\nfunction uniqTags(arr){var m={},out=[];arr.forEach(function(x){x=String(x||'').trim();if(!x||m[x.toLowerCase()])return;m[x.toLowerCase()]=1;out.push(x)});return out}\nfunction normalizeRate(r){r=String(r||'').replace(/倍率\\s*[:：=]?\\s*/,'').replace(/\\s+/g,'').replace(/×/g,'x').replace(/倍$/,'x').replace(/X$/,'x');if(/^\\d+(?:\\.\\d+)?$/.test(r))r=r+'x';return /^\\d+(?:\\.\\d+)?x$/.test(r)?r:''}\nfunction extractNameTags(n,opt){opt=opt||cleanupOptions();var e=n.extra||{};var src=[n.originalName,n.rawName,n.name,e.name,e.rate,e.ratio,e['倍率'],e.tag,e.label,e.remark,e.remarks,e.note,e.sni,e.servername,e.host,e.Host,e.path,e.plugin,e.mode].join(' ');var raw=String(src||''),txt=stripNoise(raw,opt.drop);var tags=[];var ms=raw.match(/(?:\\d+(?:\\.\\d+)?\\s*(?:x|X|×|倍)|倍率\\s*[:：=]?\\s*\\d+(?:\\.\\d+)?)/g)||[];ms.forEach(function(r){r=normalizeRate(r);if(r)tags.push(r)});(opt.keep||[]).forEach(function(k){var kk=String(k||'').trim();if(!kk)return;if(/^\\d+(?:\\.\\d+)?x$/i.test(kk)){if(new RegExp(escRe(kk),'i').test(raw))tags.push(kk.toLowerCase());return}var re=new RegExp(escRe(kk),'i');if(re.test(txt)||re.test(raw))tags.push(kk.toUpperCase()===kk?kk:kk)});return uniqTags(tags)}\nfunction templateCleanName(n,seq,width,opt){opt=opt||cleanupOptions();var c=codeName(n);var tags=extractNameTags(n,opt);var mp={flag:flag(c.cc),code:c.cc,country:c.cn,index:padNum(seq,width),seq:String(seq),tags:tags.join(' '),tag:tags.join(' ')};var out=String(opt.tpl||'{flag} {code}-{country} {index} {tags}').replace(/\\{(flag|code|country|index|seq|tags|tag)\\}/g,function(_,k){return mp[k]||''});return out.replace(/\\s+/g,' ').replace(/\\s+([,，;；])/g,'$1').trim()}\nfunction cleanNames(){if(!DATA){st('请先拉取或分析订阅');return}var nodes=operationNodes('清理节点名');if(!nodes.length)return;var opt=cleanupOptions();st('正在按清理规则重命名选中节点……');var totals={},seq={},cnt=0;nodes.forEach(function(n){if(!n.originalName)n.originalName=n.name;if(!n.rawName)n.rawName=n.originalName;var k=codeName(n).key;totals[k]=(totals[k]||0)+1});nodes.forEach(function(n){var c=codeName(n),w=Math.max(2,String(totals[c.key]||1).length);seq[c.key]=(seq[c.key]||0)+1;var nn=templateCleanName(n,seq[c.key],w,opt);if(nn&&nn!==n.name){n.name=nn;if(n.extra)n.extra.name=nn;cnt++}});render(DATA);st('已按规则清理选中节点名 '+cnt+' 个。已保留 rawName/originalName，可随时恢复；复制和导出会使用清理后的名称。')}\nwindow.cleanNames=cleanNames;\nfunction restoreNames(){if(!DATA){st('请先拉取或分析订阅');return}var nodes=operationNodes('恢复原始名');if(!nodes.length)return;var cnt=0;nodes.forEach(function(n){var old=n.rawName||n.originalName;if(old&&old!==n.name){n.name=old;if(n.extra)n.extra.name=old;cnt++}});render(DATA);st('已恢复选中节点原始名称 '+cnt+' 个')}\nwindow.restoreNames=restoreNames;\nfunction dl(name,txt,type){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:type||'text/plain;charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1000)}\nfunction b64utf8(s){return btoa(unescape(encodeURIComponent(String(s||''))))}\nfunction b64url(s){return b64utf8(s).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'')}\nfunction enc(s){return encodeURIComponent(String(s==null?'':s))}\nfunction qyaml(s){s=String(s==null?'':s);return '\"'+s.replace(/\\\\/g,'\\\\\\\\').replace(/\"/g,'\\\\\"').replace(/\\n/g,'\\\\n')+'\"'}\nfunction yval(v){if(v===true||v===false)return String(v);if(v===null||v===undefined||v==='')return '\"\"';if(/^[-+]?\\d+(\\.\\d+)?$/.test(String(v)))return String(v);return qyaml(v)}\nfunction clone(o){var r={};o=o||{};Object.keys(o).forEach(function(k){if(k!=='raw'&&k!=='extra'&&o[k]!==undefined)r[k]=o[k]});return r}\nfunction exportNodes(){var a=selectedNodes();if(!a.length)throw new Error('请先勾选要复制/导出的节点，或点击“全选当前”');return a}\nfunction toClashYAML(){var a=exportNodes();if(!a.length)throw new Error('没有可导出的节点');var lines=['mixed-port: 7890','allow-lan: false','mode: rule','log-level: info','','proxies:'];a.forEach(function(n){var o=clone(n.extra);o.name=n.name;o.type=n.protocol;o.server=o.server||n.server;o.port=o.port||n.port;if(n.network&&!o.network)o.network=n.network;if(n.tls&&!o.tls)o.tls=n.tls;lines.push('  - name: '+qyaml(o.name));Object.keys(o).forEach(function(k){if(k==='name')return;var v=o[k];if(v&&typeof v==='object')v=JSON.stringify(v);lines.push('    '+k+': '+yval(v))})});lines.push('','proxy-groups:','  - name: '+qyaml('🚀 节点选择'),'    type: select','    proxies:');a.forEach(function(n){lines.push('      - '+qyaml(n.name))});lines.push('','rules:','  - MATCH,'+qyaml('🚀 节点选择'));return lines.join('\\n')+'\\n'}\nfunction uriFor(n){var e=n.extra||{},p=String(n.protocol||'').toLowerCase(),name=enc(n.name),server=e.server||n.server,port=e.port||n.port;if(!server||!port)return null;if(p==='ss'){var method=e.cipher||e.method||'none',pass=e.password||n.id||'';var u='ss://'+b64url(method+':'+pass)+'@'+server+':'+port;var plug=e.plugin||'';if(plug){var ps=[plug];['mode','host','path','tls','mux'].forEach(function(k){if(e[k])ps.push(k+'='+e[k])});u+='?plugin='+enc(ps.join(';'))}return u+'#'+name}if(p==='trojan'){var q=[];var pass=e.password||n.id||'';if(e.sni||e.servername)q.push('sni='+enc(e.sni||e.servername));if(e.tls==='true'||e.security==='tls')q.push('security=tls');if(e.network)q.push('type='+enc(e.network));if(e.host||e.Host)q.push('host='+enc(e.host||e.Host));if(e.path)q.push('path='+enc(e.path));return 'trojan://'+enc(pass)+'@'+server+':'+port+(q.length?'?'+q.join('&'):'')+'#'+name}if(p==='vless'){var q2=['encryption='+enc(e.encryption||'none')];if(e.tls==='true'||e.security==='tls')q2.push('security=tls');if(e.network)q2.push('type='+enc(e.network));if(e.sni||e.servername)q2.push('sni='+enc(e.sni||e.servername));if(e.host||e.Host)q2.push('host='+enc(e.host||e.Host));if(e.path)q2.push('path='+enc(e.path));if(e.flow)q2.push('flow='+enc(e.flow));return 'vless://'+enc(e.uuid||n.id||'')+'@'+server+':'+port+'?'+q2.join('&')+'#'+name}if(p==='vmess'){var obj={v:'2',ps:n.name,add:server,port:String(port),id:e.uuid||n.id||'',aid:String(e.alterId||e.aid||'0'),scy:e.cipher||e.scy||'auto',net:e.network||n.network||'tcp',type:e.type||'',host:e.host||e.Host||'',path:e.path||'',tls:(e.tls==='true'||e.security==='tls')?'tls':'',sni:e.sni||e.servername||''};return 'vmess://'+b64utf8(JSON.stringify(obj))}if(/^\\w+:\\/\\//.test(String(n.raw||'')))return String(n.raw);return null}\nfunction toURIText(){var a=exportNodes(),out=[],skip=0;a.forEach(function(n){var u=uriFor(n);if(u)out.push(u);else skip++});if(!out.length)throw new Error('当前节点无法导出为 URI');if(skip)st('已跳过 '+skip+' 个暂不支持 URI 的节点');return out.join('\\n')+'\\n'}\nfunction jsn(){var a=exportNodes();return JSON.stringify({ok:true,summary:{selected:a.length,total:(DATA&&DATA.nodes&&DATA.nodes.length)||0},nodes:a,meta:(DATA&&DATA.meta)||{}},null,2)}\nfunction buildExportPayload(){if(!DATA)throw new Error('请先拉取或分析订阅');var t=$('exportType').value,c=selectedNodes().length;if(!c)throw new Error('请先勾选要复制/导出的节点，或点击“全选当前”');if(t==='json')return {name:'subviz-selected.json',text:jsn(),type:'application/json;charset=utf-8',label:'JSON 备份',count:c};if(t==='clash'){var y=toClashYAML();return {name:'subviz-selected-clash.yaml',text:y,type:'application/x-yaml;charset=utf-8',label:'Clash YAML',count:c}}if(t==='uri64'){var u64=b64utf8(toURIText());return {name:'subviz-selected-uri-base64.txt',text:u64,type:'text/plain;charset=utf-8',label:'Base64 URI 订阅',count:c}}var u=toURIText();return {name:'subviz-selected-uri.txt',text:u,type:'text/plain;charset=utf-8',label:'通用 URI 订阅',count:c}}\nwindow.doExport=function doExport(){try{var p=buildExportPayload();dl(p.name,p.text,p.type);st('已导出 '+p.label+(p.count!=null?'：'+p.count+' 个节点':''))}catch(e){st('导出失败：'+e.message)}}\nfunction fallbackCopy(txt){var ta=document.createElement('textarea');ta.value=txt;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,ta.value.length);var ok=false;try{ok=document.execCommand('copy')}catch(e){}ta.remove();return ok}\nwindow.copyExport=function copyExport(){try{var p=buildExportPayload();var done=function(){st('已复制 '+p.label+' 到剪贴板'+(p.count!=null?'：'+p.count+' 个节点':''))};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(p.text).then(done).catch(function(){if(fallbackCopy(p.text))done();else st('复制失败：请改用导出文件')})}else{if(fallbackCopy(p.text))done();else st('复制失败：当前浏览器不允许写入剪贴板')}}catch(e){st('复制失败：'+e.message)}}\n\n\nfunction aliveErr(s){s=String(s||'');var l=s.toLowerCase();if(!s)return '检测失败';if(l.indexOf('timeout')>=0||s.indexOf('超时')>=0)return '请求超时：节点无响应、速度过慢，或当前检测超时设置偏短';if(l.indexOf('connection refused')>=0)return '连接被拒绝：服务器端口关闭、节点失效，或服务端主动拒绝';if(l.indexOf('websocket closed')>=0)return 'WebSocket 被关闭：常见原因是 Host/SNI/path 不匹配、CDN 回源拒绝，或节点已失效';if(l.indexOf('load failed')>=0)return '连接失败：节点不可达、TLS/握手失败，或当前网络阻断';if(s.indexOf('状态码不匹配')>=0)return s;if(l.indexOf('policy descriptor')>=0||s.indexOf('临时代理策略')>=0)return 'Surge 临时代理策略创建失败';if(l.indexOf('unsupported')>=0||s.indexOf('不支持')>=0)return '当前协议不支持测活';return s}\nfunction aliveQS(){function val(id,def){var el=$(id);return el?String(el.value||def||'').trim():(def||'')}function ck(id){var el=$(id);return !!(el&&el.checked)}function add(k,v){v=String(v==null?'':v).trim();return v?'&'+encodeURIComponent(k)+'='+encodeURIComponent(v):''}var q='';q+=add('url',val('aliveUrl','http://connectivitycheck.platform.hicloud.com/generate_204'));q+=add('status',val('aliveStatus','204'));q+=add('timeout',val('aliveTimeout','3000'));q+=add('retries',val('aliveRetries','1'));q+=add('retry_delay',val('aliveRetryDelay','1000'));return q}\nfunction applyAliveName(n){if(!($('aliveShowLatency')&&$('aliveShowLatency').checked))return;if(n.aliveOK!==true||!n.aliveLatency)return;if(!n.nameBeforeAlive)n.nameBeforeAlive=n.name;n.name=String(n.nameBeforeAlive).replace(/^\\[\\d+ms\\]\\s*/,'');n.name='['+n.aliveLatency+'ms] '+n.name}\nfunction aliveTest(){try{if(!DATA){st('请先拉取或分析订阅');return}if(GEO_RUNNING){st('已有检测任务正在运行；如果刚才没有进度，请刷新页面后重试。');return}var nodes=operationNodes('测活');if(!nodes.length)returnGEO_RUNNING=true;var total=nodes.length,done=0,ok=0,fail=0,idx=0,errMap={},con=Math.max(1,Math.min(20,parseInt(($('aliveCon')&&$('aliveCon').value)||'5')||5));st('开始对选中的 '+total+' 个节点测活：0 / '+total);function next(){while(con>0&&idx<nodes.length){(function(n){idx++;con--;loadJSON('/api/availability?t='+Date.now()+aliveQS(),{method:'POST',body:JSON.stringify(n),headers:{'Content-Type':'application/json;charset=utf-8'}}).then(function(r){if(r&&r.ok&&r.alive){n.aliveOK=true;n.aliveLatency=r.latency||r.totalLatency||0;n.aliveStatus=r.status;n.aliveError='';applyAliveName(n);ok++}else{var er=aliveErr((r&&r.error)||'检测失败');n.aliveOK=false;n.aliveError=er;errMap[er]=(errMap[er]||0)+1;fail++}}).catch(function(e){var er=aliveErr(e.message||String(e));n.aliveOK=false;n.aliveError=er;errMap[er]=(errMap[er]||0)+1;fail++}).then(function(){done++;con++;if(done%5===0||done===total){recalc(DATA);apply();st('测活：'+done+' / '+total+'，可用 '+ok+'，不可用 '+fail)}if(done>=total){GEO_RUNNING=false;render(DATA);var es=Object.keys(errMap).slice(0,3).map(function(k){return k+'×'+errMap[k]}).join('；');st('测活完成：已检测选中的 '+total+' 个节点，可用 '+ok+'，不可用 '+fail+(es?'。失败原因：'+es:''))}else next()})})(nodes[idx])}}next()}catch(e){GEO_RUNNING=false;st('测活启动失败：'+aliveErr(e&&e.message?e.message:String(e)))}}\nwindow.aliveTest=aliveTest;\n\nfunction landingQS(){\n  function val(id){var el=$(id);return el?String(el.value||'').trim():''}\n  function add(k,v){v=String(v==null?'':v).trim();return v?'&'+encodeURIComponent(k)+'='+encodeURIComponent(v):''}\n  var q='';\n  q+=add('timeout',val('landingTimeout'));\n  q+=add('retries',val('landingRetries'));\n  var apis=val('landingApis');\n  if(apis) q+=add('api',apis.split(/\\n+/).map(function(x){return x.trim()}).filter(Boolean).join('|'));\n  q+=add('format',val('landingFormat'));\n  var internal=$('landingInternal')&&$('landingInternal').checked;\n  if(internal) q+=add('internal','1');\n  return q;\n}\n\nfunction landingApplyOne(n,r){if(!r||!r.ok)return;var cc=String(r.countryCode||'').toUpperCase();if(!cc)return;n.landingOK=true;n.landingIP=r.landingIP||r.query||'';n.landingCountryCode=cc;n.landingCountry=r.country||cc;n.landingProvider=r.provider||'';n.landingCity=r.city||'';n.landingRegion=r.region||'';n.landingISP=r.isp||'';n.landingASN=r.asn||'';n.landingAPI=r.usedAPI||r.landingAPI||'';n.landingLatency=r.latency||'';n.landingAttempts=r.attempts||'';n.entryServer=r.entryServer||n.server;n.countryCode=cc;n.country=r.country||n.country||cc;n.countrySource='landing';n.countryConfidence=96;n.geoCity=r.city||'';n.geoISP=r.isp||'';n.geoASN=r.asn||'';}\nfunction applyLandingNames(){if(!DATA)return;var counters={};(DATA.nodes||[]).forEach(function(n){var cc=String(n.countryCode||'UN').toUpperCase();var cn=String(n.country||'未知');var key=cc+'|'+cn;counters[key]=(counters[key]||0)+1;var idx=('0'+counters[key]).slice(-2);if(n.countrySource==='landing'){var old=n.name;if(!n.originalName)n.originalName=old;n.name=flag(cc)+' '+cc+'-'+cn+' '+idx;}})}\nfunction landingTest(){try{if(!DATA){st('请先拉取或分析订阅');return}if(GEO_RUNNING){st('已有 GeoIP / 落地检测任务正在运行；如果刚才没有进度，请刷新页面后重试。');return}var nodes=operationNodes('落地检测');if(!nodes.length)returnGEO_RUNNING=true;var total=nodes.length,done=0,ok=0,fail=0,idx=0,errMap={},con=Math.max(1,Math.min(10,parseInt(($('landingCon')&&$('landingCon').value)||'2')||2));st('开始对选中的 '+total+' 个节点做落地检测：0 / '+total+'。');function next(){while(con>0&&idx<nodes.length){(function(n){idx++;con--;loadJSON('/api/landing?t='+Date.now()+landingQS(),{method:'POST',body:JSON.stringify(n),headers:{'Content-Type':'application/json;charset=utf-8'}}).then(function(r){if(r&&r.ok){landingApplyOne(n,r);ok++}else{var er=(r&&r.error)||'failed'; if(r&&r.descriptorProtocol)er+='('+r.descriptorProtocol+')'; var z=zhErr(er); n.landingOK=false;n.landingError=z;n.landingErrorRaw=er;errMap[z]=(errMap[z]||0)+1;fail++}}).catch(function(e){var er=e.message||String(e);var z=zhErr(er);n.landingOK=false;n.landingError=z;n.landingErrorRaw=er;errMap[z]=(errMap[z]||0)+1;fail++}).then(function(){done++;con++;if(done%2===0||done===total){applyLandingNames();recalc(DATA);apply();st('落地检测：'+done+' / '+total+'，成功 '+ok+'，失败 '+fail)}if(done>=total){GEO_RUNNING=false;applyLandingNames();render(DATA);var es=Object.keys(errMap).slice(0,3).map(function(k){return k+'×'+errMap[k]}).join('；');st('落地检测完成：已检测选中的 '+total+' 个节点，成功 '+ok+'，失败 '+fail+'。仅对成功获取落地的节点重命名。'+(es?' 失败原因：'+es:''))}else next()})})(nodes[idx])}}next()}catch(e){GEO_RUNNING=false;st('落地检测启动失败：'+zhErr(e&&e.message?e.message:String(e)))}}\nwindow.geoFill=geoFill;\nwindow.landingTest=landingTest;\nwindow.addEventListener('DOMContentLoaded',function(){['q','pf','cf','unique'].forEach(function(id){var el=$(id);if(!el)return;el.addEventListener('input',apply);el.addEventListener('change',apply)});function bind(id,fn){var el=$(id);if(el)el.onclick=fn}bind('pull',analyzeURL);bind('demo',sample);bind('textBtn',analyzeText);bind('geo',geoFill);bind('landing',landingTest);bind('alive',aliveTest);bind('cleanNames',window.cleanNames);bind('applyRules',window.cleanNames);bind('restoreNames',window.restoreNames);bind('exportBtn',window.doExport);bind('copyBtn',window.copyExport);bind('selectCurrent',window.selectCurrent);bind('invertCurrent',window.invertCurrent);bind('clearSelected',window.clearSelected);});\n\n;(function(){\n  function svById(id){return document.getElementById(id)}\n  function svEnsureStyle(){\n    if(svById('sv132Style')) return;\n    var style=document.createElement('style');\n    style.id='sv132Style';\n    style.textContent=\n      '.sv-meta-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:10px 0 14px;}'+\n      '.sv-meta-row label{margin:0!important;}'+\n      '.sv-pill{display:inline-flex;align-items:center;justify-content:center;padding:8px 14px;border-radius:999px;background:rgba(76,132,255,.16);color:#dce7ff;font-weight:700;margin:0;}'+\n      '.sv-mini-grid,.sv-op-grid{display:grid;gap:12px;margin:12px 0;}'+\n      '.sv-mini-grid{grid-template-columns:repeat(3,minmax(0,1fr));}'+\n      '.sv-op-grid-3{grid-template-columns:repeat(3,minmax(0,1fr));}'+\n      '.sv-op-grid-2{grid-template-columns:repeat(2,minmax(0,1fr));}'+\n      '.sv-mini-grid button,.sv-op-grid button{width:100%;margin:0!important;padding:14px 10px!important;min-height:0;font-size:16px;line-height:1.25;}'+\n      '#sv132SelectGrid{margin-top:6px;margin-bottom:14px;}'+\n      '#sv132MainOps,#sv132NameOps,#sv132ExportGrid{margin-top:14px;}'+\n      '@media (max-width:640px){.sv-mini-grid,.sv-op-grid-3{grid-template-columns:repeat(2,minmax(0,1fr));}.sv-op-grid-2{grid-template-columns:repeat(2,minmax(0,1fr));}}'+\n      '@media (max-width:430px){.sv-mini-grid,.sv-op-grid-3,.sv-op-grid-2{grid-template-columns:repeat(2,minmax(0,1fr));}.sv-meta-row{align-items:flex-start;}}';\n    document.head.appendChild(style);\n  }\n  function svMakeGrid(id, cls, beforeEl){\n    var wrap=svById(id);\n    if(!wrap){\n      wrap=document.createElement('div');\n      wrap.id=id;\n      wrap.className=cls;\n      if(beforeEl&&beforeEl.parentNode) beforeEl.parentNode.insertBefore(wrap,beforeEl);\n    }\n    return wrap;\n  }\n  function svMoveIntoGrid(ids, gridId, cls){\n    var first=null;\n    ids.forEach(function(id){if(!first&&svById(id)) first=svById(id)});\n    if(!first) return null;\n    var grid=svMakeGrid(gridId, cls, first);\n    ids.forEach(function(id){\n      var el=svById(id);\n      if(el){\n        el.classList.add('sv-compact-btn');\n        grid.appendChild(el);\n      }\n    });\n    return grid;\n  }\n  function svRefineLayout(){\n    svEnsureStyle();\n    var unique=svById('unique');\n    var sel=svById('selCount');\n    var uniqueLabel = unique && unique.closest ? unique.closest('label') : (unique ? unique.parentNode : null);\n    if(uniqueLabel && sel && !svById('sv132Meta')){\n      var row=document.createElement('div');\n      row.id='sv132Meta';\n      row.className='sv-meta-row';\n      uniqueLabel.parentNode.insertBefore(row, uniqueLabel);\n      row.appendChild(uniqueLabel);\n      row.appendChild(sel);\n    }\n    if(sel) sel.classList.add('sv-pill');\n\n    svMoveIntoGrid(['selectCurrent','invertCurrent','clearSelected'], 'sv132SelectGrid', 'sv-mini-grid');\n    svMoveIntoGrid(['geo','landing','alive'], 'sv132MainOps', 'sv-op-grid sv-op-grid-3');\n    svMoveIntoGrid(['cleanNames','restoreNames'], 'sv132NameOps', 'sv-op-grid sv-op-grid-2');\n\n    var cleanBtn=svById('cleanNames');\n    if(cleanBtn) cleanBtn.textContent='清理节点名';\n    var restoreBtn=svById('restoreNames');\n    if(restoreBtn) restoreBtn.textContent='恢复原名';\n\n    var copyBtn=svById('copyBtn');\n    if(copyBtn && !svById('copyAliveBtn')){\n      var btn=document.createElement('button');\n      btn.id='copyAliveBtn';\n      btn.className=copyBtn.className||'';\n      btn.textContent='复制可用节点';\n      copyBtn.parentNode.insertBefore(btn, copyBtn.nextSibling);\n      btn.addEventListener('click', window.copyAliveExport);\n    }\n    svMoveIntoGrid(['copyAliveBtn','copyBtn','exportBtn'], 'sv132ExportGrid', 'sv-op-grid sv-op-grid-3');\n  }\n  function svWithNodes(nodes, fn){\n    var oldSelectedNodes=selectedNodes;\n    try{\n      selectedNodes=function(){return nodes};\n      return fn();\n    } finally {\n      selectedNodes=oldSelectedNodes;\n    }\n  }\n  window.copyAliveExport=function copyAliveExport(){\n    try{\n      if(!DATA){st('请先拉取或分析订阅');return}\n      var picked=operationNodes('复制可用节点');\n      if(!picked.length) return;\n      var alive=picked.filter(function(n){return n&&n.aliveOK===true});\n      if(!alive.length){st('当前勾选节点中没有可用节点。请先执行测活，或调整勾选范围。');return}\n      var payload=svWithNodes(alive, buildExportPayload);\n      payload.name=String(payload.name||'').replace('selected','alive');\n      function ok(){st('已复制可用节点：'+alive.length+' 个（'+payload.label+'）')}\n      if(navigator.clipboard && window.isSecureContext){\n        navigator.clipboard.writeText(payload.text).then(ok).catch(function(){\n          if(fallbackCopy(payload.text)) ok();\n          else st('复制失败：当前浏览器不允许写入剪贴板');\n        });\n      } else if(fallbackCopy(payload.text)){\n        ok();\n      } else {\n        st('复制失败：当前浏览器不允许写入剪贴板');\n      }\n    }catch(e){\n      st('复制可用节点失败：'+e.message);\n    }\n  };\n\n  var __sv132OldUpdateSelectUI = updateSelectUI;\n  updateSelectUI = function(){\n    if(typeof __sv132OldUpdateSelectUI === 'function') __sv132OldUpdateSelectUI();\n    var c=selectedCount();\n    var el=svById('selCount');\n    if(el){\n      el.textContent='已选 '+c+' 个';\n      el.classList.add('sv-pill');\n    }\n    var countEl=svById('count');\n    if(countEl && DATA){\n      var total=((DATA&&DATA.summary&&DATA.summary.total)||0);\n      var current=filtered().length;\n      countEl.textContent='当前显示 '+current+' / '+total+' 个节点';\n    }\n  };\n\n  var __sv132OldApply = apply;\n  apply = function(){\n    __sv132OldApply();\n    updateSelectUI();\n    svRefineLayout();\n  };\n\n  window.addEventListener('DOMContentLoaded', function(){\n    svRefineLayout();\n    updateSelectUI();\n  });\n})();\n\n\n;(function(){\n  function sv133ById(id){return document.getElementById(id)}\n  function sv133Style(){\n    if(sv133ById('sv133Style')) return;\n    var style=document.createElement('style');\n    style.id='sv133Style';\n    style.textContent =\n      'body.sv133 .wrap{max-width:980px;padding-bottom:70px;}'+\n      'body.sv133 .hero,body.sv133 .card{border-radius:22px;padding:18px;margin:14px 0;}'+\n      'body.sv133 h1{font-size:28px;line-height:1.2}body.sv133 h2{font-size:22px;margin-bottom:14px;}'+\n      'body.sv133 button{min-height:48px;border-radius:18px;padding:13px 12px;font-size:16px;line-height:1.25;margin-top:0;}'+\n      'body.sv133 input,body.sv133 textarea,body.sv133 select{border-radius:16px;padding:13px 14px;font-size:15px;}'+\n      'body.sv133 .status{font-size:14px;line-height:1.55;max-height:150px;}'+\n      'body.sv133 #cards.grid{grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;}'+\n      'body.sv133 .stat{padding:14px;border-radius:18px;}body.sv133 .stat b{font-size:30px;}'+\n      'body.sv133 #protocols,body.sv133 #countries{max-height:320px;overflow:auto;padding-right:4px;}'+\n      'body.sv133 .bar{grid-template-columns:108px 1fr 42px;gap:8px;font-size:14px;}'+\n      'body.sv133 .track,body.sv133 .fill{height:12px;}'+\n      'body.sv133 .filters{grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;}'+\n      'body.sv133 .sv-section-title{font-size:13px;color:#9fb0cc;font-weight:800;margin:14px 0 8px;}'+\n      'body.sv133 .sv-auto-row{display:flex;align-items:center;gap:9px;margin:8px 0 10px;color:#dbe8ff;font-size:14px;}'+\n      'body.sv133 .sv-auto-row input{width:22px!important;height:22px!important;accent-color:#58a6ff;padding:0;}'+\n      'body.sv133 .sv133-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:10px 0 12px;}'+\n      'body.sv133 .sv133-grid.three{grid-template-columns:repeat(3,minmax(0,1fr));}'+\n      'body.sv133 .sv133-grid button{width:100%;}'+\n      'body.sv133 .rulebox{padding:10px 12px;border-radius:16px;margin-top:10px;}'+\n      'body.sv133 .rulebox summary{font-size:15px;}'+\n      'body.sv133 .exportbar{display:grid;grid-template-columns:1.3fr .7fr .7fr;gap:10px;}'+\n      'body.sv133 #sv133ExportGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px;}'+\n      'body.sv133 #sv133ExportGrid button{margin:0;}'+\n      'body.sv133 table{table-layout:fixed;}'+\n      'body.sv133 th,body.sv133 td{padding:10px 8px;}'+\n      '@media(max-width:760px){'+\n        'body.sv133 .wrap{padding:14px 10px 56px;}'+\n        'body.sv133 .hero,body.sv133 .card{padding:15px 13px;border-radius:20px;margin:12px 0;}'+\n        'body.sv133 h1{font-size:24px}body.sv133 h2{font-size:20px;}'+\n        'body.sv133 #cards.grid{grid-template-columns:repeat(2,minmax(0,1fr));}'+\n        'body.sv133 .stat{min-height:82px;}body.sv133 .stat b{font-size:28px;}'+\n        'body.sv133 #protocols,body.sv133 #countries{max-height:260px;}'+\n        'body.sv133 .bar{grid-template-columns:82px 1fr 34px;font-size:13px;}'+\n        'body.sv133 .filters{grid-template-columns:1fr 1fr;}'+\n        'body.sv133 .selectbar{display:block;}'+\n        'body.sv133 #sv132Meta,body.sv133 .sv-meta-row{display:flex!important;gap:10px;align-items:center;justify-content:space-between;margin:10px 0;}'+\n        'body.sv133 .sv-pill{font-size:14px;padding:7px 10px;}'+\n        'body.sv133 .sv133-grid,body.sv133 .sv133-grid.three{grid-template-columns:repeat(2,minmax(0,1fr));}'+\n        'body.sv133 .toolbar{grid-template-columns:repeat(2,minmax(0,1fr))!important;}'+\n        'body.sv133 .toolhint{font-size:12px;line-height:1.5;}'+\n        'body.sv133 .exportbar{grid-template-columns:1fr;}'+\n        'body.sv133 table,body.sv133 thead,body.sv133 tbody{display:block;width:100%;}'+\n        'body.sv133 thead{display:none;}'+\n        'body.sv133 tbody tr{display:grid;grid-template-columns:34px minmax(0,1fr) 78px;grid-template-areas:\"check name proto\" \"check name port\";gap:4px 10px;align-items:center;border-top:1px solid #263f66;padding:12px 0;}'+\n        'body.sv133 tbody td{display:block;border:0!important;padding:0!important;min-width:0;}'+\n        'body.sv133 tbody td:nth-child(1){grid-area:check;}'+\n        'body.sv133 tbody td:nth-child(2){display:none;}'+\n        'body.sv133 tbody td:nth-child(3){grid-area:name;font-size:15px;line-height:1.35;word-break:break-word;}'+\n        'body.sv133 tbody td:nth-child(4){grid-area:proto;text-align:right;}'+\n        'body.sv133 tbody td:nth-child(5){display:none!important;}'+\n        'body.sv133 tbody td:nth-child(6){grid-area:port;text-align:right;color:#dbe8ff;font-weight:800;font-size:15px;}'+\n        'body.sv133 .tag{padding:5px 9px;font-size:13px;}'+\n        'body.sv133 .small{font-size:12px;line-height:1.45;word-break:break-word;}'+\n      '}'+\n      '@media(max-width:390px){body.sv133 .bar{grid-template-columns:72px 1fr 30px;}body.sv133 button{font-size:15px;padding-left:8px;padding-right:8px;}body.sv133 tbody tr{grid-template-columns:32px minmax(0,1fr) 70px;}}';\n    document.head.appendChild(style);\n  }\n  function sv133Move(ids, gridId, cls, before){\n    var first=null;\n    ids.forEach(function(id){if(!first&&sv133ById(id)) first=sv133ById(id)});\n    if(!first) return null;\n    var grid=sv133ById(gridId);\n    if(!grid){\n      grid=document.createElement('div');\n      grid.id=gridId;\n      grid.className=cls;\n      var ref=before&&sv133ById(before)?sv133ById(before):first;\n      if(ref&&ref.parentNode) ref.parentNode.insertBefore(grid, ref);\n    }\n    ids.forEach(function(id){var el=sv133ById(id); if(el) grid.appendChild(el);});\n    return grid;\n  }\n  function sv133EnsureAliveControls(){\n    var clear=sv133ById('clearSelected');\n    if(clear && !sv133ById('selectAliveBtn')){\n      var b=document.createElement('button');\n      b.id='selectAliveBtn';\n      b.type='button';\n      b.className=clear.className||'btn2';\n      b.textContent='勾选可用';\n      b.onclick=function(){window.selectAliveCurrent&&window.selectAliveCurrent();return false};\n      clear.parentNode.insertBefore(b, clear.nextSibling);\n    }\n    var hint=sv133ById('autoAliveWrap');\n    var anchor=sv133ById('selectAliveBtn')||sv133ById('alive');\n    if(!hint && anchor){\n      hint=document.createElement('label');\n      hint.id='autoAliveWrap';\n      hint.className='sv-auto-row';\n      hint.innerHTML='<input type=\"checkbox\" id=\"autoSelectAlive\" checked> 测活完成后自动只勾选可用节点';\n      var parent=(sv133ById('sv133SelectGrid')||anchor.parentNode);\n      if(parent&&parent.parentNode) parent.parentNode.insertBefore(hint, parent.nextSibling);\n    }\n  }\n  function sv133Refine(){\n    document.body.classList.add('sv133');\n    sv133Style();\n    sv133EnsureAliveControls();\n    var unique=sv133ById('unique'), sel=sv133ById('selCount');\n    var uniqueLabel=unique&&unique.closest?unique.closest('label'):(unique?unique.parentNode:null);\n    if(uniqueLabel && sel && !sv133ById('sv133Meta')){\n      var row=document.createElement('div'); row.id='sv133Meta'; row.className='sv-meta-row';\n      uniqueLabel.parentNode.insertBefore(row, uniqueLabel); row.appendChild(uniqueLabel); row.appendChild(sel);\n    }\n    if(sel) sel.classList.add('sv-pill');\n    sv133Move(['selectCurrent','invertCurrent','clearSelected','selectAliveBtn'], 'sv133SelectGrid', 'sv133-grid', 'autoAliveWrap');\n    sv133Move(['geo','landing','alive','cleanNames','restoreNames'], 'sv133MainGrid', 'sv133-grid', null);\n    sv133Move(['copyAliveBtn','copyBtn','exportBtn'], 'sv133ExportGrid', 'sv133-grid three', null);\n    var clean=sv133ById('cleanNames'); if(clean) clean.textContent='清理节点名';\n    var alive=sv133ById('alive'); if(alive) alive.textContent='测活';\n    var selAlive=sv133ById('selectAliveBtn'); if(selAlive) selAlive.textContent='勾选可用';\n  }\n  window.selectAliveCurrent=function(){\n    try{\n      if(!DATA){st('请先拉取或分析订阅');return}\n      var scope=filtered();\n      var alive=scope.filter(function(n){return n&&n.aliveOK===true});\n      SELECTED={};\n      alive.forEach(function(n){if(n._sid)SELECTED[n._sid]=1});\n      apply();\n      st('已勾选当前筛选中的可用节点：'+alive.length+' / '+scope.length+' 个');\n    }catch(e){st('勾选可用节点失败：'+(e&&e.message?e.message:String(e)))}\n  };\n  function sv133AutoEnabled(){var el=sv133ById('autoSelectAlive');return !el || el.checked}\n  function sv133AutoPick(nodes){\n    var alive=(nodes||[]).filter(function(n){return n&&n.aliveOK===true});\n    if(sv133AutoEnabled()){\n      SELECTED={};\n      alive.forEach(function(n){if(n._sid)SELECTED[n._sid]=1});\n    }\n    return alive.length;\n  }\n  window.aliveTest=function(){\n    try{\n      if(!DATA){st('请先拉取或分析订阅');return}\n      if(GEO_RUNNING){st('已有检测任务正在运行；如果刚才没有进度，请刷新页面后重试。');return}\n      var nodes=operationNodes('测活');\n      if(!nodes.length) return;\n      GEO_RUNNING=true;\n      var total=nodes.length, done=0, ok=0, fail=0, idx=0, errMap={};\n      var con=Math.max(1,Math.min(20,parseInt((sv133ById('aliveCon')&&sv133ById('aliveCon').value)||'5')||5));\n      st('开始对选中的 '+total+' 个节点测活：0 / '+total);\n      function finish(){\n        GEO_RUNNING=false;\n        var autoCount=sv133AutoPick(nodes);\n        recalc(DATA);\n        render(DATA);\n        sv133Refine();\n        var es=Object.keys(errMap).slice(0,3).map(function(k){return k+'×'+errMap[k]}).join('；');\n        st('测活完成：已检测选中的 '+total+' 个节点，可用 '+ok+'，不可用 '+fail+(sv133AutoEnabled()?'。已自动勾选可用节点 '+autoCount+' 个':'')+(es?'。失败原因：'+es:''));\n      }\n      function next(){\n        while(con>0 && idx<nodes.length){\n          (function(n){\n            idx++; con--;\n            loadJSON('/api/availability?t='+Date.now()+aliveQS(),{method:'POST',body:JSON.stringify(n),headers:{'Content-Type':'application/json;charset=utf-8'}})\n              .then(function(r){\n                if(r&&r.ok&&r.alive){\n                  n.aliveOK=true;\n                  n.aliveLatency=r.latency||r.totalLatency||0;\n                  n.aliveStatus=r.status;\n                  n.aliveError='';\n                  applyAliveName(n);\n                  ok++;\n                }else{\n                  var er=aliveErr((r&&r.error)||'检测失败');\n                  n.aliveOK=false; n.aliveError=er; errMap[er]=(errMap[er]||0)+1; fail++;\n                }\n              })\n              .catch(function(e){\n                var er=aliveErr(e.message||String(e));\n                n.aliveOK=false; n.aliveError=er; errMap[er]=(errMap[er]||0)+1; fail++;\n              })\n              .then(function(){\n                done++; con++;\n                if(done%5===0||done===total){recalc(DATA);apply();st('测活：'+done+' / '+total+'，可用 '+ok+'，不可用 '+fail)}\n                if(done>=total) finish(); else next();\n              });\n          })(nodes[idx]);\n        }\n      }\n      next();\n    }catch(e){GEO_RUNNING=false;st('测活启动失败：'+aliveErr(e&&e.message?e.message:String(e)))}\n  };\n  var oldApply=apply;\n  apply=function(){oldApply();sv133Refine()};\n  window.addEventListener('DOMContentLoaded',function(){sv133Refine()});\n})();\n";

  function html() {
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>SubViz</title>'+
    '<style>*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at top,#123257,#061225 55%,#030914);color:#eaf2ff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.wrap{max-width:980px;margin:auto;padding:22px 18px 60px}.hero,.card{background:rgba(12,30,58,.78);border:1px solid #23446f;border-radius:24px;padding:22px;margin:18px 0;box-shadow:0 18px 60px rgba(0,0,0,.22)}h1{font-size:30px;margin:0 0 10px}h2{font-size:22px;margin:0 0 16px}.muted{color:#9fb0cc}.row{display:flex;gap:12px;flex-wrap:wrap}input,textarea,select{width:100%;background:#061225;color:#eaf2ff;border:1px solid #2b4e80;border-radius:18px;padding:15px;font-size:16px}textarea{height:120px}button{width:100%;border:0;border-radius:20px;padding:16px;font-size:18px;font-weight:800;color:white;background:linear-gradient(90deg,#2d8cff,#16c6f4);margin-top:12px}.btn2{background:#22334f}.toolbar{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.selectbar{display:grid;grid-template-columns:1fr repeat(3,.8fr);gap:8px;margin:12px 0;align-items:center}.selectbar span{font-weight:900;color:#d9e8ff}.rowchk{width:22px;height:22px;accent-color:#58a6ff}.toolbar button{margin-top:0}.exportbar{display:grid;grid-template-columns:1.35fr .55fr .55fr;gap:10px;margin-top:12px}.exportbar button{margin-top:0}.rulebox{margin-top:12px;border:1px solid #284773;border-radius:18px;padding:12px;background:rgba(6,18,37,.45)}summary{cursor:pointer;font-weight:800}.rulegrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.rulebox textarea{height:92px;font-size:14px}.rulebox input{font-size:14px;padding:12px}.rulebtns{display:grid;grid-template-columns:1fr 1fr;gap:10px}.toolhint{font-size:13px;color:#9fb0cc;margin-top:8px}.sectionline{border-top:1px solid #263f66;margin:14px 0 10px}.status{margin-top:14px;padding:12px;border:1px solid #284773;border-radius:18px;overflow:auto}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.stat{background:#17263d;border:1px solid #284773;border-radius:20px;padding:18px}.stat b{display:block;font-size:34px;margin-top:6px}.bar{display:grid;grid-template-columns:120px 1fr 54px;align-items:center;gap:10px;margin:10px 0}.track{height:14px;background:#1f314e;border-radius:20px}.fill{height:14px;background:linear-gradient(90deg,#2d8cff,#16d6e9);border-radius:20px}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border-top:1px solid #263f66;padding:12px 8px;text-align:left;word-break:break-all}th{color:#c7d7f5}.tag{display:inline-block;border:1px solid #38658f;background:#183957;border-radius:999px;padding:5px 10px;font-weight:800}.filters{display:grid;grid-template-columns:1fr 1fr;gap:10px}.small{font-size:13px;color:#9fb0cc}@media(max-width:640px){.grid{grid-template-columns:1fr 1fr}.bar{grid-template-columns:90px 1fr 44px}th:nth-child(5),td:nth-child(5){display:none}.wrap{padding:16px 12px 40px}.toolbar{grid-template-columns:1fr}.selectbar{grid-template-columns:1fr}.exportbar{grid-template-columns:1fr .55fr .55fr}.rulegrid{grid-template-columns:1fr}.rulebtns{grid-template-columns:1fr}}</style></head><body><div class="wrap">'+
    '<div class="hero"><div class="small">Surge Local UI &middot; v'+VERSION+'</div><h1>&#35746;&#38405;&#33410;&#28857;&#21487;&#35270;&#21270;&#20998;&#26512;</h1><p class="muted">&#25289;&#21462;&#25110;&#31896;&#36148;&#26426;&#22330;/&#20195;&#29702;&#35746;&#38405;&#65292;&#35299;&#26512;&#33410;&#28857;&#20998;&#24067;&#12289;&#21327;&#35758;&#12289;&#22269;&#23478;/&#22320;&#21306;&#12289;&#25968;&#37327;&#12289;&#37325;&#22797;&#39033;&#65292;&#24182;&#25903;&#25345;&#31579;&#36873;&#19982;&#23548;&#20986;&#12290;</p><input id="url" placeholder="https://example.com/sub"><button type="button" id="pull">&#25289;&#21462;&#20998;&#26512;</button><button type="button" id="demo" class="btn2">&#28436;&#31034;&#25968;&#25454;</button><textarea id="raw" placeholder="&#25110;&#31896;&#36148;&#35746;&#38405;&#21407;&#25991; / Clash YAML"></textarea><button type="button" id="textBtn" class="btn2">&#20998;&#26512;&#31896;&#36148;&#20869;&#23481;</button><div id="status" class="status">&#20934;&#22791;&#23601;&#32490;&#12290;</div></div>'+
    '<div class="grid" id="cards"></div><div class="card"><h2>&#21327;&#35758;&#20998;&#24067;</h2><div id="protocols" class="muted">&#26242;&#26080;&#25968;&#25454;</div></div><div class="card"><h2>&#22269;&#23478; / &#22320;&#21306;&#20998;&#24067;</h2><div id="countries" class="muted">&#26242;&#26080;&#25968;&#25454;</div></div><div class="card"><h2>&#33410;&#28857;&#21015;&#34920;</h2><p id="count" class="muted">&#26242;&#26080;&#25968;&#25454;</p><input id="q" placeholder="&#25628;&#32034;&#33410;&#28857;&#21517; / &#26381;&#21153;&#22120; / &#22320;&#21306;"><div class="filters"><select id="pf"><option value="">&#20840;&#37096;&#21327;&#35758;</option></select><select id="cf"><option value="">&#20840;&#37096;&#22320;&#21306;</option></select></div><label style="display:flex;gap:8px;align-items:center;margin:12px 0"><input type="checkbox" id="unique" checked style="width:24px;height:24px"> &#20165;&#21807;&#19968;&#33410;&#28857;</label><div class="selectbar"><span id="selCount">&#24050;&#36873; 0 &#20010;</span><button type="button" id="selectCurrent" class="btn2" onclick="window.selectCurrent&&window.selectCurrent();return false">&#20840;&#36873;&#24403;&#21069;</button><button type="button" id="invertCurrent" class="btn2" onclick="window.invertCurrent&&window.invertCurrent();return false">&#21453;&#36873;&#24403;&#21069;</button><button type="button" id="clearSelected" class="btn2" onclick="window.clearSelected&&window.clearSelected();return false">&#28165;&#31354;&#36873;&#25321;</button></div><div class="toolhint">&#25209;&#37327;&#25805;&#20316;&#20165;&#22788;&#29702;&#24050;&#21246;&#36873;&#33410;&#28857;&#12290;&#21487;&#20197;&#20808;&#31579;&#36873;&#65292;&#20877;&#28857;&#8220;&#20840;&#36873;&#24403;&#21069;&#8221;&#12290;</div><div class="toolbar"><button type="button" id="geo" class="btn2" onclick="window.geoFill&&window.geoFill();return false">&#24555;&#36895; GeoIP &#34917;&#20840;</button><button type="button" id="landing" class="btn2" onclick="window.landingTest&&window.landingTest();return false">&#33853;&#22320;&#26816;&#27979;</button><button type="button" id="alive" class="btn2" onclick="window.aliveTest&&window.aliveTest();return false">&#27979;&#27963;</button><button type="button" id="cleanNames" class="btn2" onclick="window.cleanNames&&window.cleanNames();return false">&#25353;&#35268;&#21017;&#28165;&#29702;&#33410;&#28857;&#21517;</button></div><div class="toolhint">&#33853;&#22320;&#26816;&#27979;&#21482;&#26816;&#27979;&#24050;&#21246;&#36873;&#33410;&#28857;&#65306;&#20320;&#21487;&#20197;&#20808;&#31579;&#36873;&#8220;&#26410;&#30693;&#8221;&#12289;&#26576;&#20010;&#22320;&#21306;&#25110;&#21327;&#35758;&#65292;&#20877;&#20840;&#36873;&#24403;&#21069;&#12290;</div><div class="rulebox"><details><summary>&#33853;&#22320;&#26816;&#27979;&#35774;&#32622;</summary><div class="rulegrid"><div><div class="small">&#24182;&#21457;&#25968;&#65288;1-10&#65289;</div><input id="landingCon" value="2"></div><div><div class="small">&#36229;&#26102;&#65288;&#27627;&#31186;&#65289;</div><input id="landingTimeout" value="5000"></div><div><div class="small">&#37325;&#35797;&#27425;&#25968;</div><input id="landingRetries" value="1"></div><div><div class="small">&#21629;&#21517;&#26684;&#24335;&#65288;&#21487;&#36873;&#65289;</div><input id="landingFormat" value=""></div></div><label class="small" style="display:flex;gap:8px;align-items:center;margin:10px 0"><input type="checkbox" id="landingInternal" style="width:22px;height:22px"> &#20351;&#29992;&#20869;&#37096; GEOIP&#65288;&#38656;&#35201; Surge/Loon &#25903;&#25345; $utils.geoip&#65292;&#40664;&#35748;&#21482;&#35831;&#27714;&#20986;&#21475; IP&#65289;</label><div class="small">API &#21015;&#34920;&#65288;&#19968;&#34892;&#19968;&#20010;&#65292;&#30041;&#31354;&#21017;&#20351;&#29992;&#20869;&#32622;&#22791;&#29992;&#65306;ipwho.is / ip-api / ip.sb / ipinfo / myip&#65289;</div><textarea id="landingApis" placeholder="https://ipwho.is/?lang=zh-CN&#10;http://ip-api.com/json?lang=zh-CN"></textarea><div class="toolhint">&#20511;&#37492; Sub-Store &#33853;&#22320;&#33050;&#26412;&#24605;&#36335;&#65306;&#25903;&#25345;&#33258;&#23450;&#20041; API&#12289;&#36229;&#26102;&#12289;&#24182;&#21457;&#12289;&#37325;&#35797;&#21644;&#20869;&#37096; GEOIP&#12290;</div></details></div><div class="rulebox"><details><summary>&#33410;&#28857;&#27979;&#27963;&#35774;&#32622;</summary><div class="rulegrid"><div><div class="small">&#26816;&#27979; URL</div><input id="aliveUrl" value="http://connectivitycheck.platform.hicloud.com/generate_204"></div><div><div class="small">&#21512;&#27861;&#29366;&#24577;&#30721;</div><input id="aliveStatus" value="204"></div><div><div class="small">&#24182;&#21457;&#25968;</div><input id="aliveCon" value="5"></div><div><div class="small">&#36229;&#26102;&#65288;&#27627;&#31186;&#65289;</div><input id="aliveTimeout" value="3000"></div><div><div class="small">&#37325;&#35797;&#27425;&#25968;</div><input id="aliveRetries" value="1"></div><div><div class="small">&#37325;&#35797;&#38388;&#38548;&#65288;&#27627;&#31186;&#65289;</div><input id="aliveRetryDelay" value="1000"></div></div><label class="small" style="display:flex;gap:8px;align-items:center;margin:10px 0"><input type="checkbox" id="aliveShowLatency" style="width:22px;height:22px"> &#21517;&#31216;&# 前显示延迟</label><div class="toolhint">&#27979;&#27963;&#21482;&#26816;&#27979;&#24050;&#21246;&#36873;&#33410;&#28857;&#65307;&#21487;&#20197;&#20808;&#25353;&#21327;&#35758;&#12289;&#22320;&#21306;&#25110;&#20851;&#38190;&#35789;&#31579;&#36873;&#65292;&#20877;&#20840;&#36873;&#24403;&#21069;&#12290;</div></details></div><div class="rulebox"><details><summary>&#33410;&#28857;&#21517;&#28165;&#29702;&#35268;&#21017;&#35774;&#32622;</summary><div class="rulegrid"><div><div class="small">&#21024;&#38500;&#20851;&#38190;&#35789;&#65288;&#40657;&#21517;&#21333;&#65292;&#29992;&#36887;&#21495;&#25110;&#25442;&#34892;&#65289;</div><textarea id="dropWords">linuxdo, History, OpenRay, Telegram, TG, GitHub, Github, DeltaKroneckerGithub, WangCai, &#23448;&#32593;, &#23448;&#26041;, &#32593;&#31449;, &#20027;&#39029;, &#39057;&#36947;, &#32676;&#32452;, &#35746;&#38405;, &#20813;&#36153;, &#20844;&#30410;, &#21097;&#20313;, &#27969;&#37327;, &#21040;&#26399;, &#36807;&#26399;, &#26377;&#25928;&#26399;, &#22871;&#39184;, &#37325;&#32622;, expire, expiry, traffic, reset, GB, MB, TB, &#22495;&#21517;, &#32593;&#22336;</textarea></div><div><div class="small">&#20445;&#30041;&#26631;&#31614;&#65288;&#30333;&#21517;&#21333;&#65289;</div><textarea id="keepTags">&#20493;&#29575;, &#21407;&#29983;, &#26426;&#25151;, &#21830;&#23485;, &#23478;&#23485;, &#20303;&#23429;, &#24191;&#25773;, &#19987;&#32447;, &#20013;&#36716;, &#30452;&#36830;, &#38567;&#36947;, IEPL, IPLC, BGP, CN2, CMI, 9929, 4837, 0.2x, 0.5x, 1x, 2x, 3x, 5x, 10x</textarea></div></div><div class="small" style="margin-top:10px">&#21629;&#21517;&#27169;&#26495;&#65306;&#21487;&#29992; {flag} {code} {country} {index} {tags}</div><input id="nameTpl" value="{flag} {code}-{country} {index} {tags}"><div class="rulebtns"><button type="button" id="applyRules" class="btn2" onclick="window.cleanNames&&window.cleanNames();return false">&#24212;&#29992;&#35268;&#21017;&#24182;&#37325;&#21629;&#21517;</button><button type="button" id="restoreNames" class="btn2" onclick="window.restoreNames&&window.restoreNames();return false">&#24674;&#22797;&#21407;&#22987;&#21517;</button></div><div class="toolhint">&#24605;&#36335;&#65306;&#21024;&#38500;&#26469;&#28304;&#35789;/&#22495;&#21517;/&#36807;&#26399;&#27969;&#37327;&#20449;&#24687;&#65292;&#25552;&#21462;&#22269;&#23478;&#12289;&#20493;&#29575;&#21644;&#32447;&#36335;&#26631;&#31614;&#65292;&#20877;&#25353;&#27169;&#26495;&#24378;&#21046;&#37325;&#26500;&#33410;&#28857;&#21517;&#12290;</div></details></div><div class="sectionline"></div><div class="exportbar"><select id="exportType"><option value="clash">&#23548;&#20986; Clash YAML</option><option value="uri">&#23548;&#20986; &#36890;&#29992; URI &#35746;&#38405;</option><option value="uri64">&#23548;&#20986; Base64 URI &#35746;&#38405;</option><option value="json">&#23548;&#20986; JSON &#22791;&#20221;</option></select><button type="button" id="exportBtn" class="btn2" onclick="window.doExport&&window.doExport();return false">&#23548;&#20986;</button><button type="button" id="copyBtn" class="btn2" onclick="window.copyExport&&window.copyExport();return false">&#22797;&#21046;</button></div><div class="toolhint">&#23548;&#20986;/&#22797;&#21046;&#33539;&#22260;&#65306;&#24050;&#21246;&#36873;&#33410;&#28857;&#12290;&#21487;&#20197;&#20808;&#31579;&#36873;&#65292;&#20877;&#28857;&#8220;&#20840;&#36873;&#24403;&#21069;&#8221;&#12290;</div><table><thead><tr><th style="width:46px">&#36873;</th><th style="width:48px">#</th><th>&#33410;&#28857;&#21517;</th><th style="width:110px">&#21327;&#35758;</th><th>&#26381;&#21153;&#22120;</th><th style="width:80px">&#31471;&#21475;</th></tr></thead><tbody id="tbody"><tr><td colspan="6" class="muted">&#26242;&#26080;&#25968;&#25454;</td></tr></tbody></table></div></div><script src="/app.js?v='+VERSION+'"></script></body></html>';
  }

  function main() {
    var url = getURL(), path = getPath(url);
    if (($request.method || '').toUpperCase() === 'OPTIONS') return respond(204, '');
    if (path === '/app.js') return respond(200, CLIENT_JS, { 'Content-Type': 'application/javascript; charset=utf-8' });
    if (path === '/api/health') return respondJSON({ ok: true, name: 'SubViz Surge', version: VERSION, marker: MARKER });
    if (path === '/api/sample') { var r = parseSubscription(sampleText()); r.ok = true; return respondJSON(r); }
    if (path === '/api/geoip') return geoLookup(getQuery(url, 'host') || getQuery(url, 'ip'));
    if (path === '/api/landing') return landingLookup();
    if (path === '/api/availability') return availabilityLookup();
    if (path === '/api/analyze') return fetchURL(getQuery(url, 'url'));
    if (path === '/api/analyze-text') { try { var rt = parseSubscription(($request && $request.body) || ''); rt.ok = true; return respondJSON(rt); } catch (e) { return respondJSON({ ok:false, error:String(e) }, 500); } }
    return respond(200, html(), { 'Content-Type': 'text/html; charset=utf-8' });
  }
  return { main: main };
})();
SubViz.main();
