import {BehavioralRecorder} from './behavioralRecorder.js';

const products=[
 {id:'shoes-01',name:'Everyday Walking Shoes',category:'Shoes',price:1499,icon:'👟',tone:1,summary:'Lightweight everyday shoes with a flexible sole and a breathable upper.',features:['Breathable fabric upper','Flexible sole for everyday walking','Available in sizes 6–11','Easy-to-clean surface']},
 {id:'audio-01',name:'Wireless Over-Ear Headphones',category:'Headphones',price:2299,icon:'🎧',tone:2,summary:'Comfortable over-ear headphones for music, study sessions and video calls.',features:['Soft adjustable ear cushions','Rechargeable battery','Built-in microphone','Foldable design for storage']},
 {id:'bag-01',name:'Campus Laptop Backpack',category:'Backpacks',price:1299,icon:'🎒',tone:3,summary:'A practical backpack with separate storage for a laptop, books and small accessories.',features:['Padded laptop compartment','Two side pockets','Adjustable shoulder straps','Separate front organizer']},
 {id:'shoes-02',name:'Training Sports Shoes',category:'Shoes',price:1899,icon:'👟',tone:2,summary:'Cushioned sports shoes designed for regular training and casual outdoor activity.',features:['Cushioned heel','Textured outsole','Lightweight construction','Lace-up fastening']},
 {id:'audio-02',name:'Compact Travel Headphones',category:'Headphones',price:1799,icon:'🎧',tone:3,summary:'A compact audio option with an adjustable headband and a lightweight travel design.',features:['Adjustable headband','Detachable cable','Lightweight ear cups','Travel-friendly profile']},
 {id:'bag-02',name:'Weekend Travel Backpack',category:'Backpacks',price:1999,icon:'🎒',tone:1,summary:'A roomy backpack with multiple compartments for short trips and daily essentials.',features:['Spacious main compartment','Padded back panel','External bottle pocket','Quick-access top pocket']},
 {id:'desk-01',name:'Adjustable Desk Lamp',category:'Home',price:899,icon:'💡',tone:2,summary:'A compact desk lamp with adjustable positioning for reading and study.',features:['Adjustable angle','Stable tabletop base','Compact footprint','Simple on/off control']},
 {id:'bottle-01',name:'Everyday Water Bottle',category:'Accessories',price:599,icon:'🥤',tone:3,summary:'A reusable bottle for your desk, backpack and everyday travel.',features:['Reusable construction','Easy-grip shape','Wide opening','Fits most backpack pockets']},
 {id:'watch-01',name:'Classic Everyday Watch',category:'Accessories',price:1599,icon:'⌚',tone:1,summary:'A simple everyday watch with a clear dial and a comfortable strap.',features:['Clear dial markings','Adjustable strap','Lightweight design','Everyday style']}
];
const app=document.querySelector('#app'),panel=document.querySelector('#recording-panel');
const cart=new Map();let participant='user00',device='mouse',snapshot={state:'idle',total:0,acknowledged:0,elapsedMs:0},priorState='idle';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'₹'+n.toLocaleString('en-IN');
panel.innerHTML='<strong id="panel-title"></strong><p id="panel-state"></p><p id="panel-counts"></p><p id="panel-error" class="error" role="alert"></p><div class="row"><button id="stop-btn" type="button">Stop and save</button><button id="retry-btn" type="button">Retry saving</button><a id="result-link" data-nav href="/data-collection">View result</a></div>';
function update(s){
 snapshot=s;panel.hidden=s.state==='idle';
 document.querySelector('#panel-title').textContent='EvoGuard collection · '+s.participant;
 document.querySelector('#panel-state').textContent=s.state==='recording'?(s.paused?'Paused — return to an approved browsing task':'Recording mouse and keyboard timing'):({saved:'Session complete and saved',incomplete:'Interrupted session retained',starting:'Starting session…',saving:'Waiting for saved confirmation…',save_failed:'Saving needs attention',start_failed:'Could not start recording'}[s.state]||s.state);
 document.querySelector('#panel-counts').textContent=`${Math.floor(s.elapsedMs/1000)} s · ${s.total} captured · ${s.acknowledged} acknowledged`;
 document.querySelector('#panel-error').textContent=s.error?s.error+' Keep this tab open.':'';
 document.querySelector('#stop-btn').hidden=s.state!=='recording';
 document.querySelector('#retry-btn').hidden=!['save_failed','start_failed'].includes(s.state);
 document.querySelector('#result-link').hidden=!s.result;
 const allowed=['idle','saved','incomplete'].includes(s.state);
 for(const id of ['participant','device','consent']){const el=document.getElementById(id);if(el)el.disabled=!allowed;}
 const consent=document.getElementById('consent');
 if(s.state!==priorState && ['saved','incomplete'].includes(s.state) && consent)consent.checked=false;
 const start=document.getElementById('start-btn');if(start)start.disabled=!allowed||!consent?.checked;
 const result=document.getElementById('session-result');
 if(result){result.hidden=!s.result;if(s.result){document.getElementById('session-id').textContent=s.sessionId;document.getElementById('result-status').textContent=`${s.result.status} · ${s.acknowledged} events acknowledged`;document.getElementById('quality-flags').textContent=s.result.quality.flags.join(', ')||'No listed structural issues';}}
 priorState=s.state;
}
const recorder=new BehavioralRecorder(update);
document.querySelector('#stop-btn').addEventListener('click',()=>recorder.stop());
document.querySelector('#retry-btn').addEventListener('click',()=>recorder.retry());
function card(p){return `<article class="card"><a data-nav href="/product/${p.id}" aria-label="View ${p.name}"><div class="art tone-${p.tone}" aria-hidden="true">${p.icon}</div></a><div class="card-content"><div class="tag">${p.category}</div><h2><a data-nav href="/product/${p.id}">${p.name}</a></h2><p class="muted">${p.summary}</p><p class="price">${money(p.price)}</p><div class="row"><a class="button secondary" data-nav href="/product/${p.id}">View details</a><button data-add="${p.id}">Add to cart</button></div></div></article>`;}
function collection(){
 app.innerHTML=`<h1>Collect a browsing session</h1><p class="muted">Start with user00 for a short setup test. Use user01, user02 and so on for reviewed pilot participants.</p><section class="section" data-evoguard-control="true"><h2>Participant notice</h2><p>This research records mouse positions, scrolling, clicks and keyboard timing in the search and practice fields. It stores key categories and anonymous press IDs, not typed characters or search text. Do not enter personal details.</p><p>Your participant code replaces your name, but behavioral patterns may still distinguish people. Participation is voluntary. You may stop at any time and ask the project team to delete your sessions using your participant code or session ID.</p><p>The files remain on this computer for the project team. The team must delete them within 30 days after project evaluation finishes; deletion is not automatic.</p><form id="start-form"><div class="form-grid"><label class="field">Participant ID<input id="participant" type="text" autocomplete="off" pattern="user[0-9]{2,4}" value="${escape(participant)}" required></label><label class="field">Input device<select id="device"><option value="mouse">Mouse</option><option value="touchpad">Touchpad</option><option value="unknown">Unknown</option></select></label></div><label class="check"><input id="consent" type="checkbox"><span>I have read the notice and agree to this recording.</span></label><button id="start-btn" type="submit" disabled>Start recording</button><p id="form-error" role="alert" class="error"></p></form></section><section class="section"><h2>Tasks for everyone</h2><ol><li>Browse the homepage and scroll through the product cards.</li><li>Search for shoes, headphones and backpacks in your usual typing rhythm.</li><li>Open a few product pages, read details and scroll down.</li><li>Add two products to the cart, then remove one.</li><li>Return here and type the practice sentence below.</li><li>After about 3–5 minutes, click the persistent Stop and save button.</li></ol><p><a class="button" data-nav href="/">Open the storefront</a></p><label for="practice">Practice sentence: “I am comparing shoes, headphones and a backpack for this project.”</label><textarea id="practice" rows="3" data-evoguard-typing="true" autocomplete="off" spellcheck="false" placeholder="Type the supplied sentence. Do not enter personal information."></textarea><p class="muted">The catalog is local sample content. The session records protocol evomart_local_tasks_v1 so it can be distinguished from the original Flipkart environment.</p></section><section id="session-result" class="section" data-evoguard-control="true" hidden><h2>Saved session</h2><p id="result-status" class="success"></p><p id="session-id" class="mono"></p><p>Quality notes: <span id="quality-flags"></span></p><button id="download-btn" type="button">Download raw JSON</button><p class="muted">Quality notes describe recording structure, not a model prediction.</p><p id="download-error" class="error"></p></section>`;
 document.getElementById('device').value=device;
 document.getElementById('consent').addEventListener('change',()=>update(recorder.snapshot()));
 document.getElementById('participant').addEventListener('input',()=>{document.getElementById('consent').checked=false;update(recorder.snapshot());});
 document.getElementById('start-form').addEventListener('submit',async e=>{e.preventDefault();participant=document.getElementById('participant').value.trim();device=document.getElementById('device').value;const consent=document.getElementById('consent').checked;document.activeElement?.blur();document.getElementById('form-error').textContent='';try{await recorder.start(participant,device,consent);}catch(error){document.getElementById('form-error').textContent=error.message;}});
 document.getElementById('download-btn').addEventListener('click',async()=>{try{await recorder.download();}catch(error){document.getElementById('download-error').textContent=error.message;}});
 update(recorder.snapshot());
}
function productPage(id){
 const p=products.find(p=>p.id===id);if(!p){app.innerHTML='<h1>Product not found</h1><a data-nav href="/products">Browse products</a>';return;}
 app.innerHTML=`<p><a href="/products" data-nav>← All products</a></p><section class="section product-layout"><div class="art tone-${p.tone}" aria-hidden="true">${p.icon}</div><div><p class="tag">${p.category}</p><h1>${p.name}</h1><p>${p.summary}</p><p class="price">${money(p.price)}</p><button data-add="${p.id}">Add to cart</button><p id="cart-feedback" class="feedback" aria-live="polite"></p><p class="muted">Sample item for browsing research. No payment or account is required.</p></div></section><section class="section details"><h2>Product details</h2><ul>${p.features.map(f=>`<li>${f}</li>`).join('')}</ul><h2>Compare before choosing</h2><p>Consider how this item fits your everyday needs. Browse another option in the catalog and compare its price, features and design before deciding which item to add to your cart.</p><h2>Care and use</h2><p>Store the item in a clean, dry place when not in use. Follow the included care instructions for the product material. This description is sample storefront content for the research task.</p><h2>Delivery information</h2><p>This local storefront does not place orders or collect addresses. Adding and removing products only changes the cart in this browser tab.</p></section><h2>More products to explore</h2><div class="grid">${products.filter(q=>q.id!==p.id).slice(0,3).map(card).join('')}</div>`;
}
function cartPage(){
 const lines=[...cart].map(([id,qty])=>({p:products.find(p=>p.id===id),qty}));
 app.innerHTML=`<h1>Your task cart</h1><p class="muted">Add or remove sample products freely. There is no checkout.</p><section class="section">${lines.length?lines.map(({p,qty})=>`<div class="cart-row"><div aria-hidden="true">${p.icon}</div><div class="cart-name"><h2><a data-nav href="/product/${p.id}">${p.name}</a></h2><p>${money(p.price)} · Quantity ${qty}</p></div><button class="secondary" data-remove="${p.id}">Remove</button></div>`).join('')+'<p class="price">Total: '+money(lines.reduce((n,{p,qty})=>n+p.price*qty,0))+'</p>':'<p>Your cart is empty. Browse the products and add an item.</p>'}<a class="button" data-nav href="/products">Continue browsing</a></section>`;
}
function render(){
 const route=window.location.pathname;
 if(route==='/data-collection')collection();
 else if(route==='/cart')cartPage();
 else if(route.startsWith('/product/'))productPage(decodeURIComponent(route.slice(9)));
 else {
  const term=route.startsWith('/products/')?decodeURIComponent(route.slice(10)):'';
  const found=products.filter(p=>(p.name+' '+p.category).toLowerCase().includes(term.toLowerCase()));
  app.innerHTML=(route==='/'?'<section class="hero"><div class="tag">EVOMART LOCAL CATALOG</div><h1>Browse everyday essentials</h1><p>Explore products, compare details and manage your cart. Use normal browsing and typing movements during your recording.</p><a class="button" data-nav href="/products">Explore products</a></section>':`<h1>${term?'Search results for “'+escape(term)+'”':'All products'}</h1><p class="muted">${found.length} sample products</p>`)+`<div class="grid">${found.map(card).join('')}</div>`+(!found.length?'<section class="section"><p>No matches. Try shoes, headphones or backpacks.</p></section>':'');
 }
 document.getElementById('cart-count').textContent=[...cart.values()].reduce((n,v)=>n+v,0);
}
function navigate(href){history.pushState({},'',href);recorder.contextChanged();render();window.scrollTo(0,0);}
document.addEventListener('click',event=>{
 const link=event.target.closest('a[data-nav]');
 if(link && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button===0){event.preventDefault();navigate(link.getAttribute('href'));return;}
 const add=event.target.closest('[data-add]');if(add){const id=add.dataset.add;cart.set(id,(cart.get(id)||0)+1);document.getElementById('cart-count').textContent=[...cart.values()].reduce((n,v)=>n+v,0);const feedback=document.getElementById('cart-feedback');if(feedback)feedback.textContent='Added to your task cart.';return;}
 const remove=event.target.closest('[data-remove]');if(remove){cart.delete(remove.dataset.remove);render();}
});
document.getElementById('search-form').addEventListener('submit',event=>{event.preventDefault();const term=document.getElementById('search').value.trim();navigate(term?'/products/'+encodeURIComponent(term):'/products');});
window.addEventListener('popstate',()=>{recorder.contextChanged();render();});
render();
