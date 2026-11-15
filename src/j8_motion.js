/* ================= motion & play layer =================
   Hackathon-site style interactions layered over the static mockup visuals:
   floating/parallax decorations, staggered pop-ins, count-up stats, scroll reveals,
   talking mascots, confetti bursts, tilt-on-hover cards and a springy logo.
   Everything is skipped when the visitor prefers reduced motion. */
const RM=matchMedia("(prefers-reduced-motion: reduce)");
const still=()=>RM.matches;
document.documentElement.classList.add("js-motion");

/* count-up numbers: <span data-count="11460" data-dec="0"> */
function countUp(el){const to=+el.dataset.count, dec=+(el.dataset.dec||0); if(!Number.isFinite(to)) return;
  if(still()){el.textContent=fmt(to,dec); return}
  const t0=performance.now(), D=+(el.dataset.ms||(to>100?1300:700));
  const tick=now=>{const k=Math.min(1,(now-t0)/D), e=1-Math.pow(1-k,4); el.textContent=fmt(to*e,dec); if(k<1&&el.isConnected) requestAnimationFrame(tick)};
  el.textContent=fmt(0,dec); requestAnimationFrame(tick)}

/* reveal-on-scroll and count-when-visible */
let IO=null;
function watch(el){
  if(el.dataset.count==null&&el.getBoundingClientRect().top<innerHeight) return;
  if(still()||!("IntersectionObserver" in window)){if(el.dataset.count!=null) countUp(el); return}
  if(!IO) IO=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting) return; const t=e.target; IO.unobserve(t); t.dataset.count!=null?countUp(t):t.classList.add("in")}),{threshold:.12,rootMargin:"0px 0px -4% 0px"});
  IO.observe(el)}

/* pointer parallax for decorations (like floating planets on hackathon sites) */
let PX=0,PY=0,praf=0;
function parallax(){praf=0; $$("#view [data-depth]").forEach(el=>{const d=+el.dataset.depth; el.style.translate=`${(-PX*d).toFixed(2)}rem ${(-PY*d).toFixed(2)}rem`})}
addEventListener("pointermove",e=>{if(still()||e.pointerType==="touch") return; PX=e.clientX/innerWidth-.5; PY=e.clientY/innerHeight-.5; if(!praf) praf=requestAnimationFrame(parallax)},{passive:true});

/* confetti burst in the palette, outlined like everything else */
const BURST=["#FDE14D","#FD98A8","#7DF0C7","#CFA8FA","#8ED0FD","#FD9374"];
function burst(x,y,n=28,spread=1){
  if(still()) return;
  for(let i=0;i<n;i++){const s=document.createElement("span"); s.className="cf"; const sz=9+Math.random()*9, shape=i%3;
    s.style.cssText=`left:${x}px;top:${y}px;width:${sz}px;height:${shape===2?sz*.55:sz}px;background:${BURST[i%BURST.length]};border-radius:${shape===1?"50%":"3px"}`;
    document.body.appendChild(s);
    const a=Math.random()*Math.PI*2, v=(120+Math.random()*200)*spread, dx=Math.cos(a)*v, dy=Math.sin(a)*v*.8-120*spread, rot=(Math.random()-.5)*900;
    const an=s.animate([{transform:"translate(-50%,-50%) scale(.4)",opacity:1},
      {transform:`translate(calc(-50% + ${dx*.62}px),calc(-50% + ${dy*.62}px)) rotate(${rot*.5}deg) scale(1)`,opacity:1,offset:.42},
      {transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy+240}px)) rotate(${rot}deg) scale(.85)`,opacity:0}],
      {duration:1100+Math.random()*600,easing:"cubic-bezier(.15,.7,.35,1)"});
    an.onfinish=()=>s.remove()}}
function celebrate(el,n=30){if(!el) return; const r=el.getBoundingClientRect(); burst(r.left+r.width/2,r.top+r.height/2,n)}

/* talking mascots: click (or Enter) for a tip */
const TALK_ANY=["Models are simplifications. That's their superpower!","Test it before you trust it.","A wrong prediction is still useful data.","Change one thing at a time!","If a check fails, the model just got better."];
const TALK_PAGE={home:["Hi! Ready to model something?","Tap the yellow button to start a mission!","Every model starts with a question."],challenges:["Pick a mission!","Each one takes ~30 min.","Build, test, explain!","Finish one for a badge!"]};
function talkPool(){const r=(location.hash||"").slice(1); return (MISSIONS[r]&&MISSIONS[r].talk)||TALK_PAGE[r]||TALK_ANY}
function pick(pool,not){let t,g=0; do{t=pool[(Math.random()*pool.length)|0]}while(t===not&&pool.length>1&&g++<8); return t}
function sayNear(b){
  const host=b.offsetParent||b.parentElement; if(!host) return;
  const near=host.querySelector(":scope > .bubble");
  if(near&&host.contains(b)){const sp=near.firstChild; const t=pick(talkPool(),sp&&sp.textContent); if(sp&&sp.nodeType===3) sp.textContent=t; else near.insertAdjacentText("afterbegin",t);
    near.classList.remove("pop"); void near.offsetWidth; near.classList.add("pop"); return}
  $$(".say",host).forEach(x=>x.remove());
  const d=document.createElement("div"); d.className="say"; d.setAttribute("role","status"); d.textContent=pick(talkPool());
  const rem=parseFloat(getComputedStyle(document.documentElement).fontSize);
  const x=b.offsetLeft+b.offsetWidth*(+(b.dataset.sx||.62)), y=b.offsetTop+b.offsetHeight*(+(b.dataset.sy||0))-1.2*rem;
  d.style.left=x+"px"; d.style.top=y+"px"; host.appendChild(d);
  const hr=host.getBoundingClientRect();
  if(b.dataset.flip||hr.left+x+d.offsetWidth>innerWidth-12){d.classList.add("flip"); d.style.left=Math.max(4,b.offsetLeft+b.offsetWidth*(+(b.dataset.fx||.38))-d.offsetWidth)+"px"}
  const top=hr.top+y-d.offsetHeight; if(top<8) d.style.top=(y+(8-top))+"px";
  setTimeout(()=>{d.classList.add("out"); setTimeout(()=>d.remove(),300)},3400)}
function bindTalk(b){if(b.dataset.talk) return; b.dataset.talk="1";
  if(b.tagName==="IMG"){b.setAttribute("role","button"); b.tabIndex=0; if(!b.getAttribute("aria-label")) b.setAttribute("aria-label","ModelQuest bear: tap for a tip")}
  const go=()=>{b.classList.remove("hop"); void b.offsetWidth; b.classList.add("hop"); sayNear(b)};
  b.addEventListener("click",go); b.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault(); go()}})}

/* tilt-on-hover for challenge cards */
function bindTilt(c){if(c.dataset.tilt) return; c.dataset.tilt="1";
  c.addEventListener("pointermove",e=>{if(still()||e.pointerType==="touch") return; const r=c.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
    c.style.transform=`perspective(90rem) rotateX(${(-y*5).toFixed(2)}deg) rotateY(${(x*6).toFixed(2)}deg) translate(-.2rem,-.25rem)`});
  c.addEventListener("pointerleave",()=>{c.style.transform=""})}

/* a disabled Next/Submit that becomes ready does a small hop */
new MutationObserver(ms=>ms.forEach(m=>{const b=m.target; if(m.oldValue!==null&&!b.disabled&&b.matches(".btn.next,.btn.submit,#go2,#nextb,#twgo")){b.classList.remove("ready"); void b.offsetWidth; b.classList.add("ready")}}))
  .observe(document.body,{subtree:true,attributes:true,attributeFilter:["disabled"],attributeOldValue:true});

/* ModelQuest cube does a flip when you head home */
document.addEventListener("click",e=>{const br=e.target.closest(".brand"); if(!br) return; const s=$("svg",br); if(!s||still()) return; s.classList.remove("flip"); void s.getBoundingClientRect(); s.classList.add("flip")});

/* run after every render */
function enhance(root){
  $$("[data-stagger]",root).forEach(g=>[...g.children].forEach((c,i)=>{c.style.setProperty("--i",i); c.classList.add("pop-in")}));
  $$(".reveal,[data-count]",root).forEach(watch); fitInl(root);
  $$("[data-fill]",root).forEach(f=>{if(still()) return; const to=f.dataset.fill; f.style.width="0%"; requestAnimationFrame(()=>requestAnimationFrame(()=>{f.style.width=to}))});
  $$(".deco",root).forEach((d,i)=>{if(!d.dataset.depth) d.dataset.depth=(0.9+((i*37)%10)*0.17).toFixed(2); d.style.setProperty("--dl",(-(i*1.37)%5.5).toFixed(2)+"s")});
  $$(".blob",root).forEach(b=>{if(!b.dataset.depth&&!b.classList.contains("lblob")) b.dataset.depth=".3"});
  $$(".talk,.talkart",root).forEach(bindTalk);
  $$("button.ccard",root).forEach(bindTilt);
  const cur=$(".navlink[aria-current='page']"); if(cur&&!still()){cur.classList.remove("pop"); void cur.offsetWidth; cur.classList.add("pop")}
  if(PX||PY) parallax();
}
