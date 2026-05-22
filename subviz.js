var SUBVIZ_SURGE_0_1_12 = true;
var SubViz = (function () {
  'use strict';
  var VERSION = '0.1.12';
  var MARKER = 'SUBVIZ_SURGE_0_1_12';

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

  function buildNode(obj, format, raw) {
    obj = obj || {};
    var name = clean(obj.name || obj.ps || obj.remarks || obj.remark || obj.tag || '');
    var protocol = clean((obj.type || obj.protocol || '')).toLowerCase();
    if (protocol === 'socks') protocol = 'socks5';
    var server = clean(obj.server || obj.add || obj.host || obj.address || obj.hostname || '');
    var port = clean(obj.port || '');
    var network = clean(obj.network || obj.net || obj.transport || '');
    var tls = clean(obj.tls || obj.security || obj['skip-cert-verify'] || '');
    if (!protocol && raw) {
      var m = String(raw).match(/^([a-z0-9+.-]+):\/\//i);
      if (m) protocol = m[1].toLowerCase();
    }
    var c = detectCountry(name, server, obj);
    return {
      id: clean(obj.uuid || obj.id || obj.password || ''), name: name || server || 'node', protocol: protocol || 'unknown',
      server: server, port: port, network: network, tls: tls, countryCode: c.countryCode, country: c.country,
      countrySource: c.countrySource, countryConfidence: c.countryConfidence,
      sourceFormat: format || 'unknown', raw: raw || safeStringify(obj, 0), extra: obj,
      fingerprint: ''
    };
  }
  function setFingerprint(n) {
    n.fingerprint = [n.protocol, n.server, n.port, n.network, n.tls].join('|').toLowerCase();
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
    obj = obj || {};
    var t = clean(obj.type || obj.protocol || '').toLowerCase();
    if (t === 'socks') t = 'socks5';
    if (!t || GROUP_TYPES[t] || !REAL_PROXY_TYPES[t]) return false;
    var server = clean(obj.server || obj.add || obj.host || obj.address || obj.hostname || '');
    var port = clean(obj.port || '');
    if (!server || !port) return false;
    return true;
  }
  function parseClash(text) {
    var nodes = [], lines = String(text || '').split(/\r?\n/), cur = null, inProxies = false;
    var hasProxiesSection = /^\s*proxies\s*:\s*$/im.test(text);
    if (!hasProxiesSection && /^\s*-\s*(?:name\s*:|\{)/m.test(text)) inProxies = true;
    function push() {
      if (cur && isRealProxyObject(cur)) nodes.push(setFingerprint(buildNode(cur, 'clash-yaml', safeStringify(cur, 0))));
      cur = null;
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
      var mName = line.match(/^\s*-\s*name\s*:\s*(.*)$/i);
      if (mName) { push(); cur = { name: clean(mName[1]) }; continue; }
      if (!cur) continue;
      var m = line.match(/^\s+([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
      if (m) cur[m[1]] = clean(m[2]);
      var m2 = line.match(/^\s+(Host|host|Path|path|servername|sni)\s*:\s*(.*)$/);
      if (m2) cur[m2[1]] = clean(m2[2]);
    }
    push(); return nodes;
  }
  function parseURI(line) {
    line = clean(line); if (!line) return null;
    var m = line.match(/^([a-z0-9+.-]+):\/\//i); if (!m) return null;
    var proto = m[1].toLowerCase(), rest = line.slice(m[0].length), obj = { type: proto };
    try {
      if (proto === 'vmess') {
        var json = atobSafe(rest); obj = JSON.parse(json); obj.type = 'vmess'; return setFingerprint(buildNode(obj, 'uri', line));
      }
      var name = '';
      var hash = rest.indexOf('#'); if (hash >= 0) { name = decodeURIComponentSafe(rest.slice(hash + 1)); rest = rest.slice(0, hash); }
      var query = ''; var qi = rest.indexOf('?'); if (qi >= 0) { query = rest.slice(qi + 1); rest = rest.slice(0, qi); }
      if (proto === 'ss') {
        var decoded = rest.indexOf('@') >= 0 ? rest : atobSafe(rest);
        var at = decoded.lastIndexOf('@'); var hp = at >= 0 ? decoded.slice(at + 1) : decoded;
        obj.server = hp.split(':')[0]; obj.port = hp.split(':')[1] || ''; obj.name = name; obj.type = 'ss'; return setFingerprint(buildNode(obj, 'uri', line));
      }
      var at2 = rest.lastIndexOf('@'); var hp2 = at2 >= 0 ? rest.slice(at2 + 1) : rest;
      obj.server = hp2.split(':')[0]; obj.port = hp2.split(':')[1] || ''; obj.name = name; obj.type = proto;
      query.split('&').forEach(function (p) { var kv = p.split('='); if (kv[0]) obj[decodeURIComponentSafe(kv[0])] = decodeURIComponentSafe(kv.slice(1).join('=')); });
      obj.network = obj.type || obj.network || obj.net || '';
      obj.tls = obj.security || obj.tls || '';
      return setFingerprint(buildNode(obj, 'uri', line));
    } catch (e) { return null; }
  }
  function parseSubscription(text) {
    text = maybeDecodeBase64(text);
    var nodes = [];
    if (/proxies\s*:/i.test(text) || /^\s*-\s*name\s*:/m.test(text)) nodes = nodes.concat(parseClash(text));
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

  var CLIENT_JS = "var DATA=null;\nfunction $(id){return document.getElementById(id)}\nfunction esc(s){return String(s==null?'':s).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]||c})}\nfunction st(s){$('status').textContent=s}\nfunction bar(it,max){return '<div class=\"bar\"><div>'+esc(it.key)+'</div><div class=\"track\"><div class=\"fill\" style=\"width:'+(max?Math.round(it.count/max*100):0)+'%\"></div></div><b>'+it.count+'</b></div>'}\nfunction uniq(nodes){var m={},a=[];(nodes||[]).forEach(function(n){if(!m[n.fingerprint]){m[n.fingerprint]=1;a.push(n)}});return a}\nfunction render(d){DATA=d;var s=d.summary||{};var labels=['\\u603b\\u8282\\u70b9','\\u552f\\u4e00\\u8282\\u70b9','\\u91cd\\u590d\\u8282\\u70b9','\\u534f\\u8bae\\u6570','\\u56fd\\u5bb6/\\u5730\\u533a'];var vals=[s.total,s.unique,s.duplicates,s.protocols,s.countries];$('cards').innerHTML=labels.map(function(l,i){return '<div class=\"stat\"><span class=\"muted\">'+l+'</span><b>'+(vals[i]||0)+'</b></div>'}).join('');var p=d.stats.byProtocol||[],c=d.stats.byCountry||[];$('protocols').innerHTML=p.length?p.map(function(x){return bar(x,p[0].count)}).join(''):'\\u6682\\u65e0\\u6570\\u636e';$('countries').innerHTML=c.length?c.slice(0,20).map(function(x){return bar(x,c[0].count)}).join(''):'\\u6682\\u65e0\\u6570\\u636e';fillSelect('pf',p);fillSelect('cf',c);apply()}\nfunction fillSelect(id,arr){var old=$(id).value;$(id).innerHTML='<option value=\"\">'+(id=='pf'?'\\u5168\\u90e8\\u534f\\u8bae':'\\u5168\\u90e8\\u5730\\u533a')+'</option>'+(arr||[]).map(function(x){return '<option value=\"'+esc(x.key)+'\">'+esc(x.key)+' ('+x.count+')</option>'}).join('');$(id).value=old}\nfunction filtered(){if(!DATA)return[];var ns=$('unique').checked?uniq(DATA.nodes):DATA.nodes;var q=$('q').value.toLowerCase(),pf=$('pf').value,cf=$('cf').value;return ns.filter(function(n){return(!pf||n.protocol==pf)&&(!cf||n.country==cf)&&(!q||(n.name+n.server+n.country+n.protocol).toLowerCase().indexOf(q)>=0)})}\nfunction apply(){var a=filtered();$('count').textContent='\\u5f53\\u524d\\u663e\\u793a '+a.length+' / '+((DATA&&DATA.summary&&DATA.summary.total)||0)+' \\u4e2a\\u8282\\u70b9';$('tbody').innerHTML=a.slice(0,300).map(function(n,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(n.name)+'<div class=\"small\">'+esc(n.country)+' &middot; '+esc(n.network||'')+' '+esc(n.tls||'')+'</div></td><td><span class=\"tag\">'+esc(n.protocol)+'</span></td><td>'+esc(n.server)+'</td><td>'+esc(n.port)+'</td></tr>'}).join('')||'<tr><td colspan=\"5\" class=\"muted\">\\u6682\\u65e0\\u6570\\u636e</td></tr>'}\nfunction loadJSON(url,opt){return fetch(url,opt).then(function(r){return r.text()}).then(function(t){try{return JSON.parse(t)}catch(e){throw new Error(t.slice(0,200)||e)}})}\nfunction analyzeURL(){var u=$('url').value.trim();if(!u){st('\\u8bf7\\u5148\\u8f93\\u5165\\u35746\\u9605 URL');return}st('\\u6309\\u94ae\\u5df2\\u89e6\\u53d1\\uff0c\\u6b63\\u5728\\u62c9\\u53d6\\u5206\\u6790\\u2026');loadJSON('/api/analyze?url='+encodeURIComponent(u)+'&t='+Date.now()).then(function(d){if(!d.ok)throw new Error(d.error||'error');render(d);st('\\u5206\\u6790\\u5b8c\\u6210\\uff1a'+d.summary.total+' \\u4e2a\\u8282\\u70b9')}).catch(function(e){st('\\u5931\\u8d25\\uff1a'+e.message)})}\nfunction sample(){st('\\u6b63\\u5728\\u8f7d\\u5165\\u6f14\\u793a\\u6570\\u636e\\u2026');loadJSON('/api/sample?t='+Date.now()).then(render).then(function(){st('\\u6f14\\u793a\\u6570\\u636e\\u5df2\\u52a0\\u8f7d')}).catch(function(e){st('\\u5931\\u8d25\\uff1a'+e.message)})}\nfunction analyzeText(){var t=$('raw').value;if(!t.trim()){st('\\u8bf7\\u5148\\u7c98\\u8d34\\u35746\\u9605\\u5185\\u5bb9');return}st('\\u6b63\\u5728\\u5206\\u6790\\u7c98\\u8d34\\u5185\\u5bb9\\u2026');loadJSON('/api/analyze-text?t='+Date.now(),{method:'POST',body:t,headers:{'Content-Type':'text/plain;charset=utf-8'}}).then(function(d){if(!d.ok)throw new Error(d.error||'error');render(d);st('\\u5206\\u6790\\u5b8c\\u6210\\uff1a'+d.summary.total+' \\u4e2a\\u8282\\u70b9')}).catch(function(e){st('\\u5931\\u8d25\\uff1a'+e.message)})}\nfunction dl(name,txt,type){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:type||'text/plain;charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1000)}\nfunction csv(){var a=filtered();var rows=[['name','protocol','country','server','port','network','tls']].concat(a.map(function(n){return[n.name,n.protocol,n.country,n.server,n.port,n.network,n.tls]}));dl('subviz.csv','\\ufeff'+rows.map(function(r){return r.map(function(x){return '\"'+String(x||'').replace(/\"/g,'\"\"')+'\"'}).join(',')}).join('\\n'),'text/csv;charset=utf-8')}\nfunction jsn(){dl('subviz-analysis.json',JSON.stringify(DATA||{},null,2),'application/json;charset=utf-8')}\nwindow.addEventListener('DOMContentLoaded',function(){['q','pf','cf','unique'].forEach(function(id){$(id).addEventListener('input',apply);$(id).addEventListener('change',apply)});$('pull').onclick=analyzeURL;$('demo').onclick=sample;$('textBtn').onclick=analyzeText;$('csv').onclick=csv;$('json').onclick=jsn;});\n";

  function html() {
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>SubViz</title>'+
    '<style>*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at top,#123257,#061225 55%,#030914);color:#eaf2ff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.wrap{max-width:980px;margin:auto;padding:22px 18px 60px}.hero,.card{background:rgba(12,30,58,.78);border:1px solid #23446f;border-radius:24px;padding:22px;margin:18px 0;box-shadow:0 18px 60px rgba(0,0,0,.22)}h1{font-size:30px;margin:0 0 10px}h2{font-size:22px;margin:0 0 16px}.muted{color:#9fb0cc}.row{display:flex;gap:12px;flex-wrap:wrap}input,textarea,select{width:100%;background:#061225;color:#eaf2ff;border:1px solid #2b4e80;border-radius:18px;padding:15px;font-size:16px}textarea{height:120px}button{width:100%;border:0;border-radius:20px;padding:16px;font-size:18px;font-weight:800;color:white;background:linear-gradient(90deg,#2d8cff,#16c6f4);margin-top:12px}.btn2{background:#22334f}.status{margin-top:14px;padding:12px;border:1px solid #284773;border-radius:18px;overflow:auto}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.stat{background:#17263d;border:1px solid #284773;border-radius:20px;padding:18px}.stat b{display:block;font-size:34px;margin-top:6px}.bar{display:grid;grid-template-columns:120px 1fr 54px;align-items:center;gap:10px;margin:10px 0}.track{height:14px;background:#1f314e;border-radius:20px}.fill{height:14px;background:linear-gradient(90deg,#2d8cff,#16d6e9);border-radius:20px}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border-top:1px solid #263f66;padding:12px 8px;text-align:left;word-break:break-all}th{color:#c7d7f5}.tag{display:inline-block;border:1px solid #38658f;background:#183957;border-radius:999px;padding:5px 10px;font-weight:800}.filters{display:grid;grid-template-columns:1fr 1fr;gap:10px}.small{font-size:13px;color:#9fb0cc}@media(max-width:640px){.grid{grid-template-columns:1fr 1fr}.bar{grid-template-columns:90px 1fr 44px}th:nth-child(4),td:nth-child(4){display:none}.wrap{padding:16px 12px 40px}}</style></head><body><div class="wrap">'+
    '<div class="hero"><div class="small">Surge Local UI &middot; v'+VERSION+'</div><h1>&#35746;&#38405;&#33410;&#28857;&#21487;&#35270;&#21270;&#20998;&#26512;</h1><p class="muted">&#25289;&#21462;&#25110;&#31896;&#36148;&#26426;&#22330;/&#20195;&#29702;&#35746;&#38405;&#65292;&#35299;&#26512;&#33410;&#28857;&#20998;&#24067;&#12289;&#21327;&#35758;&#12289;&#22269;&#23478;/&#22320;&#21306;&#12289;&#25968;&#37327;&#12289;&#37325;&#22797;&#39033;&#65292;&#24182;&#25903;&#25345;&#31579;&#36873;&#19982;&#23548;&#20986;&#12290;</p><input id="url" placeholder="https://example.com/sub"><button type="button" id="pull">&#25289;&#21462;&#20998;&#26512;</button><button type="button" id="demo" class="btn2">&#28436;&#31034;&#25968;&#25454;</button><textarea id="raw" placeholder="&#25110;&#31896;&#36148;&#35746;&#38405;&#21407;&#25991; / Clash YAML"></textarea><button type="button" id="textBtn" class="btn2">&#20998;&#26512;&#31896;&#36148;&#20869;&#23481;</button><div id="status" class="status">&#20934;&#22791;&#23601;&#32490;&#12290;</div></div>'+
    '<div class="grid" id="cards"></div><div class="card"><h2>&#21327;&#35758;&#20998;&#24067;</h2><div id="protocols" class="muted">&#26242;&#26080;&#25968;&#25454;</div></div><div class="card"><h2>&#22269;&#23478; / &#22320;&#21306;&#20998;&#24067;</h2><div id="countries" class="muted">&#26242;&#26080;&#25968;&#25454;</div></div><div class="card"><h2>&#33410;&#28857;&#21015;&#34920;</h2><p id="count" class="muted">&#26242;&#26080;&#25968;&#25454;</p><input id="q" placeholder="&#25628;&#32034;&#33410;&#28857;&#21517; / &#26381;&#21153;&#22120; / &#22320;&#21306;"><div class="filters"><select id="pf"><option value="">&#20840;&#37096;&#21327;&#35758;</option></select><select id="cf"><option value="">&#20840;&#37096;&#22320;&#21306;</option></select></div><label style="display:flex;gap:8px;align-items:center;margin:12px 0"><input type="checkbox" id="unique" checked style="width:24px;height:24px"> &#20165;&#21807;&#19968;&#33410;&#28857;</label><button type="button" id="csv" class="btn2">&#23548;&#20986; CSV</button><button type="button" id="json" class="btn2">&#23548;&#20986; JSON</button><table><thead><tr><th style="width:48px">#</th><th>&#33410;&#28857;&#21517;</th><th style="width:110px">&#21327;&#35758;</th><th>&#26381;&#21153;&#22120;</th><th style="width:80px">&#31471;&#21475;</th></tr></thead><tbody id="tbody"><tr><td colspan="5" class="muted">&#26242;&#26080;&#25968;&#25454;</td></tr></tbody></table></div></div><script src="/app.js?v='+VERSION+'"></script></body></html>';
  }

  function main() {
    var url = getURL(), path = getPath(url);
    if (($request.method || '').toUpperCase() === 'OPTIONS') return respond(204, '');
    if (path === '/app.js') return respond(200, CLIENT_JS, { 'Content-Type': 'application/javascript; charset=utf-8' });
    if (path === '/api/health') return respondJSON({ ok: true, name: 'SubViz Surge', version: VERSION, marker: MARKER });
    if (path === '/api/sample') { var r = parseSubscription(sampleText()); r.ok = true; return respondJSON(r); }
    if (path === '/api/analyze') return fetchURL(getQuery(url, 'url'));
    if (path === '/api/analyze-text') { try { var rt = parseSubscription(($request && $request.body) || ''); rt.ok = true; return respondJSON(rt); } catch (e) { return respondJSON({ ok:false, error:String(e) }, 500); } }
    return respond(200, html(), { 'Content-Type': 'text/html; charset=utf-8' });
  }
  return { main: main };
})();
SubViz.main();
