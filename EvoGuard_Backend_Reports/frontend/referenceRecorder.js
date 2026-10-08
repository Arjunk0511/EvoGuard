// Schema 2.0 live windows. Never stores field values or literal keys.
export function startReferenceRecorder(onWindow, onStatus) {
  const WINDOW = 30000;
  let start = performance.now(), events = [], keys = new Map(), serial = 0;
  let lastMove = -Infinity, lastScroll = -Infinity, dropped = false, stopped = false;
  let page = route(), viewport = [window.innerWidth, window.innerHeight];
  const listeners = [];
  function route() {
    const p = window.location.pathname;
    if (['/', '/products', '/cart', '/data-collection'].includes(p)) return p;
    if (p.startsWith('/products/')) return '/products/:keyword';
    if (p.startsWith('/product/')) return '/product/:id';
    return 'restricted';
  }
  function excluded(target) {
    return Boolean(target && target.closest && target.closest('[data-evoguard-panel]'));
  }
  function keyboardAllowed(target) {
    // Only the shopping search field. Account/payment/address inputs are excluded.
    return target && target.tagName === 'INPUT' &&
      !['password','email','tel','number'].includes(target.type) &&
      (target.type === 'search' || /search/i.test(target.placeholder || '')) &&
      ['/', '/products', '/products/:keyword', '/product/:id', '/cart'].includes(route()) && !excluded(target);
  }
  function category(code) {
    if (/^Key/.test(code)) return 'LETTER';
    if (/^(Digit|Numpad)/.test(code)) return 'NUMBER';
    if (/^Arrow/.test(code)) return 'ARROW';
    if (/^Shift/.test(code)) return 'SHIFT';
    if (/^Control/.test(code)) return 'CONTROL';
    if (/^Alt/.test(code)) return 'ALT';
    return ({Space:'SPACE',Enter:'ENTER',Backspace:'BACKSPACE',Tab:'TAB',Escape:'ESCAPE',Delete:'DELETE'})[code] || 'SPECIAL';
  }
  function reset(now) {
    events=[]; keys.clear(); start=now; dropped=false; lastMove=lastScroll=-Infinity;
  }
  function advance(now) {
    if (stopped || now-start < WINDOW) return;
    if (now-start > WINDOW+2000) {
      onStatus('Window skipped: tab was delayed.'); reset(now); return;
    }
    const payload={schema_version:'2.0',timestamp_unit:'milliseconds',duration_ms:WINDOW,events};
    if (!dropped) onWindow(payload);
    else onStatus('Window skipped: event limit reached.');
    reset(start+WINDOW);
  }
  function push(type, extra={}, now=performance.now()) {
    if (stopped) return;
    advance(now);
    if (events.length >= 6000) { dropped=true; return; }
    events.push({seq:events.length,type,timestamp:Math.max(0,now-start),
      x:null,y:null,button:null,key_category:null,press_id:null,scroll_x:null,scroll_y:null,
      page,viewport_width:window.innerWidth,viewport_height:window.innerHeight,visible:null,...extra});
  }
  function sync(now) {
    advance(now);
    const next=route();
    if (next!==page || viewport[0]!==window.innerWidth || viewport[1]!==window.innerHeight) {
      keys.clear(); page=next; viewport=[window.innerWidth,window.innerHeight]; push('contextchange',{},now);
    }
  }
  function listen(type, handler, target=window) {
    target.addEventListener(type,handler,{passive:true});listeners.push([target,type,handler]);
  }
  ['mousemove','mousedown','mouseup','click','scroll','keydown','keyup'].forEach(type=>listen(type,e=>{
    const now=performance.now();sync(now);
    if (document.hidden || page==='restricted' || excluded(e.target)) return;
    if (type==='mousemove') {
      if (now-lastMove<25) return;lastMove=now;
      push(type,{x:e.clientX,y:e.clientY},now);
    } else if (['mousedown','mouseup','click'].includes(type)) {
      push(type,{x:e.clientX,y:e.clientY,button:e.button},now);
    } else if (type==='scroll') {
      if(now-lastScroll<25)return;lastScroll=now;
      push(type,{scroll_x:window.scrollX,scroll_y:window.scrollY},now);
    } else if (type==='keydown') {
      if (!keyboardAllowed(e.target)||e.repeat||e.isComposing||keys.has(e.code))return;
      const pair={press_id:String(++serial),key_category:category(e.code)};
      keys.set(e.code,pair);push(type,pair,now);
    } else {
      const pair=keys.get(e.code);keys.delete(e.code);
      if(pair && keyboardAllowed(e.target))push(type,pair,now);
    }
  }));
  listen('blur',()=>{keys.clear();push('blur');});
  listen('focus',()=>{keys.clear();push('focus');});
  listen('visibilitychange',()=>{keys.clear();push('visibilitychange',{visible:!document.hidden});},document);
  const timer=setInterval(()=>sync(performance.now()),100);
  onStatus('Recording — first result after 30 seconds.');
  return ()=>{stopped=true;clearInterval(timer);listeners.forEach(([t,n,h])=>t.removeEventListener(n,h));events=[];keys.clear();};
}
