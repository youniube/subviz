var SUBVIZ_SURGE_0_1_9 = true;
var SubViz = (function () {
  'use strict';

  var VERSION = '0.1.9';
  var MARKER = 'SUBVIZ_SURGE_0_1_9';

  function nowIso() { try { return new Date().toISOString(); } catch (e) { return ''; } }
  function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

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
  function htmlEscape(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function getPath(url) {
    var m = String(url || '').match(/^https?:\/\/[^\/]+([^?#]*)/i);
    return m ? (m[1] || '/') : '/';
  }
  function parseQuery(url) {
    var q = '', idx = String(url || '').indexOf('?'), out = {};
    if (idx >= 0) q = String(url).slice(idx + 1).split('#')[0];
    if (!q) return out;
    q.split('&').forEach(function (part) {
      if (!part) return;
      var p = part.split('='), key = safeDecodeURIComponent(p.shift() || ''), val = safeDecodeURIComponent(p.join('=') || '');
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
        c2 = bytes[i++]; out += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
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
    var pad = s.length % 4; if (pad) s += new Array(5 - pad).join('=');
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
      idx = chars.indexOf(s.charAt(j)); if (idx < 0) continue;
      buffer = idx; if (buffer === 64) break;
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
    if (/^(vmess|vless|trojan|ss|ssr|hysteria2|hy2|tuic|snell|socks5|socks):\/\//im.test(s)) return false;
    if (/proxies\s*:/i.test(s)) return false;
    return /^[A-Za-z0-9+/_=\-\r\n]+$/.test(s);
  }
  function maybeDecodeWhole(raw) {
    var s = String(raw || '').trim();
    if (!s) return '';
    if (looksLikeBase64(s)) {
      var decoded = base64Decode(s);
      if (/^(vmess|vless|trojan|ss|ssr|hysteria2|hy2|hysteria|tuic|snell|socks5|socks):\/\//im.test(decoded) || /proxies\s*:/i.test(decoded) || decoded.split('\n').length > 2) return decoded;
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
      var idx = part.indexOf(':'); if (idx < 0) return;
      var k = trimQuotes(part.slice(0, idx));
      var v = trimQuotes(part.slice(idx + 1));
      obj[k] = v;
    });
    return obj;
  }
  function parseYamlBlockValue(line) {
    var idx = line.indexOf(':'); if (idx < 0) return null;
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
      if (current) {
        var kv = parseYamlBlockValue(line.trim());
        if (kv) current[kv.key] = kv.value;
      }
    }
    pushCurrent();
    return nodes.filter(function (n) { return !!n.name || !!n.server; });
  }

  var CODE_TO_NAME = {
    AD:'安道尔', AE:'阿联酋', AF:'阿富汗', AG:'安提瓜和巴布达', AI:'安圭拉', AL:'阿尔巴尼亚', AM:'亚美尼亚', AO:'安哥拉', AR:'阿根廷', AS:'美属萨摩亚', AT:'奥地利', AU:'澳大利亚', AW:'阿鲁巴', AZ:'阿塞拜疆',
    BA:'波黑', BB:'巴巴多斯', BD:'孟加拉', BE:'比利时', BF:'布基纳法索', BG:'保加利亚', BH:'巴林', BI:'布隆迪', BJ:'贝宁', BM:'百慕大', BN:'文莱', BO:'玻利维亚', BR:'巴西', BS:'巴哈马', BT:'不丹', BW:'博茨瓦纳', BY:'白俄罗斯', BZ:'伯利兹',
    CA:'加拿大', CD:'刚果（金）', CF:'中非', CG:'刚果（布）', CH:'瑞士', CI:'科特迪瓦', CL:'智利', CM:'喀麦隆', CN:'中国大陆', CO:'哥伦比亚', CR:'哥斯达黎加', CU:'古巴', CV:'佛得角', CY:'塞浦路斯', CZ:'捷克',
    DE:'德国', DK:'丹麦', DO:'多米尼加', DZ:'阿尔及利亚', EC:'厄瓜多尔', EE:'爱沙尼亚', EG:'埃及', ES:'西班牙', ET:'埃塞俄比亚', EU:'欧洲', FI:'芬兰', FJ:'斐济', FR:'法国',
    GB:'英国', GD:'格林纳达', GE:'格鲁吉亚', GH:'加纳', GI:'直布罗陀', GR:'希腊', GT:'危地马拉', HK:'香港', HN:'洪都拉斯', HR:'克罗地亚', HU:'匈牙利', ID:'印尼', IE:'爱尔兰', IL:'以色列', IN:'印度', IQ:'伊拉克', IR:'伊朗', IS:'冰岛', IT:'意大利',
    JM:'牙买加', JO:'约旦', JP:'日本', KE:'肯尼亚', KG:'吉尔吉斯斯坦', KH:'柬埔寨', KR:'韩国', KW:'科威特', KZ:'哈萨克斯坦', LA:'老挝', LB:'黎巴嫩', LK:'斯里兰卡', LT:'立陶宛', LU:'卢森堡', LV:'拉脱维亚', LY:'利比亚',
    MA:'摩洛哥', MD:'摩尔多瓦', ME:'黑山', MG:'马达加斯加', MK:'北马其顿', MM:'缅甸', MN:'蒙古', MO:'澳门', MT:'马耳他', MU:'毛里求斯', MV:'马尔代夫', MX:'墨西哥', MY:'马来西亚', MZ:'莫桑比克',
    NG:'尼日利亚', NL:'荷兰', NO:'挪威', NP:'尼泊尔', NZ:'新西兰', OM:'阿曼', PA:'巴拿马', PE:'秘鲁', PH:'菲律宾', PK:'巴基斯坦', PL:'波兰', PR:'波多黎各', PT:'葡萄牙', PY:'巴拉圭', QA:'卡塔尔',
    RO:'罗马尼亚', RS:'塞尔维亚', RU:'俄罗斯', SA:'沙特', SE:'瑞典', SG:'新加坡', SI:'斯洛文尼亚', SK:'斯洛伐克', SN:'塞内加尔', TH:'泰国', TR:'土耳其', TW:'台湾', UA:'乌克兰', UK:'英国', US:'美国', UY:'乌拉圭', UZ:'乌兹别克斯坦', VE:'委内瑞拉', VN:'越南', ZA:'南非'
  };
  var NAME_KEYWORDS = [
    ['HK','香港','香港|港区|Hong\\s*Kong|HKG'], ['TW','台湾','台湾|臺灣|台灣|Taiwan|TPE'], ['JP','日本','日本|东京|大阪|Japan|Tokyo|Osaka|NRT|HND'], ['SG','新加坡','新加坡|狮城|Singapore|SIN'], ['US','美国','美国|美國|洛杉矶|洛杉磯|西雅图|西雅圖|硅谷|纽约|紐約|United\\s*States|USA|America|Los\\s*Angeles|Seattle|New\\s*York|San\\s*Jose'], ['KR','韩国','韩国|韓國|首尔|首爾|Korea|Seoul|ICN'], ['GB','英国','英国|英國|伦敦|倫敦|Britain|London'], ['DE','德国','德国|德國|Germany|Frankfurt|Berlin'], ['FR','法国','法国|法國|France|Paris'], ['CA','加拿大','加拿大|Canada|Toronto|Vancouver'], ['AU','澳大利亚','澳大利亚|澳洲|Australia|Sydney|Melbourne'], ['RU','俄罗斯','俄罗斯|俄羅斯|Russia|Moscow'], ['NL','荷兰','荷兰|荷蘭|Netherlands|Amsterdam'], ['IT','意大利','意大利|Italy|Milan|Rome'], ['ES','西班牙','西班牙|Spain|Madrid'], ['TR','土耳其','土耳其|Turkey|Istanbul'], ['IN','印度','印度|India|Mumbai|Delhi'], ['TH','泰国','泰国|泰國|Thailand|Bangkok'], ['VN','越南','越南|Vietnam|Hanoi'], ['MY','马来西亚','马来西亚|馬來西亞|Malaysia|Kuala'], ['PH','菲律宾','菲律宾|菲律賓|Philippines|Manila'], ['ID','印尼','印尼|印度尼西亚|印度尼西亞|Indonesia|Jakarta'], ['MO','澳门','澳门|澳門|Macau|Macao'], ['CN','中国大陆','中国大陆|中國大陸|大陆|大陸|China|Shanghai|Beijing'],
    ['SE','瑞典','瑞典|Sweden|Stockholm'], ['FI','芬兰','芬兰|芬蘭|Finland|Helsinki'], ['RO','罗马尼亚','罗马尼亚|羅馬尼亞|Romania|Bucharest'], ['PL','波兰','波兰|波蘭|Poland|Warsaw'], ['CZ','捷克','捷克|Czech|Prague'], ['CH','瑞士','瑞士|Switzerland|Zurich'], ['LV','拉脱维亚','拉脱维亚|拉脫維亞|Latvia|Riga'], ['EE','爱沙尼亚','爱沙尼亚|愛沙尼亞|Estonia|Tallinn'], ['MD','摩尔多瓦','摩尔多瓦|摩爾多瓦|Moldova'], ['AR','阿根廷','阿根廷|Argentina'], ['ZA','南非','南非|South\\s*Africa'], ['NG','尼日利亚','尼日利亚|奈及利亚|Nigeria'], ['NZ','新西兰','新西兰|紐西蘭|New\\s*Zealand'], ['PT','葡萄牙','葡萄牙|Portugal|Lisbon'], ['BE','比利时','比利时|比利時|Belgium'], ['AT','奥地利','奥地利|奧地利|Austria'], ['NO','挪威','挪威|Norway'], ['DK','丹麦','丹麦|丹麥|Denmark'], ['IE','爱尔兰','爱尔兰|愛爾蘭|Ireland'], ['IL','以色列','以色列|Israel']
  ];
  var CODE_LIST = Object.keys(CODE_TO_NAME).sort().join('|');
  var CODE_TOKEN_RE = new RegExp('(^|[^A-Za-z]|[0-9])(' + CODE_LIST + ')(?=($|[^A-Za-z0-9]|[_\\-\\s\\]\\|]))', 'i');

  function cleanFlagText(s) {
    return String(s || '').replace(/\\u200d/g, '\u200d');
  }
  function flagCodesFromText(s) {
    var text = cleanFlagText(s), out = [], i = 0;
    while (i < text.length) {
      var cp1 = text.codePointAt ? text.codePointAt(i) : text.charCodeAt(i);
      var w1 = cp1 > 0xFFFF ? 2 : 1;
      if (cp1 >= 0x1F1E6 && cp1 <= 0x1F1FF && i + w1 < text.length) {
        var cp2 = text.codePointAt ? text.codePointAt(i + w1) : text.charCodeAt(i + w1);
        var w2 = cp2 > 0xFFFF ? 2 : 1;
        if (cp2 >= 0x1F1E6 && cp2 <= 0x1F1FF) {
          out.push(String.fromCharCode(65 + cp1 - 0x1F1E6) + String.fromCharCode(65 + cp2 - 0x1F1E6));
          i += w1 + w2; continue;
        }
      }
      i += w1;
    }
    return out;
  }
  function inferByFlag(text) {
    var codes = flagCodesFromText(text);
    for (var i = 0; i < codes.length; i++) {
      var c = codes[i] === 'UK' ? 'GB' : codes[i];
      if (CODE_TO_NAME[c]) return { code: c, name: CODE_TO_NAME[c], source: 'flag', confidence: 0.98 };
    }
    return null;
  }
  function inferByKeyword(text) {
    text = cleanFlagText(text);
    for (var i = 0; i < NAME_KEYWORDS.length; i++) {
      var re = new RegExp(NAME_KEYWORDS[i][2], 'i');
      if (re.test(text)) return { code: NAME_KEYWORDS[i][0], name: NAME_KEYWORDS[i][1], source: 'keyword', confidence: 0.88 };
    }
    return null;
  }
  function inferByCode(text) {
    text = String(text || '').replace(/\bUK\b/ig, 'GB');
    var m = text.match(CODE_TOKEN_RE);
    if (m && m[2]) {
      var c = String(m[2]).toUpperCase(); if (c === 'UK') c = 'GB';
      if (CODE_TO_NAME[c]) return { code: c, name: CODE_TO_NAME[c], source: 'iso-code', confidence: 0.78 };
    }
    return null;
  }
  function inferByExtraCountry(extra) {
    if (!extra) return null;
    var vals = [];
    ['country','countryCode','region','location'].forEach(function (k) { if (extra[k]) vals.push(String(extra[k])); });
    if (!vals.length) return null;
    var t = vals.join(' ');
    return inferByFlag(t) || inferByCode(t) || inferByKeyword(t);
  }
  function inferByTld(server) {
    var m = String(server || '').toLowerCase().match(/\.([a-z]{2})(?:\.|$)/);
    if (m) {
      var c = m[1].toUpperCase(); if (c === 'UK') c = 'GB';
      if (CODE_TO_NAME[c]) return { code: c, name: CODE_TO_NAME[c], source: 'server-tld', confidence: 0.45 };
    }
    return null;
  }
  function isCdnLike(name, server, extra) {
    var t = [name, server, extra && (extra.Host || extra.host || extra.servername || extra.sni)].join(' ');
    if (/CF中转|Cloudflare|Anycast|CDN|优选|优选IP/i.test(t)) return true;
    if (/^(104\.(1[6-9]|2[0-9]|3[0-1])\.|172\.(6[4-9]|7[0-1])\.|162\.159\.)/.test(String(server || ''))) return true;
    return false;
  }
  function inferCountry(name, server, extra) {
    extra = extra || {};
    var textName = String(name || '');
    var textFull = [extra.country, extra.countryCode, name, extra.name, server].join(' ');
    var r = inferByExtraCountry(extra) || inferByFlag(textName) || inferByKeyword(textName);
    if (r) return r;
    var c1 = inferByCode(textName);
    if (c1 && !(c1.code === 'CF' && isCdnLike(name, server, extra))) return c1;
    var r2 = inferByKeyword(textFull);
    if (r2) return r2;
    var c2 = inferByCode(textFull);
    if (c2 && !(c2.code === 'CF' && isCdnLike(name, server, extra))) return c2;
    var tld = inferByTld(server);
    if (tld) return tld;
    if (isCdnLike(name, server, extra)) return { code: 'CDN', name: 'CDN/中转', source: 'cdn-hint', confidence: 0.35 };
    return { code: 'UN', name: '未知', source: 'unknown', confidence: 0 };
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
    var out = {}; if (!q) return out;
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
    var extra = x.extra || {};
    var country = inferCountry(x.name, x.server, extra);
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
      countrySource: country.source,
      countryConfidence: country.confidence,
      sourceFormat: x.sourceFormat || '',
      raw: x.raw || '',
      extra: extra
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
    var qidx = body.indexOf('?'); if (qidx >= 0) body = body.slice(0, qidx);
    var main = body;
    if (main.indexOf('@') < 0) { var decoded = base64Decode(main); if (decoded.indexOf('@') >= 0) main = decoded; }
    else { var left = main.split('@')[0]; if (left.indexOf(':') < 0) main = base64Decode(left) + '@' + main.split('@').slice(1).join('@'); }
    var hp = parseHostPort(main.split('@').pop());
    var extra = {}, methodPart = main.indexOf('@') >= 0 ? main.split('@')[0] : '';
    if (methodPart.indexOf(':') >= 0) extra.method = safeDecodeURIComponent(methodPart.split(':')[0]);
    return makeNode({ protocol: 'ss', name: hash || hp.server, server: hp.server, port: hp.port, sourceFormat: 'uri', raw: url, extra: extra });
  }
  function parseGenericUri(url) {
    var raw = String(url), m = raw.match(/^([a-z0-9+.-]+):\/\//i), protocol = m ? m[1].toLowerCase() : 'unknown', body = raw.replace(/^[a-z0-9+.-]+:\/\//i, ''), name = '';
    var hidx = body.indexOf('#'); if (hidx >= 0) { name = safeDecodeURIComponent(body.slice(hidx + 1)); body = body.slice(0, hidx); }
    var query = '', qidx = body.indexOf('?'); if (qidx >= 0) { query = body.slice(qidx + 1); body = body.slice(0, qidx); }
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
      line = line.trim(); if (!line || line.charAt(0) === '#') return;
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
    return Object.keys(map).sort(function (a, b) { return map[b] - map[a] || String(a).localeCompare(String(b)); }).map(function (k) { return { key: k, count: map[k] }; });
  }
  function duplicateGroups(nodes) {
    var map = {};
    nodes.forEach(function (n) { if (!map[n.fingerprint]) map[n.fingerprint] = []; map[n.fingerprint].push(n); });
    return Object.keys(map).filter(function (k) { return map[k].length > 1; }).sort(function (a, b) { return map[b].length - map[a].length; }).map(function (k) { return { fingerprint: k, count: map[k].length, nodes: map[k] }; });
  }
  function analyze(raw, meta) {
    meta = meta || {};
    var parsed = parseSubscription(raw), nodes = parsed.nodes, dupGroups = duplicateGroups(nodes);
    var uniqueCount = nodes.length - dupGroups.reduce(function (acc, g) { return acc + g.count - 1; }, 0);
    return {
      ok: true, version: VERSION, marker: MARKER, generatedAt: nowIso(), source: meta.source || '', size: String(raw || '').length, normalizedSize: parsed.normalizedText.length,
      summary: { total: nodes.length, unique: uniqueCount, duplicates: nodes.length - uniqueCount, protocols: countBy(nodes, 'protocol').length, countries: countBy(nodes, 'country').length, unknown: nodes.filter(function(n){ return n.countryCode === 'UN'; }).length },
      stats: { byProtocol: countBy(nodes, 'protocol'), byCountry: countBy(nodes, 'country'), byCountryCode: countBy(nodes, 'countryCode'), byCountrySource: countBy(nodes, 'countrySource'), bySourceFormat: countBy(nodes, 'sourceFormat') },
      duplicates: dupGroups, nodes: nodes
    };
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
      try { respondJSON(analyze(body, { source: url })); } catch (e) { respondJSON({ ok: false, error: String(e && e.stack || e) }, 500); }
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
    var vmess = 'vmess://' + b64(JSON.stringify({ v: '2', ps: '🇭🇰HK-香港 01', add: 'hk.example.com', port: '443', id: 'demo', aid: '0', net: 'ws', type: 'none', host: '', path: '/ws', tls: 'tls' }));
    var sample = [vmess, 'trojan://password@jp.example.com:443?security=tls#🇯🇵JP-日本 01', 'vless://uuid@sg.example.com:443?encryption=none&security=tls&type=ws#🇸🇬SG-新加坡 01', 'ss://' + b64('aes-128-gcm:pass@us.example.com:8388') + '#🇺🇸US-美国 01', 'trojan://password@jp.example.com:443?security=tls#🇯🇵JP-日本 01 副本', 'vless://uuid@cf.example.com:443?encryption=none&security=tls&type=ws#CF中转节点'].join('\n');
    respondJSON(analyze(sample, { source: 'demo-sample' }));
  }

  function htmlPage() {
    var css = '<style>' +
      '*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;background:#071226;color:#eaf2ff}body:before{content:"";position:fixed;inset:0;background:radial-gradient(circle at 20% 0%,rgba(80,140,255,.28),transparent 32%),radial-gradient(circle at 90% 10%,rgba(26,214,255,.16),transparent 30%);pointer-events:none}.wrap{position:relative;max-width:1180px;margin:0 auto;padding:32px 18px 70px}.hero{background:linear-gradient(135deg,rgba(20,42,78,.92),rgba(8,18,38,.92));border:1px solid rgba(120,160,220,.26);border-radius:28px;padding:26px;box-shadow:0 20px 60px rgba(0,0,0,.35)}h1{margin:0 0 12px;font-size:30px}.muted{color:#9fb1cc}.badge{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(117,168,255,.35);background:rgba(50,103,180,.18);border-radius:999px;padding:6px 10px;color:#bcd8ff;font-size:13px}.panel{margin-top:18px;background:rgba(9,24,50,.78);border:1px solid rgba(105,150,210,.24);border-radius:24px;padding:18px}.row{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center}input,textarea,select,button{font:inherit;border-radius:18px;border:1px solid rgba(120,165,230,.28);background:#071225;color:#eaf2ff;padding:13px 15px;outline:none}textarea{width:100%;min-height:110px;resize:vertical;margin-top:10px}button{cursor:pointer;background:linear-gradient(135deg,#2e7cf7,#13b7ff);border:none;font-weight:800}button.secondary{background:rgba(255,255,255,.09);border:1px solid rgba(120,165,230,.26)}button:active{transform:translateY(1px)}.status{margin-top:12px;white-space:pre-wrap;color:#b8c8e3}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:18px}.card{background:rgba(255,255,255,.07);border:1px solid rgba(120,165,230,.18);border-radius:20px;padding:16px}.num{font-size:28px;font-weight:900}.charts{display:grid;grid-template-columns:1fr 1fr;gap:18px}.bar{display:grid;grid-template-columns:95px 1fr 48px;gap:10px;align-items:center;margin:9px 0}.barline{height:10px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden}.barline i{display:block;height:100%;background:linear-gradient(90deg,#2e7cf7,#14d6ff);border-radius:999px}.tools{display:grid;grid-template-columns:1fr 160px 160px auto auto auto;gap:10px;align-items:center}.check{display:flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap}.check input{width:22px;height:22px;accent-color:#188cff;padding:0}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{padding:13px 10px;border-bottom:1px solid rgba(130,160,210,.16);text-align:left;vertical-align:middle;word-break:break-all}th{color:#bfd3ef;font-size:13px}.pill{display:inline-flex;border:1px solid rgba(90,160,220,.36);background:rgba(64,130,190,.22);border-radius:999px;padding:5px 10px;font-weight:800;color:#cfe9ff}.small{font-size:12px;color:#8ea1bf}.dup{margin:10px 0;padding:12px;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}@media(max-width:760px){.wrap{padding:18px 12px}.row{grid-template-columns:1fr}.grid{grid-template-columns:repeat(2,1fr)}.charts{grid-template-columns:1fr}.tools{grid-template-columns:1fr}.check{justify-content:flex-start}th:nth-child(4),td:nth-child(4),th:nth-child(7),td:nth-child(7){display:none}h1{font-size:25px}.hero{padding:18px}.panel{padding:14px}table{font-size:14px}}</style>';
    var js = '<script>' +
      'var last=null,filtered=[],uniqueOnly=false;function qs(id){return document.getElementById(id)}function status(t){qs("status").textContent=t}function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c]||c})}function setBusy(t){status(t||"处理中……")}function apiJson(u,opt){return fetch(u,opt).then(function(r){return r.text().then(function(t){try{return JSON.parse(t)}catch(e){throw new Error(t||("HTTP "+r.status))}})})}function loadUrl(){var u=qs("url").value.trim();if(!u){status("请先输入订阅 URL。");return}setBusy("正在拉取订阅并解析……");apiJson("/api/analyze?url="+encodeURIComponent(u)).then(render).catch(function(e){status("拉取失败："+e.message)})}function loadText(){var t=qs("raw").value;if(!t.trim()){status("请先粘贴订阅原文或 Clash YAML。");return}setBusy("正在解析粘贴内容……");apiJson("/api/analyze-text",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({raw:t})}).then(render).catch(function(e){status("解析失败："+e.message)})}function loadSample(){setBusy("正在载入演示数据……");apiJson("/api/sample").then(render).catch(function(e){status("演示数据失败："+e.message)})}function cards(s){var arr=[["总节点",s.total],["唯一节点",s.unique],["重复节点",s.duplicates],["协议数",s.protocols],["未知",s.unknown||0]];qs("cards").innerHTML=arr.map(function(x){return "<div class=card><div class=muted>"+x[0]+"</div><div class=num>"+x[1]+"</div></div>"}).join("")}function bars(id,arr){var max=1;(arr||[]).forEach(function(x){if(x.count>max)max=x.count});qs(id).innerHTML=(arr||[]).slice(0,12).map(function(x){var w=Math.max(3,Math.round(x.count/max*100));return "<div class=bar><div>"+esc(x.key)+"</div><div class=barline><i style=width:"+w+"%></i></div><div>"+x.count+"</div></div>"}).join("")||"<p class=muted>暂无数据</p>"}function fillFilters(){var ps={},cs={};(last.nodes||[]).forEach(function(n){ps[n.protocol||"未知"]=1;cs[n.country||"未知"]=1});qs("protocol").innerHTML="<option value=\"\">全部协议</option>"+Object.keys(ps).sort().map(function(k){return "<option>"+esc(k)+"</option>"}).join("");qs("country").innerHTML="<option value=\"\">全部地区</option>"+Object.keys(cs).sort().map(function(k){return "<option>"+esc(k)+"</option>"}).join("")}function apply(){if(!last){return}var q=qs("search").value.toLowerCase(),p=qs("protocol").value,c=qs("country").value;var seen={};filtered=(last.nodes||[]).filter(function(n){if(p&&n.protocol!==p)return false;if(c&&n.country!==c)return false;var hay=[n.name,n.server,n.country,n.protocol,n.countryCode].join(" ").toLowerCase();if(q&&hay.indexOf(q)<0)return false;if(uniqueOnly){if(seen[n.fingerprint])return false;seen[n.fingerprint]=1}return true});renderTable()}function renderTable(){qs("count").textContent="当前显示 "+filtered.length+" / "+(last.nodes||[]).length+" 个节点";var rows=filtered.slice(0,800).map(function(n,i){var tls=(n.network||"")+(n.tls?" / "+n.tls:"");var src=n.countrySource&&n.countrySource!=="unknown"?"<div class=small>识别："+esc(n.countrySource)+"</div>":"";return "<tr><td>"+(i+1)+"</td><td>"+esc(n.name)+"</td><td><span class=pill>"+esc(n.protocol)+"</span></td><td>"+esc(n.country)+" <span class=small>"+esc(n.countryCode)+"</span>"+src+"</td><td>"+esc(n.server)+"</td><td>"+esc(n.port)+"</td><td>"+esc(tls)+"<div class=small>"+esc(n.fingerprint)+"</div></td></tr>"}).join("");qs("tbody").innerHTML=rows||"<tr><td colspan=7 class=muted>暂无数据</td></tr>"}function renderDup(){var d=last.duplicates||[];qs("dups").innerHTML=d.length?d.slice(0,30).map(function(g){return "<div class=dup><b>"+esc(g.fingerprint)+"</b><div class=small>重复 "+g.count+" 个</div>"+(g.nodes||[]).map(function(n){return "<div>· "+esc(n.name)+"</div>"}).join("")+"</div>"}).join(""):"<p class=muted>暂无重复节点。</p>"}function render(data){if(!data||!data.ok){status("解析失败："+(data&&data.error?data.error:"未知错误"));return}last=data;cards(data.summary||{});bars("protocolChart",data.stats.byProtocol||[]);bars("countryChart",data.stats.byCountry||[]);fillFilters();status("解析完成。版本："+data.version+"，未知节点："+(data.summary.unknown||0));uniqueOnly=false;qs("unique").checked=false;apply();renderDup()}function toCsv(rows){var h=["name","protocol","country","countryCode","countrySource","server","port","network","tls","fingerprint"];return [h.join(",")].concat(rows.map(function(n){return h.map(function(k){return "\\\""+String(n[k]||"").replace(/"/g,"\"\"")+"\\\""}).join(",")})).join("\\n")}function download(name,text,type){var a=document.createElement("a"),blob=new Blob([text],{type:type||"text/plain"});a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}function exportJson(){if(!last){status("暂无数据可导出。");return}download("subviz-analysis.json",JSON.stringify(last,null,2),"application/json")}function exportCsv(){if(!last){status("暂无数据可导出。");return}download("subviz-nodes.csv",toCsv(filtered.length?filtered:last.nodes),"text/csv")}window.addEventListener("DOMContentLoaded",function(){qs("btnUrl").onclick=loadUrl;qs("btnText").onclick=loadText;qs("btnSample").onclick=loadSample;qs("search").oninput=apply;qs("protocol").onchange=apply;qs("country").onchange=apply;qs("unique").onchange=function(){uniqueOnly=this.checked;apply()};qs("exportJson").onclick=exportJson;qs("exportCsv").onclick=exportCsv;status("准备就绪。访问域名：http://subviz.store/ 。当前脚本版本 v' + VERSION + '")});' +
      '</script>';
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>SubViz Surge</title>' + css + '</head><body><div class="wrap"><div class="hero"><span class="badge">Surge Local UI · v' + VERSION + '</span><h1>订阅节点可视化分析</h1><p class="muted">拉取或粘贴机场/代理订阅，解析节点分布、协议、国家/地区、数量、重复项，并支持筛选与导出。v0.1.9 已增强国旗 / ISO / 中文国家名识别。</p><div class="row"><input id="url" placeholder="订阅 URL，例如 https://example.com/sub"><button id="btnUrl" type="button">拉取分析</button><button id="btnSample" class="secondary" type="button">演示数据</button></div><textarea id="raw" placeholder="或粘贴订阅原文 / Clash YAML"></textarea><button id="btnText" class="secondary" type="button" style="margin-top:10px;width:100%">分析粘贴内容</button><div id="status" class="status">准备就绪。</div></div><div id="cards" class="grid"></div><div class="charts"><div class="panel"><h2>协议分布</h2><div id="protocolChart" class="muted">暂无数据</div></div><div class="panel"><h2>国家 / 地区分布</h2><div id="countryChart" class="muted">暂无数据</div></div></div><div class="panel"><h2>节点列表</h2><p id="count" class="muted">暂无数据</p><div class="tools"><input id="search" placeholder="搜索节点名 / 服务器 / 地区"><select id="protocol"><option value="">全部协议</option></select><select id="country"><option value="">全部地区</option></select><label class="check"><input id="unique" type="checkbox">仅唯一节点</label><button id="exportCsv" class="secondary" type="button">导出 CSV</button><button id="exportJson" class="secondary" type="button">导出 JSON</button></div><div style="overflow:auto;margin-top:14px;border:1px solid rgba(120,165,230,.18);border-radius:18px"><table><thead><tr><th style="width:52px">#</th><th>节点名</th><th style="width:100px">协议</th><th style="width:150px">国家/地区</th><th>服务器</th><th style="width:80px">端口</th><th>传输/TLS</th></tr></thead><tbody id="tbody"><tr><td colspan="7" class="muted">暂无数据</td></tr></tbody></table></div></div><div class="panel"><h2>去重统计</h2><div id="dups"><p class="muted">暂无重复节点。</p></div></div></div>' + js + '</body></html>';
  }

  function handle() {
    var req = typeof $request !== 'undefined' ? $request : { url: '' };
    var method = String(req.method || 'GET').toUpperCase();
    if (method === 'OPTIONS') { respond(204, ''); return; }
    var url = req.url || '', path = getPath(url), q = parseQuery(url);
    if (path === '/api/health') { respondJSON({ ok: true, name: 'SubViz Surge', version: VERSION, marker: MARKER }); return; }
    if (path === '/api/sample') { handleSample(); return; }
    if (path === '/api/analyze') { handleAnalyzeByUrl(q.url || q.u || ''); return; }
    if (path === '/api/analyze-text') { handleAnalyzeText(req.body || ''); return; }
    if (path === '/' || path === '' || path === '/index.html') { respond(200, htmlPage(), { 'Content-Type': 'text/html; charset=utf-8' }); return; }
    respondJSON({ ok: false, error: 'Not Found', path: path, version: VERSION }, 404);
  }

  try { handle(); } catch (e) { respondJSON({ ok: false, error: String(e && e.stack || e), version: VERSION }, 500); }
  return { version: VERSION };
})();
