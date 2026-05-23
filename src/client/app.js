var DATA=null;
var GEO_CACHE={};
var GEO_RUNNING=false;
var SELECTED={};
function selectedCount(){return Object.keys(SELECTED).filter(function(k){return SELECTED[k]}).length}
function selectedNodes(){if(!DATA)return[];return (DATA.nodes||[]).filter(function(n){return n&&n._sid&&SELECTED[n._sid]})}
function operationNodes(action){var a=selectedNodes();if(!a.length){st('请先勾选要'+action+'的节点，或点击“全选当前”。');return []}return a}
function updateSelectUI(){var c=selectedCount();var el=$('selCount');if(el)el.textContent='已选 '+c+' 个'}
function toggleSelect(sid,checked){if(!sid)return;if(checked)SELECTED[sid]=1;else delete SELECTED[sid];updateSelectUI()}
window.toggleSelect=toggleSelect;
function selectCurrent(){var a=filtered();a.forEach(function(n){if(n._sid)SELECTED[n._sid]=1});apply();st('已全选当前筛选结果：'+a.length+' 个节点')}
function invertCurrent(){filtered().forEach(function(n){if(!n._sid)return;if(SELECTED[n._sid])delete SELECTED[n._sid];else SELECTED[n._sid]=1});apply();st('已反选当前筛选结果')}
function clearSelected(){SELECTED={};apply();st('已清空选择')}
window.selectCurrent=selectCurrent;window.invertCurrent=invertCurrent;window.clearSelected=clearSelected;
function $(id){return document.getElementById(id)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c})}
function st(s){$('status').textContent=s}
function zhErr(s){s=String(s||'');var raw=s;var lower=s.toLowerCase();if(!s)return '';if(s.indexOf('不支持该协议')>=0||lower.indexOf('unsupported protocol')>=0)return '不支持该协议进行落地检测';if(s.indexOf('落地查询失败')>=0||lower.indexOf('landing lookup failed')>=0)return '落地查询失败：所有备用接口或临时代理尝试均失败';if(lower.indexOf('timeout')>=0||s.indexOf('超时')>=0)return '请求超时：节点不可用、速度过慢，或查询接口被阻断';if(lower.indexOf('websocket closed')>=0)return 'WebSocket 被服务端关闭：通常是 Host/SNI/path 不匹配，或 CDN/服务端拒绝握手';if(lower.indexOf('ss missing cipher')>=0||s.indexOf('SS 节点缺少')>=0)return 'SS 节点缺少加密方式或密码：多半是解析没有识别 cipher/password';if(lower.indexOf('policy descriptor')>=0)return 'Surge 临时代理策略创建失败：该节点参数可能不兼容';if(lower.indexOf('http 403')>=0)return '查询接口返回 403：接口拒绝访问，或该节点出口被限制';var m=s.match(/HTTP\s*(\d+)/i);if(m)return '查询接口返回 HTTP '+m[1];if(s.indexOf('节点数据不是有效 JSON')>=0||lower.indexOf('invalid node json')>=0)return '节点数据格式异常';if(s.indexOf('内部 GEOIP')>=0||lower.indexOf('internal geoip')>=0)return '内部 GEOIP 查询失败：当前 Surge 可能不支持 $utils.geoip 或没有 GEOIP 数据库';if(s.indexOf('查询接口返回内容解析失败')>=0||lower.indexOf('parse failed')>=0)return '查询接口返回内容解析失败';if(lower==='failed')return '检测失败';return raw}
function bar(it,max){return '<div class="bar"><div>'+esc(it.key)+'</div><div class="track"><div class="fill" style="width:'+(max?Math.round(it.count/max*100):0)+'%"></div></div><b>'+it.count+'</b></div>'}
function uniq(nodes){var m={},a=[];(nodes||[]).forEach(function(n){var k=n.fingerprint||[n.protocol,n.server,n.port,n.network,n.tls].join('|').toLowerCase();if(!m[k]){m[k]=1;a.push(n)}});return a}
function addCount(m,k){k=k||'未知';m[k]=(m[k]||0)+1}
function toArr(m){return Object.keys(m).map(function(k){return{key:k,count:m[k]}}).sort(function(a,b){return b.count-a.count})}
function recalc(d){var ns=d.nodes||[],byP={},byC={},byCC={},byF={},seen={},dups=0;ns.forEach(function(n){addCount(byP,n.protocol);addCount(byC,n.country);addCount(byCC,n.countryCode||'UN');addCount(byF,n.sourceFormat||'unknown');var fp=n.fingerprint||[n.protocol,n.server,n.port,n.network,n.tls].join('|').toLowerCase();if(seen[fp])dups++;else seen[fp]=1});d.summary={total:ns.length,unique:Object.keys(seen).length,duplicates:dups,protocols:Object.keys(byP).length,countries:Object.keys(byC).length};d.stats={byProtocol:toArr(byP),byCountry:toArr(byC),byCountryCode:toArr(byCC),bySourceFormat:toArr(byF)};return d}
function render(d){var isNew=(d!==DATA);if(isNew)SELECTED={};(d.nodes||[]).forEach(function(n,i){if(!n._sid)n._sid='sv_'+i;if(!n.originalName)n.originalName=n.name});DATA=recalc(d);var s=DATA.summary||{};var labels=['总节点','唯一节点','重复节点','协议数','国家/地区'];var vals=[s.total,s.unique,s.duplicates,s.protocols,s.countries];$('cards').innerHTML=labels.map(function(l,i){return '<div class="stat"><span class="muted">'+l+'</span><b>'+(vals[i]||0)+'</b></div>'}).join('');var p=DATA.stats.byProtocol||[],c=DATA.stats.byCountry||[];$('protocols').innerHTML=p.length?p.map(function(x){return bar(x,p[0].count)}).join(''):'暂无数据';$('countries').innerHTML=c.length?c.slice(0,30).map(function(x){return bar(x,c[0].count)}).join(''):'暂无数据';fillSelect('pf',p);fillSelect('cf',c);apply()}
function fillSelect(id,arr){var old=$(id).value;$(id).innerHTML='<option value="">'+(id=='pf'?'全部协议':'全部地区')+'</option>'+(arr||[]).map(function(x){return '<option value="'+esc(x.key)+'">'+esc(x.key)+' ('+x.count+')</option>'}).join('');$(id).value=old}
function filtered(){if(!DATA)return[];var ns=$('unique').checked?uniq(DATA.nodes):DATA.nodes;var q=$('q').value.toLowerCase(),pf=$('pf').value,cf=$('cf').value;return ns.filter(function(n){return(!pf||n.protocol==pf)&&(!cf||n.country==cf)&&(!q||(String(n.name)+String(n.server)+String(n.country)+String(n.protocol)+String(n.port)).toLowerCase().indexOf(q)>=0)})}
function meta(n){var a=[];if(n.country)a.push(n.country);if(n.network)a.push(n.network);if(String(n.tls)==='true')a.push('TLS');if(n.geoCity)a.push(n.geoCity);if(n.aliveOK===true)a.push('可用 '+n.aliveLatency+'ms');else if(n.aliveOK===false)a.push('不可用:'+aliveErr(n.aliveError));if(n.landingError)a.push('失败:'+zhErr(n.landingError));return a.join(' · ')}
function apply(){var a=filtered(),sc=selectedCount();$('count').textContent='当前显示 '+a.length+' / '+((DATA&&DATA.summary&&DATA.summary.total)||0)+' 个节点，已选 '+sc+' 个';updateSelectUI();$('tbody').innerHTML=a.map(function(n,i){var chk=SELECTED[n._sid]?' checked':'';return '<tr><td><input type="checkbox" class="rowchk" data-sid="'+esc(n._sid||'')+'" onchange="window.toggleSelect&&window.toggleSelect(this.dataset.sid,this.checked)"'+chk+'></td><td>'+(i+1)+'</td><td>'+esc(n.name)+'<div class="small">'+esc(meta(n))+'</div></td><td><span class="tag">'+esc(n.protocol)+'</span></td><td>'+esc(n.server)+'</td><td>'+esc(n.port)+'</td></tr>'}).join('')||'<tr><td colspan="6" class="muted">暂无数据</td></tr>'}
function loadJSON(url,opt){return fetch(url,opt).then(function(r){return r.text()}).then(function(t){try{return JSON.parse(t)}catch(e){throw new Error(t.slice(0,200)||e)}})}
function analyzeURL(){var u=$('url').value.trim();if(!u){st('请先输入订阅 URL');return}st('按钮已触发，正在拉取分析…');loadJSON('/api/analyze?url='+encodeURIComponent(u)+'&t='+Date.now()).then(function(d){if(!d.ok)throw new Error(d.error||'error');render(d);st('分析完成：'+d.summary.total+' 个节点')}).catch(function(e){st('失败：'+e.message)})}
function sample(){st('正在载入演示数据…');loadJSON('/api/sample?t='+Date.now()).then(render).then(function(){st('演示数据已加载')}).catch(function(e){st('失败：'+e.message)})}
function analyzeText(){var t=$('raw').value;if(!t.trim()){st('请先粘贴订阅内容');return}st('正在分析粘贴内容…');loadJSON('/api/analyze-text?t='+Date.now(),{method:'POST',body:t,headers:{'Content-Type':'text/plain;charset=utf-8'}}).then(function(d){if(!d.ok)throw new Error(d.error||'error');render(d);st('分析完成：'+d.summary.total+' 个节点')}).catch(function(e){st('失败：'+e.message)})}
function flag(cc){cc=String(cc||'').toUpperCase();if(cc==='CDN')return '\uD83D\uDD00';if(!/^[A-Z]{2}$/.test(cc))return '\uD83C\uDFC1';return cc.replace(/./g,function(ch){return String.fromCodePoint(127397+ch.charCodeAt(0))})}
function suffix(n,i){var nm=String(n.name||'');var m=nm.match(/[-_ ]([A-Fa-f0-9]{4,10})\b/);if(m)return m[1].toUpperCase();var base=String(n.server||'')+':'+String(n.port||'')+':'+i;var h=0;for(var x=0;x<base.length;x++){h=((h<<5)-h)+base.charCodeAt(x);h|=0}return ('00000000'+(h>>>0).toString(16).toUpperCase()).slice(-8)}
function isUnknown(n){return !n.countryCode||n.countryCode==='UN'||n.country==='未知'||n.countrySource==='none'}
function applyGeoToServer(server,geo){(DATA.nodes||[]).forEach(function(n,idx){if(n.server!==server||!isUnknown(n)||!geo||!geo.countryCode)return;n.countryCode=geo.countryCode;n.country=geo.country||n.country;n.countrySource='geoip';n.countryConfidence=geo.countryConfidence||78;n.geoProvider=geo.provider;n.geoQuery=geo.query;n.geoCity=geo.city||'';n.geoRegion=geo.region||'';n.geoISP=geo.isp||'';n.geoASN=geo.asn||'';n.name=flag(n.countryCode)+' '+n.country+'-'+suffix(n,idx)})}
function applyGeoToTargets(server,geo,targets){(targets||[]).forEach(function(n,idx){if(n.server!==server||!isUnknown(n)||!geo||!geo.countryCode)return;n.countryCode=geo.countryCode;n.country=geo.country||n.country;n.countrySource='geoip';n.countryConfidence=geo.countryConfidence||78;n.geoProvider=geo.provider;n.geoQuery=geo.query;n.geoCity=geo.city||'';n.geoRegion=geo.region||'';n.geoISP=geo.isp||'';n.geoASN=geo.asn||'';n.name=flag(n.countryCode)+' '+n.country+'-'+suffix(n,idx);if(n.extra)n.extra.name=n.name})}
function geoFill(){if(!DATA){st('请先拉取或分析订阅');return}if(GEO_RUNNING){st('已有 GeoIP / 落地检测任务正在运行；如果刚才点过落地检测没继续，请刷新页面后重试。');return}var targets=operationNodes('GeoIP 补全');if(!targets.length)return;var set={},servers=[];targets.forEach(function(n){if(isUnknown(n)&&n.server&&!set[n.server]){set[n.server]=1;servers.push(n.server)}});if(!servers.length){st('选中节点里没有需要 GeoIP 补全的未知节点');return}GEO_RUNNING=true;var total=servers.length,done=0,ok=0,fail=0,idx=0,con=3;st('开始对选中节点做在线 IP 归属补全：0 / '+total);function next(){while(con>0&&idx<servers.length){(function(sv){idx++;con--;var p=GEO_CACHE[sv]?Promise.resolve(GEO_CACHE[sv]):loadJSON('/api/geoip?host='+encodeURIComponent(sv)+'&t='+Date.now()).then(function(g){GEO_CACHE[sv]=g;return g});p.then(function(g){if(g&&g.ok&&g.countryCode){applyGeoToTargets(sv,g,targets);ok++}else fail++}).catch(function(){fail++}).then(function(){done++;con++;if(done%5===0||done===total){recalc(DATA);apply();st('在线 IP 归属补全：'+done+' / '+total+'，成功 '+ok+'，失败 '+fail)}if(done>=total){GEO_RUNNING=false;render(DATA);st('补全完成：成功 '+ok+'，失败 '+fail+'。已将选中的未知节点按 GeoIP 重命名。')}else next()})})(servers[idx])}}next()}
var DEFAULT_DROP='linuxdo,History,OpenRay,Telegram,TG,GitHub,Github,DeltaKroneckerGithub,WangCai,官网,官方,网站,主页,频道,群组,订阅,免费,公益,剩余,流量,到期,过期,有效期,套餐,重置,expire,expiry,traffic,reset,GB,MB,TB,官网地址,永久官网,域名,网址,节点,机场,订阅链接,欢迎,加入,关注';
var DEFAULT_KEEP='倍率,原生,机房,商宽,家宽,住宅,广播,专线,中转,直连,隧道,IEPL,IPLC,BGP,CN2,CMI,9929,4837,0.2x,0.5x,1x,2x,3x,5x,10x';
function codeName(n){var cc=String(n.countryCode||'').toUpperCase();var cn=String(n.country||'');if(!cc||cc==='UN'){cc='UN';cn=cn&&cn!=='未知'?cn:'未知'}if(cc==='CDN'){cn='中转'}return {cc:cc,cn:cn,key:cc+'|'+cn}}
function padNum(n,w){n=String(n||'');while(n.length<w)n='0'+n;return n}
function splitRules(v,def){v=String(v||'').trim();if(!v)v=def||'';return v.split(/[\n,，;；]+/).map(function(x){return String(x||'').trim()}).filter(Boolean)}
function escRe(s){return String(s||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function ruleValue(id,def){var el=$(id);return el?el.value:def}
function cleanupOptions(){return {drop:splitRules(ruleValue('dropWords',DEFAULT_DROP),DEFAULT_DROP),keep:splitRules(ruleValue('keepTags',DEFAULT_KEEP),DEFAULT_KEEP),tpl:String(ruleValue('nameTpl','{flag} {code}-{country} {index} {tags}')||'{flag} {code}-{country} {index} {tags}')}}
function stripNoise(t,drop){t=String(t||'');t=t.replace(/https?:\/\/\S+/ig,' ');t=t.replace(/www\.[^\s|]+/ig,' ');t=t.replace(/[A-Za-z0-9._%+-]+\.[A-Za-z]{2,}(?:[\/\w?=&%.:+-]*)?/g,' ');t=t.replace(/@\w+/g,' ');t=t.replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]/g,' ');(drop||[]).forEach(function(w){if(!w)return;var re=new RegExp(escRe(w),'ig');t=t.replace(re,' ')});return t.replace(/[\[\]【】()（）{}<>《》]/g,' ').replace(/[|｜/\\]+/g,' ').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim()}
function uniqTags(arr){var m={},out=[];arr.forEach(function(x){x=String(x||'').trim();if(!x||m[x.toLowerCase()])return;m[x.toLowerCase()]=1;out.push(x)});return out}
function normalizeRate(r){r=String(r||'').replace(/倍率\s*[:：=]?\s*/,'').replace(/\s+/g,'').replace(/×/g,'x').replace(/倍$/,'x').replace(/X$/,'x');if(/^\d+(?:\.\d+)?$/.test(r))r=r+'x';return /^\d+(?:\.\d+)?x$/.test(r)?r:''}
function extractNameTags(n,opt){opt=opt||cleanupOptions();var e=n.extra||{};var src=[n.originalName,n.rawName,n.name,e.name,e.rate,e.ratio,e['倍率'],e.tag,e.label,e.remark,e.remarks,e.note,e.sni,e.servername,e.host,e.Host,e.path,e.plugin,e.mode].join(' ');var raw=String(src||''),txt=stripNoise(raw,opt.drop);var tags=[];var ms=raw.match(/(?:\d+(?:\.\d+)?\s*(?:x|X|×|倍)|倍率\s*[:：=]?\s*\d+(?:\.\d+)?)/g)||[];ms.forEach(function(r){r=normalizeRate(r);if(r)tags.push(r)});(opt.keep||[]).forEach(function(k){var kk=String(k||'').trim();if(!kk)return;if(/^\d+(?:\.\d+)?x$/i.test(kk)){if(new RegExp(escRe(kk),'i').test(raw))tags.push(kk.toLowerCase());return}var re=new RegExp(escRe(kk),'i');if(re.test(txt)||re.test(raw))tags.push(kk.toUpperCase()===kk?kk:kk)});return uniqTags(tags)}
function templateCleanName(n,seq,width,opt){opt=opt||cleanupOptions();var c=codeName(n);var tags=extractNameTags(n,opt);var mp={flag:flag(c.cc),code:c.cc,country:c.cn,index:padNum(seq,width),seq:String(seq),tags:tags.join(' '),tag:tags.join(' ')};var out=String(opt.tpl||'{flag} {code}-{country} {index} {tags}').replace(/\{(flag|code|country|index|seq|tags|tag)\}/g,function(_,k){return mp[k]||''});return out.replace(/\s+/g,' ').replace(/\s+([,，;；])/g,'$1').trim()}
function cleanNames(){if(!DATA){st('请先拉取或分析订阅');return}var nodes=operationNodes('清理节点名');if(!nodes.length)return;var opt=cleanupOptions();st('正在按清理规则重命名选中节点……');var totals={},seq={},cnt=0;nodes.forEach(function(n){if(!n.originalName)n.originalName=n.name;if(!n.rawName)n.rawName=n.originalName;var k=codeName(n).key;totals[k]=(totals[k]||0)+1});nodes.forEach(function(n){var c=codeName(n),w=Math.max(2,String(totals[c.key]||1).length);seq[c.key]=(seq[c.key]||0)+1;var nn=templateCleanName(n,seq[c.key],w,opt);if(nn&&nn!==n.name){n.name=nn;if(n.extra)n.extra.name=nn;cnt++}});render(DATA);st('已按规则清理选中节点名 '+cnt+' 个。已保留 rawName/originalName，可随时恢复；复制和导出会使用清理后的名称。')}
window.cleanNames=cleanNames;
function restoreNames(){if(!DATA){st('请先拉取或分析订阅');return}var nodes=operationNodes('恢复原始名');if(!nodes.length)return;var cnt=0;nodes.forEach(function(n){var old=n.rawName||n.originalName;if(old&&old!==n.name){n.name=old;if(n.extra)n.extra.name=old;cnt++}});render(DATA);st('已恢复选中节点原始名称 '+cnt+' 个')}
window.restoreNames=restoreNames;
function dl(name,txt,type){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:type||'text/plain;charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1000)}
function b64utf8(s){return btoa(unescape(encodeURIComponent(String(s||''))))}
function b64url(s){return b64utf8(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function enc(s){return encodeURIComponent(String(s==null?'':s))}
function qyaml(s){s=String(s==null?'':s);return '"'+s.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n')+'"'}
function yamlKey(k){k=String(k||'');return /^[A-Za-z0-9_-]+$/.test(k)?k:qyaml(k)}
function isBoolKey(k){return /^(tls|udp|skip-cert-verify|allow-insecure|insecure|udp-relay|fast-open|tfo|smux|xudp)$/i.test(String(k||''))}
function isNumKey(k){return /^(port|alterId|alterid|aid|up|down|mtu|recv-window|recv_window|hop-interval|hop_interval|download-bandwidth|upload-bandwidth)$/i.test(String(k||''))}
function yval(v,k){if(v===true||v===false)return String(v);if(v===null||v===undefined||v==='')return '""';var s=String(v);if(isBoolKey(k)&&/^(true|false)$/i.test(s))return s.toLowerCase();if(isNumKey(k)&&/^[-+]?\d+(\.\d+)?$/.test(s))return s;return qyaml(s)}
function deepClone(v){if(v===undefined||typeof v==='function')return undefined;if(Array.isArray(v))return v.map(deepClone).filter(function(x){return x!==undefined});if(v&&typeof v==='object'){var r={};Object.keys(v).forEach(function(k){var x=deepClone(v[k]);if(x!==undefined)r[k]=x});return r}return v}
function clone(o){var r={},drop={raw:1,extra:1,fingerprint:1,_sid:1,originalName:1,rawName:1,nameBeforeAlive:1,aliveOK:1,aliveLatency:1,aliveStatus:1,aliveError:1,landingError:1,geoProvider:1,geoQuery:1,geoCity:1,geoRegion:1,geoISP:1,geoASN:1,country:1,countryCode:1,countrySource:1,countryConfidence:1,sourceFormat:1};o=o||{};Object.keys(o).forEach(function(k){if(drop[k]||o[k]===undefined)return;var v=deepClone(o[k]);if(v!==undefined)r[k]=v});return r}
function firstNonEmpty(){for(var i=0;i<arguments.length;i++){var v=arguments[i];if(v!==null&&v!==undefined&&String(v)!=='')return v}return ''}
function pruneEmpty(v){if(Array.isArray(v)){for(var i=v.length-1;i>=0;i--){var x=pruneEmpty(v[i]);if(x===undefined)v.splice(i,1);else v[i]=x}return v.length?v:undefined}if(v&&typeof v==='object'){Object.keys(v).forEach(function(k){var x=pruneEmpty(v[k]);if(x===undefined)delete v[k];else v[k]=x});return Object.keys(v).length?v:undefined}if(v===undefined||v===null||v==='')return undefined;return v}
function getWSPath(e){return firstNonEmpty(e.path,e['ws-path'],e['ws-opts']&&e['ws-opts'].path)}
function getWSHost(e){return firstNonEmpty(e.Host,e.host,e['ws-host'],e['ws-opts']&&e['ws-opts'].headers&&e['ws-opts'].headers.Host,e['ws-opts']&&e['ws-opts'].headers&&e['ws-opts'].headers.host,e.headers&&e.headers.Host,e.headers&&e.headers.host)}
function getGrpcService(e){return firstNonEmpty(e['grpc-service-name'],e.serviceName,e['service-name'],e['grpc-opts']&&e['grpc-opts']['grpc-service-name'],e['grpc-opts']&&e['grpc-opts']['service-name'],e['grpc-opts']&&e['grpc-opts'].serviceName)}
function getRealityPBK(e){return firstNonEmpty(e['reality-public-key'],e['public-key'],e.publicKey,e.pbk,e['reality-opts']&&e['reality-opts']['public-key'],e['reality-opts']&&e['reality-opts'].publicKey,e['reality-opts']&&e['reality-opts'].pbk)}
function getRealitySID(e){return firstNonEmpty(e['reality-short-id'],e['short-id'],e.shortId,e.sid,e['reality-opts']&&e['reality-opts']['short-id'],e['reality-opts']&&e['reality-opts'].shortId,e['reality-opts']&&e['reality-opts'].sid)}
function getFP(e){return firstNonEmpty(e['client-fingerprint'],e.fingerprint,e.fp)}
function getSNI(e){return firstNonEmpty(e.sni,e.servername,e.serverName,e['server-name'],e.server_name)}
function getALPN(e){var a=e.alpn;if(Array.isArray(a))return a.join(',');return firstNonEmpty(a,e.alpns)}
function normalizeClashForExport(o,n){o=o||{};n=n||{};if(!o.name)o.name=n.name;if(!o.type)o.type=n.protocol;if(!o.server)o.server=n.server;if(!o.port)o.port=n.port;if(n.network&&!o.network)o.network=n.network;if(n.tls&&!o.tls)o.tls=n.tls;var net=String(o.network||'').toLowerCase();if(net==='websocket')o.network='ws';if(net==='h2')o.network='grpc';if(String(o.network||'').toLowerCase()==='ws'){var path=getWSPath(o);var host=getWSHost(o);if(path||host){if(!o['ws-opts']||typeof o['ws-opts']!=='object')o['ws-opts']={};if(path&&!o['ws-opts'].path)o['ws-opts'].path=path;if(host){if(!o['ws-opts'].headers||typeof o['ws-opts'].headers!=='object')o['ws-opts'].headers={};if(!o['ws-opts'].headers.Host&&!o['ws-opts'].headers.host)o['ws-opts'].headers.Host=host}}delete o.path;delete o['ws-path'];delete o.Host;delete o.host;delete o['ws-host']}var svc=getGrpcService(o);if(String(o.network||'').toLowerCase()==='grpc'||svc){o.network='grpc';if(svc){if(!o['grpc-opts']||typeof o['grpc-opts']!=='object')o['grpc-opts']={};if(!o['grpc-opts']['grpc-service-name'])o['grpc-opts']['grpc-service-name']=svc}delete o['grpc-service-name'];delete o.serviceName;delete o['service-name']}var pbk=getRealityPBK(o);var sid=getRealitySID(o);if(pbk||sid){if(!o['reality-opts']||typeof o['reality-opts']!=='object')o['reality-opts']={};if(pbk&&!o['reality-opts']['public-key'])o['reality-opts']['public-key']=pbk;if(sid&&!o['reality-opts']['short-id'])o['reality-opts']['short-id']=sid;delete o['reality-public-key'];delete o['public-key'];delete o.publicKey;delete o.pbk;delete o['reality-short-id'];delete o['short-id'];delete o.shortId;delete o.sid}return pruneEmpty(o)||{} }
function yamlEmit(lines,indent,key,val){if(val===undefined||typeof val==='function')return;var sp=' '.repeat(indent);if(Array.isArray(val)){if(!val.length){lines.push(sp+yamlKey(key)+': []');return}lines.push(sp+yamlKey(key)+':');val.forEach(function(x){if(x&&typeof x==='object'){lines.push(sp+'  -');Object.keys(x).forEach(function(ck){yamlEmit(lines,indent+4,ck,x[ck])})}else lines.push(sp+'  - '+yval(x,key))});return}if(val&&typeof val==='object'){var ks=Object.keys(val).filter(function(k){return val[k]!==undefined&&typeof val[k]!=='function'});if(!ks.length){lines.push(sp+yamlKey(key)+': {}');return}lines.push(sp+yamlKey(key)+':');ks.forEach(function(ck){yamlEmit(lines,indent+2,ck,val[ck])});return}lines.push(sp+yamlKey(key)+': '+yval(val,key))}
function orderedKeys(o){var order=['type','server','port','cipher','uuid','password','username','alterId','alterid','network','tls','udp','sni','servername','server-name','client-fingerprint','flow','encryption','skip-cert-verify','alpn','ws-opts','grpc-opts','reality-opts','plugin','plugin-opts','headers','obfs','obfs-password','up','down','auth','auth-str','token','version'];var used={},out=[];order.forEach(function(k){if(o[k]!==undefined&&k!=='name'){out.push(k);used[k]=1}});Object.keys(o).forEach(function(k){if(k!=='name'&&!used[k])out.push(k)});return out}
function exportNodes(){var a=selectedNodes();if(!a.length)throw new Error('请先勾选要复制/导出的节点，或点击“全选当前”');return a}
function toClashYAML(){var a=exportNodes();if(!a.length)throw new Error('没有可导出的节点');var lines=['mixed-port: 7890','allow-lan: false','mode: rule','log-level: info','','proxies:'];a.forEach(function(n){var o=normalizeClashForExport(clone(n.extra),n);o.name=n.name;o.type=o.type||n.protocol;o.server=o.server||n.server;o.port=o.port||n.port;lines.push('  - name: '+qyaml(o.name));orderedKeys(o).forEach(function(k){yamlEmit(lines,4,k,o[k])})});lines.push('','proxy-groups:','  - name: '+qyaml('🚀 节点选择'),'    type: select','    proxies:');a.forEach(function(n){lines.push('      - '+qyaml(n.name))});lines.push('','rules:','  - MATCH,'+qyaml('🚀 节点选择'));return lines.join('\n')+'\n'}
function uriHost(h){h=String(h||'');return h.indexOf(':')>=0&&h[0]!=='['?'['+h+']':h}
function addQ(q,k,v){if(v===null||v===undefined||String(v)==='')return;q.push(enc(k)+'='+enc(v))}
function addBoolQ(q,k,v){if(v===null||v===undefined||v==='')return;var s=String(v).toLowerCase();q.push(enc(k)+'='+(s==='true'||s==='1'||s==='yes'?'1':'0'))}
function tlsSecurity(e){var sec=String(e.security||'').toLowerCase();if(sec==='reality')return 'reality';if(sec==='tls'||String(e.tls).toLowerCase()==='true')return 'tls';return ''}
function addTransportQ(q,e){var net=String(e.network||e.net||'').toLowerCase();if(net==='websocket')net='ws';if(net==='h2')net='grpc';if(net)addQ(q,'type',net);if(net==='ws'){addQ(q,'host',getWSHost(e));addQ(q,'path',getWSPath(e))}if(net==='grpc'){addQ(q,'serviceName',getGrpcService(e));addQ(q,'mode',e.mode)}}
function uriFor(n){var e=n.extra||{},p=String(n.protocol||e.type||'').toLowerCase(),name=enc(n.name),server=uriHost(e.server||n.server),port=e.port||n.port;if(p==='hy2')p='hysteria2';if(p==='socks')p='socks5';if(!server||!port)return null;
if(p==='ss'){var method=e.cipher||e.method||e['encrypt-method']||'none',pass=e.password||n.id||'';var u='ss://'+b64url(method+':'+pass)+'@'+server+':'+port;var plug=e.plugin||'';if(plug){var ps=[plug];['mode','host','path','tls','mux'].forEach(function(k){if(e[k])ps.push(k+'='+e[k])});u+='?plugin='+enc(ps.join(';'))}return u+'#'+name}
if(p==='trojan'){var q=[];var pass=e.password||n.id||'';var sec=tlsSecurity(e);if(sec)addQ(q,'security',sec);addQ(q,'sni',getSNI(e));addTransportQ(q,e);return 'trojan://'+enc(pass)+'@'+server+':'+port+(q.length?'?'+q.join('&'):'')+'#'+name}
if(p==='vless'){var pbk=getRealityPBK(e),sid=getRealitySID(e),fp=getFP(e),q2=['encryption='+enc(e.encryption||'none')];var sec=tlsSecurity(e);if(pbk)sec='reality';if(sec)addQ(q2,'security',sec);addTransportQ(q2,e);addQ(q2,'sni',getSNI(e));addQ(q2,'flow',e.flow);addQ(q2,'pbk',pbk);addQ(q2,'sid',sid);addQ(q2,'fp',fp);return 'vless://'+enc(e.uuid||n.id||'')+'@'+server+':'+port+'?'+q2.join('&')+'#'+name}
if(p==='vmess'){var net=String(e.network||n.network||'tcp').toLowerCase();if(net==='websocket')net='ws';var obj={v:'2',ps:n.name,add:e.server||n.server,port:String(port),id:e.uuid||n.id||'',aid:String(e.alterId||e.aid||'0'),scy:e.cipher||e.scy||'auto',net:net,type:e.type||'',host:getWSHost(e),path:getWSPath(e)||getGrpcService(e)||'',tls:tlsSecurity(e)==='tls'?'tls':'',sni:getSNI(e)};return 'vmess://'+b64utf8(JSON.stringify(obj))}
if(p==='hysteria2'||p==='hysteria'){var qh=[],pass=e.password||e.auth||e['auth-str']||n.id||'';addQ(qh,'sni',getSNI(e));addBoolQ(qh,'insecure',e.insecure||e['skip-cert-verify']||e.allowInsecure);addQ(qh,'obfs',e.obfs);addQ(qh,'obfs-password',e['obfs-password']||e.obfsPassword);addQ(qh,'alpn',getALPN(e));addQ(qh,'up',e.up||e['upload-bandwidth']||e.uploadBandwidth);addQ(qh,'down',e.down||e['download-bandwidth']||e.downloadBandwidth);return 'hysteria2://'+enc(pass)+'@'+server+':'+port+(qh.length?'?'+qh.join('&'):'')+'#'+name}
if(p==='tuic'){var qt=[],uuid=e.uuid||e.id||n.id||'',pwd=e.password||e.passwd||'';addQ(qt,'sni',getSNI(e));addQ(qt,'alpn',getALPN(e)||'h3');addQ(qt,'congestion_control',e.congestion_control||e['congestion-controller']||e.congestionController);addQ(qt,'udp_relay_mode',e.udp_relay_mode||e['udp-relay-mode']||e.udpRelayMode);addBoolQ(qt,'allow_insecure',e['skip-cert-verify']||e.allowInsecure||e.insecure);return 'tuic://'+enc(uuid)+(pwd?':'+enc(pwd):'')+'@'+server+':'+port+(qt.length?'?'+qt.join('&'):'')+'#'+name}
if(p==='snell'){var qs=[],psk=e.psk||e.password||n.id||'';addQ(qs,'version',e.version||'4');addQ(qs,'obfs',e.obfs);addQ(qs,'obfs-host',e['obfs-host']||e.obfsHost||e.host);return 'snell://'+enc(psk)+'@'+server+':'+port+(qs.length?'?'+qs.join('&'):'')+'#'+name}
if(p==='socks5'||p==='http'||p==='https'){var user=e.username||e.user||'',pwd=e.password||e.pass||'',auth=user?enc(user)+(pwd?':'+enc(pwd):'')+'@':'';return p+'://'+auth+server+':'+port+'#'+name}
if(p==='anytls'){var qa=[],ap=e.password||e.passwd||n.id||'';addQ(qa,'security','tls');addQ(qa,'sni',getSNI(e));addBoolQ(qa,'insecure',e.insecure||e['skip-cert-verify']||e.allowInsecure);return 'anytls://'+enc(ap)+'@'+server+':'+port+(qa.length?'?'+qa.join('&'):'')+'#'+name}
if(/^\w+:\/\//.test(String(n.raw||'')))return String(n.raw);return null}
function toURIText(){var a=exportNodes(),out=[],skip=0;a.forEach(function(n){var u=uriFor(n);if(u)out.push(u);else skip++});if(!out.length)throw new Error('当前节点无法导出为 URI');if(skip)st('已跳过 '+skip+' 个暂不支持 URI 的节点');return out.join('\n')+'\n'}
function jsn(){var a=exportNodes();return JSON.stringify({ok:true,summary:{selected:a.length,total:(DATA&&DATA.nodes&&DATA.nodes.length)||0},nodes:a,meta:(DATA&&DATA.meta)||{}},null,2)}
function buildExportPayload(){if(!DATA)throw new Error('请先拉取或分析订阅');var t=$('exportType').value,c=selectedNodes().length;if(!c)throw new Error('请先勾选要复制/导出的节点，或点击“全选当前”');if(t==='json')return {name:'subviz-selected.json',text:jsn(),type:'application/json;charset=utf-8',label:'JSON 备份',count:c};if(t==='clash'){var y=toClashYAML();return {name:'subviz-selected-clash.yaml',text:y,type:'application/x-yaml;charset=utf-8',label:'Clash YAML',count:c}}if(t==='uri64'){var u64=b64utf8(toURIText());return {name:'subviz-selected-uri-base64.txt',text:u64,type:'text/plain;charset=utf-8',label:'Base64 URI 订阅',count:c}}var u=toURIText();return {name:'subviz-selected-uri.txt',text:u,type:'text/plain;charset=utf-8',label:'通用 URI 订阅',count:c}}
window.doExport=function doExport(){try{var p=buildExportPayload();dl(p.name,p.text,p.type);st('已导出 '+p.label+(p.count!=null?'：'+p.count+' 个节点':''))}catch(e){st('导出失败：'+e.message)}}
function fallbackCopy(txt){var ta=document.createElement('textarea');ta.value=txt;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,ta.value.length);var ok=false;try{ok=document.execCommand('copy')}catch(e){}ta.remove();return ok}
window.copyExport=function copyExport(){try{var p=buildExportPayload();var done=function(){st('已复制 '+p.label+' 到剪贴板'+(p.count!=null?'：'+p.count+' 个节点':''))};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(p.text).then(done).catch(function(){if(fallbackCopy(p.text))done();else st('复制失败：请改用导出文件')})}else{if(fallbackCopy(p.text))done();else st('复制失败：当前浏览器不允许写入剪贴板')}}catch(e){st('复制失败：'+e.message)}}


function aliveErr(s){s=String(s||'');var l=s.toLowerCase();if(!s)return '检测失败';if(l.indexOf('timeout')>=0||s.indexOf('超时')>=0)return '请求超时：节点无响应、速度过慢，或当前检测超时设置偏短';if(l.indexOf('connection refused')>=0)return '连接被拒绝：服务器端口关闭、节点失效，或服务端主动拒绝';if(l.indexOf('websocket closed')>=0)return 'WebSocket 被关闭：常见原因是 Host/SNI/path 不匹配、CDN 回源拒绝，或节点已失效';if(l.indexOf('load failed')>=0)return '连接失败：节点不可达、TLS/握手失败，或当前网络阻断';if(s.indexOf('状态码不匹配')>=0)return s;if(l.indexOf('policy descriptor')>=0||s.indexOf('临时代理策略')>=0)return 'Surge 临时代理策略创建失败';if(l.indexOf('unsupported')>=0||s.indexOf('不支持')>=0)return '当前协议不支持测活';return s}
function aliveQS(){function val(id,def){var el=$(id);return el?String(el.value||def||'').trim():(def||'')}function ck(id){var el=$(id);return !!(el&&el.checked)}function add(k,v){v=String(v==null?'':v).trim();return v?'&'+encodeURIComponent(k)+'='+encodeURIComponent(v):''}var q='';q+=add('url',val('aliveUrl','http://connectivitycheck.platform.hicloud.com/generate_204'));q+=add('status',val('aliveStatus','204'));q+=add('timeout',val('aliveTimeout','3000'));q+=add('retries',val('aliveRetries','1'));q+=add('retry_delay',val('aliveRetryDelay','1000'));return q}
function applyAliveName(n){if(!($('aliveShowLatency')&&$('aliveShowLatency').checked))return;if(n.aliveOK!==true||!n.aliveLatency)return;if(!n.nameBeforeAlive)n.nameBeforeAlive=n.name;n.name=String(n.nameBeforeAlive).replace(/^\[\d+ms\]\s*/,'');n.name='['+n.aliveLatency+'ms] '+n.name}
function aliveTest(){try{if(!DATA){st('请先拉取或分析订阅');return}if(GEO_RUNNING){st('已有检测任务正在运行；如果刚才没有进度，请刷新页面后重试。');return}var nodes=operationNodes('测活');if(!nodes.length)return;GEO_RUNNING=true;var total=nodes.length,done=0,ok=0,fail=0,idx=0,errMap={},con=Math.max(1,Math.min(20,parseInt(($('aliveCon')&&$('aliveCon').value)||'5')||5));st('开始对选中的 '+total+' 个节点测活：0 / '+total);function next(){while(con>0&&idx<nodes.length){(function(n){idx++;con--;loadJSON('/api/availability?t='+Date.now()+aliveQS(),{method:'POST',body:JSON.stringify(n),headers:{'Content-Type':'application/json;charset=utf-8'}}).then(function(r){if(r&&r.ok&&r.alive){n.aliveOK=true;n.aliveLatency=r.latency||r.totalLatency||0;n.aliveStatus=r.status;n.aliveError='';applyAliveName(n);ok++}else{var er=aliveErr((r&&r.error)||'检测失败');n.aliveOK=false;n.aliveError=er;errMap[er]=(errMap[er]||0)+1;fail++}}).catch(function(e){var er=aliveErr(e.message||String(e));n.aliveOK=false;n.aliveError=er;errMap[er]=(errMap[er]||0)+1;fail++}).then(function(){done++;con++;if(done%5===0||done===total){recalc(DATA);apply();st('测活：'+done+' / '+total+'，可用 '+ok+'，不可用 '+fail)}if(done>=total){GEO_RUNNING=false;render(DATA);var es=Object.keys(errMap).slice(0,3).map(function(k){return k+'×'+errMap[k]}).join('；');st('测活完成：已检测选中的 '+total+' 个节点，可用 '+ok+'，不可用 '+fail+(es?'。失败原因：'+es:''))}else next()})})(nodes[idx])}}next()}catch(e){GEO_RUNNING=false;st('测活启动失败：'+aliveErr(e&&e.message?e.message:String(e)))}}
window.aliveTest=aliveTest;

function landingQS(){
  function val(id){var el=$(id);return el?String(el.value||'').trim():''}
  function add(k,v){v=String(v==null?'':v).trim();return v?'&'+encodeURIComponent(k)+'='+encodeURIComponent(v):''}
  var q='';
  q+=add('timeout',val('landingTimeout'));
  q+=add('retries',val('landingRetries'));
  var apis=val('landingApis');
  if(apis) q+=add('api',apis.split(/\n+/).map(function(x){return x.trim()}).filter(Boolean).join('|'));
  q+=add('format',val('landingFormat'));
  var internal=$('landingInternal')&&$('landingInternal').checked;
  if(internal) q+=add('internal','1');
  return q;
}

function landingApplyOne(n,r){if(!r||!r.ok)return;var cc=String(r.countryCode||'').toUpperCase();if(!cc)return;n.landingOK=true;n.landingIP=r.landingIP||r.query||'';n.landingCountryCode=cc;n.landingCountry=r.country||cc;n.landingProvider=r.provider||'';n.landingCity=r.city||'';n.landingRegion=r.region||'';n.landingISP=r.isp||'';n.landingASN=r.asn||'';n.landingAPI=r.usedAPI||r.landingAPI||'';n.landingLatency=r.latency||'';n.landingAttempts=r.attempts||'';n.entryServer=r.entryServer||n.server;n.countryCode=cc;n.country=r.country||n.country||cc;n.countrySource='landing';n.countryConfidence=96;n.geoCity=r.city||'';n.geoISP=r.isp||'';n.geoASN=r.asn||'';}
function applyLandingNames(){if(!DATA)return;var counters={};(DATA.nodes||[]).forEach(function(n){var cc=String(n.countryCode||'UN').toUpperCase();var cn=String(n.country||'未知');var key=cc+'|'+cn;counters[key]=(counters[key]||0)+1;var idx=('0'+counters[key]).slice(-2);if(n.countrySource==='landing'){var old=n.name;if(!n.originalName)n.originalName=old;n.name=flag(cc)+' '+cc+'-'+cn+' '+idx;}})}
function landingTest(){try{if(!DATA){st('请先拉取或分析订阅');return}if(GEO_RUNNING){st('已有 GeoIP / 落地检测任务正在运行；如果刚才没有进度，请刷新页面后重试。');return}var nodes=operationNodes('落地检测');if(!nodes.length)return;GEO_RUNNING=true;var total=nodes.length,done=0,ok=0,fail=0,idx=0,errMap={},con=Math.max(1,Math.min(10,parseInt(($('landingCon')&&$('landingCon').value)||'2')||2));st('开始对选中的 '+total+' 个节点做落地检测：0 / '+total+'。');function next(){while(con>0&&idx<nodes.length){(function(n){idx++;con--;loadJSON('/api/landing?t='+Date.now()+landingQS(),{method:'POST',body:JSON.stringify(n),headers:{'Content-Type':'application/json;charset=utf-8'}}).then(function(r){if(r&&r.ok){landingApplyOne(n,r);ok++}else{var er=(r&&r.error)||'failed'; if(r&&r.descriptorProtocol)er+='('+r.descriptorProtocol+')'; var z=zhErr(er); n.landingOK=false;n.landingError=z;n.landingErrorRaw=er;errMap[z]=(errMap[z]||0)+1;fail++}}).catch(function(e){var er=e.message||String(e);var z=zhErr(er);n.landingOK=false;n.landingError=z;n.landingErrorRaw=er;errMap[z]=(errMap[z]||0)+1;fail++}).then(function(){done++;con++;if(done%2===0||done===total){applyLandingNames();recalc(DATA);apply();st('落地检测：'+done+' / '+total+'，成功 '+ok+'，失败 '+fail)}if(done>=total){GEO_RUNNING=false;applyLandingNames();render(DATA);var es=Object.keys(errMap).slice(0,3).map(function(k){return k+'×'+errMap[k]}).join('；');st('落地检测完成：已检测选中的 '+total+' 个节点，成功 '+ok+'，失败 '+fail+'。仅对成功获取落地的节点重命名。'+(es?' 失败原因：'+es:''))}else next()})})(nodes[idx])}}next()}catch(e){GEO_RUNNING=false;st('落地检测启动失败：'+zhErr(e&&e.message?e.message:String(e)))}}
window.geoFill=geoFill;
window.landingTest=landingTest;
window.addEventListener('DOMContentLoaded',function(){['q','pf','cf','unique'].forEach(function(id){var el=$(id);if(!el)return;el.addEventListener('input',apply);el.addEventListener('change',apply)});function bind(id,fn){var el=$(id);if(el)el.onclick=fn}bind('pull',analyzeURL);bind('demo',sample);bind('textBtn',analyzeText);bind('geo',geoFill);bind('landing',landingTest);bind('alive',aliveTest);bind('cleanNames',window.cleanNames);bind('applyRules',window.cleanNames);bind('restoreNames',window.restoreNames);bind('exportBtn',window.doExport);bind('copyBtn',window.copyExport);bind('selectCurrent',window.selectCurrent);bind('invertCurrent',window.invertCurrent);bind('clearSelected',window.clearSelected);});

;(function(){
  function svById(id){return document.getElementById(id)}
  function svEnsureStyle(){
    if(svById('sv132Style')) return;
    var style=document.createElement('style');
    style.id='sv132Style';
    style.textContent=
      '.sv-meta-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:10px 0 14px;}'+
      '.sv-meta-row label{margin:0!important;}'+
      '.sv-pill{display:inline-flex;align-items:center;justify-content:center;padding:8px 14px;border-radius:999px;background:rgba(76,132,255,.16);color:#dce7ff;font-weight:700;margin:0;}'+
      '.sv-mini-grid,.sv-op-grid{display:grid;gap:12px;margin:12px 0;}'+
      '.sv-mini-grid{grid-template-columns:repeat(3,minmax(0,1fr));}'+
      '.sv-op-grid-3{grid-template-columns:repeat(3,minmax(0,1fr));}'+
      '.sv-op-grid-2{grid-template-columns:repeat(2,minmax(0,1fr));}'+
      '.sv-mini-grid button,.sv-op-grid button{width:100%;margin:0!important;padding:14px 10px!important;min-height:0;font-size:16px;line-height:1.25;}'+
      '#sv132SelectGrid{margin-top:6px;margin-bottom:14px;}'+
      '#sv132MainOps,#sv132NameOps,#sv132ExportGrid{margin-top:14px;}'+
      '@media (max-width:640px){.sv-mini-grid,.sv-op-grid-3{grid-template-columns:repeat(2,minmax(0,1fr));}.sv-op-grid-2{grid-template-columns:repeat(2,minmax(0,1fr));}}'+
      '@media (max-width:430px){.sv-mini-grid,.sv-op-grid-3,.sv-op-grid-2{grid-template-columns:repeat(2,minmax(0,1fr));}.sv-meta-row{align-items:flex-start;}}';
    document.head.appendChild(style);
  }
  function svMakeGrid(id, cls, beforeEl){
    var wrap=svById(id);
    if(!wrap){
      wrap=document.createElement('div');
      wrap.id=id;
      wrap.className=cls;
      if(beforeEl&&beforeEl.parentNode) beforeEl.parentNode.insertBefore(wrap,beforeEl);
    }
    return wrap;
  }
  function svMoveIntoGrid(ids, gridId, cls){
    var first=null;
    ids.forEach(function(id){if(!first&&svById(id)) first=svById(id)});
    if(!first) return null;
    var grid=svMakeGrid(gridId, cls, first);
    ids.forEach(function(id){
      var el=svById(id);
      if(el){
        el.classList.add('sv-compact-btn');
        grid.appendChild(el);
      }
    });
    return grid;
  }
  function svRefineLayout(){
    svEnsureStyle();
    var unique=svById('unique');
    var sel=svById('selCount');
    var uniqueLabel = unique && unique.closest ? unique.closest('label') : (unique ? unique.parentNode : null);
    if(uniqueLabel && sel && !svById('sv132Meta')){
      var row=document.createElement('div');
      row.id='sv132Meta';
      row.className='sv-meta-row';
      uniqueLabel.parentNode.insertBefore(row, uniqueLabel);
      row.appendChild(uniqueLabel);
      row.appendChild(sel);
    }
    if(sel) sel.classList.add('sv-pill');

    svMoveIntoGrid(['selectCurrent','invertCurrent','clearSelected'], 'sv132SelectGrid', 'sv-mini-grid');
    svMoveIntoGrid(['geo','landing','alive'], 'sv132MainOps', 'sv-op-grid sv-op-grid-3');
    svMoveIntoGrid(['cleanNames','restoreNames'], 'sv132NameOps', 'sv-op-grid sv-op-grid-2');

    var cleanBtn=svById('cleanNames');
    if(cleanBtn) cleanBtn.textContent='清理节点名';
    var restoreBtn=svById('restoreNames');
    if(restoreBtn) restoreBtn.textContent='恢复原名';

    var copyBtn=svById('copyBtn');
    if(copyBtn && !svById('copyAliveBtn')){
      var btn=document.createElement('button');
      btn.id='copyAliveBtn';
      btn.className=copyBtn.className||'';
      btn.textContent='复制可用节点';
      copyBtn.parentNode.insertBefore(btn, copyBtn.nextSibling);
      btn.addEventListener('click', window.copyAliveExport);
    }
    svMoveIntoGrid(['copyAliveBtn','copyBtn','exportBtn'], 'sv132ExportGrid', 'sv-op-grid sv-op-grid-3');
  }
  function svWithNodes(nodes, fn){
    var oldSelectedNodes=selectedNodes;
    try{
      selectedNodes=function(){return nodes};
      return fn();
    } finally {
      selectedNodes=oldSelectedNodes;
    }
  }
  window.copyAliveExport=function copyAliveExport(){
    try{
      if(!DATA){st('请先拉取或分析订阅');return}
      var picked=operationNodes('复制可用节点');
      if(!picked.length) return;
      var alive=picked.filter(function(n){return n&&n.aliveOK===true});
      if(!alive.length){st('当前勾选节点中没有可用节点。请先执行测活，或调整勾选范围。');return}
      var payload=svWithNodes(alive, buildExportPayload);
      payload.name=String(payload.name||'').replace('selected','alive');
      function ok(){st('已复制可用节点：'+alive.length+' 个（'+payload.label+'）')}
      if(navigator.clipboard && window.isSecureContext){
        navigator.clipboard.writeText(payload.text).then(ok).catch(function(){
          if(fallbackCopy(payload.text)) ok();
          else st('复制失败：当前浏览器不允许写入剪贴板');
        });
      } else if(fallbackCopy(payload.text)){
        ok();
      } else {
        st('复制失败：当前浏览器不允许写入剪贴板');
      }
    }catch(e){
      st('复制可用节点失败：'+e.message);
    }
  };

  var __sv132OldUpdateSelectUI = updateSelectUI;
  updateSelectUI = function(){
    if(typeof __sv132OldUpdateSelectUI === 'function') __sv132OldUpdateSelectUI();
    var c=selectedCount();
    var el=svById('selCount');
    if(el){
      el.textContent='已选 '+c+' 个';
      el.classList.add('sv-pill');
    }
    var countEl=svById('count');
    if(countEl && DATA){
      var total=((DATA&&DATA.summary&&DATA.summary.total)||0);
      var current=filtered().length;
      countEl.textContent='当前显示 '+current+' / '+total+' 个节点';
    }
  };

  var __sv132OldApply = apply;
  apply = function(){
    __sv132OldApply();
    updateSelectUI();
    svRefineLayout();
  };

  window.addEventListener('DOMContentLoaded', function(){
    svRefineLayout();
    updateSelectUI();
  });
})();


;(function(){
  function sv133ById(id){return document.getElementById(id)}
  function sv133Style(){
    if(sv133ById('sv133Style')) return;
    var style=document.createElement('style');
    style.id='sv133Style';
    style.textContent =
      'body.sv133 .wrap{max-width:980px;padding-bottom:70px;}'+
      'body.sv133 .hero,body.sv133 .card{border-radius:22px;padding:18px;margin:14px 0;}'+
      'body.sv133 h1{font-size:28px;line-height:1.2}body.sv133 h2{font-size:22px;margin-bottom:14px;}'+
      'body.sv133 button{min-height:48px;border-radius:18px;padding:13px 12px;font-size:16px;line-height:1.25;margin-top:0;}'+
      'body.sv133 input,body.sv133 textarea,body.sv133 select{border-radius:16px;padding:13px 14px;font-size:15px;}'+
      'body.sv133 .status{font-size:14px;line-height:1.55;max-height:150px;}'+
      'body.sv133 #cards.grid{grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;}'+
      'body.sv133 .stat{padding:14px;border-radius:18px;}body.sv133 .stat b{font-size:30px;}'+
      'body.sv133 #protocols,body.sv133 #countries{max-height:320px;overflow:auto;padding-right:4px;}'+
      'body.sv133 .bar{grid-template-columns:108px 1fr 42px;gap:8px;font-size:14px;}'+
      'body.sv133 .track,body.sv133 .fill{height:12px;}'+
      'body.sv133 .filters{grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;}'+
      'body.sv133 .sv-section-title{font-size:13px;color:#9fb0cc;font-weight:800;margin:14px 0 8px;}'+
      'body.sv133 .sv-auto-row{display:flex;align-items:center;gap:9px;margin:8px 0 10px;color:#dbe8ff;font-size:14px;}'+
      'body.sv133 .sv-auto-row input{width:22px!important;height:22px!important;accent-color:#58a6ff;padding:0;}'+
      'body.sv133 .sv133-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:10px 0 12px;}'+
      'body.sv133 .sv133-grid.three{grid-template-columns:repeat(3,minmax(0,1fr));}'+
      'body.sv133 .sv133-grid button{width:100%;}'+
      'body.sv133 .rulebox{padding:10px 12px;border-radius:16px;margin-top:10px;}'+
      'body.sv133 .rulebox summary{font-size:15px;}'+
      'body.sv133 .exportbar{display:grid;grid-template-columns:1.3fr .7fr .7fr;gap:10px;}'+
      'body.sv133 #sv133ExportGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px;}'+
      'body.sv133 #sv133ExportGrid button{margin:0;}'+
      'body.sv133 table{table-layout:fixed;}'+
      'body.sv133 th,body.sv133 td{padding:10px 8px;}'+
      '@media(max-width:760px){'+
        'body.sv133 .wrap{padding:14px 10px 56px;}'+
        'body.sv133 .hero,body.sv133 .card{padding:15px 13px;border-radius:20px;margin:12px 0;}'+
        'body.sv133 h1{font-size:24px}body.sv133 h2{font-size:20px;}'+
        'body.sv133 #cards.grid{grid-template-columns:repeat(2,minmax(0,1fr));}'+
        'body.sv133 .stat{min-height:82px;}body.sv133 .stat b{font-size:28px;}'+
        'body.sv133 #protocols,body.sv133 #countries{max-height:260px;}'+
        'body.sv133 .bar{grid-template-columns:82px 1fr 34px;font-size:13px;}'+
        'body.sv133 .filters{grid-template-columns:1fr 1fr;}'+
        'body.sv133 .selectbar{display:block;}'+
        'body.sv133 #sv132Meta,body.sv133 .sv-meta-row{display:flex!important;gap:10px;align-items:center;justify-content:space-between;margin:10px 0;}'+
        'body.sv133 .sv-pill{font-size:14px;padding:7px 10px;}'+
        'body.sv133 .sv133-grid,body.sv133 .sv133-grid.three{grid-template-columns:repeat(2,minmax(0,1fr));}'+
        'body.sv133 .toolbar{grid-template-columns:repeat(2,minmax(0,1fr))!important;}'+
        'body.sv133 .toolhint{font-size:12px;line-height:1.5;}'+
        'body.sv133 .exportbar{grid-template-columns:1fr;}'+
        'body.sv133 table,body.sv133 thead,body.sv133 tbody{display:block;width:100%;}'+
        'body.sv133 thead{display:none;}'+
        'body.sv133 tbody tr{display:grid;grid-template-columns:34px minmax(0,1fr) 78px;grid-template-areas:"check name proto" "check name port";gap:4px 10px;align-items:center;border-top:1px solid #263f66;padding:12px 0;}'+
        'body.sv133 tbody td{display:block;border:0!important;padding:0!important;min-width:0;}'+
        'body.sv133 tbody td:nth-child(1){grid-area:check;}'+
        'body.sv133 tbody td:nth-child(2){display:none;}'+
        'body.sv133 tbody td:nth-child(3){grid-area:name;font-size:15px;line-height:1.35;word-break:break-word;}'+
        'body.sv133 tbody td:nth-child(4){grid-area:proto;text-align:right;}'+
        'body.sv133 tbody td:nth-child(5){display:none!important;}'+
        'body.sv133 tbody td:nth-child(6){grid-area:port;text-align:right;color:#dbe8ff;font-weight:800;font-size:15px;}'+
        'body.sv133 .tag{padding:5px 9px;font-size:13px;}'+
        'body.sv133 .small{font-size:12px;line-height:1.45;word-break:break-word;}'+
      '}'+
      '@media(max-width:390px){body.sv133 .bar{grid-template-columns:72px 1fr 30px;}body.sv133 button{font-size:15px;padding-left:8px;padding-right:8px;}body.sv133 tbody tr{grid-template-columns:32px minmax(0,1fr) 70px;}}';
    document.head.appendChild(style);
  }
  function sv133Move(ids, gridId, cls, before){
    var first=null;
    ids.forEach(function(id){if(!first&&sv133ById(id)) first=sv133ById(id)});
    if(!first) return null;
    var grid=sv133ById(gridId);
    if(!grid){
      grid=document.createElement('div');
      grid.id=gridId;
      grid.className=cls;
      var ref=before&&sv133ById(before)?sv133ById(before):first;
      if(ref&&ref.parentNode) ref.parentNode.insertBefore(grid, ref);
    }
    ids.forEach(function(id){var el=sv133ById(id); if(el) grid.appendChild(el);});
    return grid;
  }
  function sv133EnsureAliveControls(){
    var clear=sv133ById('clearSelected');
    if(clear && !sv133ById('selectAliveBtn')){
      var b=document.createElement('button');
      b.id='selectAliveBtn';
      b.type='button';
      b.className=clear.className||'btn2';
      b.textContent='勾选可用';
      b.onclick=function(){window.selectAliveCurrent&&window.selectAliveCurrent();return false};
      clear.parentNode.insertBefore(b, clear.nextSibling);
    }
    var hint=sv133ById('autoAliveWrap');
    var anchor=sv133ById('selectAliveBtn')||sv133ById('alive');
    if(!hint && anchor){
      hint=document.createElement('label');
      hint.id='autoAliveWrap';
      hint.className='sv-auto-row';
      hint.innerHTML='<input type="checkbox" id="autoSelectAlive" checked> 测活完成后自动只勾选可用节点';
      var parent=(sv133ById('sv133SelectGrid')||anchor.parentNode);
      if(parent&&parent.parentNode) parent.parentNode.insertBefore(hint, parent.nextSibling);
    }
  }
  function sv133Refine(){
    document.body.classList.add('sv133');
    sv133Style();
    sv133EnsureAliveControls();
    var unique=sv133ById('unique'), sel=sv133ById('selCount');
    var uniqueLabel=unique&&unique.closest?unique.closest('label'):(unique?unique.parentNode:null);
    if(uniqueLabel && sel && !sv133ById('sv133Meta')){
      var row=document.createElement('div'); row.id='sv133Meta'; row.className='sv-meta-row';
      uniqueLabel.parentNode.insertBefore(row, uniqueLabel); row.appendChild(uniqueLabel); row.appendChild(sel);
    }
    if(sel) sel.classList.add('sv-pill');
    sv133Move(['selectCurrent','invertCurrent','clearSelected','selectAliveBtn'], 'sv133SelectGrid', 'sv133-grid', 'autoAliveWrap');
    sv133Move(['geo','landing','alive','cleanNames','restoreNames'], 'sv133MainGrid', 'sv133-grid', null);
    sv133Move(['copyAliveBtn','copyBtn','exportBtn'], 'sv133ExportGrid', 'sv133-grid three', null);
    var clean=sv133ById('cleanNames'); if(clean) clean.textContent='清理节点名';
    var alive=sv133ById('alive'); if(alive) alive.textContent='测活';
    var selAlive=sv133ById('selectAliveBtn'); if(selAlive) selAlive.textContent='勾选可用';
  }
  window.selectAliveCurrent=function(){
    try{
      if(!DATA){st('请先拉取或分析订阅');return}
      var scope=filtered();
      var alive=scope.filter(function(n){return n&&n.aliveOK===true});
      SELECTED={};
      alive.forEach(function(n){if(n._sid)SELECTED[n._sid]=1});
      apply();
      st('已勾选当前筛选中的可用节点：'+alive.length+' / '+scope.length+' 个');
    }catch(e){st('勾选可用节点失败：'+(e&&e.message?e.message:String(e)))}
  };
  function sv133AutoEnabled(){var el=sv133ById('autoSelectAlive');return !el || el.checked}
  function sv133AutoPick(nodes){
    var alive=(nodes||[]).filter(function(n){return n&&n.aliveOK===true});
    if(sv133AutoEnabled()){
      SELECTED={};
      alive.forEach(function(n){if(n._sid)SELECTED[n._sid]=1});
    }
    return alive.length;
  }
  window.aliveTest=function(){
    try{
      if(!DATA){st('请先拉取或分析订阅');return}
      if(GEO_RUNNING){st('已有检测任务正在运行；如果刚才没有进度，请刷新页面后重试。');return}
      var nodes=operationNodes('测活');
      if(!nodes.length) return;
      GEO_RUNNING=true;
      var total=nodes.length, done=0, ok=0, fail=0, idx=0, errMap={};
      var con=Math.max(1,Math.min(20,parseInt((sv133ById('aliveCon')&&sv133ById('aliveCon').value)||'5')||5));
      st('开始对选中的 '+total+' 个节点测活：0 / '+total);
      function finish(){
        GEO_RUNNING=false;
        var autoCount=sv133AutoPick(nodes);
        recalc(DATA);
        render(DATA);
        sv133Refine();
        var es=Object.keys(errMap).slice(0,3).map(function(k){return k+'×'+errMap[k]}).join('；');
        st('测活完成：已检测选中的 '+total+' 个节点，可用 '+ok+'，不可用 '+fail+(sv133AutoEnabled()?'。已自动勾选可用节点 '+autoCount+' 个':'')+(es?'。失败原因：'+es:''));
      }
      function next(){
        while(con>0 && idx<nodes.length){
          (function(n){
            idx++; con--;
            loadJSON('/api/availability?t='+Date.now()+aliveQS(),{method:'POST',body:JSON.stringify(n),headers:{'Content-Type':'application/json;charset=utf-8'}})
              .then(function(r){
                if(r&&r.ok&&r.alive){
                  n.aliveOK=true;
                  n.aliveLatency=r.latency||r.totalLatency||0;
                  n.aliveStatus=r.status;
                  n.aliveError='';
                  applyAliveName(n);
                  ok++;
                }else{
                  var er=aliveErr((r&&r.error)||'检测失败');
                  n.aliveOK=false; n.aliveError=er; errMap[er]=(errMap[er]||0)+1; fail++;
                }
              })
              .catch(function(e){
                var er=aliveErr(e.message||String(e));
                n.aliveOK=false; n.aliveError=er; errMap[er]=(errMap[er]||0)+1; fail++;
              })
              .then(function(){
                done++; con++;
                if(done%5===0||done===total){recalc(DATA);apply();st('测活：'+done+' / '+total+'，可用 '+ok+'，不可用 '+fail)}
                if(done>=total) finish(); else next();
              });
          })(nodes[idx]);
        }
      }
      next();
    }catch(e){GEO_RUNNING=false;st('测活启动失败：'+aliveErr(e&&e.message?e.message:String(e)))}
  };
  var oldApply=apply;
  apply=function(){oldApply();sv133Refine()};
  window.addEventListener('DOMContentLoaded',function(){sv133Refine()});
})();


;(function(){
  var PAGE_SIZE=120;
  var viewLimit=PAGE_SIZE;
  var lastKey='';
  function byId(id){return document.getElementById(id)}
  function parentCard(el){return el&&el.closest?el.closest('.card'):(el?el.parentNode:null)}
  function addTitle(id,text,before){
    if(!before||byId(id)) return;
    var t=document.createElement('div');
    t.id=id;t.className='sv135-section-title';t.textContent=text;
    before.parentNode.insertBefore(t,before);
  }
  function style(){
    if(byId('sv135Style')) return;
    var s=document.createElement('style');
    s.id='sv135Style';
    s.textContent=
      'body.sv135{--sv-card:#10243d;--sv-line:#29466f;--sv-soft:#9fb0cc;--sv-accent:#35c5ff;}'+
      'body.sv135 .wrap{max-width:980px;}'+
      'body.sv135 .hero input#url{border-color:#2f6fb2;box-shadow:0 0 0 1px rgba(53,197,255,.16),0 0 26px rgba(30,144,255,.08) inset;}'+
      'body.sv135 .hero input#url:focus{border-color:#35c5ff;box-shadow:0 0 0 3px rgba(53,197,255,.16);}'+
      'body.sv135 #cards.grid{grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:14px;}'+
      'body.sv135 .stat{background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.015));border-color:rgba(92,137,201,.58);}'+
      'body.sv135 .sv135-chart-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}'+
      'body.sv135 .sv135-chart-grid>.card{margin:0;}'+
      'body.sv135 #protocols,body.sv135 #countries{max-height:280px;overflow:auto;padding-right:3px;}'+
      'body.sv135 .bar{grid-template-columns:104px 1fr 42px;min-height:22px;}'+
      'body.sv135 .track{height:12px;background:rgba(73,102,148,.38);}'+
      'body.sv135 .fill{height:12px;background:linear-gradient(90deg,#338fff,#23d1e9);border-radius:999px;}'+
      'body.sv135 #sv135Health .health-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:6px 0 12px;}'+
      'body.sv135 #sv135Health .health-cell{padding:11px 12px;border:1px solid rgba(92,137,201,.45);border-radius:16px;background:rgba(255,255,255,.025);}'+
      'body.sv135 #sv135Health .health-cell span{display:block;color:#9fb0cc;font-size:13px;font-weight:700;}'+
      'body.sv135 #sv135Health .health-cell b{display:block;color:#f2f7ff;font-size:28px;line-height:1.1;margin-top:3px;}'+
      'body.sv135 .sv135-section-title{color:#9fb0cc;font-size:13px;font-weight:900;letter-spacing:.04em;margin:15px 0 8px;}'+
      'body.sv135 .sv133-grid,body.sv135 .sv133-grid.three,body.sv135 .sv-mini-grid,body.sv135 .sv-op-grid{grid-template-columns:repeat(auto-fit,minmax(136px,1fr))!important;gap:10px!important;margin:10px 0 12px!important;}'+
      'body.sv135 .sv133-grid button,body.sv135 .sv-mini-grid button,body.sv135 .sv-op-grid button,body.sv135 .toolbar button{min-height:48px!important;white-space:normal!important;word-break:keep-all!important;overflow-wrap:normal!important;line-height:1.25!important;}'+
      'body.sv135 #alive{background:linear-gradient(180deg,#3187f7,#2167ca)!important;color:#fff!important;}'+
      'body.sv135 .toolhint{margin:8px 0 12px;font-size:13px;line-height:1.55;}'+
      'body.sv135 .rulebox{margin-top:10px;}'+
      'body.sv135 .exportbar{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(96px,.45fr) minmax(96px,.45fr);gap:10px;align-items:stretch;}'+
      'body.sv135 #sv133ExportGrid{grid-template-columns:repeat(auto-fit,minmax(126px,1fr))!important;}'+
      'body.sv135 .sv135-empty{padding:22px 14px;text-align:center;color:#9fb0cc;line-height:1.6;border:1px dashed rgba(92,137,201,.55);border-radius:18px;background:rgba(255,255,255,.018);}'+
      'body.sv135 .sv135-more-row td{text-align:center!important;padding:14px 0!important;}'+
      'body.sv135 .sv135-more{width:min(360px,100%);margin:0 auto!important;}'+
      'body.sv135 table{table-layout:fixed;}'+
      'body.sv135 th:nth-child(1){width:48px}body.sv135 th:nth-child(2){width:48px}body.sv135 th:nth-child(4){width:112px}body.sv135 th:nth-child(6){width:86px}'+
      'body.sv135 .tag{white-space:nowrap;word-break:keep-all;max-width:104px;overflow:hidden;text-overflow:ellipsis;text-align:center;}'+
      '@media(max-width:820px){body.sv135 .sv135-chart-grid{grid-template-columns:1fr;}body.sv135 #cards.grid{grid-template-columns:repeat(2,minmax(0,1fr));}body.sv135 #cards .stat:last-child{grid-column:span 2;}}'+
      '@media(max-width:760px){body.sv135 .exportbar{grid-template-columns:1fr;}body.sv135 .filters{grid-template-columns:1fr 1fr!important;}body.sv135 table,body.sv135 thead,body.sv135 tbody{display:block;width:100%;}body.sv135 thead{display:none;}body.sv135 tbody tr{display:grid!important;grid-template-columns:38px minmax(0,1fr) 92px!important;grid-template-areas:"check name proto" "check name port"!important;gap:4px 10px;align-items:center;border-top:1px solid #263f66;padding:12px 0;}body.sv135 tbody td{display:block;border:0!important;padding:0!important;min-width:0;}body.sv135 tbody td:nth-child(1){grid-area:check;}body.sv135 tbody td:nth-child(2){display:none!important;}body.sv135 tbody td:nth-child(3){grid-area:name;font-size:15px;line-height:1.36;word-break:break-word;}body.sv135 tbody td:nth-child(4){grid-area:proto;text-align:right;}body.sv135 tbody td:nth-child(5){display:none!important;}body.sv135 tbody td:nth-child(6){grid-area:port;text-align:right;color:#eaf2ff;font-weight:900;font-size:16px;}body.sv135 .rowchk{width:24px!important;height:24px!important;}body.sv135 .tag{max-width:90px;padding:5px 8px;font-size:13px;}body.sv135 .small{font-size:12px;line-height:1.45;}}'+
      '@media(max-width:390px){body.sv135 .sv133-grid,body.sv135 .sv133-grid.three,body.sv135 .sv-mini-grid,body.sv135 .sv-op-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}body.sv135 tbody tr{grid-template-columns:36px minmax(0,1fr) 86px!important;}body.sv135 button{font-size:15px!important;padding-left:8px!important;padding-right:8px!important;}}';
    document.head.appendChild(s);
  }
  function ensureDashboard(){
    document.body.classList.add('sv135');style();
    var p=parentCard(byId('protocols')), c=parentCard(byId('countries'));
    if(p&&c&&!byId('sv135Charts')){
      var grid=document.createElement('div');grid.id='sv135Charts';grid.className='sv135-chart-grid';
      p.parentNode.insertBefore(grid,p);grid.appendChild(p);grid.appendChild(c);
      var h=document.createElement('div');h.id='sv135Health';h.className='card';h.innerHTML='<h2>节点健康状况</h2><div class="health-grid"><div class="health-cell"><span>可用</span><b id="hAlive">0</b></div><div class="health-cell"><span>不可用</span><b id="hDead">0</b></div><div class="health-cell"><span>未测</span><b id="hUntested">0</b></div><div class="health-cell"><span>当前筛选</span><b id="hScope">0</b></div></div><div id="hBars" class="small muted">测活后这里会显示可用比例。</div>';
      grid.appendChild(h);
    }
  }
  function health(nodes){var a=0,d=0,u=0;(nodes||[]).forEach(function(n){if(n.aliveOK===true)a++;else if(n.aliveOK===false)d++;else u++});return{alive:a,dead:d,untested:u,total:(nodes||[]).length}}
  function updateHealth(nodes){ensureDashboard();var h=health(nodes||filtered());[['hAlive',h.alive],['hDead',h.dead],['hUntested',h.untested],['hScope',h.total]].forEach(function(x){var el=byId(x[0]);if(el)el.textContent=x[1]});var b=byId('hBars');if(b){var p=h.total?Math.round(h.alive/h.total*100):0;b.innerHTML='<div class="bar"><div>可用率</div><div class="track"><div class="fill" style="width:'+p+'%"></div></div><b>'+p+'%</b></div>';}}
  function refine(){
    ensureDashboard();
    var selectGrid=byId('sv133SelectGrid')||byId('sv132SelectGrid');
    var mainGrid=byId('sv133MainGrid')||byId('sv132MainOps');
    var exportGrid=byId('sv133ExportGrid')||byId('sv132ExportGrid');
    addTitle('sv135SelectTitle','选择范围',selectGrid);
    addTitle('sv135ActionTitle','常用操作',mainGrid);
    var firstRule=document.querySelector('.rulebox');
    addTitle('sv135AdvancedTitle','高级设置',firstRule);
    addTitle('sv135ExportTitle','导出与复制',exportGrid||byId('exportType'));
    var alive=byId('alive');if(alive)alive.textContent='测活';
    var geo=byId('geo');if(geo)geo.textContent='GeoIP补全';
    var landing=byId('landing');if(landing)landing.textContent='落地检测';
    var clean=byId('cleanNames');if(clean)clean.textContent='清理节点名';
    var copyAlive=byId('copyAliveBtn');if(copyAlive)copyAlive.textContent='复制可用';
    if(!DATA){var tb=byId('tbody');if(tb)tb.innerHTML='<tr><td colspan="6"><div class="sv135-empty">先输入订阅 URL 或粘贴订阅内容，再点击分析。<br>分析后可筛选、勾选节点，再执行测活、落地检测、清理和复制。</div></td></tr>';}
  }
  function keyOf(a){var q=(byId('q')&&byId('q').value)||'',pf=(byId('pf')&&byId('pf').value)||'',cf=(byId('cf')&&byId('cf').value)||'',u=(byId('unique')&&byId('unique').checked)?'1':'0';return [a.length,q,pf,cf,u].join('|')}
  function row(n,i){var chk=SELECTED[n._sid]?' checked':'';return '<tr><td><input type="checkbox" class="rowchk" data-sid="'+esc(n._sid||'')+'" onchange="window.toggleSelect&&window.toggleSelect(this.dataset.sid,this.checked)"'+chk+'></td><td>'+(i+1)+'</td><td>'+esc(n.name)+'<div class="small">'+esc(meta(n))+'</div></td><td><span class="tag" title="'+esc(n.protocol)+'">'+esc(n.protocol)+'</span></td><td>'+esc(n.server)+'</td><td>'+esc(n.port)+'</td></tr>'}
  window.sv135LoadMore=function(){viewLimit+=PAGE_SIZE;apply();};
  var oldApply=apply;
  apply=function(){
    try{
      if(!DATA){refine();return}
      var a=filtered(),sc=selectedCount(),k=keyOf(a);if(k!==lastKey){viewLimit=PAGE_SIZE;lastKey=k}
      var c=byId('count');if(c)c.textContent='当前显示 '+a.length+' / '+((DATA&&DATA.summary&&DATA.summary.total)||0)+' 个节点，已选 '+sc+' 个';
      updateSelectUI();
      var show=a.slice(0,viewLimit), html=show.map(row).join('');
      if(a.length>show.length){html+='<tr class="sv135-more-row"><td colspan="6"><button type="button" class="btn2 sv135-more" onclick="window.sv135LoadMore&&window.sv135LoadMore();return false">继续显示 '+Math.min(PAGE_SIZE,a.length-show.length)+' 个，剩余 '+(a.length-show.length)+' 个</button></td></tr>'}
      if(!html) html='<tr><td colspan="6" class="muted">当前筛选没有节点</td></tr>';
      var tb=byId('tbody');if(tb)tb.innerHTML=html;
      updateHealth(a);refine();
    }catch(e){try{oldApply()}catch(_){ } console.log(e)}
  };
  var oldRender=render;
  render=function(d){oldRender(d);ensureDashboard();updateHealth(filtered());refine();};
  window.addEventListener('DOMContentLoaded',function(){refine();updateHealth([]);});
})();

;(function(){
  var PAGE_SIZE=120;
  var viewLimit=PAGE_SIZE;
  var lastKey='';
  function byId(id){return document.getElementById(id)}
  function closestCard(el){return el&&el.closest?el.closest('.card'):(el?el.parentNode:null)}
  function addMeta(name,content){
    if(document.querySelector('meta[name="'+name+'"]')) return;
    var m=document.createElement('meta');m.name=name;m.content=content;document.head.appendChild(m);
  }
  function pulseButton(btn,okText){
    if(!btn)return;
    var old=btn.textContent;
    btn.textContent=okText||'✓ SUCCESS';
    btn.classList.add('sv136-success');
    setTimeout(function(){btn.textContent=old;btn.classList.remove('sv136-success')},1500);
  }
  function installStyle(){
    if(byId('sv136Style'))return;
    var stl=document.createElement('style');stl.id='sv136Style';
    stl.textContent=
      'body.sv136{--bg-main:#0B0C10;--bg-card:#171921;--bg-card-2:#1E212B;--color-gold:#F1B813;--color-gold-2:#D4A00E;--color-gold-dim:rgba(241,184,19,.12);--border-color:#262938;--text-main:#fff;--text-soft:#94A3B8;--text-dim:#64748B;margin:0!important;background:radial-gradient(circle at 50% -10%,rgba(241,184,19,.12),transparent 34%),#0B0C10!important;color:var(--text-soft)!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;}'+
      'body.sv136 .wrap{max-width:1080px!important;margin:0 auto!important;padding:calc(22px + env(safe-area-inset-top)) 18px calc(58px + env(safe-area-inset-bottom))!important;}'+
      'body.sv136 .hero,body.sv136 .card,body.sv136 .rulebox{background:rgba(23,25,33,.92)!important;border:1px solid var(--border-color)!important;border-radius:22px!important;box-shadow:0 18px 50px rgba(0,0,0,.30)!important;}'+
      'body.sv136 .hero{position:relative;overflow:hidden;padding:24px!important;}body.sv136 .hero:before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:linear-gradient(90deg,transparent,var(--color-gold),transparent);opacity:.85;}'+
      'body.sv136 h1,body.sv136 h2{color:var(--text-main)!important;letter-spacing:-.02em;}body.sv136 h1{font-size:30px!important;margin:6px 0 10px!important;}body.sv136 h2{font-size:21px!important;margin-bottom:14px!important;}'+
      'body.sv136 .small,body.sv136 .muted,body.sv136 .toolhint{color:var(--text-soft)!important;}body.sv136 .toolhint{line-height:1.7!important;font-size:13px!important;margin:9px 0 13px!important;}'+
      'body.sv136 input,body.sv136 textarea,body.sv136 select{background:#0F1118!important;border:1px solid var(--border-color)!important;color:var(--text-main)!important;border-radius:14px!important;padding:13px 15px!important;transition:border-color .22s ease,box-shadow .22s ease,background .22s ease!important;}'+
      'body.sv136 input:focus,body.sv136 textarea:focus,body.sv136 select:focus{border-color:var(--color-gold)!important;box-shadow:0 0 0 3px rgba(241,184,19,.15)!important;outline:none!important;background:#11141D!important;}'+
      'body.sv136 input::placeholder,body.sv136 textarea::placeholder{color:#64748B!important;}'+
      'body.sv136 button{background:#202432!important;color:#fff!important;border:1px solid rgba(255,255,255,.04)!important;border-radius:14px!important;box-shadow:none!important;font-weight:800!important;letter-spacing:.01em!important;transition:transform .18s ease,box-shadow .18s ease,background .18s ease,color .18s ease!important;}'+
      'body.sv136 button:hover{transform:translateY(-1px)!important;box-shadow:0 10px 24px rgba(0,0,0,.28)!important;}body.sv136 #pull,body.sv136 #alive,body.sv136 .sv136-primary{background:linear-gradient(135deg,var(--color-gold),var(--color-gold-2))!important;color:#0B0C10!important;box-shadow:0 8px 24px rgba(241,184,19,.18)!important;}body.sv136 .sv136-success{background:linear-gradient(135deg,#2dd4bf,#10b981)!important;color:#07110f!important;}'+
      'body.sv136 .status{background:#0F1118!important;border-color:var(--border-color)!important;border-radius:16px!important;color:#D8DEE9!important;}'+
      'body.sv136 #cards.grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:14px!important;margin:22px 0 16px!important;}'+
      'body.sv136 .stat{background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.012))!important;border:1px solid var(--border-color)!important;border-radius:18px!important;padding:18px!important;text-align:left!important;}'+
      'body.sv136 .stat span{display:block;color:var(--text-dim)!important;font-size:12px!important;text-transform:uppercase;letter-spacing:.05em;font-weight:800!important;}body.sv136 .stat b{display:block;color:var(--color-gold)!important;font-size:32px!important;line-height:1.1;margin-top:8px!important;}'+
      'body.sv136 .sv135-chart-grid{display:grid!important;grid-template-columns:1fr 1fr 1fr!important;gap:16px!important;margin:8px 0 18px!important;}body.sv136 .sv135-chart-grid>.card{margin:0!important;}'+
      'body.sv136 #protocols,body.sv136 #countries{max-height:310px;overflow:auto;padding-right:3px;}body.sv136 .bar{display:grid!important;grid-template-columns:minmax(76px,120px) minmax(90px,1fr) 38px!important;align-items:center!important;gap:10px!important;margin:11px 0!important;min-height:24px!important;}'+
      'body.sv136 .track{height:11px!important;background:#262938!important;border-radius:999px!important;overflow:hidden!important;}body.sv136 .fill{height:11px!important;background:linear-gradient(90deg,var(--color-gold),#F6D36C)!important;border-radius:999px!important;}body.sv136 .bar b{color:#E5E7EB!important;}'+
      'body.sv136 #sv135Health .health-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:6px 0 12px;}body.sv136 #sv135Health .health-cell{padding:13px 12px;border:1px solid var(--border-color);border-radius:16px;background:#0F1118;}body.sv136 #sv135Health .health-cell span{display:block;color:var(--text-dim);font-size:12px;font-weight:800;}body.sv136 #sv135Health .health-cell b{display:block;color:var(--color-gold);font-size:29px;line-height:1.05;margin-top:5px;}'+
      'body.sv136 .sv135-section-title,body.sv136 .sv136-section-title{color:var(--color-gold)!important;font-size:12px!important;font-weight:900!important;letter-spacing:.08em!important;text-transform:uppercase!important;margin:18px 0 9px!important;}'+
      'body.sv136 .sv133-grid,body.sv136 .sv133-grid.three,body.sv136 .sv-mini-grid,body.sv136 .sv-op-grid,body.sv136 .toolbar{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(138px,1fr))!important;gap:10px!important;margin:10px 0 14px!important;}'+
      'body.sv136 .sv133-grid button,body.sv136 .sv-mini-grid button,body.sv136 .sv-op-grid button,body.sv136 .toolbar button{min-height:48px!important;margin:0!important;padding:12px 10px!important;white-space:normal!important;word-break:keep-all!important;line-height:1.28!important;}'+
      'body.sv136 .sv-meta-row{background:#0F1118;border:1px solid var(--border-color);border-radius:16px;padding:10px 12px;}body.sv136 .sv-pill{background:var(--color-gold-dim)!important;color:var(--color-gold)!important;border:1px solid rgba(241,184,19,.22)!important;}'+
      'body.sv136 .rowchk{accent-color:var(--color-gold)!important;width:23px!important;height:23px!important;}body.sv136 input[type="checkbox"]{accent-color:var(--color-gold)!important;}'+
      'body.sv136 details summary{color:#fff!important;list-style:none;}body.sv136 details summary::-webkit-details-marker{display:none;}body.sv136 details summary:before{content:"▸";color:var(--color-gold);margin-right:8px;}body.sv136 details[open] summary:before{content:"▾";}'+
      'body.sv136 .exportbar{display:grid!important;grid-template-columns:minmax(0,1.35fr) minmax(94px,.45fr) minmax(94px,.45fr)!important;gap:10px!important;align-items:stretch!important;}body.sv136 #sv133ExportGrid{grid-template-columns:repeat(auto-fit,minmax(124px,1fr))!important;}'+
      'body.sv136 table{width:100%!important;border-collapse:collapse!important;table-layout:fixed!important;background:var(--bg-card)!important;border:1px solid var(--border-color)!important;border-radius:18px!important;overflow:hidden!important;margin-top:18px!important;}'+
      'body.sv136 th{background:var(--bg-card-2)!important;color:#fff!important;font-size:13px!important;font-weight:800!important;letter-spacing:.04em!important;text-align:left!important;padding:14px 14px!important;border-bottom:1px solid var(--border-color)!important;border-top:0!important;}'+
      'body.sv136 td{padding:15px 14px!important;color:var(--text-soft)!important;border-top:0!important;border-bottom:1px solid #1E212B!important;word-break:normal!important;vertical-align:middle!important;}body.sv136 tr:hover td{background:rgba(255,255,255,.025)!important;color:#fff!important;}'+
      'body.sv136 th:nth-child(1){width:48px!important}body.sv136 th:nth-child(2){width:54px!important}body.sv136 th:nth-child(4){width:104px!important}body.sv136 th:nth-child(6){width:84px!important}body.sv136 td.sv136-server{max-width:240px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:#7F8EA3!important;}body.sv136 td.sv136-port{color:#fff!important;font-weight:800!important;}'+
      'body.sv136 .tag{display:inline-flex!important;align-items:center!important;justify-content:center!important;background:var(--color-gold-dim)!important;color:var(--color-gold)!important;border:1px solid rgba(241,184,19,.22)!important;border-radius:999px!important;padding:5px 10px!important;font-size:12px!important;font-weight:900!important;text-transform:uppercase!important;white-space:nowrap!important;max-width:96px!important;overflow:hidden!important;text-overflow:ellipsis!important;}'+
      'body.sv136 .sv136-empty{padding:26px 14px;text-align:center;color:var(--text-soft);line-height:1.7;border:1px dashed rgba(241,184,19,.28);border-radius:18px;background:#0F1118;}body.sv136 .sv135-more-row td,body.sv136 .sv136-more-row td{text-align:center!important;padding:16px!important;}body.sv136 .sv136-more{width:min(360px,100%);margin:0 auto!important;}'+
      'body.sv136 .sv136-quick-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0 0;}body.sv136 .sv136-dragging{box-shadow:0 0 0 3px rgba(241,184,19,.2),0 24px 60px rgba(0,0,0,.45)!important;border-color:var(--color-gold)!important;}'+
      '@media(max-width:860px){body.sv136 .sv135-chart-grid{grid-template-columns:1fr!important;}body.sv136 #cards.grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}body.sv136 #cards .stat:last-child{grid-column:span 2;}body.sv136 .wrap{padding-left:14px!important;padding-right:14px!important;}}'+
      '@media(max-width:720px){body.sv136 .exportbar{grid-template-columns:1fr!important;}body.sv136 .filters{grid-template-columns:1fr 1fr!important;}body.sv136 .sv136-quick-row{grid-template-columns:1fr;}body.sv136 table,body.sv136 thead,body.sv136 tbody{display:block;width:100%;}body.sv136 thead{display:none;}body.sv136 tbody tr{display:grid!important;grid-template-columns:36px minmax(0,1fr) 92px!important;grid-template-areas:"check name proto" "check server port"!important;gap:6px 10px;align-items:center;border-bottom:1px solid #1E212B!important;padding:13px 0!important;}body.sv136 tbody td{display:block!important;border:0!important;padding:0!important;min-width:0!important;}body.sv136 tbody td:nth-child(1){grid-area:check;}body.sv136 tbody td:nth-child(2){display:none!important;}body.sv136 tbody td:nth-child(3){grid-area:name;color:#fff!important;font-size:15px!important;line-height:1.35!important;word-break:break-word!important;}body.sv136 tbody td:nth-child(4){grid-area:proto;text-align:right!important;}body.sv136 tbody td:nth-child(5){grid-area:server;display:block!important;max-width:none!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:12px!important;color:#64748B!important;}body.sv136 tbody td:nth-child(6){grid-area:port;text-align:right!important;color:#fff!important;font-size:15px!important;font-weight:900!important;}body.sv136 .tag{max-width:90px!important;font-size:12px!important;padding:5px 9px!important;}body.sv136 .small{font-size:12px!important;line-height:1.42!important;}}'+
      '@media(max-width:390px){body.sv136 #cards.grid{gap:10px!important;}body.sv136 .stat{padding:15px!important;}body.sv136 .stat b{font-size:28px!important;}body.sv136 .sv133-grid,body.sv136 .sv133-grid.three,body.sv136 .sv-mini-grid,body.sv136 .sv-op-grid,body.sv136 .toolbar{grid-template-columns:repeat(2,minmax(0,1fr))!important;}body.sv136 tbody tr{grid-template-columns:34px minmax(0,1fr) 84px!important;}body.sv136 button{font-size:15px!important;padding-left:8px!important;padding-right:8px!important;}}';
    document.head.appendChild(stl);
  }
  function addTitle(id,text,before){if(!before||byId(id))return;var t=document.createElement('div');t.id=id;t.className='sv136-section-title';t.textContent=text;before.parentNode.insertBefore(t,before)}
  function ensureCopyQuick(){
    var hero=document.querySelector('.hero'); if(!hero||byId('sv136QuickCopy'))return;
    var status=byId('status'); var row=document.createElement('div'); row.className='sv136-quick-row';
    row.innerHTML='<button type="button" id="sv136QuickCopy" class="sv136-primary">一键复制干净配置</button><button type="button" id="sv136CopyAliveQuick">复制可用节点</button>';
    hero.insertBefore(row,status||null);
    byId('sv136QuickCopy').onclick=function(){if(window.copyExport)window.copyExport();var b=this;setTimeout(function(){var txt=(byId('status')&&byId('status').textContent)||'';if(txt.indexOf('已复制')>=0)pulseButton(b)},120)};
    byId('sv136CopyAliveQuick').onclick=function(){if(window.copyAliveExport)window.copyAliveExport();var b=this;setTimeout(function(){var txt=(byId('status')&&byId('status').textContent)||'';if(txt.indexOf('已复制')>=0)pulseButton(b)},120)};
  }
  function ensureDashboard(){
    document.body.classList.add('sv136');installStyle();ensureCopyQuick();
    addMeta('apple-mobile-web-app-capable','yes');addMeta('apple-mobile-web-app-status-bar-style','black-translucent');addMeta('apple-mobile-web-app-title','SubViz');
    var p=closestCard(byId('protocols')),c=closestCard(byId('countries'));
    if(p&&c&&!byId('sv135Charts')){var grid=document.createElement('div');grid.id='sv135Charts';grid.className='sv135-chart-grid';p.parentNode.insertBefore(grid,p);grid.appendChild(p);grid.appendChild(c);var h=document.createElement('div');h.id='sv135Health';h.className='card';h.innerHTML='<h2>节点健康状况</h2><div class="health-grid"><div class="health-cell"><span>可用</span><b id="hAlive">0</b></div><div class="health-cell"><span>不可用</span><b id="hDead">0</b></div><div class="health-cell"><span>未测</span><b id="hUntested">0</b></div><div class="health-cell"><span>当前筛选</span><b id="hScope">0</b></div></div><div id="hBars" class="small muted">测活后这里会显示可用比例。</div>';grid.appendChild(h)}
  }
  function health(nodes){var a=0,d=0,u=0;(nodes||[]).forEach(function(n){if(n.aliveOK===true)a++;else if(n.aliveOK===false)d++;else u++});return{alive:a,dead:d,untested:u,total:(nodes||[]).length}}
  function updateHealth(nodes){ensureDashboard();var h=health(nodes||[]);[['hAlive',h.alive],['hDead',h.dead],['hUntested',h.untested],['hScope',h.total]].forEach(function(x){var el=byId(x[0]);if(el)el.textContent=x[1]});var b=byId('hBars');if(b){var p=h.total?Math.round(h.alive/h.total*100):0;b.innerHTML='<div class="bar"><div>可用率</div><div class="track"><div class="fill" style="width:'+p+'%"></div></div><b>'+p+'%</b></div>'}}
  function refine(){
    ensureDashboard();
    addTitle('sv136SelectTitle','选择范围',byId('sv133SelectGrid')||byId('sv132SelectGrid'));
    addTitle('sv136ActionTitle','常用操作',byId('sv133MainGrid')||byId('sv132MainOps'));
    addTitle('sv136AdvancedTitle','高级设置',document.querySelector('.rulebox'));
    addTitle('sv136ExportTitle','导出与复制',byId('sv133ExportGrid')||byId('sv132ExportGrid')||byId('exportType'));
    var alive=byId('alive');if(alive)alive.textContent='测活';
    var geo=byId('geo');if(geo)geo.textContent='GeoIP 补全';
    var landing=byId('landing');if(landing)landing.textContent='落地检测';
    var clean=byId('cleanNames');if(clean)clean.textContent='清理节点名';
    var copyAlive=byId('copyAliveBtn');if(copyAlive)copyAlive.textContent='复制可用';
    if(!DATA){var tb=byId('tbody');if(tb)tb.innerHTML='<tr><td colspan="6"><div class="sv136-empty">先输入订阅 URL，或直接粘贴 / 拖入订阅内容。<br>分析后可筛选、勾选节点，再执行测活、落地检测、清理和复制。</div></td></tr>'}
  }
  function keyOf(a){var q=(byId('q')&&byId('q').value)||'',pf=(byId('pf')&&byId('pf').value)||'',cf=(byId('cf')&&byId('cf').value)||'',u=(byId('unique')&&byId('unique').checked)?'1':'0';return [a.length,q,pf,cf,u].join('|')}
  function row(n,i){var chk=SELECTED[n._sid]?' checked':'';return '<tr><td><input type="checkbox" class="rowchk" data-sid="'+esc(n._sid||'')+'" onchange="window.toggleSelect&&window.toggleSelect(this.dataset.sid,this.checked)"'+chk+'></td><td>'+(i+1)+'</td><td>'+esc(n.name)+'<div class="small">'+esc(meta(n))+'</div></td><td><span class="tag" title="'+esc(n.protocol)+'">'+esc(n.protocol)+'</span></td><td class="sv136-server" title="'+esc(n.server||'')+'">'+esc(n.server)+'</td><td class="sv136-port">'+esc(n.port)+'</td></tr>'}
  window.sv136LoadMore=function(){viewLimit+=PAGE_SIZE;apply()};
  var oldApply=apply;
  apply=function(){
    try{
      if(!DATA){refine();updateHealth([]);return}
      var a=filtered(),sc=selectedCount(),k=keyOf(a);if(k!==lastKey){viewLimit=PAGE_SIZE;lastKey=k}
      var c=byId('count');if(c)c.textContent='当前显示 '+a.length+' / '+((DATA&&DATA.summary&&DATA.summary.total)||0)+' 个节点，已选 '+sc+' 个';
      updateSelectUI();
      var show=a.slice(0,viewLimit),html=show.map(row).join('');
      if(a.length>show.length){html+='<tr class="sv136-more-row"><td colspan="6"><button type="button" class="btn2 sv136-more" onclick="window.sv136LoadMore&&window.sv136LoadMore();return false">继续显示 '+Math.min(PAGE_SIZE,a.length-show.length)+' 个，剩余 '+(a.length-show.length)+' 个</button></td></tr>'}
      if(!html)html='<tr><td colspan="6" class="muted">当前筛选没有节点</td></tr>';
      var tb=byId('tbody');if(tb)tb.innerHTML=html;
      updateHealth(a);refine();
    }catch(e){try{oldApply()}catch(_){ }console.log(e)}
  };
  var oldRender=render;
  render=function(d){oldRender(d);ensureDashboard();updateHealth(filtered());refine()};
  function autoAnalyzeText(){var raw=byId('raw');if(!raw)return;var t=String(raw.value||'').trim();if(t.length<20)return;if(/^(https?:\/\/\S+)$/i.test(t)){var u=byId('url');if(u){u.value=t;analyzeURL();return}}analyzeText()}
  function installAutoParse(){
    var raw=byId('raw'),url=byId('url'),hero=document.querySelector('.hero');
    if(url&&!url._sv136Paste){url._sv136Paste=1;url.addEventListener('paste',function(){setTimeout(function(){var v=String(url.value||'').trim();if(/^https?:\/\//i.test(v))analyzeURL()},80)});url.addEventListener('drop',function(e){try{e.preventDefault();var txt=e.dataTransfer.getData('text');if(txt){url.value=txt.trim();if(/^https?:\/\//i.test(url.value))analyzeURL()}}catch(_){}})}
    if(raw&&!raw._sv136Paste){raw._sv136Paste=1;raw.addEventListener('paste',function(){setTimeout(autoAnalyzeText,120)});raw.addEventListener('drop',function(e){try{e.preventDefault();var f=e.dataTransfer.files&&e.dataTransfer.files[0];if(f){var r=new FileReader();r.onload=function(){raw.value=String(r.result||'');autoAnalyzeText()};r.readAsText(f);return}var txt=e.dataTransfer.getData('text');if(txt){raw.value=txt;autoAnalyzeText()}}catch(err){st('拖拽读取失败：'+(err.message||err))}})}
    if(hero&&!hero._sv136Drop){hero._sv136Drop=1;['dragenter','dragover'].forEach(function(ev){hero.addEventListener(ev,function(e){e.preventDefault();hero.classList.add('sv136-dragging')})});['dragleave','drop'].forEach(function(ev){hero.addEventListener(ev,function(){hero.classList.remove('sv136-dragging')})})}
  }
  var oldCopyExport=window.copyExport;
  if(oldCopyExport&&!window._sv136CopyWrapped){window._sv136CopyWrapped=1;window.copyExport=function(){oldCopyExport.apply(this,arguments);var b=byId('copyBtn');setTimeout(function(){var txt=(byId('status')&&byId('status').textContent)||'';if(txt.indexOf('已复制')>=0)pulseButton(b)},150)}}
  window.addEventListener('DOMContentLoaded',function(){ensureDashboard();installAutoParse();refine();updateHealth(DATA?filtered():[])});
})();
