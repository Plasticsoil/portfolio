/*! FunType (c) 2026 yamliv.net - all rights reserved. Outputs CC BY-NC 4.0 - https://yamliv.net/fun/license */
import"./render-CCgHOVR5.js";import{m as BN,c as BC,t as BT,r as BR,p as BP}from"./bounce.js";import{s as SWY,f as SWR,v as SWV,p as SWP,dealPalette as SWD}from"./sway.js";import{m as D}from"./cornerPinMesh-DvsMy1Jx.js";import{m as z,a as I,b as B,c as V,d as W}from"./loop-ObPNdiM7.js";import{P as g,C as w,c as j,D as q}from"./palette-D5fFc6np.js";const b="a, button, input, label, .card, .mnav-col, [role='button']",$="Inter, system-ui, sans-serif",R=16,T=24,X=4,G=12,y=12,F=27,Y=17,U=10,M=8,O=5;let v,u;function Z(){v||(v=document.createElementNS("http://www.w3.org/2000/svg","svg"),u=document.createElementNS("http://www.w3.org/2000/svg","text"),v.style.cssText="position:absolute;visibility:hidden;top:-9999px;left:-9999px;pointer-events:none;",u.setAttribute("font-family",$),u.setAttribute("font-size",R),u.setAttribute("font-weight","400"),v.appendChild(u),document.body.appendChild(v))}function J(e){return Z(),u.textContent=e,u.getComputedTextLength()}function K(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function Q(e,n){const c=String(e).trim(),t=J(c),o=F+t,r=y,i=o+M,a=o+(n?M+O:0)+U,s=n?`<polygon points="${i},${r-4} ${i+O},${r} ${i},${r+4}" fill="#292929"/>`:"";return`<svg width="${a}" height="${T}" viewBox="0 0 ${a} ${T}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${G}" cy="${y}" r="${X}" fill="#292929"/>
    <text x="${F}" y="${Y}" font-family="${$}" font-weight="400" font-size="${R}" fill="#26251E">${K(c)}</text>
    ${s}
  </svg>`}function ee(){if(window.matchMedia&&window.matchMedia("(pointer: coarse)").matches)return;const e=document.createElement("div");e.id="fz-cursor",e.innerHTML=`
    <div class="fz-inner">
      <div class="fz-idle">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.75 24.75H24.75V18.75M6.75 24.75H0.75V18.75M0.75 6.75V0.75H6.75M18.75 0.75H24.75V6.75" stroke="#26251E" stroke-width="1.5"/>
          <path d="M12.755 6.75V18.75" stroke="#26251E" stroke-width="1.5"/>
          <path d="M18.755 12.75L6.755 12.75" stroke="#26251E" stroke-width="1.5"/>
        </svg>
      </div>
      <div class="fz-canpress">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.75 24.75H24.75V18.75M6.75 24.75H0.75V18.75M0.75 6.75V0.75H6.75M18.75 0.75H24.75V6.75" stroke="#26251E" stroke-width="1.5"/>
          <circle cx="12.75" cy="12.75" r="4" fill="#26251E"/>
        </svg>
      </div>
      <div class="fz-tip"></div>
    </div>`,document.body.appendChild(e);const n=e.querySelector(".fz-tip");let c=innerWidth/2,t=innerHeight/2,o=c,r=t,i=!1;addEventListener("mousemove",a=>{o=a.clientX,r=a.clientY,i||(i=!0,e.classList.add("show"))},{passive:!0}),addEventListener("mouseleave",()=>{e.classList.remove("show"),i=!1}),addEventListener("mousedown",()=>e.classList.add("down")),addEventListener("mouseup",()=>e.classList.remove("down")),addEventListener("mouseover",a=>{a.target.closest&&a.target.closest(b)&&e.classList.add("active");const s=a.target.closest&&a.target.closest("[data-tip]");if(s){const l=s.dataset.tip,d=s.hasAttribute("data-tip-arrow");n.innerHTML=Q(l,d),e.classList.add("with-tip")}},{passive:!0}),addEventListener("mouseout",a=>{const s=a.relatedTarget;a.target.closest&&a.target.closest(b)&&!(s&&s.closest&&s.closest(b))&&e.classList.remove("active");const l=a.target.closest&&a.target.closest("[data-tip]"),d=s&&s.closest&&s.closest("[data-tip]");l&&!d&&e.classList.remove("with-tip")},{passive:!0}),function a(){c+=(o-c)*.22,t+=(r-t)*.22,e.style.transform=`translate(${c.toFixed(1)}px, ${t.toFixed(1)}px)`,requestAnimationFrame(a)}()}const N={"corner-pin":D,boxes:W,carousel:V,pack:B,dots:I,loop:z,bounce:BN,"bounce-chaos":BC,"bounce-tower":BT,"bounce-pillars":BR,sway:SWY,"sway-flower":SWR,"sway-volume":SWV},H=[],h=["frame","card","ink","anchor"],te={frame:"Background",card:"Card",ink:"Letters",anchor:"Anchors"},k=[{label:"Collection 01",short:"Coll. 01",cards:[{name:"Corner",kind:"corner-pin",word:"Corner",palette:g[5]},{name:"Orbit",kind:"carousel",word:"Orbit",palette:g[0]},{name:"Block",kind:"boxes",word:"In a block",palette:{frame:"#FFDD00",card:"#FA8EFA",ink:"#FFFFFF",anchor:"#FF721E"}}]},{label:"Collection 02",short:"Coll. 02",palettes:w,maxLength:60,cards:[{name:"Dots",kind:"dots",word:"DOTS!",palette:{frame:"#49C7FD",card:"#A9FF67",ink:"#D9FF93",anchor:"#A9FF67"}},{name:"Stickers",kind:"pack",word:"stick 4 ever",palette:w[0]},{name:"Loop",kind:"loop",word:"in the loooooop",palette:w[4]}]},{label:"Collection 03",short:"Coll. 03",palettes:BP,permute:!0,maxLength:300,cards:[{name:"Shrink",kind:"bounce-chaos",word:"Shrink the walls until there is no room left",palette:BP[1]},{name:"Towers",kind:"bounce-pillars",word:"I stack towers of letters",palette:BP[2]},{name:"Snake",kind:"bounce",word:"The snake eats its tail",palette:BP[0]}]},{label:"Collection 04",short:"Coll. 04",palettes:SWP,permute:!0,maxLength:300,cards:[{name:"Flower",kind:"sway-flower",word:"Flower power",palette:SWP[1]},{name:"Sway",kind:"sway",word:"all the sway",palette:SWP[0]},{name:"Grow",kind:"sway-volume",word:"Grow slowly",palette:SWP[2]}]}],C={shuffle:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/></svg>',arrowRight:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>'},A=(e,n)=>e.word.trim()?e.word:n.word,S=(e,n,c)=>e.cardPalettes&&e.cardPalettes[c]||e.paletteOverride||n.palette;function ne(e,n,c,t){const o=[n.frame,n.card,n.ink,n.anchor].map(a=>a.replace("#","")).join(","),r={effect:c.kind,word:e,name:c.name||"",pal:o};return t&&(r.seed=t|0),`export.html?${new URLSearchParams(r).toString()}`}function ae(e,n){const c=n&&n.length?n:g,t=c.map((o,r)=>r);for(let o=t.length-1;o>0;o--){const r=Math.floor(Math.random()*(o+1));[t[o],t[r]]=[t[r],t[o]]}return Array.from({length:e},(o,r)=>({...c[t[r%c.length]]}))}/* ---------- Card gate: only the cards you can see are running ----------

   Every card is a full 1080x1080 engine with a loop of its own, and the
   studio holds twelve of them. Mounting all twelve at load and leaving
   all twelve running for ever is affordable on a desktop and is not
   affordable on a phone: the main thread never comes free, the
   compositor carries hundreds of promoted layers it is not drawing, and
   the tab is killed part way through loading. On a phone the grid is one
   column, so one or two of the twelve are on screen at a time — the
   other ten are paying rent on nothing.

   So a card is built a little before it reaches the viewport, it draws
   only while it is actually on screen and the tab is visible, and it
   hands its DOM back once it has been away for a while. Two watchers:
   one reaching past the fold decides what is built, one on the fold
   itself decides what moves.

   The gate works on the clock rather than on each effect, so no effect
   module has to know about it. requestAnimationFrame is wrapped: a frame
   asked for while a card is mounting, or from inside one of that card's
   own frames, belongs to that card, and is held back while the card is
   parked. The timestamp handed back has the parked time taken off it, so
   an effect's clock stands still while it is off screen and picks up
   mid-stride when it comes back — no jump and no catching up.

   Mounting is paced one card to a frame, so a screen that reveals three
   at once costs three ordinary frames instead of one long task. */

const rafRaw = requestAnimationFrame.bind(window),
      cafRaw = cancelAnimationFrame.bind(window),
      GATE_ID = 1e9,                  /* our frame ids sit above the native ones */
      RETIRE_MS = 1e4,
      MOUNT_CAP = 4;
let gateSeq = GATE_ID, inCard = null, fontsIn = false;
const gateFrames = new Map(), gateCards = new Set(), gateBuilt = [];

window.requestAnimationFrame = function (cb) {
  const card = inCard;
  if (!card) return rafRaw(cb);
  const id = ++gateSeq, frame = { card, id, native: 0 };
  frame.run = (t) => {
    gateFrames.delete(id);
    card.frames.delete(frame);
    const prev = inCard;
    inCard = card;
    try { cb(t - card.parked); } finally { inCard = prev; }
  };
  gateFrames.set(id, frame);
  card.frames.add(frame);
  if (card.running) frame.native = rafRaw(frame.run);
  return id;
};

window.cancelAnimationFrame = function (id) {
  if (id > GATE_ID) {
    const frame = gateFrames.get(id);
    if (frame) {
      if (frame.native) cafRaw(frame.native);
      gateFrames.delete(id);
      frame.card.frames.delete(frame);
    }
    return;
  }
  return cafRaw(id);
};

function gateRun(card) {
  if (card.running) return;
  card.running = true;
  card.parked += performance.now() - card.since;
  card.frames.forEach((f) => { f.native = rafRaw(f.run); });
}

function gatePark(card) {
  if (!card.running) return;
  card.running = false;
  card.since = performance.now();
  card.frames.forEach((f) => { if (f.native) { cafRaw(f.native); f.native = 0; } });
}

/* One card a frame, so a screen that reveals three never pays for three
   mounts in one task. */
const mountQueue = [];
let pumping = false;
function pump() {
  const card = mountQueue.shift();
  if (card && !card.fx && !card.dead && card.near && !document.hidden) gateMount(card);
  if (mountQueue.length) rafRaw(pump); else pumping = false;
}
function gateQueue(card) {
  if (mountQueue.indexOf(card) < 0) mountQueue.push(card);
  if (!pumping) { pumping = true; rafRaw(pump); }
}

function gateMount(card) {
  card.running = true;
  card.since = 0;
  card.parked = 0;
  card.beforeFonts = !fontsIn;
  const prev = inCard;
  inCard = card;
  try { card.fx = card.make(card.stage()); } finally { inCard = prev; }
  /* The effects write the stage's whole style attribute as they mount,
     which drops the fit-to-card scale — so it goes back on after. */
  if (card.after) card.after();
  /* Built ahead of the fold: it has painted its first frame, and it
     holds there until it is actually looked at. */
  if (!card.seen || document.hidden) gatePark(card);
  gateBuilt.push(card);
  gateTrim();
}

/* A ceiling on how many cards are built at once, and the reason the gate
   exists at all. What a card costs on a phone is not its loop, it is its
   backing store: a card is a 1080x1080 stage, and between the stage, the
   grain it blends over the top and the full-frame overlays the effects
   draw into, each one is about four surfaces of that size. Twelve cards
   came to 163MB of compositor memory, which is past what iOS will let a
   tab hold — it is killed, and Safari says a problem repeatedly occurred
   while Chrome, WebKit underneath on that platform, says it cannot open
   the page.

   The retirement timer alone loses this race: scrolling the studio end
   to end builds every card well inside ten seconds. So the ceiling is
   counted, not timed. Cards near the fold are never given up — if more
   than the cap are genuinely near, they are all wanted — and the rest go
   oldest first. */
function gateTrim() {
  for (let i = 0; i < gateBuilt.length && gateBuilt.length > MOUNT_CAP; ) {
    const card = gateBuilt[i];
    if (card.near && !document.hidden) i++;
    else gateRetire(card);
  }
}

function gateRetire(card) {
  const at = gateBuilt.indexOf(card);
  if (at >= 0) gateBuilt.splice(at, 1);
  if (!card.fx || card.dead) return;
  if (card.fx.stop) card.fx.stop();
  card.frames.forEach((f) => { if (f.native) cafRaw(f.native); gateFrames.delete(f.id); });
  card.frames.clear();
  card.fx = null;
  card.running = false;
  /* The stage element goes, not just its children. Some effects take
     the card's pointer events and hand back a stop() that only stops
     the clock, so emptying the stage would leave those listeners on it —
     and each one holds the whole subtree it was built with. Swapping in
     a fresh stage drops the listeners with the node, whatever any one
     effect remembers to clean up. */
  const stage = card.stage();
  if (stage) {
    const fresh = document.createElement("div");
    fresh.className = "card-stage";
    stage.replaceWith(fresh);
    if (card.after) card.after();
  }
}

function gateSync(card) {
  if (card.dead) return;
  const live = !document.hidden, build = card.near && live;
  if (card.seen && live) {
    const at = gateBuilt.indexOf(card);
    if (at >= 0) { gateBuilt.splice(at, 1); gateBuilt.push(card); }
    card.fx ? gateRun(card) : gateQueue(card);
  }
  else if (card.fx) gatePark(card);
  else if (build) gateQueue(card);
  /* Parked costs no main thread, but a mounted card holds its promoted
     layers whether it is drawing or not, and twelve cards' worth of
     those is the other half of what a phone cannot carry. */
  clearTimeout(card.timer);
  if (card.fx && !build)
    card.timer = setTimeout(() => { if (!card.near || document.hidden) gateRetire(card); }, RETIRE_MS);
}

let watchNear, watchSeen;
function gateWatchers() {
  if (watchNear) return;
  const mark = (key) => (entries) => entries.forEach((en) => {
    const card = en.target._card;
    if (card) { card[key] = en.isIntersecting; gateSync(card); }
  });
  /* Built a little over half a screen ahead, so it is drawn by the time
     it arrives; moving only once it is on the fold. */
  watchNear = new IntersectionObserver(mark("near"), { rootMargin: "60% 0px" });
  watchSeen = new IntersectionObserver(mark("seen"), { rootMargin: "0px" });
}

function gateCard(el, make, after) {
  gateWatchers();
  const card = {
    el, make, after,
    stage: () => el.querySelector(".card-stage"),
    fx: null, frames: new Set(), running: false, timer: 0,
    parked: 0, since: 0, near: false, seen: false, dead: false,
    stop() {
      this.dead = true;
      clearTimeout(this.timer);
      watchNear.unobserve(el);
      watchSeen.unobserve(el);
      gateCards.delete(this);
      const at = gateBuilt.indexOf(this);
      if (at >= 0) gateBuilt.splice(at, 1);
      this.frames.forEach((f) => { if (f.native) cafRaw(f.native); gateFrames.delete(f.id); });
      this.frames.clear();
      if (this.fx && this.fx.stop) this.fx.stop();
      this.fx = null;
    },
  };
  el._card = card;
  gateCards.add(card);
  /* Seeded from where the card actually is, so a card in view when its
     section is rebuilt — typing a word, mixing the palette — is queued
     at once rather than waiting on the observers' first delivery. */
  const r = el.getBoundingClientRect(), h = innerHeight || 0;
  card.seen = r.bottom > 0 && r.top < h;
  card.near = r.bottom > -h * 0.6 && r.top < h * 1.6;
  watchNear.observe(el);
  watchSeen.observe(el);
  if (card.near) gateSync(card);
  return card;
}

document.addEventListener("visibilitychange", () => gateCards.forEach(gateSync));

/* Switzer settles every measurement these effects make, so a card that
   mounted before the face arrived was measured against a fallback and has
   to be laid out again once it lands. Only those cards: with the gate,
   most cards mount after the fonts are in and are right the first time.
   The whole studio used to be rebuilt here, all twelve cards, which on a
   phone is the expensive half of the load happening twice. */
if (document.fonts && document.fonts.ready)
  document.fonts.ready.then(() => {
    fontsIn = true;
    gateCards.forEach((card) => {
      if (!card.fx || !card.beforeFonts) return;
      card.beforeFonts = false;
      gateRetire(card);
      gateSync(card);
    });
  });

const L=document.getElementById("studio"),_={"corner-pin":"click",boxes:"click",carousel:"click",pack:"click",dots:"click",loop:"click",bounce:"click","bounce-chaos":"click","bounce-tower":"click","bounce-pillars":"click",sway:"click","sway-flower":"click","sway-volume":"click"};function se(e,n,c){const t=document.createElement("div");t.className="card-wrap";const o=document.createElement("div");o.className="card-header";const r=document.createElement("a");if(r.className="card-name",r.href="#",r.innerHTML=`<span class="card-slash">/</span> <span class="card-name-text">${n.name||""}</span>`,o.appendChild(r),n.kind!=="empty"){const a=document.createElement("a");a.className="card-export",a.title="Open export view",a.setAttribute("aria-label","Open export view"),a.dataset.tip="more",a.setAttribute("data-tip-arrow",""),a.target="_blank",a.rel="noopener",a.innerHTML=C.arrowRight;const s=()=>{a.href=ne(A(e,n),S(e,n,c),n,e.seed)};s(),a.addEventListener("click",s),r.href=a.href,r.addEventListener("click",l=>{s(),r.href=a.href}),o.appendChild(a)}t.appendChild(o);const i=document.createElement("div");if(i.className="card",_[n.kind]&&(i.dataset.tip=_[n.kind]),N[n.kind]){const a=document.createElement("div");a.className="card-stagewrap";const s=document.createElement("div");s.className="card-stage",a.appendChild(s),i.appendChild(a);const l=A(e,n),d=S(e,n,c);const p=()=>{const m=a.clientWidth,y=a.firstElementChild;m&&y&&(y.style.transform=`scale(${m/1080})`)},f=new ResizeObserver(p);f.observe(a),e.observers.push(f),i._setScale=p,i.style.background=d.frame,i._fx=gateCard(i,y=>N[n.kind](y,{word:l,palette:d,seed:e.seed|0}),p)}return t.appendChild(i),t._fx=i._fx,t._setScale=i._setScale,t}function x(e,n){(n.loops||[]).forEach(t=>t.stop&&t.stop()),n.loops=[],n.observers.forEach(t=>t.disconnect()),n.observers=[],n.cardsEl.innerHTML="";const c=e.cards.map((t,o)=>se(n,t,o));c.forEach(t=>n.cardsEl.appendChild(t)),c.forEach(t=>{t._fx&&n.loops.push(t._fx),t._setScale&&t._setScale()})}function oe(e,n){const c=document.createElement("div");c.className="pill text-pill";const t=document.createElement("input");t.type="text",t.value=e.word,t.maxLength=e.section&&e.section.maxLength||30,t.placeholder="Type here…",t.spellcheck=!1;let o;t.addEventListener("input",()=>{e.word=t.value,clearTimeout(o),o=setTimeout(n,400)});const r=document.createElement("button");return r.className="pill-btn",r.title="Random word",r.setAttribute("aria-label","Random word"),r.dataset.tip="shuffle word",r.innerHTML=C.shuffle,r.addEventListener("click",()=>{e.word=j(e.word),t.value=e.word,n()}),c.append(t,r),c}function re(e,n){const c=document.createElement("div");c.className="pill color-pill";const t=()=>e.paletteOverride||e.section&&e.section.cards[0]&&e.section.cards[0].palette||q,o={};function r(a,s){if(a===s)return;const l=h.indexOf(a),d=h.indexOf(s);if(l<0||d<0)return;e.cardPalettes=null,e.paletteOverride=e.paletteOverride||{...t()};const p=h.map(m=>e.paletteOverride[m]),[f]=p.splice(l,1);p.splice(d,0,f),h.forEach((m,E)=>{e.paletteOverride[m]=p[E],o[m].el.style.background=p[E],o[m].input.value=p[E]}),n()}h.forEach(a=>{const s=document.createElement("label");s.className="dot",s.title=te[a],s.style.background=t()[a];const l=document.createElement("input");l.type="color",l.className="dot-input",l.value=t()[a],l.addEventListener("input",()=>{e.cardPalettes=null,e.paletteOverride=e.paletteOverride||{...t()},e.paletteOverride[a]=l.value,s.style.background=l.value,n()}),s.appendChild(l),s.draggable=!0,s.addEventListener("dragstart",d=>{d.dataTransfer.setData("text/plain",a),d.dataTransfer.effectAllowed="move",s.classList.add("dot-dragging")}),s.addEventListener("dragend",()=>{s.classList.remove("dot-dragging")}),s.addEventListener("dragenter",d=>{d.dataTransfer.types.includes("text/plain")&&(d.preventDefault(),s.classList.add("dot-drop-target"))}),s.addEventListener("dragover",d=>{d.dataTransfer.types.includes("text/plain")&&(d.preventDefault(),d.dataTransfer.dropEffect="move")}),s.addEventListener("dragleave",()=>{s.classList.remove("dot-drop-target")}),s.addEventListener("drop",d=>{d.preventDefault(),s.classList.remove("dot-drop-target");const p=d.dataTransfer.getData("text/plain");p&&r(p,a)}),o[a]={el:s,input:l},c.appendChild(s)});const i=document.createElement("button");return i.className="pill-btn",i.title="Mix colors",i.setAttribute("aria-label","Mix colors"),i.dataset.tip="shuffle palette",i.innerHTML=C.shuffle,i.addEventListener("click",()=>{const a=e.section&&e.section.permute?(P=>[0,1,2,3].map(k=>{const q=[P.frame,P.card,P.ink,P.anchor];return SWD(null,{frame:q[k],card:q[(k+1)%4],ink:q[(k+2)%4],anchor:q[(k+3)%4]})}))(t()):e.section&&e.section.palettes||g,s=ae(e.section.cards.length,a);e.paletteOverride=null,e.cardPalettes=s,e.seed=Math.random()*4294967295|0;const l=s[0];h.forEach(d=>{o[d].el.style.background=l[d],o[d].input.value=l[d]}),n()}),c.appendChild(i),c}function ce(e,n){const c=document.createElement("section");c.className="section",c.id=`c${n+1}`;const t={word:"",paletteOverride:null,seed:0,observers:[],loops:[],section:e},o=document.createElement("div");o.className="section-head";const r=document.createElement("span");r.className="section-label",r.textContent=e.label;const i=()=>x(e,t);o.append(r,oe(t,i),re(t,i)),c.appendChild(o);const a=document.createElement("div");return a.className="cards",c.appendChild(a),t.cardsEl=a,x(e,t),H.push(()=>x(e,t)),c}function ie(){const e=document.getElementById("mastNav");e&&k.forEach((n,c)=>{const t=document.createElement("div");t.className="mnav-col";const o=document.createElement("a");o.className="mnav-title",o.href=`#c${c+1}`,o.textContent=n.short||n.label;const r=document.createElement("div");r.className="mnav-items";const i=document.createElement("div");i.className="mnav-line";const a=document.createElement("div");a.className="mnav-list",n.cards.forEach(s=>{const l=document.createElement("a");l.className="mnav-item",l.href=`#c${c+1}`,l.textContent=s.name||"Coming soon",a.appendChild(l)}),r.append(i,a),t.append(o,r),e.appendChild(t)})}function le(){const e=document.createElement("button");e.className="fz-menu-btn",e.type="button",e.setAttribute("aria-label","Open collection menu"),e.setAttribute("aria-expanded","false"),e.dataset.tip="menu",e.innerHTML=`
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>
    </svg>`,document.body.appendChild(e);const n=document.createElement("div");n.className="fz-menu-sheet",n.setAttribute("role","dialog"),n.setAttribute("aria-label","Collections"),n.innerHTML=`
    <button class="fz-menu-close" type="button" aria-label="Close menu">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18M6 6l12 12"/>
      </svg>
    </button>
    <div class="fz-menu-hero">Fun</div>
    <div class="fz-menu-card">${k.map((o,r)=>`
      <div class="fz-menu-group">
        <div class="fz-menu-title">${o.label}</div>
        <ul class="fz-menu-list">${o.cards.map((i,a)=>`
          <li><a href="#c${r+1}" data-card="${a}"><span class="fz-menu-slash">/</span> ${i.name||"Coming soon"}</a></li>
        `).join("")}</ul>
      </div>
    `).join("")}</div>`,document.body.appendChild(n),n.querySelector(".fz-menu-close").addEventListener("click",()=>{n.classList.remove("open"),e.classList.remove("open"),e.setAttribute("aria-expanded","false")});const c=()=>{n.classList.add("open"),e.classList.add("open"),e.setAttribute("aria-expanded","true")},t=()=>{n.classList.remove("open"),e.classList.remove("open"),e.setAttribute("aria-expanded","false")};e.addEventListener("click",()=>n.classList.contains("open")?t():c()),n.addEventListener("click",o=>{if(o.target===n){t();return}o.target.closest("a[href^='#']")&&t()}),document.addEventListener("keydown",o=>{o.key==="Escape"&&t()})}const P=()=>{const e=document.createElement("div");return e.className="divider",e};k.forEach((e,n)=>{L.appendChild(P()),L.appendChild(ce(e,n))});L.appendChild(P());ie();le();ee();
