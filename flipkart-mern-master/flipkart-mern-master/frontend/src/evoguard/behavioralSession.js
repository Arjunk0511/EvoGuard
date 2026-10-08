export const SCHEMA_VERSION = '2.0';
export const CAPTURE_SETTINGS = {mousemove_interval_ms:25,scroll_interval_ms:25,keyboard_policy:'allowlisted_non_sensitive',coordinate_unit:'css_pixels',scroll_mode:'document_absolute'};
export function safePage(pathname) {
  if (['/','/products','/cart','/data-collection'].includes(pathname)) return pathname;
  if (/^\/products\/[^/]+\/?$/.test(pathname)) return '/products/:keyword';
  if (/^\/product\/[^/]+\/?$/.test(pathname)) return '/product/:id';
  if (/^\/(login|register|password|account|shipping|order|orders|order_details|process|admin)(\/|$)/.test(pathname)) return 'restricted';
  return 'other';
}
export function keyCategory(code) {
  if (/^Key[A-Z]$/.test(code)) return 'LETTER';
  if (/^(Digit|Numpad)[0-9]$/.test(code)) return 'NUMBER';
  const map={Space:'SPACE',Enter:'ENTER',NumpadEnter:'ENTER',Backspace:'BACKSPACE',Tab:'TAB',ShiftLeft:'SHIFT',ShiftRight:'SHIFT',ControlLeft:'CONTROL',ControlRight:'CONTROL',AltLeft:'ALT',AltRight:'ALT',ArrowUp:'ARROW',ArrowDown:'ARROW',ArrowLeft:'ARROW',ArrowRight:'ARROW',Escape:'ESCAPE',Delete:'DELETE'};
  return map[code] || (code?'SPECIAL':'UNKNOWN');
}
export function currentContext() {
  return {page:safePage(window.location.pathname),viewport_width:Math.max(1,window.innerWidth),viewport_height:Math.max(1,window.innerHeight),focused:document.hasFocus(),visible:!document.hidden};
}
export function createBehavioralSession(participantId,inputDevice) {
  if (!/^user\d{2,4}$/.test(participantId)) throw new Error('Use an anonymous participant ID such as user01.');
  if (!window.crypto || !window.crypto.randomUUID) throw new Error('Open EvoMart on localhost or HTTPS to create session IDs.');
  return {schema_version:SCHEMA_VERSION,dataset_version:'evoguard_pilot_v1',collector_version:'custom_collector_2.0.1',session_id:window.crypto.randomUUID(),participant_id:participantId,behavior_label:'human',data_origin:'human_browser',protocol_version:'evomart_local_tasks_v1',consent:{status:'granted',notice_version:'behavior_notice_v1'},input_device:inputDevice,timestamp_unit:'milliseconds',started_at:new Date().toISOString(),capture_settings:{...CAPTURE_SETTINGS},initial_context:currentContext()};
}
export function createBehavioralEvent(seq,type,timestamp,fields={}) {
  const c=currentContext();
  return {seq,type,timestamp,x:null,y:null,button:null,key_category:null,press_id:null,scroll_x:null,scroll_y:null,page:c.page,viewport_width:c.viewport_width,viewport_height:c.viewport_height,visible:null,...fields};
}
