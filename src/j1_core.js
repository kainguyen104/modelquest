"use strict";
/* ================= utilities ================= */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=(x,d=0)=>Number.isFinite(x)?x.toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d}):"—";
const money=x=>Number.isFinite(x)?"$"+fmt(x,Math.abs(x-Math.round(x))<0.005?0:2):"—";
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const near=(a,b,t=0.01)=>Number.isFinite(a)&&Math.abs(a-b)<=t;
let UID=1; const uid=()=>"b"+(UID++).toString(36)+Math.random().toString(36).slice(2,7);
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const INK="#17171C";

/* ================= icons (outline, matched to the mockups) ================= */
const ICP={
 home:'<path d="M3.2 11.2 12 3.8l8.8 7.4"/><path d="M5.4 9.6V20h4.8v-5.6h3.6V20h4.8V9.6"/>',
 trophy:'<path d="M7.6 3.6h8.8v4.6a4.4 4.4 0 0 1-8.8 0z"/><path d="M7.6 5.4H4.4a3.6 3.6 0 0 0 3.8 4.4M16.4 5.4h3.2a3.6 3.6 0 0 1-3.8 4.4"/><path d="M12 12.6v3.6M8.2 20.4h7.6M9.6 16.2h4.8v4.2H9.6z"/>',
 bars3:'<path d="M5.5 19.5v-6M12 19.5v-11M18.5 19.5v-15"/>',
 bars4:'<path d="M5 20v-5M10 20V10M15 20v-7M20 20V5"/>',
 diff:'<path d="M6 19v-4M12 19v-8M18 19V5"/>',
 gear:'<path d="M10.3 2.8h3.4l.5 2.6 1.9.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.9 2.6.5v3.4l-2.6.5-.8 1.9 1.5 2.2-2.4 2.4-2.2-1.5-1.9.8-.5 2.6h-3.4l-.5-2.6-1.9-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.9-2.6-.5v-3.4l2.6-.5.8-1.9-1.5-2.2 2.4-2.4 2.2 1.5 1.9-.8z"/><circle cx="12" cy="12" r="3.3"/>',
 clock:'<circle cx="12" cy="12" r="8.8"/><path d="M12 7.2V12l3.2 2.2"/>',
 flask:'<path d="M9 3h6M10 3v6.2L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.2V3"/><path d="M7.3 15h9.4"/>',
 cap:'<path d="M2 9.5 12 5l10 4.5L12 14z"/><path d="M6 11.5V16c3.5 2.3 8.5 2.3 12 0v-4.5M22 9.5V15"/>',
 play:'<path d="M7.5 4.8v14.4L19 12z"/>',
 playf:'<path d="M7.5 4.8v14.4L19 12z" fill="currentColor"/>',
 refresh:'<path d="M20 11a8 8 0 0 0-14.3-4.6M4 4.5v4.2h4.2"/><path d="M4 13a8 8 0 0 0 14.3 4.6M20 19.5v-4.2h-4.2"/>',
 check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
 arrowR:'<path d="M4.5 12h15M13 5.5l6.5 6.5-6.5 6.5"/>',
 arrowL:'<path d="M19.5 12h-15M11 5.5 4.5 12l6.5 6.5"/>',
 bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
 code:'<path d="M8 6.5 2.5 12 8 17.5M16 6.5l5.5 5.5-5.5 5.5"/>',
 code2:'<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
 vars:'<circle cx="12" cy="12" r="8.5"/><path d="M9 9l6 6M15 9l-6 6"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 logic:'<circle cx="12" cy="6" r="2.7"/><circle cx="6" cy="18" r="2.7"/><circle cx="18" cy="18" r="2.7"/><path d="M10.6 8.3 7.3 15.7M13.4 8.3l3.3 7.4M8.7 18h6.6"/>',
 loop:'<path d="M17 2.5l3 3-3 3"/><path d="M4 11.5v-1A5 5 0 0 1 9 5.5h11"/><path d="M7 21.5l-3-3 3-3"/><path d="M20 12.5v1a5 5 0 0 1-5 5H4"/>',
 trend:'<path d="M3 17.5l6-6 4 4 8-8"/><path d="M15 7.5h6v6"/>',
 graph:'<path d="M3.5 19.5h17"/><path d="M5 16.5l4.8-5 3.4 3.2 5.8-6.2"/><circle cx="19" cy="8.5" r="1.1" fill="currentColor"/>',
 term:'<rect x="3" y="4.5" width="18" height="15" rx="3"/><path d="M7 10l3 2.5L7 15M13 15h4"/>',
 percent:'<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.6"/><circle cx="17" cy="17" r="2.6"/>',
 cal:'<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.6v.4"/>',
 pillar:'<path d="M4.5 6.5h15"/><path d="M6 6.5c-2.2 0-2.2 3.2 0 3.2h12c2.2 0 2.2-3.2 0-3.2"/><path d="M8.2 9.7v9M12 9.7v9M15.8 9.7v9M5.5 20.5h13"/>',
 sigma:'<path d="M18 5H6.5l6 7-6 7H18"/>',
 atom:'<circle cx="12" cy="12" r="1.8" fill="currentColor"/><ellipse cx="12" cy="12" rx="9.5" ry="4"/><ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(120 12 12)"/>',
 leaf:'<path d="M5 19C5 9.5 11 4.5 20 4.5c0 9-5.5 14.5-15 14.5z"/><path d="M5 19l8.5-8.5"/>',
 lock:'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
 star:'<path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9-4.4-4.1 6-.8z"/>',
 fire:'<path d="M12 2.8c.8 3.8 5.6 5.4 5.6 10.4a5.6 5.6 0 0 1-11.2 0c0-2.6 1.3-4 2.1-5.6.8 1.2 1.6 2.2 1.6 3.6 1.3-2 2.1-5.1 1.9-8.4z"/>',
 tree:'<path d="M12 2.5 6.5 10h3.2L5.5 16h13l-4.2-6h3.2z"/><path d="M12 16v5.5"/>',
 phone:'<rect x="6.5" y="2.5" width="11" height="19" rx="2.8"/><path d="M10.5 18h3"/>',
 users:'<circle cx="9" cy="8" r="3.4"/><path d="M2.8 20c.6-3.6 3.1-5.6 6.2-5.6s5.6 2 6.2 5.6"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.4c2.5.2 4.2 2 4.7 4.8"/>',
 dollar:'<path d="M12 2.5v19"/><path d="M16.5 7.2c0-2-2-3.2-4.5-3.2s-4.5 1.2-4.5 3.4 2.1 3 4.5 3.6 4.5 1.4 4.5 3.7-2 3.3-4.5 3.3-4.5-1.2-4.5-3.3"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
 bug:'<rect x="7" y="7.5" width="10" height="12.5" rx="5"/><path d="M12 7.5v12.5M9 5l1.6 2.3M15 5l-1.6 2.3M3.5 12H7M17 12h3.5M4.5 18l2.7-1.5M19.5 18l-2.7-1.5M4.5 7.5 7.2 9M19.5 7.5 16.8 9"/>',
 doc:'<path d="M6 2.5h8l4.5 4.5v14.5H6z"/><path d="M14 2.5V7h4.5M9 12h6M9 16h6"/>',
 step:'<path d="M5 5v14M10 5l9 7-9 7z"/>',
 x:'<path d="M6 6l12 12M18 6 6 18"/>',
 sparkle:'<path d="M12 2.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5 4.6-.6 6.9-2.9 7.5-7.5z"/>',
 dice:'<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
 grid:'<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M3.5 9.3h17M3.5 14.7h17M9.3 3.5v17M14.7 3.5v17"/>',
 shield:'<path d="M12 3 5 6v5.5c0 4.6 3 8 7 9.5 4-1.5 7-4.9 7-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
 bolt:'<path d="M13.5 2.5 5 13.5h6l-1 8 8.5-11h-6z"/>',
 square:'<rect x="4.5" y="4.5" width="15" height="15" rx="3.5"/>',
 arrowRt:'<path d="M3.5 12h15M12.5 6l6 6-6 6"/>',
 copy:'<rect x="8" y="8" width="12.5" height="12.5" rx="3"/><path d="M5.5 15.5h-1A1.5 1.5 0 0 1 3 14V4.5A1.5 1.5 0 0 1 4.5 3H14a1.5 1.5 0 0 1 1.5 1.5v1"/>'
};
function ic(n,sw=2.2,extra=""){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${ICP[n]||""}</svg>`}
const _mc=document.createElement("canvas").getContext("2d");
function textW(el,txt){const cs=getComputedStyle(el); _mc.font=`${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; return _mc.measureText(txt).width}
function fitInl(root=document){$$(".ufield.inl input",root).forEach(i=>{i.style.width=Math.ceil(textW(i,i.value||i.placeholder||"?")+2)+"px"})}
function fitSel(s){const o=s.options[s.selectedIndex]; if(!o) return; const cs=getComputedStyle(s); s.style.width=Math.ceil(textW(s,o.text)+parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight)+parseFloat(cs.borderLeftWidth)*2+2)+"px"}
function fitNum(i){const cs=getComputedStyle(i); i.style.width=Math.ceil(textW(i,i.value||"?")+parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight)+parseFloat(cs.borderLeftWidth)*2+3)+"px"}
function growTA(t){t.style.height="auto"; t.style.height=Math.max(t.scrollHeight,0)+"px"}
document.addEventListener("input",e=>{const t=e.target; if(t.matches&&t.matches("textarea.etext")) growTA(t); if(t.matches&&t.matches(".blk input.slot")) fitNum(t)});
document.addEventListener("input",e=>{if(e.target.matches&&e.target.matches(".ufield.inl input")) fitInl(e.target.parentElement)});
document.addEventListener("click",e=>{const u=e.target.closest&&e.target.closest(".ufield.inl"); if(u&&e.target===u){const i=$("input",u); i&&!i.readOnly&&i.focus()}});
function hydrateIcons(root=document){$$("[data-ic]",root).forEach(el=>{el.outerHTML=ic(el.dataset.ic,2.1)})}

/* coloured icons drawn the way the mockups draw them */
const CIC={
 flaskPurple:`<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M17 6h14M19 6v13L9 37a5 5 0 0 0 4.4 7.4h21.2A5 5 0 0 0 39 37L29 19V6" fill="#fff" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/><path d="M13.4 30h21.2l3.3 6.4A4 4 0 0 1 34.3 42H13.7a4 4 0 0 1-3.6-5.6z" fill="#C9A6FF"/><path d="M19 6v13L9 37a5 5 0 0 0 4.4 7.4h21.2A5 5 0 0 0 39 37L29 19V6" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/></svg>`,
 capTeal:`<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 19 24 10l20 9-20 9z" fill="#3FD4C8" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M12 23.5V33c7 4.6 17 4.6 24 0v-9.5L24 29z" fill="#3FD4C8" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M42 20v10" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></svg>`,
 clockRed:`<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="19" fill="#FD8A93" stroke="${INK}" stroke-width="3"/><circle cx="24" cy="24" r="13" fill="#fff" stroke="${INK}" stroke-width="2.6"/><path d="M24 15.5V24l5.5 3.5" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
 flaskGreen:`<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M17 6h14M19 6v13L9 37a5 5 0 0 0 4.4 7.4h21.2A5 5 0 0 0 39 37L29 19V6" fill="#fff" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M13.4 30h21.2l3.3 6.4A4 4 0 0 1 34.3 42H13.7a4 4 0 0 1-3.6-5.6z" fill="#4DD27A"/><path d="M19 6v13L9 37a5 5 0 0 0 4.4 7.4h21.2A5 5 0 0 0 39 37L29 19V6" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/><circle cx="22" cy="36" r="2.4" fill="#fff" stroke="${INK}" stroke-width="1.8"/></svg>`,
 bulb:`<svg viewBox="0 0 64 66" aria-hidden="true"><path d="M8 14 3 9M56 14l5-5M32 6V1M14 6l-3-5M50 6l3-5" stroke="#FDD94A" stroke-width="4" stroke-linecap="round"/><path d="M32 12a16 16 0 0 0-9.6 28.8c1.6 1.3 2.6 3.1 2.6 5.2v2h14v-2c0-2.1 1-3.9 2.6-5.2A16 16 0 0 0 32 12z" fill="#FDE14D" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/><path d="M25 52h14M27 58h10" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/><path d="M24 26a9 9 0 0 1 6-6" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/></svg>`,
 particles:`<svg viewBox="0 0 66 52" aria-hidden="true"><circle cx="34" cy="12" r="9" fill="#C9B1FF" stroke="${INK}" stroke-width="3"/><circle cx="14" cy="38" r="9" fill="#A9DCFA" stroke="${INK}" stroke-width="3"/><circle cx="53" cy="38" r="9" fill="#FDE14D" stroke="${INK}" stroke-width="3"/><path d="M28 19 19 30M40 19l8 11" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></svg>`,
 trees:`<svg viewBox="0 0 66 52" aria-hidden="true"><path d="M22 4 9 24h7L6 40h32l-10-16h7z" fill="#5DBB76" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M22 40v8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M48 14c3 7 11 9 11 18a11 11 0 0 1-22 0c0-5 3-7 4-10 2 2 3 4 3 7 2-4 4-9 4-15z" fill="#FF8A5B" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M48 32c1 3 4 4 4 7a4 4 0 0 1-8 0c0-2 1-3 2-4" fill="#FDE14D"/></svg>`,
 medal:`<svg viewBox="0 0 52 60" aria-hidden="true"><path d="M14 4l8 17M38 4l-8 17" stroke="#FF8DA0" stroke-width="7" stroke-linecap="round"/><path d="M14 4l8 17M38 4l-8 17" stroke="#1A1F3D" stroke-width="2.4" stroke-linecap="round" fill="none"/><circle cx="26" cy="36" r="15" fill="#FDE14D" stroke="#1A1F3D" stroke-width="3"/><path d="M26 27.5l2.6 5.2 5.6.8-4 3.9 1 5.6-5.2-2.7-5.2 2.7 1-5.6-4-3.9 5.6-.8z" fill="#fff" stroke="#1A1F3D" stroke-width="2" stroke-linejoin="round"/><path d="M14 48l-6 8h9l3-5M38 48l6 8h-9l-3-5" fill="#FF8DA0" stroke="#1A1F3D" stroke-width="2.4" stroke-linejoin="round"/></svg>`,
 progressBars:`<svg viewBox="0 0 50 44" aria-hidden="true"><defs><linearGradient id="pbg" x1="0" x2="1"><stop offset="0" stop-color="#8E7BFF"/><stop offset="1" stop-color="#6FA0FF"/></linearGradient></defs><rect x="3" y="24" width="12" height="17" rx="2" fill="url(#pbg)" stroke="#1A1F3D" stroke-width="2.6"/><rect x="19" y="14" width="12" height="27" rx="2" fill="url(#pbg)" stroke="#1A1F3D" stroke-width="2.6"/><rect x="35" y="3" width="12" height="38" rx="2" fill="url(#pbg)" stroke="#1A1F3D" stroke-width="2.6"/></svg>`
};

/* ================= brand ================= */
const LOGO=`<svg viewBox="0 0 56 56" aria-hidden="true"><g stroke="${INK}" stroke-width="3.2" stroke-linejoin="round">
<path d="M28 5.5 48.5 17 28 28.5 7.5 17z" fill="#FEE962"/><path d="M7.5 17 28 28.5V51L7.5 39.5z" fill="#FD8595"/><path d="M48.5 17 28 28.5V51l20.5-11.5z" fill="#52E5DD"/></g></svg>`;

/* ================= artwork from the design mockups ================= */
const A=n=>`assets/${n}`;
function img(n,cls="",style="",alt=""){return `<img src="${A(n)}" alt="${esc(alt)}" class="${cls}" style="${style}" decoding="async" draggable="false">`}
const BEARS={flask:"bear-flask.webp",wave:"bear-wave.webp",clip:"bear-clip.webp",hdr:"bear-hdr.webp",clip2:"bear-clip2.webp"};
const ARTS={plans:"art-plans.webp",decay:"art-decay.webp",fire:"art-fire.svg",pop:"art-pop.webp",coaster:"art-coaster.webp",reaction:"art-reaction.webp"};

/* ================= decorations (yellow rays, confetti, stars) ================= */
function rays(x,y,w,rot=0,outline=true,col="#FDE14D",flip=false){ // three capsules fanning around a corner, like the mockups' sparkle marks
  const st=outline?`stroke="${INK}" stroke-width="2.8"`:"";
  const cap=(cx,cy,len,ang)=>`<rect x="${cx-len/2}" y="${cy-6}" width="${len}" height="12" rx="6" transform="rotate(${ang} ${cx} ${cy})" fill="${col}" ${st}/>`;
  return `<span class="deco" style="left:${x}rem;top:${y}rem;width:${w}rem;height:${w}rem;transform:rotate(${rot}deg)${flip?" scaleX(-1)":""}"><svg viewBox="0 0 80 80">${cap(20,62,36,22)}${cap(40,32,34,52)}${cap(66,16,30,78)}</svg></span>`}
function confetti(x,y,s,col,rot=18,shape="sq"){
  const p=shape==="dia"?`<path d="M20 3 37 20 20 37 3 20z" fill="${col}" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>`:`<rect x="5" y="5" width="30" height="30" rx="6" fill="${col}" stroke="${INK}" stroke-width="3.4"/>`;
  return `<span class="deco" style="left:${x}rem;top:${y}rem;width:${s}rem;height:${s}rem;transform:rotate(${rot}deg)"><svg viewBox="0 0 40 40">${p}</svg></span>`}
function starDeco(x,y,s,plus=false){return `<span class="deco" style="left:${x}rem;top:${y}rem;width:${s}rem;height:${s}rem"><svg viewBox="0 0 60 60"><path d="M24 14l4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3L24 37.6l-9.3 4.9 1.8-10.3L9 24.9l10.4-1.5z" fill="#FDE14D" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>${plus?`<path d="M48 4v14M41 11h14" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`:""}</svg></span>`}
function squiggle(cls="",col="#FDE14D"){return `<svg class="${cls}" viewBox="0 0 175 32" preserveAspectRatio="none" aria-hidden="true"><path d="M6 24C40 14 70 10 100 10s48 2 69 6" pathLength="100" fill="none" stroke="${col}" stroke-width="13" stroke-linecap="round"/></svg>`}
function sparkLines(dir){return `<span class="slines ${dir}" aria-hidden="true"><svg viewBox="0 0 34 52"><path d="M30 18 8 4M31 26H3M30 34 8 48" stroke="#1A1F3D" stroke-width="3.4" stroke-linecap="round"/></svg></span>`}
function shadowLines(x,y,w,rot=0){return `<span class="deco" style="left:${x}rem;top:${y}rem;width:${w}rem;height:${w}rem;transform:rotate(${rot}deg)"><svg viewBox="0 0 60 60"><path d="M10 40 22 30M14 18l12 4M30 8l2 13" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></svg></span>`}
