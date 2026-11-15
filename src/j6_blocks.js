/* ================= ModelQuest blocks: a Scratch-style block library =================
   Round reporters (numbers, variables, math) drop into round slots; pointy conditions drop into
   pointy slots; commands stack under the hat; C-blocks (if, repeat) hold stacks of their own.
   Drag with a mouse or a finger, or tap a block in the library to add it. */

const CATS={
  v:{id:"v",name:"Variables",ic:"vars",bg:"#F7959C"},
  m:{id:"m",name:"Math",ic:"plus",bg:"#DABEF6"},
  l:{id:"l",name:"Logic",ic:"logic",bg:"#7EF0D2"},
  o:{id:"o",name:"Loops",ic:"loop",bg:"#F7E373"},
  g:{id:"g",name:"Graph",ic:"graph",bg:"#BFD7FB"},
  f:{id:"f",name:"Forest",ic:"tree",bg:"#BDEFC9"}
};
const FLAG=`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" style="width:2.8rem;height:2.8rem"><path d="M5 21.5V3.5" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M5 4c4-2 7 2 13 0v9c-6 2-9-2-13 0z" fill="#3FC46B" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
const HAT=`<div class="blk hat"><i class="hf"></i><span>when</span>${FLAG}<span>Run clicked</span></div>`;
let FLY=null;
function closeFlyouts(){if(FLY){FLY.remove(); FLY=null; $$(".ptab[aria-expanded]").forEach(b=>b.setAttribute("aria-expanded","false"))}}
document.addEventListener("pointerdown",e=>{if(FLY&&!e.target.closest(".flyout")&&!e.target.closest(".ptab")&&!DRAG) closeFlyouts()});

/* ---------- block definitions ---------- */
const BDEF={};
function defB(type,o){BDEF[type]=Object.assign({type,shape:"st",cat:"v",tpl:[],d:{},f:{}},o)}
class BErr extends Error{constructor(bid,msg){super(msg); this.bid=bid}}
const N2=(a,b)=>[{i:"a"},a,{i:"b"}];
const FNS=[["sqrt","√ sqrt"],["abs","abs"],["round","round"],["floor","floor"],["ceil","ceiling"],["ln","ln"],["log","log₁₀"],["exp","e ^"],["p10","10 ^"]];
const FNF={sqrt:Math.sqrt,abs:Math.abs,round:Math.round,floor:Math.floor,ceil:Math.ceil,ln:Math.log,log:Math.log10,exp:Math.exp,p10:x=>Math.pow(10,x)};
const STATES=[["1","tree"],["2","burning"],["0","empty"]];
// variables
defB("var",{shape:"rp",cat:"v",tpl:[{vr:"v"}],say:"variable",c:(n,K)=>K.get(n,n.f.v)});
defB("set",{cat:"v",tpl:["set",{m:"v",o:"setvars"},"to",{i:"x"}],d:{x:""},say:"set",c:(n,K)=>{const x=K.num(n,"x"),v=n.f.v; K.need(n,v); return e=>{e.v[v]=x(e); e.set.add(v)}}});
defB("change",{cat:"v",tpl:["change",{m:"v",o:"setvars"},"by",{i:"x"}],d:{x:"1"},say:"change",c:(n,K)=>{const x=K.num(n,"x"),v=n.f.v; K.need(n,v); return e=>{const o=e.v[v]; if(o===undefined) throw new BErr(n.id,`${K.lab(v)} has no value to change yet. Set it first.`); e.v[v]=o+x(e); e.set.add(v)}}});
// math
const bin=(sym,fn,say)=>({shape:"rp",cat:"m",tpl:N2(sym),say,c:(n,K)=>{const a=K.num(n,"a"),b=K.num(n,"b"); return e=>fn(a(e),b(e),n)}});
defB("add",bin("+",(a,b)=>a+b,"+"));
defB("sub",bin("−",(a,b)=>a-b,"−"));
defB("mul",bin("×",(a,b)=>a*b,"×"));
defB("div",bin("÷",(a,b,n)=>{if(b===0) throw new BErr(n.id,"This ÷ block divides by 0."); return a/b},"÷"));
defB("pow",bin("^",(a,b,n)=>{const r=Math.pow(a,b); if(!Number.isFinite(r)) throw new BErr(n.id,"This ^ block gives a number that's too big or undefined."); return r},"^"));
defB("mod",bin("mod",(a,b,n)=>{if(b===0) throw new BErr(n.id,"mod 0 is undefined."); return ((a%b)+b)%b},"mod"));
defB("fn",{shape:"rp",cat:"m",tpl:[{m:"fn",o:FNS},{i:"a"}],f:{fn:"sqrt"},say:"function",c:(n,K)=>{const a=K.num(n,"a"),k=n.f.fn,f=FNF[k]||Math.sqrt;
  return e=>{const x=a(e); if((k==="sqrt"&&x<0)||((k==="ln"||k==="log")&&x<=0)) throw new BErr(n.id,`${(FNS.find(o=>o[0]===k)||[0,k])[1]} of ${fmt(x,2)} is undefined.`); return f(x)}}});
defB("rand",{shape:"rp",cat:"m",tpl:["pick random",{i:"a"},"to",{i:"b"}],d:{a:"1",b:"10"},say:"pick random",c:(n,K)=>{const a=K.num(n,"a"),b=K.num(n,"b"); const ints=[n.a.a,n.a.b].every(s=>typeof s==="string"&&/^-?\d+$/.test(s.trim()));
  return e=>{const x=a(e),y=b(e),lo=Math.min(x,y),hi=Math.max(x,y),r=e.rng(); return ints?Math.floor(lo+r*(hi-lo+1)):lo+r*(hi-lo)}}});
// logic
const cmp=(sym,fn,numeric)=>({shape:"bl",cat:"l",tpl:N2(sym),say:sym,c:(n,K)=>{const a=numeric?K.num(n,"a"):K.any(n,"a"),b=numeric?K.num(n,"b"):K.any(n,"b"); return e=>fn(a(e),b(e))}});
defB("lt",cmp("<",(a,b)=>a<b,true));
defB("gt",cmp(">",(a,b)=>a>b,true));
const SN={tree:1,burning:2,empty:0}, sn=x=>typeof x==="string"&&SN[x.trim().toLowerCase()]!==undefined?SN[x.trim().toLowerCase()]:x;
defB("eq",cmp("=",(a,b)=>{a=sn(a); b=sn(b); return typeof a==="number"&&typeof b==="number"?Math.abs(a-b)<1e-9:String(a).trim().toLowerCase()===String(b).trim().toLowerCase()}));
defB("and",{shape:"bl",cat:"l",tpl:[{i:"a",t:"bool"},"and",{i:"b",t:"bool"}],say:"and",c:(n,K)=>{const a=K.bool(n,"a"),b=K.bool(n,"b"); return e=>a(e)&&b(e)}});
defB("or",{shape:"bl",cat:"l",tpl:[{i:"a",t:"bool"},"or",{i:"b",t:"bool"}],say:"or",c:(n,K)=>{const a=K.bool(n,"a"),b=K.bool(n,"b"); return e=>a(e)||b(e)}});
defB("not",{shape:"bl",cat:"l",tpl:["not",{i:"a",t:"bool"}],say:"not",c:(n,K)=>{const a=K.bool(n,"a"); return e=>!a(e)}});
defB("if",{shape:"c",cat:"l",tpl:["if",{i:"c",t:"bool"},"then",{s:"y"}],say:"if",c:(n,K)=>{const c=K.bool(n,"c"),y=K.stack(n,"y"); return e=>{if(c(e)) y(e)}}});
defB("ifelse",{shape:"c",cat:"l",tpl:["if",{i:"c",t:"bool"},"then",{s:"y"},"else",{s:"n"}],say:"if-else",c:(n,K)=>{const c=K.bool(n,"c"),y=K.stack(n,"y"),z=K.stack(n,"n"); return e=>{if(c(e)) y(e); else z(e)}}});
// loops
defB("repeat",{shape:"c",cat:"o",tpl:["repeat",{i:"k"},"times",{s:"y"}],d:{k:"10"},say:"repeat",c:(n,K)=>{const k=K.num(n,"k"),y=K.stack(n,"y");
  return e=>{const t=Math.round(k(e)); if(t>10000) throw new BErr(n.id,"Keep repeats under 10,000."); for(let i=0;i<t;i++) y(e)}}});
defB("until",{shape:"c",cat:"o",tpl:["repeat until",{i:"c",t:"bool"},{s:"y"}],say:"repeat until",c:(n,K)=>{const c=K.bool(n,"c"),y=K.stack(n,"y");
  return e=>{let g=0; while(!c(e)){y(e); if(++g>10000) throw new BErr(n.id,"This loop ran 10,000 times without stopping, so its condition never became true. Check that the condition uses your variable blocks (dragged in, not typed), and that the loop changes that variable each time round.")}}}});
// graph & output
defB("plot",{cat:"g",tpl:[{ic:"graph"},"plot",{m:"y",o:"plotvars"},"against",{m:"x",o:"invars"}],say:"plot",c:(n,K)=>{const y=n.f.y,x=n.f.x; K.need(n,y); K.need(n,x); return e=>{if(!e.plots.some(p=>p.y===y&&p.x===x)) e.plots.push({y,x,id:n.id})}}});
defB("say",{cat:"g",tpl:["say",{i:"x",t:"text"}],d:{x:"Hello!"},say:"say",c:(n,K)=>{const x=K.any(n,"x"); return e=>{e.out.push(x(e))}}});
// forest (fire mission)
defB("fstate",{shape:"rp",cat:"f",tpl:["state of this square"],say:"state",c:()=>e=>e.sq.s});
defB("fkind",{shape:"rp",cat:"f",tpl:[{m:"k",o:STATES}],f:{k:"1"},say:"state name",c:n=>{const k=+n.f.k; return ()=>k}});
defB("fnb",{shape:"rp",cat:"f",tpl:["burning neighbours"],say:"burning neighbours",c:()=>e=>e.sq.nb});
defB("frand",{shape:"rp",cat:"f",tpl:["random 0 to 1"],say:"random",c:()=>e=>e.rng()});
defB("fbecome",{cat:"f",tpl:["become",{m:"k",o:STATES}],f:{k:"2"},say:"become",c:n=>{const k=+n.f.k; return e=>{e.sq.next=k}}});
const SHAPE_COL={v:"#F7959C",m:"#DABEF6",l:"#8EF0CE",o:"#F7E37A",g:"#A8D2FB",f:"#BDEFC9"};

/* ---------- model ---------- */
function newNode(type,preset={}){const d=BDEF[type]; const n={id:uid(),type,f:Object.assign({},d.f,preset.f),a:{},b:{}};
  d.tpl.forEach(t=>{if(t&&t.i) n.a[t.i]=t.t==="bool"?null:(preset.a&&t.i in preset.a?preset.a[t.i]:(d.d[t.i]??"")); if(t&&t.s) n.b[t.s]=[]; if(t&&t.m&&n.f[t.m]===undefined) n.f[t.m]=preset.f&&preset.f[t.m]||""});
  if(preset.f&&preset.f.v) n.f.v=preset.f.v; return n}
const isNode=x=>x&&typeof x==="object"&&x.type;
function eachNode(arr,fn,parent){for(const n of arr){fn(n,parent); for(const k in n.a) if(isNode(n.a[k])) eachNode([n.a[k]],fn,n); for(const k in n.b) eachNode(n.b[k],fn,n)}}
function locate(prog,id){let hit=null;
  const walkStack=(arr)=>{for(let i=0;i<arr.length&&!hit;i++){const n=arr[i]; if(n.id===id){hit={stack:arr,i,node:n};return} walkNode(n)}};
  const walkNode=n=>{for(const k in n.a){const c=n.a[k]; if(!isNode(c)) continue; if(c.id===id){hit={parent:n,key:k,node:c};return} walkNode(c); if(hit) return} for(const k in n.b){walkStack(n.b[k]); if(hit) return}};
  walkStack(prog.body); return hit}
function detachNode(prog,id){const h=locate(prog,id); if(!h) return null;
  if(h.stack) h.stack.splice(h.i,1); else h.parent.a[h.key]=BDEF[h.parent.type].tpl.find(t=>t&&t.i===h.key).t==="bool"?null:"";
  return h.node}
function stackByRef(prog,ref){if(ref==="root") return prog.body; const [id,k]=ref.split(":"); const h=locate(prog,id); return h&&h.node.b[k]}
function slotByRef(prog,ref){const [id,k]=ref.split(":"); const h=locate(prog,id); return h?{node:h.node,key:k}:null}

/* ---------- compiler ---------- */
function compileProgram(prog,vars,lab=v=>v){
  const errs={};
  const K={
    lab,
    need(n,v){if(!v) throw new BErr(n.id,"Choose a variable in this block."); if(!vars[v]) throw new BErr(n.id,`There's no variable called ${v}.`)},
    get(n,v){if(!vars[v]) throw new BErr(n.id,`There's no variable called ${v}.`); return e=>{const x=e.v[v]; if(x===undefined) throw new BErr(n.id,`${lab(v)} doesn't have a value yet. Set it above this block.`); return x}},
    num(n,k){const v=n.a[k]; if(isNode(v)){if(BDEF[v.type].shape==="bl") throw new BErr(n.id,"A pointy block can't go in a round slot."); return comp(v)}
      const s=String(v??"").trim(); if(s==="") throw new BErr(n.id,`Fill the empty slot in this ${BDEF[n.type].say} block: type a number, or drag in a block from Variables or Math.`); typedVar(n,s); const x=Number(s.replace(/,/g,"")); if(!Number.isFinite(x)) throw new BErr(n.id,`“${s}” isn't a number. Type a number here, or drag in a block from Variables or Math.`); return ()=>x},
    any(n,k){const v=n.a[k]; if(isNode(v)) return comp(v); const s=String(v??"").trim(); if(s==="") throw new BErr(n.id,`Fill the empty slot in this ${BDEF[n.type].say} block.`); typedVar(n,s); const x=Number(s.replace(/,/g,"")); return Number.isFinite(x)&&/\d/.test(s)?()=>x:()=>s},
    bool(n,k){const v=n.a[k]; if(!isNode(v)) throw new BErr(n.id,`Put a pointy condition block in this ${BDEF[n.type].say} block.`); return comp(v)},
    stack(n,k){return stackFn(n.b[k]||[])}
  };
  // a variable's name typed into a slot is only a word: say so, instead of letting it quietly compare as text
  const typedVar=(n,s)=>{if(/^[-+]?[\d.,\s]+$/.test(s)) return; const t=s.toLowerCase(), k=vars[s]?s:Object.keys(vars).find(x=>x.toLowerCase()===t||String(vars[x].label||"").toLowerCase()===t);
    if(k) throw new BErr(n.id,`You typed “${s}”, so this slot holds the word, not the ${lab(k)} variable. Drag the ${lab(k)} block from Variables into this slot instead.`)};
  const comp=n=>{const d=BDEF[n.type]; if(!d) throw new BErr(n.id,"Unknown block."); return d.c(n,K)};
  const stackFn=arr=>{const fs=[]; for(const n of arr){try{const f=comp(n); fs.push(e=>{try{f(e)}catch(err){if(err.bid){if(!e.errs[err.bid]) e.errs[err.bid]=err.message; if(err.fatal) throw err} else throw err}})}catch(err){if(err.bid) errs[err.bid]=err.message; else throw err}} return e=>{for(const f of fs) f(e)}};
  const body=stackFn(prog.body);
  return {errs,body,run(e){e.errs=e.errs||{}; e.set=e.set||new Set(); e.out=e.out||[]; e.plots=e.plots||[]; e.rng=e.rng||Math.random; body(e); for(const k in errs) if(!e.errs[k]) e.errs[k]=errs[k]; return e}};
}

/* ---------- rendering ---------- */
function varLabel(vars,v){return (vars[v]&&vars[v].label)||v}
function rTok(n,t,o){
  if(typeof t==="string") return `<span class="tx">${esc(t)}</span>`;
  if(t.ic) return `<span class="ico">${ic(t.ic,2.4)}</span>`;
  if(t.vr){const v=n.f[t.vr]; return `<span class="tx vname">${esc(varLabel(o.vars,v))}</span>`}
  if(t.m){const opts=typeof t.o==="string"?o.menus(t.o):t.o; const val=n.f[t.m]; const isVar=typeof t.o==="string";
    if(o.pal){const cur=opts.find(x=>x[0]===val)||(val?[val,val]:opts[0])||["",""]; return `<span class="bsel fake ${isVar?"vsel":""}" ${isVar?`data-var="${esc(cur[0])}"`:""}>${esc(cur[1])}</span>`}
    const has=opts.some(x=>x[0]===val);
    return `<select class="bsel ${isVar?"vsel":""}" data-m="${n.id}:${t.m}" ${isVar?`data-var="${esc(val)}"`:""} aria-label="${esc(BDEF[n.type].say)} option">${has?"":`<option value="${esc(val)}" selected>${esc(val||"choose")}</option>`}${opts.map(x=>`<option value="${esc(x[0])}" ${x[0]===val?"selected":""}>${esc(x[1])}</option>`).join("")}</select>`}
  if(t.i){const v=n.a[t.i], ref=`${n.id}:${t.i}`;
    if(t.t==="bool") return `<span class="slot bs ${isNode(v)?"fill":""}" ${o.pal?"":`data-slot="${ref}" data-acc="bool"`}>${isNode(v)?rNode(v,o):""}</span>`;
    if(isNode(v)) return `<span class="slot fill" ${o.pal?"":`data-slot="${ref}" data-acc="${t.t||"num"}"`}>${rNode(v,o)}</span>`;
    if(o.pal) return `<span class="slot"><span class="bin fake">${esc(v??"")}</span></span>`;
    return `<span class="slot ${o.sel===ref?"sel":""}" data-slot="${ref}" data-acc="${t.t||"num"}"><input class="bin" data-in="${ref}" value="${esc(v??"")}" ${t.t==="text"?"":'inputmode="decimal"'} autocomplete="off" spellcheck="false" aria-label="${esc(BDEF[n.type].say)} ${t.t==="text"?"text":"number"}"></span>`}
  return "";
}
function rNode(n,o){const d=BDEF[n.type], col=n.type==="var"?"var(--pink-var)":SHAPE_COL[d.cat];
  const id=o.pal?"":`data-id="${n.id}"`, err=o.errs&&o.errs[n.id], cls=`b ${d.shape} ${err?"bad":""} ${o.fresh===n.id?"snap":""}`, tt=err?`title="${esc(err)}"`:"";
  const xb=o.pal||o.ro?"":`<button class="bx" tabindex="-1" aria-label="Remove block">${ic("x",3.4)}</button>`;
  const dv=n.type==="var"?`data-var="${esc(n.f.v)}"`:"";
  if(d.shape==="rp") return `<span class="${cls} ${n.type==="var"?"vr":""}" ${id} ${dv} ${tt} style="--c:${col}" ${o.pal?"":'tabindex="0"'}>${d.tpl.map(t=>rTok(n,t,o)).join("")}</span>`;
  if(d.shape==="bl") return `<span class="${cls}" ${id} ${tt} style="--c:${col}" ${o.pal?"":'tabindex="0"'}><span class="bi">${d.tpl.map(t=>rTok(n,t,o)).join("")}</span></span>`;
  if(d.shape==="st") return `<div class="${cls}" ${id} ${tt} style="--c:${col}">${d.tpl.map(t=>rTok(n,t,o)).join("")}${xb}</div>`;
  // C-block: header row, then each mouth, with "else" rows between mouths
  const parts=[]; let row=[];
  d.tpl.forEach(t=>{if(t&&t.s){parts.push({row,s:t.s}); row=[]} else row.push(t)});
  let html=`<div class="${cls}" ${id} ${tt} style="--c:${col}">`;
  parts.forEach((p,i)=>{html+=`<div class="${i?"cmid":"chd"}">${p.row.map(x=>rTok(n,x,o)).join("")}</div><div class="mouth ${!o.pal&&o.selS===`${n.id}:${p.s}`?"sel":""}" ${o.pal?"":`data-stack="${n.id}:${p.s}"`}>${o.pal&&!o.show?"":(n.b[p.s]||[]).map(c=>rNode(c,o)).join("")}</div>`});
  html+=(row.length?`<div class="cmid">${row.map(x=>rTok(n,x,o)).join("")}</div>`:`<div class="cft"></div>`)+xb+`</div>`;
  return html;
}

/* ---------- the studio: library + canvas ---------- */
let ACTIVE=null, DRAG=null;
function blockStudio(cfg){
  const vars=()=>cfg.vars();
  const prog=cfg.prog; prog.body=prog.body||[];
  let sel=null, selS=null, fresh=null, errs={}; const hist=[];
  const menus=k=>{const V=vars(), ks=Object.keys(V);
    if(k==="setvars") return ks.filter(v=>V[v].kind!=="in").map(v=>[v,V[v].label||v]);
    if(k==="plotvars") return ks.filter(v=>V[v].kind==="out"||V[v].kind==="mine").map(v=>[v,V[v].label||v]);
    if(k==="invars") return ks.filter(v=>V[v].kind==="in").map(v=>[v,V[v].label||v]);
    return ks.map(v=>[v,V[v].label||v])};
  const ro=()=>({vars:vars(),menus,errs,sel,selS,fresh});
  const snapshot=()=>JSON.stringify(prog.body);
  const commit=(kind,before)=>{hist.push(before); if(hist.length>60) hist.shift(); draw(); cfg.onChange(kind)};
  const draw=()=>{
    cfg.canvas.innerHTML=`<div class="ctools"><button class="ctool" data-tool="undo" ${hist.length?"":"disabled"} title="Undo (Ctrl+Z)">${ic("refresh",2.4,'style="transform:scaleX(-1)"')}Undo</button><button class="ctool" data-tool="clear" ${prog.body.length?"":"disabled"} title="Remove every block">${ic("x",2.6)}Clear</button></div>
      <div class="script">${cfg.hat}<div class="stack root" data-stack="root">${prog.body.map(n=>rNode(n,ro())).join("")}</div></div>
      ${prog.body.length?"":`<div class="empty">Open a category in the library, then drag a block under the yellow block. You can also tap a block to add it.</div>`}`;
    $$(".bin",cfg.canvas).forEach(fitNum); $$("select.bsel",cfg.canvas).forEach(fitSel); fresh=null; hideTip();
  };
  // library
  const tpls=[];
  const openFly=(btn,cat)=>{const was=btn.getAttribute("aria-expanded")==="true"; closeFlyouts(); if(was) return;
    const c=CATS[cat], items=cfg.lib(cat); tpls.length=0;
    const f=document.createElement("div"); f.className="card flyout"+(cfg.horizontal?" hz":""); f.setAttribute("role","dialog"); f.setAttribute("aria-label",c.name+" blocks");
    if(!cfg.horizontal&&innerWidth>900) f.style.top=Math.max(0,btn.offsetTop-.6*parseFloat(getComputedStyle(document.documentElement).fontSize))+"px";
    else f.style.left=Math.max(0,Math.min(btn.offsetLeft,cfg.pal.clientWidth-10))+"px";
    f.innerHTML=`<div class="fh"><span class="chip" style="width:4rem;height:4rem;border-radius:1rem;box-shadow:none;background:${c.bg}">${ic(c.ic,2.4)}</span>${esc(c.name)}<button class="xbtn x" aria-label="Close">${ic("x",3)}</button></div>
      <div class="fl">${items.map(it=>{
        if(it.head) return `<div class="fsec">${esc(it.head)}</div>`;
        if(it.note) return `<p class="note">${it.note}</p>`;
        if(it.make) return `<form class="mkvar" autocomplete="off"><input id="mkv" maxlength="14" placeholder="new variable" aria-label="Name for a new variable"><button class="btn sm" type="submit">${ic("plus",2.6)}Make</button></form><p class="fb mkfb" hidden></p>`;
        const node=newNode(it.type,it); tpls.push(node);
        return `<div class="tpl" data-tpl="${tpls.length-1}" role="button" tabindex="0" aria-label="Add ${esc(BDEF[it.type].say)} block${it.f&&it.f.v?" "+esc(it.f.v):""}">${rNode(node,{pal:true,vars:vars(),menus})}</div>`}).join("")}</div>`;
    (cfg.flyHost||cfg.pal).appendChild(f); FLY=f; btn.setAttribute("aria-expanded","true");
    $(".x",f).onclick=closeFlyouts;
    $$("[data-tpl]",f).forEach(b=>{b.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault(); tapAdd(tpls[+b.dataset.tpl])}}});
    const mk=$(".mkvar",f); if(mk) mk.onsubmit=e=>{e.preventDefault(); const name=$("#mkv",f).value.trim(); const msg=cfg.makeVar(name); const fb=$(".mkfb",f); if(msg){fb.hidden=false; fb.textContent=msg} else {cfg.onChange("var"); closeFlyouts(); openFly(btn,cat); toast(`New variable <b>${esc(name)}</b> is in your library.`)}};
    const first=$("[data-tpl]",f); first&&first.focus({preventScroll:true});
  };
  cfg.pal.innerHTML=(cfg.horizontal?"":`<h3>Blocks</h3>`)+`<div class="ptabs">${cfg.cats.map(k=>{const c=CATS[k]; return `<button class="ptab" style="background:${c.bg}" aria-expanded="false" aria-haspopup="dialog" data-cat="${k}">${ic(c.ic,2.4)}${c.name}</button>`}).join("")}</div>`;
  $$(".ptab",cfg.pal).forEach(b=>b.onclick=()=>openFly(b,b.dataset.cat));
  // tap to add: a statement goes to the end of the script (or into the mouth you picked);
  // a reporter fills the slot you picked, or else the first empty slot that fits
  const accOf=r=>{const s=slotByRef(prog,r); if(!s) return null; const t=BDEF[s.node.type].tpl.find(t=>t&&t.i===r.split(":")[1]); return t?(t.t==="bool"?"bool":"num"):null};
  const emptySlot=shape=>{const want=shape==="bl"?"bool":"num"; let found=null;
    if(sel){const s=slotByRef(prog,sel), v=s&&s.node.a[s.key]; if(s&&!isNode(v)&&accOf(sel)===want&&(want==="bool"?v===null:String(v??"").trim()==="")) return sel}
    // reading order: a block's slots left to right (going inside filled slots first), then its mouths
    const walk=n=>{for(const t of BDEF[n.type].tpl){if(found) return; if(!t||typeof t!=="object") continue;
      if(t.i){const v=n.a[t.i]; if(isNode(v)) walk(v); else if((t.t==="bool"?"bool":"num")===want&&(want==="bool"?v===null:String(v??"").trim()==="")) found=`${n.id}:${t.i}`}
      if(t.s) for(const c of n.b[t.s]||[]){walk(c); if(found) return}}};
    for(const n of prog.body){walk(n); if(found) break}
    return found};
  const tapAdd=tpl=>{const node=JSON.parse(JSON.stringify(tpl)); eachNode([node],x=>{x.id=uid()}); const d=BDEF[node.type], before=snapshot();
    if(d.shape==="rp"||d.shape==="bl"){const r=emptySlot(d.shape); if(!r){toast(d.shape==="bl"?"Drag this pointy block into a pointy slot, like the one in an <b>if</b> block.":"No empty round slot to fill. Click a slot in your script first, or drag this block into one.",4200); return}
      const s=slotByRef(prog,r); s.node.a[s.key]=node; sel=null}
    else{const arr=(selS&&stackByRef(prog,selS))||prog.body; arr.push(node)}
    fresh=node.id; closeFlyouts(); commit("add",before);
    const el=$(`[data-id="${node.id}"]`,cfg.canvas); if(el){const cv=cfg.canvas, cr=cv.getBoundingClientRect(), r=el.getBoundingClientRect();
      if(r.bottom>cr.bottom-12) cv.scrollTop+=r.bottom-cr.bottom+28; else if(r.top<cr.top+12) cv.scrollTop-=cr.top-r.top+28}};
  // canvas events
  let editSnap=null;
  cfg.canvas.addEventListener("focusin",e=>{const i=e.target.closest("[data-in]"); if(i){sel=i.dataset.in; editSnap=snapshot(); $$(".slot.sel",cfg.canvas).forEach(s=>s.classList.remove("sel")); i.parentElement.classList.add("sel")}});
  cfg.canvas.addEventListener("focusout",e=>{const i=e.target.closest("[data-in]"); if(i&&editSnap!==null&&editSnap!==snapshot()){hist.push(editSnap); const u=$('[data-tool="undo"]',cfg.canvas); if(u) u.disabled=false} editSnap=null});
  cfg.canvas.addEventListener("input",e=>{const i=e.target.closest("[data-in]"); if(!i) return; const s=slotByRef(prog,i.dataset.in); if(!s) return; s.node.a[s.key]=i.value; fitNum(i); cfg.onChange("edit")});
  cfg.canvas.addEventListener("change",e=>{const m=e.target.closest("[data-m]"); if(!m) return; const [id,k]=m.dataset.m.split(":"); const h=locate(prog,id); if(!h) return; const before=snapshot(); h.node.f[k]=m.value; if(m.classList.contains("vsel")) m.dataset.var=m.value; fitSel(m); hist.push(before); cfg.onChange("edit")});
  cfg.canvas.addEventListener("click",e=>{
    const t=e.target.closest("[data-tool]");
    if(t){if(t.dataset.tool==="undo") undo(); else {const z=$(".ctools",cfg.canvas); z.innerHTML=`<span class="cq">Remove every block?</span><button class="ctool" data-tool="yes">Yes, clear</button><button class="ctool" data-tool="no">Keep</button>`}
      if(t.dataset.tool==="yes"){const before=snapshot(); prog.body.length=0; commit("clear",before)} if(t.dataset.tool==="no") draw(); return}
    const x=e.target.closest(".bx"); if(x){const b=x.closest("[data-id]"); const before=snapshot(); detachNode(prog,b.dataset.id); commit("remove",before); return}
    const bs=e.target.closest(".slot.bs:not(.fill)"); if(bs&&bs.dataset.slot){sel=bs.dataset.slot; $$(".slot.sel",cfg.canvas).forEach(s=>s.classList.remove("sel")); bs.classList.add("sel"); return}
    const mo=e.target.closest(".mouth[data-stack]"); if(mo&&e.target===mo){selS=selS===mo.dataset.stack?null:mo.dataset.stack; $$(".mouth.sel",cfg.canvas).forEach(x=>x.classList.remove("sel")); if(selS) mo.classList.add("sel"); return}
    if(!e.target.closest(".slot")){sel=null; selS=null; $$(".slot.sel,.mouth.sel",cfg.canvas).forEach(x=>x.classList.remove("sel"))}});
  cfg.canvas.addEventListener("keydown",e=>{if((e.key==="Delete"||e.key==="Backspace")&&e.target.matches(".b[data-id]")){e.preventDefault(); const before=snapshot(); detachNode(prog,e.target.dataset.id); commit("remove",before)}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"&&!e.target.matches("input")){e.preventDefault(); undo()}});
  const undo=()=>{if(!hist.length) return; const j=hist.pop(); prog.body.length=0; JSON.parse(j).forEach(n=>prog.body.push(n)); draw(); cfg.onChange("undo")};
  const api={cfg,prog,draw,commit,snapshot,tapAdd,menus,_tpl:i=>tpls[i],_fresh:id=>{fresh=id},
    mark(map){errs=map||{}; $$(".b[data-id]",cfg.canvas).forEach(b=>{const m=errs[b.dataset.id]; b.classList.toggle("bad",!!m); if(m) b.title=m; else b.removeAttribute("title")})},
    varInfo:v=>{const V=vars(); return V[v]&&cfg.varTip?cfg.varTip(v,V[v]):null}};
  ACTIVE=api; draw(); return api;
}

/* ---------- drag and drop (mouse, pen and touch) ---------- */
function dndTargets(x,y){
  const A=ACTIVE, cv=A.cfg.canvas, pal=A.cfg.pal;
  const pr=pal.getBoundingClientRect(); if(x>=pr.left&&x<=pr.right&&y>=pr.top&&y<=pr.bottom) return {trash:true};
  const cr=cv.getBoundingClientRect(); const inCanvas=x>=cr.left&&x<=cr.right&&y>=cr.top&&y<=cr.bottom;
  const pt=document.elementFromPoint(x,y); const shape=BDEF[DRAG.node.type].shape;
  if(shape==="rp"||shape==="bl"){if(!pt||!cv.contains(pt)) return null; const s=pt.closest("[data-slot]:not(.fill)"); if(!s) return null; const acc=s.dataset.acc; if((shape==="bl")!==(acc==="bool")) return null; return {slot:s.dataset.slot,el:s}}
  if(!inCanvas) return null;
  let st=pt&&cv.contains(pt)?pt.closest("[data-stack]"):null; if(!st) st=$('[data-stack="root"]',cv);
  const kids=[...st.children].filter(c=>c.matches(".b[data-id]")); let idx=kids.length;
  for(let i=0;i<kids.length;i++){const r=kids[i].getBoundingClientRect(); if(y<r.top+r.height/2){idx=i;break}}
  return {stack:st.dataset.stack,idx,el:st,kids}}
function dndShow(t){const A=ACTIVE, cv=A.cfg.canvas;
  $$(".slot.hot",cv).forEach(s=>s.classList.remove("hot")); A.cfg.pal.classList.toggle("trash",!!(t&&t.trash));
  let bar=$(".insbar",cv); if(!t||!t.stack){bar&&bar.remove()}
  if(t&&t.slot) t.el.classList.add("hot");
  if(t&&t.stack){if(!bar){bar=document.createElement("div"); bar.className="insbar"; cv.appendChild(bar)}
    const cr=cv.getBoundingClientRect(), sr=t.el.getBoundingClientRect(); let y;
    if(t.idx<t.kids.length) y=t.kids[t.idx].getBoundingClientRect().top; else if(t.kids.length) y=t.kids[t.kids.length-1].getBoundingClientRect().bottom; else y=sr.top+4;
    bar.style.left=(sr.left-cr.left-cv.clientLeft+cv.scrollLeft)+"px"; bar.style.top=(y-cr.top-cv.clientTop+cv.scrollTop-4)+"px"; bar.style.width=Math.max(120,Math.min(sr.width,360))+"px"}}
document.addEventListener("pointerdown",e=>{
  if(!ACTIVE||e.button>0||DRAG) return; const cv=ACTIVE.cfg.canvas;
  if(e.target.closest("input,select,button,textarea,a")) return;
  const tpl=e.target.closest(".flyout [data-tpl]"); const blk=!tpl&&cv.contains(e.target)?e.target.closest(".b[data-id]"):null;
  if(!tpl&&!blk) return;
  DRAG={x0:e.clientX,y0:e.clientY,tpl,blk,on:false,pid:e.pointerId};
});
document.addEventListener("pointermove",e=>{
  if(!DRAG||!ACTIVE) return;
  if(!DRAG.on){if(Math.hypot(e.clientX-DRAG.x0,e.clientY-DRAG.y0)<6) return;
    const A=ACTIVE; DRAG.on=true; DRAG.before=A.snapshot();
    let node, srcEl=DRAG.tpl?DRAG.tpl.firstElementChild:DRAG.blk;
    const r=srcEl.getBoundingClientRect(); DRAG.dx=DRAG.x0-r.left; DRAG.dy=DRAG.y0-r.top;
    if(DRAG.tpl){node=JSON.parse(JSON.stringify(A._tpl(+DRAG.tpl.dataset.tpl))); eachNode([node],x=>{x.id=uid()})}
    else {node=detachNode(A.prog,DRAG.blk.dataset.id); A.draw()}
    DRAG.node=node; closeFlyouts();
    const g=document.createElement("div"); g.className="ghost"; g.innerHTML=rNode(node,{pal:false,ro:true,vars:A.cfg.vars(),menus:A.menus}); document.body.appendChild(g); DRAG.g=g;
    $$("input,select",g).forEach(x=>x.tabIndex=-1); document.body.classList.add("dragging")}
  e.preventDefault();
  DRAG.g.style.left=(e.clientX-DRAG.dx)+"px"; DRAG.g.style.top=(e.clientY-DRAG.dy)+"px";
  DRAG.t=dndTargets(e.clientX,e.clientY); dndShow(DRAG.t);
},{passive:false});
function dndEnd(e,cancel){
  if(!DRAG) return; const D=DRAG; DRAG=null; const A=ACTIVE;
  if(!D.on){if(D.tpl&&!cancel&&A) A.tapAdd(A._tpl(+D.tpl.dataset.tpl)); return}
  D.g.remove(); document.body.classList.remove("dragging"); if(!A) return; dndShow(null);
  const t=cancel?null:D.t, prog=A.prog;
  if(t&&t.slot){const s=slotByRef(prog,t.slot); if(s){s.node.a[s.key]=D.node; A._fresh(D.node.id); A.commit("add",D.before); return}}
  if(t&&t.stack){const arr=stackByRef(prog,t.stack); if(arr){arr.splice(t.idx,0,D.node); A._fresh(D.node.id); A.commit(D.tpl?"add":"move",D.before); return}}
  if(t&&t.trash){if(D.blk){A.commit("remove",D.before)} return}
  if(D.blk){prog.body.length=0; JSON.parse(D.before).forEach(n=>prog.body.push(n)); A.draw()}
}
document.addEventListener("pointerup",e=>dndEnd(e,false));
document.addEventListener("pointercancel",e=>dndEnd(e,true));
// variable info on hover (library, canvas, menus)
let TIPV=null; // steps without a studio can still explain variables on hover
document.addEventListener("pointerover",e=>{const v=e.target.closest&&e.target.closest("[data-var]"); if(!v||DRAG) return; const f=ACTIVE?ACTIVE.varInfo:TIPV; const html=f&&f(v.dataset.var); if(html) showTip(e,html)});
document.addEventListener("pointerout",e=>{const v=e.target.closest&&e.target.closest("[data-var]"); if(v&&!v.contains(e.relatedTarget)) hideTip()});

/* ---------- running a student's model ---------- */
// V: the mission's variable table. Given numbers start at their values, your own variables start at 0,
// inputs come from the sliders (or from a plot's sweep), and outputs start empty until a block sets them.
function modelRunner(V,prog){
  const comp=compileProgram(prog,V,v=>V[v]?V[v].label||v:v);
  const base=()=>{const v={}; for(const k in V){const x=V[k]; if(x.kind==="par") v[k]=x.val; if(x.kind==="mine") v[k]=0} return v};
  const at=(inputs,seed=7)=>{const e={v:Object.assign(base(),inputs),rng:mulberry32(seed)}; comp.run(e); return e};
  return {comp,at,base};
}
function sayText(x){return typeof x==="number"?fmt(x,Math.abs(x-Math.round(x))<1e-9?0:Math.abs(x)<10?3:2):String(x)}

/* ---------- shared library + variable helpers for the missions ---------- */
function stdLib(cat,V,o={}){
  const ks=Object.keys(V), of=kind=>ks.filter(k=>V[k].kind===kind).map(k=>({type:"var",f:{v:k}}));
  const out0=ks.find(k=>V[k].kind==="out")||ks.find(k=>V[k].kind==="mine")||"", mine=of("mine");
  if(cat==="v") return [{head:"Inputs (you slide these)"},...of("in"),{head:"Given numbers"},...of("par"),{head:"Your model calculates"},...of("out"),
    ...(mine.length?[{head:"Your variables"},...mine]:[]),{head:"Commands"},{type:"set",f:{v:out0}},{type:"change",f:{v:(mine[0]&&mine[0].f.v)||out0}},{make:true}];
  if(cat==="m") return [{type:"add"},{type:"sub"},{type:"mul"},{type:"div"},{type:"pow"},{type:"fn",f:{fn:o.fn||"round"}},{type:"mod"},{type:"rand"}];
  if(cat==="l") return [{type:"lt"},{type:"gt"},{type:"eq"},{type:"and"},{type:"or"},{type:"not"},{type:"if"},{type:"ifelse"}];
  if(cat==="o") return [{type:"repeat"},{type:"until"},...(o.loopNote?[{note:o.loopNote}]:[])];
  if(cat==="g") return [{type:"plot",f:{y:o.plotY||out0,x:ks.find(k=>V[k].kind==="in")}},{type:"say",a:{x:o.sayText??"Hello!"}}];
  return [];
}
function varTipHTML(k,x,cur){const val=v=>x.show?x.show(v):fmt(v,3);
  const line=x.kind==="par"?`${val(x.val)}${x.unit?` <span class="muted">${esc(x.unit)}</span>`:""}${x.src?`<br><span class="muted">From ${esc(x.src)}</span>`:""}`:
    x.kind==="in"?`You set this with the slider${Number.isFinite(cur)?`: now ${val(cur)}`:""}`:
    x.kind==="out"?(Number.isFinite(cur)?`Your model says ${val(cur)}`:"Your model calculates this"):"Your own variable. It starts at 0 each run.";
  return `<div class="vtip"><b>${esc(x.label||k)}</b><span>${esc(x.name)}</span><span>${line}</span></div>`}
function makeVarFn(st,V){return name=>{if(!/^[A-Za-z][A-Za-z0-9_]{0,13}$/.test(name)) return "Use letters, digits or _ , starting with a letter (up to 14).";
  if(V()[name]) return `There's already a variable called ${name}.`; (st.d.mine=st.d.mine||[]).push(name); save(); return null}}
