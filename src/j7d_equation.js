/* ================= Equation step: write the model as symbolic equations, make sense of every symbol, then solve =================
   Four parts, unlocked in order: 1 match each symbol to its meaning · 2 build each equation from tiles (checked for
   equivalence, so any correct arrangement passes) · 3 questions on why the equation has that shape · 4 final steps: solve it. */

/* ---------- math rendering ---------- */
const MPREC={"+":1,"-":1,"*":2,"/":2,neg:3,"^":4};
function symParts(key,SY){const y=SY&&SY[key]; if(y&&y.b) return [y.b,y.s||""];
  const mm=/^([A-Za-z]+?)(?:_([A-Za-z0-9]+)|(\d+))$/.exec(key); return mm?[mm[1],mm[2]||mm[3]||""]:[key,""]}
function symHTML(key,SY){const [b,s]=symParts(key,SY); return `<span class="mv ${b.length===1?"it":"rm"}">${esc(b)}${s?`<sub>${esc(s)}</sub>`:""}</span>`}
function fmtM(n){if(!Number.isFinite(n)) return "?"; const r=+n.toPrecision(7); if(Number.isInteger(r)&&Math.abs(r)>=10000) return String(r).replace(/\B(?=(\d{3})+(?!\d))/g," "); return String(r)}
const mPar=h=>`<span class="mp">(</span>${h}<span class="mp">)</span>`;
const FNAME={ln:"ln",log:"log",exp:"exp",sqrt:"√",abs:"abs",round:"round",floor:"floor",ceil:"ceil",sin:"sin",cos:"cos",tan:"tan",min:"min",max:"max",pow:"pow"};
function mathHTML(t,SY,o={}){
  if(!t) return "";
  if(t.n!=null) return `<span class="mn">${fmtM(t.n)}</span>`;
  if(t.v) return symHTML(t.v,SY);
  if(t.f) return `<span class="mfn">${esc(FNAME[t.f]||t.f)}</span>${mPar(t.args.map(a=>mathHTML(a,SY,o)).join(", "))}`;
  const kid=(x,p,side)=>{const h=mathHTML(x,SY,o), cp=x.o?MPREC[x.o]:9, inl=o.exp&&x.o==="/";
    const need=cp<p||(side==="r"&&cp===p&&(t.o==="-"||t.o==="/"))||(t.o==="^"&&side==="l"&&(x.o||x.n<0))||(inl&&p>2);
    return need?mPar(h):h};
  if(t.o==="neg") return `<span class="mo">−</span>${kid(t.a,3,"r")}`;
  if(t.o==="^") return `<span class="msup">${kid(t.a,5,"l")}<sup class="me">${mathHTML(t.b,SY,Object.assign({},o,{exp:true}))}</sup></span>`;
  const atom=x=>x.n!=null||!!x.v;
  if(t.o==="/"&&(o.exp||(o.inl&&atom(t.a)&&atom(t.b)))) return `${kid(t.a,2,"l")}<span class="mo">/</span>${kid(t.b,2,"r")}`;
  if(t.o==="/") return `<span class="mfrac"><span class="mnum">${mathHTML(t.a,SY,o)}</span><span class="mden">${mathHTML(t.b,SY,o)}</span></span>`;
  if(t.o==="*"&&t.a.n!=null&&t.b.v) return `${kid(t.a,2,"l")}${kid(t.b,2,"r")}`;
  return `${kid(t.a,MPREC[t.o],"l")}<span class="mo">${{"+":"+","-":"−","*":"·","/":"/"}[t.o]}</span>${kid(t.b,MPREC[t.o],"r")}`}
// "a = b ≈ c": every part is a formula, joined by its relation sign
function lineHTML(src,SY,o){return `<span class="mline">${String(src).split(/(=|≈|≤|≥|<|>)/).map((p,i)=>{if(i%2) return `<span class="mo mrel">${p}</span>`; const s=p.trim(); if(!s) return "";
  try{return mathHTML(parseFormula(s),SY,o||{})}catch(e){return `<span class="mtx">${esc(s)}</span>`}}).join("")}</span>`}
// text with math in {{ … }}
function rich(s,SY){return String(s??"").split(/\{\{|\}\}/).map((p,i)=>i%2?lineHTML(p,SY,{inl:true}):p).join("")}
function astSrc(t){if(t.n!=null) return t.n<0?`(${t.n})`:String(t.n); if(t.v) return t.v; if(t.f) return `${t.f}(${t.args.map(astSrc).join(", ")})`;
  if(t.o==="neg") return `(-${astSrc(t.a)})`; return `(${astSrc(t.a)} ${t.o} ${astSrc(t.b)})`}
const astSub=(t,env)=>t.v&&Object.prototype.hasOwnProperty.call(env,t.v)?{n:env[t.v]}:t.n!=null||t.v?t:t.f?{f:t.f,args:t.args.map(a=>astSub(a,env))}:{o:t.o,a:astSub(t.a,env),b:t.b&&astSub(t.b,env)};
function safeEval(t,env){try{const x=evalAst(t,env); return Number.isFinite(x)?x:NaN}catch(e){return NaN}}

/* ---------- the student's blocks as an expression (the equation their blocks already compute) ---------- */
function blockAst(n){if(n==null) return null;
  if(!isNode(n)){const x=Number(String(n).replace(/,/g,"").trim()); return String(n).trim()!==""&&Number.isFinite(x)?{n:x}:null}
  const O={add:"+",sub:"-",mul:"*",div:"/",pow:"^"};
  if(n.type==="var") return n.f.v?{v:n.f.v}:null;
  if(O[n.type]){const a=blockAst(n.a.a), b=blockAst(n.a.b); return a&&b?{o:O[n.type],a,b}:null}
  if(n.type==="fn"){const a=blockAst(n.a.a); if(!a) return null; return n.f.fn==="p10"?{o:"^",a:{n:10},b:a}:{f:n.f.fn==="log"?"log":n.f.fn,args:[a]}}
  return null}
function blockFor(prog,key){let found=null; eachNode((prog&&prog.body)||[],n=>{if(n.type==="set"&&n.f.v===key) found=n}); return found?blockAst(found.a.x):null}

/* ---------- checking a built equation ---------- */
const TOK_OP={"+":"+","-":"−","*":"×","/":"÷","^":"^","(":"(",")":")","=":"="};
const isNumTok=t=>/^-?[\d.]+$/.test(t);
function tokHTML(t,SY){if(TOK_OP[t]) return `<span class="to">${TOK_OP[t]}</span>`; if(t==="ln(") return `<span class="to"><span class="mfn">ln</span>(</span>`;
  if(isNumTok(t)) return `<span class="mn">${esc(t)}</span>`; return symHTML(t,SY)}
const tokSrc=toks=>toks.map(t=>t==="ln("?"ln(":t).join(" ");
function eqSplit(toks){const i=toks.indexOf("="); if(i<0) return {err:"An equation needs an = sign: what it works out on one side, how on the other."};
  if(toks.indexOf("=",i+1)>=0) return {err:"Use just one = sign."};
  const L=toks.slice(0,i), R=toks.slice(i+1); if(!L.length||!R.length) return {err:"Put something on both sides of the = sign."};
  let l,r; try{l=parseFormula(tokSrc(L))}catch(e){return {err:friendlyParse(e.message,"left")}} try{r=parseFormula(tokSrc(R))}catch(e){return {err:friendlyParse(e.message,"right")}}
  return {l,r}}
function friendlyParse(m,side){return /never closed|Close the bracket/.test(m)?`A bracket on the ${side} side is opened but never closed.`:/ends too early/.test(m)?`The ${side} side ends with an operation. What comes after it?`:
  /wrong place|Unexpected/.test(m)?`Something on the ${side} side is out of order: check for two operations in a row, or a bracket in the wrong place.`:m}
function eqPoints(spec,keys,seed,given){const R=mulberry32(seed), pts=[];
  for(let i=0;i<9;i++){const e={}; keys.forEach(k=>{const y=spec.SY[k]||{};
      if(given&&y.role==="par"&&y.val!=null){e[k]=y.val; return}
      let lo,hi; if(y.range){[lo,hi]=y.range} else if(y.val!=null&&y.val!==0){lo=Math.abs(y.val)*.4; hi=Math.abs(y.val)*1.6} else {lo=.5; hi=12}
      e[k]=lo+(hi-lo)*(.08+.84*R())}); pts.push(e)}
  return pts}
const same=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-7*Math.max(1,Math.abs(a),Math.abs(b));
function equivalent(spec,a,b,keys,given,seed=7){let any=0; for(const e of eqPoints(spec,keys,seed,given)){const x=safeEval(a,e), y=safeEval(b,e);
    if(!Number.isFinite(x)&&!Number.isFinite(y)) continue; if(!same(x,y)) return false; any++} return any>=3}
function eqCheck(spec,e,toks){const SY=spec.SY, sp=eqSplit(toks); if(sp.err) return {fb:sp.err};
  let lhs=sp.l, rhs=sp.r;
  if(!(lhs.v===e.out)&&rhs.v===e.out){const t=lhs; lhs=rhs; rhs=t}
  if(!lhs.v) return {fb:`The left side should be just the symbol for what the equation works out: ${symHTML(e.out,SY)}.`};
  if(lhs.v!==e.out){const y=SY[lhs.v]; return {fb:y&&y.role==="out"?`That's the equation for ${symHTML(lhs.v,SY)}. This one is for ${symHTML(e.out,SY)}.`:`The left side should be what the equation works out, ${symHTML(e.out,SY)}. ${y?`${symHTML(lhs.v,SY)} is “${esc(y.name)}”.`:""}`}}
  const tgt=parseFormula(e.f), tv=[...formulaVars(tgt)], uv=[...formulaVars(rhs)];
  if(uv.includes(e.out)) return {fb:`${symHTML(e.out,SY)} can't be on both sides. The right side says how to work it out from the other symbols.`};
  const extra=uv.find(k=>!tv.includes(k)); if(extra){const y=SY[extra]; return {fb:`Your equation uses ${symHTML(extra,SY)}${y?` (${esc(y.name)})`:""}. Does ${symHTML(e.out,SY)} depend on it?`}}
  const keys=[...new Set(tv.concat(uv))];
  if(equivalent(spec,rhs,tgt,keys,false)) return {ok:true,lhs,rhs};
  for(const mk of e.mistakes||[]){try{if(equivalent(spec,rhs,parseFormula(mk.f),keys,false)) return {fb:rich(mk.fb,SY)}}catch(err){}}
  if(equivalent(spec,rhs,tgt,keys,true)){const miss=tv.filter(k=>!uv.includes(k)&&SY[k]&&SY[k].role==="par");
    return {fb:`This works with these numbers, but write it with the symbols${miss.length?` (${miss.map(k=>symHTML(k,SY)).join(", ")})`:""} so it works for any values. You'll put the numbers in during the final steps.`}}
  const miss=tv.find(k=>!uv.includes(k)); if(miss){const y=SY[miss]; return {fb:`Your equation doesn't use ${symHTML(miss,SY)}${y?` (${esc(y.name)})`:""}. Where does it come in?`}}
  const pt={}; keys.forEach(k=>{const y=SY[k]||{}; pt[k]=y.val!=null?y.val:y.story!=null?y.story:y.range?y.range[0]+(y.range[1]-y.range[0])/3:2});
  const a=safeEval(rhs,pt), b=safeEval(tgt,pt), u=(SY[e.out]||{}).unit||"", show=x=>Number.isFinite(x)?fmtM(+x.toPrecision(5))+(u&&u!=="$"?" "+u:""):"no number";
  const where=keys.filter(k=>SY[k]&&SY[k].role==="in").map(k=>`${symHTML(k,SY)} = ${fmtM(+pt[k].toPrecision(4))}`).join(", ");
  return {fb:`Check it with numbers${where?` (${where})`:""}: your right side gives ${u==="$"?"$":""}${show(a)}, but ${symHTML(e.out,SY)} should be ${u==="$"?"$":""}${show(b)}. Compare each part with your blocks.`}}

/* ---------- the step ---------- */
function equationStep(el,m,st,ctx,spec){
  const d=st.d, SY=spec.SY, prog=d.prog||{body:[]};
  const E=d.eq||(d.eq={}); E.sym=E.sym||{}; E.ok=E.ok||{}; E.tok=E.tok||{}; E.draft=E.draft||{}; E.q=E.q||{}; E.sv=E.sv||{at:0,fin:false,ans:{},ip:null};
  const symsOK=()=>spec.syms.every(k=>E.sym[k]===k), eqsOK=()=>spec.eqs.every(e=>E.ok[e.out]);
  const qOK=q=>{const i=E.q[q.id]; return i!=null&&!!(q.opts[i]&&q.opts[i].ok)}, whyOK=()=>spec.why.every(qOK);
  const sv=spec.solve, solveOK=()=>E.sv.at>=sv.steps.length&&E.sv.fin&&(!sv.interp||(E.sv.ip!=null&&sv.interp.opts[E.sv.ip]&&sv.interp.opts[E.sv.ip].ok));
  const open=[()=>true,()=>S.teacher||symsOK(),()=>S.teacher||(symsOK()&&eqsOK()),()=>S.teacher||(symsOK()&&eqsOK()&&whyOK())];
  const order=[...spec.syms].sort((a,b)=>((a.length*7919+a.charCodeAt(0)*31)%97)-((b.length*7919+b.charCodeAt(0)*31)%97));
  const vlab={}; spec.syms.concat(Object.keys(SY)).forEach(k=>{if(SY[k]&&SY[k].lab) vlab[k]={label:SY[k].lab}});
  let symFb="";
  el.innerHTML=`<div class="eqstep">${spec.intro?`<p class="lead eqintro">${rich(spec.intro,SY)}</p>`:""}${spec.note?`<div style="margin-top:2rem">${teacherNote(spec.note)}</div>`:""}
    <div class="card esec" id="es1"></div><div class="card esec" id="es2"></div><div class="card esec" id="es3"></div><div class="card esec" id="es4"></div>
    <div class="ex-btns" style="margin-left:0"><button class="btn back" id="back">${ic("arrowL",2.8)}Build</button><button class="btn submit" id="nextb" disabled>Test ${ic("arrowR",2.8)}</button></div></div>`;
  const head=(n,title,done,sub)=>`<div class="esh"><span class="enum ${done?"ok":""}">${done?ic("check",2.6):n}</span><h2>${title}</h2>${done?`<span class="pill easy">Done</span>`:""}</div>${sub?`<p class="lead">${sub}</p>`:""}`;
  const locked=(box,n,title,why)=>{box.className="card esec locked"; box.innerHTML=`<div class="esh"><span class="enum">${n}</span><h2>${title}</h2></div><p class="elock">${ic("lock",2.2)}${why}</p>`};
  const meta=k=>{const y=SY[k]||{}, u=y.unit?esc(y.unit):"";
    return y.role==="in"?`${u?u+" · ":""}you slide it`:y.role==="par"?`given: ${esc(y.show||fmtM(y.val))}${u&&!y.show?" "+u:""}`:`${u?u+" · ":""}the model works it out`};

  /* 1 · symbols */
  function sec1(){const box=$("#es1",el), done=symsOK(); box.className="card esec"+(done?" done":"");
    box.innerHTML=head(1,"Know your symbols",done,"Each symbol in an equation stands for one quantity. Match every symbol to what it means. The pink chip is the same quantity's block.")+
      `<div class="symgrid">${spec.syms.map(k=>{const ch=E.sym[k], ok=ch===k;
        return `<div class="symrow ${ok?"ok":ch?"bad":""}"><span class="symbig${String(k).replace(/_/g,"").length>6?" sm":""}">${symHTML(k,SY)}</span><span class="symblk"><span class="bk">${esc(SY[k]&&SY[k].lab||k)}</span></span>
          <select class="field sm" data-sym="${esc(k)}" aria-label="What ${esc(k)} means" ${ok&&!S.teacher?"disabled":""}><option value="">Choose what it means…</option>${order.map(o=>`<option value="${esc(o)}" ${ch===o?"selected":""}>${esc(SY[o].name)}</option>`).join("")}</select>
          <span class="symmeta">${ok?`${ic("check",2.2)}${meta(k)}`:""}</span></div>`}).join("")}</div><p class="fb ${symFb?"warn":""}" id="symfb">${symFb}</p>`;
    $$("[data-sym]",box).forEach(s=>s.onchange=()=>{const k=s.dataset.sym, v=s.value; E.sym[k]=v; st.runs=(st.runs||0)+1;
      symFb=!v||v===k?"":`Not quite: “${esc(SY[v].name)}” is ${symHTML(v,SY)}, not ${symHTML(k,SY)}. Open Problem info to check what each quantity means.`;
      if(symsOK()) symFb=""; save(); const was=done; sec1(); if(!was&&symsOK()){celebrate($("#es1 .enum",el)); sec2(); sec3(); sec4()} refresh()})}

  /* 2 · equations */
  const tilesFor=e=>e.tiles||spec.tiles;
  const tileCls=t=>TOK_OP[t]||t==="ln("?"op":isNumTok(t)?"num":"sym";
  const tileLab=t=>({"+":"plus","-":"minus","*":"times","/":"divided by","^":"to the power of","(":"open bracket",")":"close bracket","=":"equals","ln(":"natural log"})[t]||(isNumTok(t)?t:`symbol ${t}`);
  function eqHints(e){const tgt=parseFormula(e.f), b=blockFor(prog,e.out), keys=[...formulaVars(tgt)], bOK=b&&(()=>{try{return equivalent(spec,b,tgt,[...new Set(keys.concat([...formulaVars(b)]))],false)}catch(err){return false}})();
    const h3=bOK?`Your blocks for ${symHTML(e.out,SY)} already say this:<span class="hline">${symHTML(e.out,SY)}<span class="mo mrel">=</span>${mathHTML(b,SY)}</span>Build the same thing with the tiles. Each Math block becomes its sign, a ÷ block can be a fraction, and a ^ block puts its right side up in the exponent.`:
      `The equation is:<span class="hline">${lineHTML(e.out+" = "+e.f,SY)}</span>Build it with the tiles, one symbol or sign at a time.`;
    return (e.hints||[]).slice(0,2).map(h=>rich(h,SY)).concat([h3])}
  function sec2(){const box=$("#es2",el); if(!open[1]()) return locked(box,2,"Write the equations","Match the symbols first.");
    const done=eqsOK(); box.className="card esec"+(done?" done":"");
    box.innerHTML=head(2,"Write the equations",done,spec.buildLead||"Turn your blocks into equations. Tap the tiles to build each one: the symbol for what it works out, then =, then how it's worked out. Tap inside your equation to move the cursor.")+
      `<div class="egrid"><div class="ebuilds">${spec.eqs.map((e,i)=>`<div class="eqb ${E.ok[e.out]?"ok":""}" id="eqb${i}"></div>`).join("")}</div>
       <aside class="eblocks"><div class="ebh">${ic("code",2.2)}<b>Your blocks</b></div>${blocksHTML()}</aside></div>`;
    spec.eqs.forEach((e,i)=>mountEq(e,i))}
  function blocksHTML(){const body=(prog&&prog.body)||[]; if(!body.length) return `<p class="muted ebmt">The blocks you build show up here, to help you write each equation.</p>`;
    const hat=m.id==="fire"?`<div class="blk hat fhat"><i class="hf"></i>${FLAG}<span>each step, every square writes to</span><span class="bsel fake">${d.mode==="inplace"?"the same forest":d.mode==="next"?"a fresh copy":"(not chosen)"}</span></div>`:HAT;
    return `<div class="canvasbox card ro ebcv"><div class="script">${hat}<div class="stack root">${body.map(n=>rNode(n,{pal:true,show:true,vars:vlab,menus:()=>[]})).join("")}</div></div></div>`}
  function mountEq(e,i){const box=$("#eqb"+i,el), ok=!!E.ok[e.out];
    const top=`<div class="eqbh"><span class="eqfor">Equation for ${symHTML(e.out,SY)}</span><span class="muted">${esc(SY[e.out].name)}</span></div>`;
    if(ok){box.innerHTML=top+`<div class="eqdone">${ic("check",2.6)}${eqView(E.tok[e.out])}</div>${e.after?`<p class="eqafter">${rich(e.after,SY)}</p>`:""}`; return}
    let toks=(E.draft[e.out]||[]).slice(), caret=toks.length;
    box.innerHTML=top+`<div class="eqline" tabindex="0" role="group" aria-label="Your equation for ${esc(e.out)}. Backspace deletes, arrow keys move the cursor."></div>
      <div class="eqprev" aria-live="polite"></div>
      <div class="eqtray" role="group" aria-label="Tiles">${tilesFor(e).map(t=>`<button type="button" class="etile ${tileCls(t)}" data-t="${esc(t)}" aria-label="Add ${esc(tileLab(t))}">${tokHTML(t,SY)}</button>`).join("")}</div>
      <div class="eqbtns"><button type="button" class="btn sm white" data-bs>${ic("arrowL",2.2)}Delete</button><button type="button" class="btn sm white" data-clr>${ic("x",2.2)}Clear</button><button type="button" class="btn sm" data-chk>${ic("check",2.4)}Check</button></div>
      <p class="fb eqfb"></p><div class="hintzone"></div>`;
    const line=$(".eqline",box), prev=$(".eqprev",box), fb=$(".eqfb",box), hz=$(".hintzone",box);
    const keep=()=>{E.draft[e.out]=toks.slice(); save()};
    const draw=()=>{line.innerHTML=(toks.length?toks.map((t,j)=>`${j===caret?'<i class="ecaret" aria-hidden="true"></i>':""}<button type="button" class="etok ${tileCls(t)}" data-j="${j}" tabindex="-1" aria-label="${esc(tileLab(t))}">${tokHTML(t,SY)}</button>`).join("")+(caret===toks.length?'<i class="ecaret" aria-hidden="true"></i>':""):
        `<i class="ecaret" aria-hidden="true"></i><span class="eqph">Tap the tiles below</span>`);
      if(!toks.length){prev.innerHTML=""; return}
      const sp=eqSplit(toks); let h="";
      if(!sp.err) h=`${mathHTML(sp.l,SY)}<span class="mo mrel">=</span>${mathHTML(sp.r,SY)}`;
      else if(toks.indexOf("=")<0){try{h=mathHTML(parseFormula(tokSrc(toks)),SY)}catch(err){h=""}}
      prev.innerHTML=h?`<span class="eqpl">Reads as</span><span class="mline">${h}</span>`:`<span class="eqpl">Reads as</span><span class="muted">… keep going</span>`};
    const put=t=>{toks.splice(caret,0,t); caret++; fb.textContent=""; fb.className="fb eqfb"; keep(); draw()};
    const del=()=>{if(caret>0){toks.splice(caret-1,1); caret--; keep(); draw()}};
    $$(".etile",box).forEach(b=>b.onclick=()=>{put(b.dataset.t); line.focus({preventScroll:true})});
    line.addEventListener("click",ev=>{const tk=ev.target.closest(".etok"); caret=tk?+tk.dataset.j+1:toks.length; draw(); line.focus({preventScroll:true})});
    line.addEventListener("keydown",ev=>{const k=ev.key, map={"+":"+","-":"-","*":"*","x":"*","/":"/","^":"^","(":"(",")":")","=":"="};
      if(k==="Backspace"){ev.preventDefault(); del()} else if(k==="Delete"){ev.preventDefault(); if(caret<toks.length){toks.splice(caret,1); keep(); draw()}}
      else if(k==="ArrowLeft"){ev.preventDefault(); caret=Math.max(0,caret-1); draw()} else if(k==="ArrowRight"){ev.preventDefault(); caret=Math.min(toks.length,caret+1); draw()}
      else if(k==="Home"){ev.preventDefault(); caret=0; draw()} else if(k==="End"){ev.preventDefault(); caret=toks.length; draw()}
      else if(map[k]&&tilesFor(e).includes(map[k])){ev.preventDefault(); put(map[k])} else if(k==="Enter"){ev.preventDefault(); check()}});
    $("[data-bs]",box).onclick=del; $("[data-clr]",box).onclick=()=>{toks=[]; caret=0; keep(); draw(); fb.textContent=""};
    const check=()=>{st.runs=(st.runs||0)+1; const r=eqCheck(spec,e,toks);
      if(r.ok){E.ok[e.out]=true; E.tok[e.out]=toks.slice(); delete E.draft[e.out]; save(); box.classList.add("ok"); const all=eqsOK(); mountEq(e,i); celebrate($(".eqdone",box)||box,14);
        if(all){sec2(); sec3(); sec4()} refresh(); return}
      fb.className="fb warn eqfb"; fb.innerHTML=r.fb; save()};
    $("[data-chk]",box).onclick=check;
    draw(); goalHints(hz,st,{k:"eq-"+e.out,hints:eqHints(e)})}
  const eqView=toks=>{const sp=eqSplit(toks||[]); return sp.err?`<span class="mline">${(toks||[]).map(t=>tokHTML(t,SY)).join(" ")}</span>`:`<span class="mline">${mathHTML(sp.l,SY)}<span class="mo mrel">=</span>${mathHTML(sp.r,SY)}</span>`};

  /* 3 · why the equation looks like that */
  function qHTML(q,sel,name){const pk=sel!=null?q.opts[sel]:null, ok=!!(pk&&pk.ok);
    return `<div class="qq ${ok?"ok":""}"><p class="qtext">${rich(q.q,SY)}</p>
      <div class="choices" role="radiogroup">${q.opts.map((o,j)=>`<button type="button" class="choice ${sel===j?(o.ok?"right":"wrong"):""}" role="radio" aria-checked="${sel===j}" data-${name}="${j}" data-qid="${esc(q.id)}" ${ok&&!S.teacher?"disabled":""}><span class="k">${"ABCD"[j]}</span><span>${rich(o.h,SY)}</span></button>`).join("")}</div>
      ${pk?`<p class="fb ${ok?"good":"warn"} qfb">${rich(ok?(pk.why||"Right."):(pk.fb||"Not quite. Try another answer."),SY)}</p>`:""}</div>`}
  function sec3(){const box=$("#es3",el); if(!open[2]()) return locked(box,3,"Make sense of the equations","Write the equations first.");
    const done=whyOK(); box.className="card esec"+(done?" done":"");
    box.innerHTML=head(3,"Make sense of the equations",done,"An equation is only useful if you know why it has that shape. Pick an answer: each one tells you why it's right or what's missing.")+
      `<div class="qlist">${spec.why.map(q=>qHTML(q,E.q[q.id],"qo")).join("")}</div>`;
    $$("[data-qo]",box).forEach(b=>b.onclick=()=>{const was=whyOK(); E.q[b.dataset.qid]=+b.dataset.qo; st.runs=(st.runs||0)+1; save(); const y=$(`[data-qid="${CSS.escape(b.dataset.qid)}"]`,box).closest(".qq").getBoundingClientRect().top;
      sec3(); const q2=$$(".qq",box).find(x=>x.querySelector(`[data-qid="${CSS.escape(b.dataset.qid)}"]`)); if(q2) scrollBy(0,q2.getBoundingClientRect().top-y);
      if(!was&&whyOK()){celebrate($("#es3 .enum",el)); sec4()} refresh()})}

  /* 4 · final steps */
  function sec4(){const box=$("#es4",el); if(!open[3]()) return locked(box,4,"Final steps: "+rich(sv.title,SY),"Answer the questions above first.");
    const done=solveOK(), at=Math.min(E.sv.at,sv.steps.length); box.className="card esec"+(done?" done":"");
    const rows=[`<div class="lrow"><span class="lmath">${lineHTML(sv.start,SY)}</span><span class="lnote">${esc(sv.startNote||"start here")}</span></div>`];
    sv.steps.slice(0,at).forEach((s,i)=>{const o=s.opts.find(x=>x.ok); rows.push(`<div class="lrow ${i===at-1&&!E.sv.fin?"new":""}"><span class="lmath">${lineHTML(o.to||o.h.replace(/\{\{|\}\}/g,""),SY)}</span><span class="lnote">${rich(o.note||"",SY)}</span></div>`)});
    let cur="";
    if(at<sv.steps.length){const s=sv.steps[at], sel=E.sv.pick&&E.sv.pick[at];
      cur=`<div class="lstep"><p class="qtext"><b>Step ${at+1} of ${sv.steps.length}.</b> ${rich(s.q,SY)}</p><div class="choices moves" role="radiogroup">${s.opts.map((o,j)=>`<button type="button" class="choice ${sel===j?"wrong":""}" role="radio" aria-checked="${sel===j}" data-mv="${j}"><span class="k">${"ABCD"[j]}</span><span>${rich(o.h,SY)}</span></button>`).join("")}</div>
        ${sel!=null?`<p class="fb warn">${rich(s.opts[sel].fb||"That move doesn't get you closer. Try another.",SY)}</p>`:""}</div>`}
    else{const f=sv.final;
      cur=`<div class="lfinal"><p class="qtext">${rich(f.q,SY)}</p><div class="finrow">${f.inputs.map((x,j)=>`<label class="ufield inl finf" id="fw${j}"><span class="fpre">${rich(x.pre,SY)}</span><input data-fi="${j}" inputmode="decimal" placeholder="?" value="${esc(E.sv.ans[j]??"")}" aria-label="${esc(plain(rich(x.pre,SY))||"Answer")}"${E.sv.fin&&!S.teacher?" disabled":""}>${x.post?`<span>${esc(x.post)}</span>`:""}</label>`).join("")}
        ${E.sv.fin?"":`<button type="button" class="btn sm" id="fincheck">${ic("check",2.4)}Check</button>`}</div><p class="fb ${E.sv.fin?"good":""}" id="finfb">${E.sv.fin?rich(f.ok,SY):""}</p>
        ${E.sv.fin&&sv.interp?qHTML(sv.interp,E.sv.ip,"ip"):""}</div>`}
    box.innerHTML=head(4,"Final steps: "+rich(sv.title,SY),done,sv.intro?rich(sv.intro,SY):"")+`<div class="ledger">${rows.join("")}</div>${cur}`;
    $$("[data-mv]",box).forEach(b=>b.onclick=()=>{const s=sv.steps[at], j=+b.dataset.mv; st.runs=(st.runs||0)+1;
      if(s.opts[j].ok){E.sv.at=at+1; if(E.sv.pick) delete E.sv.pick[at]} else {E.sv.pick=E.sv.pick||{}; E.sv.pick[at]=j}
      save(); sec4(); refresh(); const nw=$(".lrow.new",box)||$(".lstep",box); if(nw&&!still()) nw.scrollIntoView({block:"nearest",behavior:"smooth"})});
    const fc=$("#fincheck",box); if(fc) fc.onclick=()=>{const f=sv.final, fbx=$("#finfb",box); let ok=true;
      f.inputs.forEach((x,j)=>{const inp=$(`[data-fi="${j}"]`,box), raw=inp.value.trim(), v=numOr(raw.replace(/[$,%\s]/g,""),NaN); E.sv.ans[j]=raw;
        const good=Number.isFinite(v)&&Math.abs(v-x.ans)<=(x.tol??Math.max(1e-9,Math.abs(x.ans)*.005)); $("#fw"+j,box).classList.toggle("bad",!good); $("#fw"+j,box).classList.toggle("ok",good); if(!good) ok=false});
      st.runs=(st.runs||0)+1;
      if(ok){E.sv.fin=true; save(); sec4(); celebrate($("#es4 .enum",el)||box,16); refresh()}
      else{fbx.className="fb warn"; fbx.innerHTML=rich(f.fb||"Not yet. Work it out from the last line above, then try again.",SY); save()}};
    $$("[data-fi]",box).forEach(inp=>inp.addEventListener("keydown",ev=>{if(ev.key==="Enter"&&fc) fc.click()}));
    $$("[data-ip]",box).forEach(b=>b.onclick=()=>{E.sv.ip=+b.dataset.ip; st.runs=(st.runs||0)+1; save(); sec4(); refresh(); if(solveOK()) celebrate($("#es4 .enum",el))})}

  function goals(){return [{k:"eq-sym",t:"Match each symbol to its meaning",ok:symsOK()}].concat(spec.eqs.map(e=>({k:"eq-"+e.out,t:`Write the equation for ${e.out}`,ok:!!E.ok[e.out]})),
    [{k:"eq-why",t:"Make sense of the equations",ok:whyOK()},{k:"eq-solve",t:"Final steps: "+String(sv.title).replace(/\{\{|\}\}/g,""),ok:solveOK()}])}
  function refresh(){const G=goals(); trackGoals(st,G); const nb=$("#nextb",el); if(nb) nb.disabled=!S.teacher&&!G.every(g=>g.ok)}
  sec1(); sec2(); sec3(); sec4(); refresh();
  $("#back",el).onclick=ctx.back; $("#nextb",el).onclick=ctx.next;
}

/* ---------- a teacher's problem gets the same step, made from the teacher's formulas ---------- */
function autoEqSpec(p){const model=probModel(p), V=p.vars, by=k=>V.find(v=>v.key===k);
  const outs=V.filter(v=>v.kind==="out"&&!model.errs[v.key]&&String(v.formula||"").trim()).slice(0,3), ins=V.filter(v=>v.kind==="in");
  const base={}; ins.forEach(v=>base[v.key]=v.start);
  const SY={}; V.forEach(v=>{SY[v.key]={name:capFirst(v.name||("the value of "+v.key)),unit:v.unit||"",role:v.kind,val:v.kind==="par"?v.val:undefined,show:v.kind==="par"?showV(v,v.val):undefined,range:v.kind==="in"?[v.min,v.max]:undefined,story:v.kind==="in"?v.start:undefined}});
  const one=u=>{u=String(u||"").trim(); return /^[a-z]{3,}s$/i.test(u)?u.slice(0,-1):u};
  const used=new Set(); outs.forEach(o=>{used.add(o.key); try{formulaVars(parseFormula(o.formula)).forEach(k=>used.add(k))}catch(e){}});
  const names=new Set(), syms=[...used].filter(k=>by(k)&&by(k).name&&!names.has(by(k).name.toLowerCase())&&names.add(by(k).name.toLowerCase())).slice(0,9);
  const nums=new Set(); outs.forEach(o=>{try{(function walk(t){if(t.n!=null) nums.add(String(t.n)); if(t.a) walk(t.a); if(t.b) walk(t.b); (t.args||[]).forEach(walk)})(parseFormula(o.formula))}catch(e){}});
  const hasPow=outs.some(o=>/\^/.test(o.formula)), hasLn=outs.some(o=>/\bln\s*\(/.test(o.formula));
  const tiles=[...used].concat([...nums].slice(0,4),["=","+","-","*","/"],hasPow?["^"]:[],["(",")"],hasLn?["ln("]:[]);
  const rnd=mulberry32(String(p.id||p.title||"x").split("").reduce((a,c)=>a*31+c.charCodeAt(0)>>>0,7)), shuf=a=>{const b=a.slice(); for(let i=b.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1)); [b[i],b[j]]=[b[j],b[i]]} return b};
  const eqs=outs.map(o=>{const ast=parseFormula(o.formula), uv=[...formulaVars(ast)].filter(k=>k!==o.key);
    return {out:o.key,f:o.formula,hints:[`Start with ${"{{"+o.key+"}}"} =. Which quantities does ${esc(o.name?o.name.charAt(0).toLowerCase()+o.name.slice(1):o.key)} depend on? Look back at the symbols you matched.`,
      `${"{{"+o.key+"}}"} is worked out from ${uv.map(k=>"{{"+k+"}}").join(", ")||"the given numbers"}. Look at how your blocks for ${o.key} join them, and use the same operations.`]}});
  const out=outs[0], inn=ins[0], why=[];
  if(out&&inn){const f=x=>model.at(Object.assign({},base,{[inn.key]:x}))[out.key], h=inn.step||1, x0=Number.isFinite(inn.start)?inn.start:inn.min;
    const y0=f(x0), y1=f(x0+h), y2=f(x0+2*h), tol=1e-9*Math.max(1,Math.abs(y0)), dir=y1>y0+tol?"up":y1<y0-tol?"down":"same", sv=x=>showV(out,x);
    if(Number.isFinite(y0)&&Number.isFinite(y1)){
      why.push({id:"dir",q:`If {{${inn.key}}} goes up, what happens to {{${out.key}}}?`,opts:[["up","It goes up"],["down","It goes down"],["same","It stays the same"]].map(([k,l])=>k===dir?
        {h:l,ok:true,why:`Check with your equation: when {{${inn.key}}} = ${fmtM(x0)}, {{${out.key}}} = ${esc(sv(y0))}; when {{${inn.key}}} = ${fmtM(x0+h)}, it's ${esc(sv(y1))}.`}:
        {h:l,fb:`Try two values in your equation: {{${inn.key}}} = ${fmtM(x0)} gives ${esc(sv(y0))}, and {{${inn.key}}} = ${fmtM(x0+h)} gives ${esc(sv(y1))}.`})});
      const lin=Number.isFinite(y2)&&Math.abs((y2-y1)-(y1-y0))<=1e-9*Math.max(1,Math.abs(y1-y0));
      if(lin&&dir!=="same"){const rate=(y1-y0)/h, y00=f(0), opts=[{h:esc(sv(rate)),ok:true,why:`Each extra 1 ${esc(one(inn.unit)||"unit")} changes {{${out.key}}} by the same amount, so the graph is a straight line. In the equation, it's the number that multiplies {{${inn.key}}}.`}];
        if(Number.isFinite(y00)&&!same(y00,rate)) opts.push({h:esc(sv(y00)),fb:`That's {{${out.key}}} when {{${inn.key}}} = 0, where the line starts. The change for each extra 1 is the number multiplying {{${inn.key}}}.`});
        if(!same(rate*2,rate)&&!opts.some(o=>o.h===esc(sv(rate*2)))) opts.push({h:esc(sv(rate*2)),fb:`That's the change for 2 more, not 1.`});
        why.push({id:"rate",q:`When {{${inn.key}}} goes up by 1${inn.unit?" "+esc(one(inn.unit)):""}, by how much does {{${out.key}}} change?`,opts:shuf(opts)})}
      else if(!lin&&Number.isFinite(y2)){const grow=Math.abs(y2-y1)>Math.abs(y1-y0);
        why.push({id:"shape",q:`Does {{${out.key}}} change by the same amount for every extra ${fmtM(h)} ${esc(inn.unit||"")} of {{${inn.key}}}?`,opts:[
          {h:`No: the changes get ${grow?"bigger":"smaller"}`,ok:true,why:`${esc(sv(y0))} → ${esc(sv(y1))} → ${esc(sv(y2))}. The changes aren't equal, so the graph curves. That's what the operations in your equation do.`},
          {h:"Yes: it's a straight line",fb:`Check three values: ${esc(sv(y0))}, ${esc(sv(y1))}, ${esc(sv(y2))}. Are the jumps equal?`},
          {h:`No: the changes get ${grow?"smaller":"bigger"}`,fb:`Compare the two jumps: from ${esc(sv(y0))} to ${esc(sv(y1))}, then to ${esc(sv(y2))}.`}]})}}}
  let solve=null;
  if(out){const ast=parseFormula(out.formula), at=model.at(base), env={}; V.forEach(v=>{if(v.kind==="par") env[v.key]=v.val; else if(v.kind==="in") env[v.key]=base[v.key]; else if(v.key!==out.key&&Number.isFinite(at[v.key])) env[v.key]=at[v.key]});
    const ok=astSrc(astSub(ast,env)), pars=V.filter(v=>v.kind==="par"&&formulaVars(ast).has(v.key)), wrong=[];
    if(pars.length>=2&&pars[0].val!==pars[1].val){const e2=Object.assign({},env,{[pars[0].key]:pars[1].val,[pars[1].key]:pars[0].val}); wrong.push({src:astSrc(astSub(ast,e2)),fb:`Two of the given numbers swapped places. Which number is ${esc(pars[0].name?pars[0].name.charAt(0).toLowerCase()+pars[0].name.slice(1):pars[0].key)}?`})}
    if(inn&&formulaVars(ast).has(inn.key)){const alt=inn.max!==inn.start?inn.max:inn.min; const e3=Object.assign({},env,{[inn.key]:alt}); wrong.push({src:astSrc(astSub(ast,e3)),fb:`That uses {{${inn.key}}} = ${fmtM(alt)}. The story's value is ${fmtM(inn.start)}.`})}
    if(pars.length){const e4=Object.assign({},env,{[pars[0].key]:pars[0].val*10}); wrong.push({src:astSrc(astSub(ast,e4)),fb:`Check the value of {{${pars[0].key}}} in the problem: it's ${fmtM(pars[0].val)}.`})}
    const seen=new Set([ok]), opts=[{h:`{{${out.key} = ${ok}}}`,ok:true,to:`${out.key} = ${ok}`,note:"the story's numbers in"}].concat(wrong.filter(w=>!seen.has(w.src)&&seen.add(w.src)).slice(0,2).map(w=>({h:`{{${out.key} = ${w.src}}}`,fb:w.fb})));
    const ans=at[out.key];
    solve={title:`find {{${out.key}}}${inn?` when {{${inn.key} = ${inn.start}}}`:""}`,intro:"Use your equation the way a mathematician would: put the numbers in, then work it out.",start:`${out.key} = ${out.formula}`,startNote:"your equation",
      steps:[{q:"Put the problem's numbers into the equation. Which line is right?",opts:shuf(opts)}],
      final:{q:`Work it out.${out.unit?` Give {{${out.key}}} in ${out.unit==="$"?"dollars":esc(out.unit)}.`:""}`,inputs:[{pre:`{{${out.key}}} =${out.unit==="$"?" $":""}`,ans,tol:Math.max(Math.abs(ans)*.005,.01),post:out.unit&&out.unit!=="$"?out.unit:""}],
        ok:`Right: your blocks give ${esc(showV(out,ans))} too. The equation and the code are two ways to write the same model.`,fb:"Not yet. Work it out from the last line, one operation at a time (brackets first, then powers, then × and ÷, then + and −)."}}}
  return {SY,syms,tiles,eqs,why,solve:solve||{title:"use your equation",start:"",steps:[],final:{q:"",inputs:[],ok:""}},
    intro:"Your blocks work out the answers. Now write the same model as equations, the way it would look in a math book.",buildLead:null,note:p.steps&&p.steps.equation||""}}
