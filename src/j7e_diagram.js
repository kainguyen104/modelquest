/* ================= Diagram step: build the model as a stock-and-flow diagram by dragging, then explore it ================= */
// The parts follow system dynamics as Shiflet & Shiflet draw it (Introduction to Computational Science, Module 2.2):
// a stock (box) builds up or drains; a flow (pipe with a valve) is a rate that fills or drains a stock; a converter (circle) is a
// constant or is worked out from others; a connector (thin blue arrow) means "is used to work out"; a spiral is outside the model.
ICP.diagram='<rect x="2" y="7.5" width="7.5" height="9" rx="1.2"/><path d="M9.5 12h6.6"/><path d="m14.3 9.6 2.4 2.4-2.4 2.4"/><circle cx="19.4" cy="12" r="2.4"/>';
ICP.eye='<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>';
ICP.hand='<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-.5V4a1.5 1.5 0 0 1 3 0v6m0-1.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.6a6 6 0 0 1-5-2.7L3.3 15a1.6 1.6 0 0 1 2.5-2L9 16"/>';
const DGK={stock:"Stock",flow:"Flow",conv:"Converter"};
const DGC={blue:"#1F78CF",pipe:"#8D95A3",stock:"#E4DBFB",valve:"#FDE651",conv:"#FFFDFB"};
const DGS={sw:180,sh:110,vrx:30,vry:20,cr:32,gw:156,gh:62,clr:22};
function spiralD(cx,cy,R){let d=""; const n=64,turns=2.6; for(let i=0;i<=n;i++){const th=i/n*turns*2*Math.PI, r=R*(.12+.88*i/n); d+=(i?"L":"M")+(cx+r*Math.cos(th)).toFixed(1)+" "+(cy+r*Math.sin(th)).toFixed(1)} return d}
const DGI={
  stock:`<svg class="dgi" viewBox="0 0 44 30" aria-hidden="true"><rect x="3" y="4" width="38" height="22" rx="3" fill="${DGC.stock}" stroke="${INK}" stroke-width="2.8"/></svg>`,
  flow:`<svg class="dgi" viewBox="0 0 56 30" aria-hidden="true"><path d="M2 15H40" stroke="${DGC.pipe}" stroke-width="6.5"/><path d="M39 5.5 53 15 39 24.5z" fill="${DGC.pipe}"/><ellipse cx="22" cy="15" rx="10" ry="7" fill="${DGC.valve}" stroke="${INK}" stroke-width="2.6"/></svg>`,
  conv:`<svg class="dgi" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="11.5" fill="${DGC.conv}" stroke="${INK}" stroke-width="2.8"/></svg>`,
  link:`<svg class="dgi" viewBox="0 0 56 30" aria-hidden="true"><path d="M4 25C12 7 31 4 42 14" fill="none" stroke="${DGC.blue}" stroke-width="3"/><path d="M51 22 37.6 21 45.4 10.6z" fill="${DGC.blue}"/></svg>`,
  cloud:`<svg class="dgi" viewBox="0 0 30 30" aria-hidden="true"><path d="${spiralD(15,15,12)}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`};
const DGLEG=[["stock","Stock","builds up or drains away"],["flow","Flow","a rate that fills or drains a stock"],["conv","Converter","a constant, or worked out from others"],["link","Connector","means “is used to work out”"],["cloud","Spiral","outside the model"]];
function dgLegend(full,only){return `<div class="dglegend ${full?"full":""}">${DGLEG.filter(([k])=>!only||only.includes(k)).map(([k,n,s])=>`<span class="dgli">${DGI[k]}<span class="dglt"><b>${n}</b>${full?`<small>${s}</small>`:""}</span></span>`).join("")}</div>`}

/* ---------- geometry and drawing ---------- */
function dgShape(n,L,shown){const p=L.pos[n.id], x=p[0], y=p[1];
  if(!shown) return {x,y,k:"rect",hw:DGS.gw/2,hh:DGS.gh/2,ghost:true};
  if(n.t==="stock") return {x,y,k:"rect",hw:DGS.sw/2,hh:DGS.sh/2};
  if(n.t==="flow") return {x,y,k:"ell",rx:DGS.vrx,ry:DGS.vry,a:0};
  return {x,y,k:"circ",r:DGS.cr}}
// the point where a line from the shape's centre towards (tx,ty) leaves the shape
function dgEdge(s,tx,ty){const dx=tx-s.x, dy=ty-s.y, l=Math.hypot(dx,dy)||1;
  if(s.k==="circ") return [s.x+dx/l*s.r,s.y+dy/l*s.r];
  if(s.k==="ell"){const c=Math.cos(s.a||0), sn=Math.sin(s.a||0), u=dx*c+dy*sn, v=-dx*sn+dy*c, t=1/Math.sqrt((u/s.rx)**2+(v/s.ry)**2); return [s.x+dx*t,s.y+dy*t]}
  const t=Math.min(s.hw/Math.max(Math.abs(dx),1e-9),s.hh/Math.max(Math.abs(dy),1e-9)); return [s.x+dx*t,s.y+dy*t]}
const f1=v=>(+v).toFixed(1);
function dgLabel(n,s,L,cls){const lp=(L.lp&&L.lp[n.id])||(n.t==="conv"?"b":"t"), nm=L.tall?"":n.name||"", big=!!L.tall;
  const vert=s.k==="ell"&&Math.abs(Math.sin(s.a||0))>.7, ext=s.k==="rect"?[s.hw,s.hh]:s.k==="circ"?[s.r,s.r]:vert?[DGS.vry,DGS.vrx]:[DGS.vrx,DGS.vry];
  let x=s.x, y1, y2, a="middle";
  if(lp==="t"){y2=s.y-ext[1]-11; y1=nm?y2-25:y2-(big?1:0)}
  else if(lp==="b"){y1=s.y+ext[1]+(big?33:30); y2=y1+23}
  else {x=lp==="r"?s.x+ext[0]+13:s.x-ext[0]-13; a=lp==="r"?"start":"end"; y1=nm?s.y-4:s.y+(big?11:10); y2=s.y+21}
  return `<g class="dglab ${cls||""}"><text class="dgk" x="${f1(x)}" y="${f1(y1)}" text-anchor="${a}">${esc(n.lab)}</text>${nm?`<text class="dgnm" x="${f1(x)}" y="${f1(y2)}" text-anchor="${a}">${esc(nm)}</text>`:""}</g>`}
// every shape, the two ends of every pipe, and each valve turned to lie along its pipe
function dgGeo(spec,L,isShown){const sh={}, PG={}; spec.nodes.forEach(n=>{if(L.pos[n.id]) sh[n.id]=dgShape(n,L,isShown(n.id))});
  (spec.pipes||[]).forEach(p=>{if(!sh[p.f]) return; const end=k=>k==="cloud"?(L.cl&&L.cl[p.f]?{x:L.cl[p.f][0],y:L.cl[p.f][1],k:"circ",r:DGS.clr,cloud:true}:null):sh[k];
    const A=end(p.a), B=end(p.b); if(!A||!B) return; if(sh[p.f].k==="ell") sh[p.f].a=Math.atan2(B.y-A.y,B.x-A.x); PG[p.f]={A,B}});
  return {sh,PG}}
const dgBend=(L,a,b)=>L.bend&&L.bend[a+">"+b]!=null?L.bend[a+">"+b]:.16;
// a connector is a gentle curve from the edge of one shape to the edge of the other
function dgCurve(s,t,bd){const dx=t.x-s.x, dy=t.y-s.y, cx=(s.x+t.x)/2-dy*bd, cy=(s.y+t.y)/2+dx*bd;
  const p0=dgEdge(s,cx,cy), p1=dgEdge(t,cx,cy), ux=p1[0]-cx, uy=p1[1]-cy, ul=Math.hypot(ux,uy)||1, u=[ux/ul,uy/ul], q=[p1[0]-u[0]*15,p1[1]-u[1]*15];
  return {p0,p1,c:[cx,cy],q,nr:[-u[1],u[0]],mid:[.25*p0[0]+.5*cx+.25*p1[0],.25*p0[1]+.5*cy+.25*p1[1]],len:Math.hypot(p0[0]-cx,p0[1]-cy)+Math.hypot(q[0]-cx,q[1]-cy)}}
function dgLinkSVG(C,cls,attrs){const d=`M${f1(C.p0[0])} ${f1(C.p0[1])}Q${f1(C.c[0])} ${f1(C.c[1])} ${f1(C.q[0])} ${f1(C.q[1])}`, W=7.5;
  return `<g class="dglink ${cls||""}" style="--len:${f1(C.len)}" ${attrs||""}><path class="dghit" d="${d}"/><path class="dgll" d="${d}"/><path class="dgla" d="M${f1(C.p1[0])} ${f1(C.p1[1])}L${f1(C.q[0]+C.nr[0]*W)} ${f1(C.q[1]+C.nr[1]*W)}L${f1(C.q[0]-C.nr[0]*W)} ${f1(C.q[1]-C.nr[1]*W)}Z"/></g>`}
function dgPipeSVG(G,f,laid,cls,attrs){const {A,B}=G.PG[f], pa=dgEdge(A,B.x,B.y), pb=dgEdge(B,A.x,A.y), cl=c=>c.cloud?`<path class="dgcloud" d="${spiralD(c.x,c.y,DGS.clr)}"/>`:"";
  if(!laid) return `<g class="dgguide ${cls||""}">${cl(A)}${cl(B)}<path d="M${f1(pa[0])} ${f1(pa[1])}L${f1(pb[0])} ${f1(pb[1])}"/></g>`;
  const ux=pb[0]-pa[0], uy=pb[1]-pa[1], l=Math.hypot(ux,uy)||1, u=[ux/l,uy/l], nr=[-u[1],u[0]], AW=17, b=[pb[0]-u[0]*26,pb[1]-u[1]*26], line=`M${f1(pa[0])} ${f1(pa[1])}L${f1(b[0])} ${f1(b[1])}`;
  return `<g class="dgpipe ${cls||""}" style="--len:${f1(l)}" ${attrs||""}>${cl(A)}${cl(B)}<path class="dghit" d="${line}"/><path class="dgpl" d="${line}"/><path class="dgph" d="M${f1(pb[0])} ${f1(pb[1])}L${f1(b[0]+nr[0]*AW)} ${f1(b[1]+nr[1]*AW)}L${f1(b[0]-nr[0]*AW)} ${f1(b[1]-nr[1]*AW)}Z"/></g>`}
// one shape, solid (placed) or dashed (an empty slot); pad grows it for hit areas and rings
function dgShapeSVG(s,cls,pad){const tr=s.k==="ell"?` transform="rotate(${f1((s.a||0)*180/Math.PI)} ${f1(s.x)} ${f1(s.y)})"`:"";
  return s.k==="rect"?`<rect class="${cls}" x="${f1(s.x-s.hw-pad)}" y="${f1(s.y-s.hh-pad)}" width="${f1(2*(s.hw+pad))}" height="${f1(2*(s.hh+pad))}" rx="${8+pad}"/>`:
    s.k==="ell"?`<ellipse class="${cls}" cx="${f1(s.x)}" cy="${f1(s.y)}" rx="${DGS.vrx+pad}" ry="${DGS.vry+pad}"${tr}/>`:`<circle class="${cls}" cx="${f1(s.x)}" cy="${f1(s.y)}" r="${DGS.cr+pad}"/>`}
const dgStartTxt=(n,s)=>`<text class="dgsm" x="${f1(s.x)}" y="${f1(s.y-8)}" text-anchor="middle">starts at</text><text class="dgsv" x="${f1(s.x)}" y="${f1(s.y+20)}" text-anchor="middle">${esc(n.start)}</text>`;
let DGID=0;
// a finished or part-built diagram, read-only. view: {all, shown:Set(node), pipes:Set(flow), links:[[a,b]], exOn(id), bad:Set("a>b")}
function dgSVG(spec,L,view,o={}){
  const id="dg"+(++DGID), [W,H]=L.vb, on=k=>!!(view.all||view.shown.has(k)), exOn=k=>view.all||!view.exOn||view.exOn(k), N=spec.nodes, G=dgGeo(spec,L,on);
  let pipes="", links="", nodes="", labels="";
  (spec.pipes||[]).forEach(p=>{if(!G.PG[p.f]) return; const laid=view.all||view.pipes.has(p.f); if(on(p.f)||laid) pipes+=dgPipeSVG(G,p.f,laid)});
  (view.all?spec.links.map(l=>[l.a,l.b]):view.links).forEach(([a,b])=>{const s=G.sh[a], t=G.sh[b]; if(s&&t) links+=dgLinkSVG(dgCurve(s,t,dgBend(L,a,b)),view.bad&&view.bad.has(a+">"+b)?"bad":"")});
  N.forEach(n=>{const s=G.sh[n.id]; if(!s) return;
    if(!on(n.id)){nodes+=`<g class="dgn dgun"><rect class="dgghost" x="${f1(s.x-s.hw)}" y="${f1(s.y-s.hh)}" width="${DGS.gw}" height="${DGS.gh}" rx="16"/><text class="dgk gk" x="${f1(s.x)}" y="${f1(s.y+8.5)}" text-anchor="middle">${esc(n.lab)}</text></g>`; return}
    const cls=n.t==="stock"?"dgstock":n.t==="flow"?"dgvalve":"dgconv";
    nodes+=`<g class="dgn t-${n.t}" data-tip="${esc(`<b>${esc(n.lab)}</b> · ${DGK[n.t].toLowerCase()}${n.desc?`<br>${esc(n.desc)}`:""}`)}">${dgShapeSVG(s,cls,0)}${n.t==="stock"&&n.start?(n.startBy&&!exOn(n.startBy)?`<text class="dgsm" x="${f1(s.x)}" y="${f1(s.y+6)}" text-anchor="middle">starts at ?</text>`:dgStartTxt(n,s)):""}</g>`;
    labels+=dgLabel(n,s,L)});
  return `<svg class="dgsvg ${L.tall?"tall":""}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||"Stock-and-flow diagram")}"><defs><pattern id="${id}d" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.7" fill="#E9E1DB"/></pattern></defs>
    <rect class="dgbg" width="${W}" height="${H}" fill="url(#${id}d)"/>${pipes}${links}${nodes}${labels}</svg>`}
function dgAria(spec,v){const N=spec.nodes, on=n=>v.all||v.shown.has(n.id), of=t=>N.filter(n=>n.t===t&&on(n)).map(n=>n.lab);
  const lk=v.all?spec.links.map(l=>[l.a,l.b]):v.links, lab=k=>(N.find(n=>n.id===k)||{lab:k}).lab, pp=(spec.pipes||[]).filter(p=>v.all||v.pipes.has(p.f));
  const bits=[]; if(of("stock").length) bits.push("Stocks: "+of("stock").join(", ")); if(of("flow").length) bits.push("Flows: "+of("flow").join(", "));
  pp.forEach(p=>bits.push(`${lab(p.f)} moves from ${p.a==="cloud"?"outside the model":lab(p.a)} to ${p.b==="cloud"?"outside the model":lab(p.b)}`));
  if(of("conv").length) bits.push("Converters: "+of("conv").join(", ")); if(lk.length) bits.push("Connectors: "+lk.map(([a,b])=>`${lab(a)} to ${lab(b)}`).join(", "));
  return "Stock-and-flow diagram. "+(bits.join(". ")||"Nothing drawn yet")+"."}
const dgLayoutFor=(spec,w)=>w<560&&spec.L.tall?spec.L.tall:spec.L.wide;
// the finished diagram, read-only (Problem info)
function dgStatic(spec,narrow){const L=narrow&&spec.L.tall?spec.L.tall:spec.L.wide, v={all:true,shown:new Set(),pipes:new Set(),links:[]};
  return `<div class="dgstatic"><div class="dgcanvas">${dgSVG(spec,L,v,{aria:dgAria(spec,v)})}</div>${dgLegend(false,spec.custom?["conv","link"]:null)}</div>`}
const dgDone=st=>!!(st&&st.d&&st.d.dg&&st.d.dg.done);
const dgSpecOf=m=>m?(m.dg||(m.prob?(m._dg||(m._dg=autoDgSpec(m.prob))):null)):null;
// work saved by the list version of this step (sort/try/lnOK) carries over: what was right stays done
function dgNorm(spec,D){D=D||{}; if(D.v===2) return D;
  const pl={}, ln={}, ex={};
  spec.nodes.forEach(n=>{if(spec.sort===false||(D.sort&&D.sort[n.id]===n.t)) pl[n.id]=1});
  spec.links.forEach(l=>{if(D.ln&&(D.ln[l.b]||[]).includes(l.a)) (ln[l.b]=ln[l.b]||[]).push(l.a)});
  if(D.done) (spec.extras||[]).forEach(x=>ex[x.id]=1);
  return {v:2,pl,ex,pipe:Object.assign({},D.pipe||{}),ln,q:Object.assign({},D.q||{}),err:{},done:!!D.done}}
// what a student has drawn so far (the teacher's view of a student)
function dgViewOf(spec,D){D=dgNorm(spec,D); const pl=D.pl||{}, pp=D.pipe||{}, ln=D.ln||{}, ex=D.ex||{};
  const v={shown:new Set(spec.nodes.filter(n=>spec.sort===false||pl[n.id]).map(n=>n.id)),pipes:new Set((spec.pipes||[]).filter(p=>{const i=pp[p.f]; return i!=null&&p.opts[i]&&p.opts[i].ok}).map(p=>p.f)),links:[],exOn:k=>!!ex[k]};
  Object.keys(ln).forEach(b=>(ln[b]||[]).forEach(a=>{if(spec.links.some(l=>l.a===a&&l.b===b)) v.links.push([a,b])})); return v}
// the wrong moves a student made on the way, for the teacher
function dgErrList(spec,D){D=dgNorm(spec,D); const lab=k=>{const n=spec.nodes.find(x=>x.id===k)||(spec.extras||[]).find(x=>x.id===k); return n?n.lab:k};
  const where={stock:"a box",flow:"a valve",conv:"a circle",start:"a “starts at” space",clock:"the clock",emptybox:"an empty box"};
  return Object.entries(D.err||{}).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,n])=>{const [kind,rest]=[k.slice(0,k.indexOf(":")),k.slice(k.indexOf(":")+1)]; let t=k;
    if(kind==="place"||kind==="ex"){const [id,w]=rest.split(">"); t=`${lab(id)} in ${where[w]||lab(w)}`}
    else if(kind==="link"){const [a,b]=rest.split(">"); t=`${lab(a)} → ${lab(b)}`}
    else if(kind==="pipe"||kind==="q"){const [id,j]=rest.split(":"), q=kind==="pipe"?(spec.pipes||[]).find(p=>p.f===id):(spec.why||[]).find(x=>x.id===id); t=q&&q.opts[+j]?`${kind==="pipe"?lab(id)+" pipe":"Question "+((spec.why||[]).indexOf(q)+1)}: “${plain(q.opts[+j].h)}”`:rest}
    return n>1?`${t} ×${n}`:t})}

/* ---------- the step ---------- */
const DGFB={stock:{flow:"It's an amount at one moment, not a rate. An amount that builds up or drains goes in a box: it's a stock.",conv:"It carries over from one moment to the next, and changes only as things flow in or out. That's a stock, so it goes in a box."},
  flow:{stock:"Look at its unit: it's a rate, an amount per step. A rate that fills or drains a stock is a flow, so it goes in a valve.",conv:"It's what moves stuff into or out of a stock. That makes it a flow, even though it's worked out from other quantities. It goes in a valve."},
  conv:{stock:"It doesn't build up or drain over time. A constant, or a quantity worked out fresh from others, is a converter: a circle.",flow:"Nothing moves through it: it's a number used to work out other quantities. That's a converter: a circle."}};
const DGSL={stock:"an empty box. A stock goes here",flow:"an empty valve on a pipe. A flow goes here",conv:"an empty circle. A converter goes here"};
const DGTT={place:"Build the diagram",pipes:"Point the pipes",links:"Draw the connectors",read:"Explore your diagram",done:"Your diagram is done"};
const DGTS={place:"Build",pipes:"Pipes",links:"Connect",read:"Explore"};
function diagramStep(el,m,st,ctx,spec){
  const d=st.d; d.dg=dgNorm(spec,d.dg); const D=d.dg; ["pl","ex","pipe","ln","q","err"].forEach(k=>D[k]=D[k]||{});
  const N=spec.nodes, X=spec.extras||[], nd=k=>N.find(n=>n.id===k), xd=k=>X.find(x=>x.id===k), lab=k=>esc((nd(k)||xd(k)||{lab:k}).lab);
  const pipes=spec.pipes||[], why=spec.why||[], links=spec.links, srcOf={}; links.forEach(l=>(srcOf[l.b]=srcOf[l.b]||[]).push(l.a));
  if(spec.sort===false) N.forEach(n=>D.pl[n.id]=1);
  const isLink=(a,b)=>links.some(l=>l.a===a&&l.b===b), has=(a,b)=>(D.ln[b]||[]).includes(a);
  const pipeOK=p=>{const i=D.pipe[p.f]; return i!=null&&!!(p.opts[i]&&p.opts[i].ok)}, qOK=q=>{const i=D.q[q.id]; return i!=null&&!!(q.opts[i]&&q.opts[i].ok)};
  const OK={place:()=>N.every(n=>D.pl[n.id])&&X.every(x=>D.ex[x.id]),pipes:()=>pipes.every(pipeOK),links:()=>links.every(l=>has(l.a,l.b)),read:()=>why.every(qOK)};
  const PH=[]; if(spec.sort!==false) PH.push("place"); if(pipes.length) PH.push("pipes"); if(links.length) PH.push("links"); if(why.length) PH.push("read");
  let forced=null, picked=null, srcSel=null, qNow=null, BUB=null, lay=null, prevKeys=null, DR=null, justDragged=false, bubT=0, flashT=0, wasDone=!!D.done;
  const phase=()=>forced||PH.find(k=>!OK[k]())||"done";
  const past=k=>{const p=phase(); return p==="done"||(PH.indexOf(k)>=0&&PH.indexOf(p)>PH.indexOf(k))};
  const placed=k=>!!(D.pl[k]||past("place")), exOn=k=>!!(D.ex[k]||past("place")), laid=p=>pipeOK(p)||past("pipes");
  const drawnLinks=()=>past("links")?links.map(l=>[l.a,l.b]):Object.keys(D.ln).reduce((a,b)=>a.concat((D.ln[b]||[]).map(s=>[s,b])),[]);
  const hash=s=>String(s).split("").reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7)%997;
  const order=N.map(n=>n.id).concat(X.map(x=>x.id)).sort((a,b)=>hash(a+"q")-hash(b+"q"));
  const clockX=X.find(x=>x.to==="clock");
  const bump=()=>{st.runs=(st.runs||0)+1};
  el.innerHTML=`<div class="dgstep">${spec.intro?`<p class="lead dgintro">${spec.intro}</p>`:""}${spec.note?`<div class="dgtn">${teacherNote(spec.note)}</div>`:""}
    <div class="card dgbench" id="dgb">
      <div class="dgtop"><ol class="dgph" id="dgph" aria-label="Diagram tasks"></ol><div class="dgtask" id="dgtask" aria-live="polite"></div></div>
      <div class="dgbody">
        <div class="dgside"><div class="dgqslot" id="dgqslot"></div><div id="dgside"></div></div>
        <div class="dgstage">${spec.clock?`<div class="dgsthd"><button type="button" class="dgclock" id="dgclock" data-drop="clock"></button></div>`:""}
          <div class="dgcv" id="dgcv"><svg class="dgsvg" id="dgsvg" role="group"></svg><div class="dginfo" id="dginfo" hidden></div><div class="dgbub" id="dgbub" hidden aria-live="polite"></div></div>
          <div class="dgdslot" id="dgdslot"><div class="dgdock" id="dgdock" hidden aria-live="polite"></div></div></div>
        <div class="dgmore"><div class="hintzone" id="dghz"></div>${dgLegend(true,spec.custom?["conv","link"]:null)}</div>
      </div>
    </div>
    <div class="ex-btns" style="margin-left:0"><button class="btn back" id="back">${ic("arrowL",2.8)}Define</button><button class="btn submit" id="nextb" disabled>Build ${ic("arrowR",2.8)}</button></div></div>`;
  const bench=$("#dgb",el), svg=$("#dgsvg",el), cv=$("#dgcv",el), dock=$("#dgdock",el), info=$("#dginfo",el), bub=$("#dgbub",el), side=$("#dgside",el), clockB=$("#dgclock",el), qslot=$("#dgqslot",el), dslot=$("#dgdslot",el);
  const alive=()=>document.body.contains(bench), uid="dgp"+(++DGID), narrow=()=>cv.clientWidth<600, twoCol=()=>!matchMedia("(max-width:900px)").matches;

  /* drawing the canvas */
  function draw(){const L=dgLayoutFor(spec,cv.clientWidth||900); lay=L; const [W,H]=L.vb, ph=phase(), G=dgGeo(spec,L,()=>true), act=ph!=="done", linking=act&&ph==="links";
    const lk=drawnLinks(), keys=new Set([...N.filter(n=>placed(n.id)).map(n=>"n:"+n.id),...pipes.filter(laid).map(p=>"p:"+p.f),...lk.map(([a,b])=>"l:"+a+">"+b),...X.filter(x=>exOn(x.id)).map(x=>"x:"+x.id)]);
    const fresh=new Set(); if(prevKeys&&!still()) keys.forEach(k=>{if(!prevKeys.has(k)) fresh.add(k)}); prevKeys=keys;
    const fr=k=>fresh.has(k)?" dgnew":"", atS=new Set([BUB&&BUB.at,info.hidden?null:info.dataset.k].filter(Boolean)), F=k=>atS.has(k);
    let P="", Lk="", Nd="", Lb="", Z="";
    pipes.forEach(p=>{if(!G.PG[p.f]) return; const on=laid(p); P+=dgPipeSVG(G,p.f,on,fr("p:"+p.f)+(F("p:"+p.f)||(BUB&&BUB.at===p.f&&BUB.k==="q")?" focus":""),on?`data-p="${esc(p.f)}"`:"")});
    lk.forEach(([a,b])=>{const s=G.sh[a], t=G.sh[b]; if(s&&t) Lk+=dgLinkSVG(dgCurve(s,t,dgBend(L,a,b)),fr("l:"+a+">"+b)+(F(a+">"+b)?" focus":""),`data-l="${esc(a+">"+b)}"`)});
    N.forEach(n=>{const s=G.sh[n.id]; if(!s) return; const k=n.id, focus=F(k)||F("start:"+k);
      if(placed(k)){const cls=n.t==="stock"?"dgstock":n.t==="flow"?"dgvalve":"dgconv", startOn=n.start&&(!n.startBy||exOn(n.startBy));
        Nd+=`<g class="dgn t-${n.t}${fr("n:"+k)}${focus?" focus":""}${srcSel===k?" src":""}" data-n="${esc(k)}" role="button" tabindex="0" aria-label="${esc(n.lab+", "+DGK[n.t].toLowerCase()+". "+(n.desc||"")+(linking?" Press Enter, then choose what it helps work out.":""))}">${dgShapeSVG(s,"dghitz",12)}${focus?dgShapeSVG(s,"dgring",9):""}${dgShapeSVG(s,cls,0)}${n.t==="stock"&&n.start?(startOn?dgStartTxt(n,s):`<text class="dgsm" x="${f1(s.x)}" y="${f1(s.y-10)}" text-anchor="middle">starts at</text>`):""}</g>`;
        Lb+=dgLabel(n,s,L,fr("n:"+k).trim());
        if(n.t==="stock"&&n.start&&!startOn) Z+=`<g class="dgstartz${focus?" focus":""}" data-start="${esc(k)}" role="button" tabindex="0" aria-label="${esc("Where "+n.lab+" starts: drop its starting value here")}"><rect x="${f1(s.x-64)}" y="${f1(s.y-2)}" width="128" height="40" rx="10"/><text class="dgq sm" x="${f1(s.x)}" y="${f1(s.y+27)}" text-anchor="middle">?</text></g>`}
      else Nd+=`<g class="dgslot s-${n.t}${focus?" focus":""}" data-slot="${esc(k)}" role="button" tabindex="0" aria-label="${esc(capFirst(DGSL[n.t]))}">${dgShapeSVG(s,"dghitz",14)}${dgShapeSVG(s,"dgslotsh",0)}<text class="dgq" x="${f1(s.x)}" y="${f1(s.y+11)}" text-anchor="middle">?</text></g>`});
    const fk=document.activeElement&&svg.contains(document.activeElement)?keyOf(document.activeElement):null;
    svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
    svg.setAttribute("class","dgsvg"+(L.tall?" tall":"")+(linking?" linking":"")+(picked?" dropping":""));
    svg.setAttribute("aria-label",dgAria(spec,{all:past("links")&&past("pipes")&&past("place"),shown:new Set(N.filter(n=>placed(n.id)).map(n=>n.id)),pipes:new Set(pipes.filter(laid).map(p=>p.f)),links:lk}));
    svg.innerHTML=`<defs><pattern id="${uid}" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.7" fill="#E9E1DB"/></pattern></defs><rect class="dgbg" width="${W}" height="${H}" fill="url(#${uid})"/>${P}${Lk}${Nd}${Lb}${Z}<g class="dgfx" id="dgfx"></g>`;
    if(fk){const again=svg.querySelector(fk); if(again) again.focus({preventScroll:true})}}
  const keyOf=e=>e.dataset.n?`[data-n="${CSS.escape(e.dataset.n)}"]`:e.dataset.slot?`[data-slot="${CSS.escape(e.dataset.slot)}"]`:e.dataset.start?`[data-start="${CSS.escape(e.dataset.start)}"]`:null;
  const toSvg=(x,y)=>{const mm=svg.getScreenCTM(); return mm?new DOMPoint(x,y).matrixTransform(mm.inverse()):{x:0,y:0}};

  /* the bar on top: tasks, what to do now, progress */
  function count(k){return k==="place"?[N.filter(n=>D.pl[n.id]).length+X.filter(x=>D.ex[x.id]).length,N.length+X.length]:k==="pipes"?[pipes.filter(pipeOK).length,pipes.length]:k==="links"?[links.filter(l=>has(l.a,l.b)).length,links.length]:[why.filter(qOK).length,why.length]}
  function taskHTML(){const ph=phase();
    if(ph==="done") return `<h3>${DGTT.done} <span class="dgok">${ic("check",2.6)}</span></h3><p>${spec.toCode?rich(spec.toCode,spec.SY||{}):"Each flow or converter with arrows into it becomes a set block, and the arrows tell you which variables go into it."}</p><p class="dgagain">${ic("doc",2)}<span>You can open your diagram again from <b>Problem info</b> while you build.</span></p>`;
    const [a,b]=count(ph), ext=X.some(x=>x.to!=="clock"), tap=matchMedia("(hover:none)").matches;
    const txt={place:spec.placeLead||`Drag each card onto the diagram${tap?" (or tap a card, then tap where it goes)":""}: a stock into a box, a flow into a valve, a converter into a circle.${clockX?" The card that ticks goes on the clock"+(ext?", and a starting value goes inside its box.":"."):""}`,
      pipes:spec.pipesLead||"Each pipe moves stuff one way. Answer the question about the ringed valve to give its pipe an arrow.",
      links:spec.linksLead||`Drag from a quantity to the flow or converter it helps work out${tap?" (or tap one, then the other)":""}. A blue connector appears when it's right.`,
      read:spec.readLead||`Your diagram is built. ${tap?"Tap":"Hover over"} any part to read about it. Each question is about the part ringed in the diagram.`}[ph];
    return `<h3>${DGTT[ph]} <span class="dgprog">${a} of ${b}</span></h3><p>${txt}</p>`}
  function phHTML(){const ph=phase(); return PH.map((k,i)=>{const done=OK[k](), on=k===ph, inner=`<span class="dgpn">${done?ic("check",2.8):i+1}</span><span>${DGTS[k]}</span>`;
    return `<li>${S.teacher?`<button type="button" class="dgpp ${done?"ok":""} ${on?"on":""}" data-ph="${k}" aria-current="${on?"step":"false"}">${inner}</button>`:`<span class="dgpp ${done?"ok":""} ${on?"on":""}" ${on?'aria-current="step"':""}>${inner}</span>`}</li>`}).join("")}

  /* the side: cards to place, then a record of the diagram so far */
  function cardHTML(k){const n=nd(k)||xd(k); return `<button type="button" class="dgcard ${picked===k?"picked":""}" data-card="${esc(k)}" aria-pressed="${picked===k}"><span class="dgck">${esc(n.lab)}</span><span class="dgcd">${esc(n.desc||"")}${n.unit?` <i>(${esc(n.unit)})</i>`:""}</span></button>`}
  function sideHTML(){const ph=phase();
    if(ph==="place"){const left=order.filter(k=>nd(k)?!D.pl[k]:!D.ex[k]);
      return `<div class="dgsh"><h4>${ic("hand",2.4)}Cards</h4><span class="dgcnt">${left.length} left</span></div><div class="dgtray">${left.map(cardHTML).join("")}</div>
        ${picked?`<p class="dgpick">${ic("arrowRt",2.2)}<span>Now tap where <b>${lab(picked)}</b> goes. Tap the card again to put it back.</span></p>`:""}`}
    let h=`<div class="dgsh"><h4>${ic("diagram",2.4)}Your diagram</h4></div>`;
    if(spec.sort!==false) h+=`<div class="dgnt"><span class="dgnk">Parts</span><div class="dgparts">${["stock","flow","conv"].map(t=>N.filter(n=>n.t===t).map(n=>`<span class="dgpart" data-hk="${esc(n.id)}">${DGI[t]}${esc(n.lab)}</span>`).join("")).join("")}</div></div>`;
    if(pipes.length) h+=`<div class="dgnt"><span class="dgnk">Pipes</span><ul>${pipes.map(p=>{const ok=laid(p), cur=qNow&&qNow.kind==="pipe"&&qNow.id===p.f;
      return `<li><button type="button" class="dgnq ${ok?"ok":""} ${cur?"cur":""}" data-nq="${esc(p.f)}" data-nk="pipe" ${!ok&&phase()!=="pipes"?"disabled":""}><b>${lab(p.f)}</b>${ok?`: ${p.a==="cloud"?"outside":lab(p.a)} → ${p.b==="cloud"?"outside":lab(p.b)}`:": which way?"}</button></li>`}).join("")}</ul></div>`;
    if(links.length){const got=drawnLinks(); h+=`<div class="dgnt"><span class="dgnk">Connectors <span class="dgcnt">${got.length} of ${links.length}</span></span>${got.length?`<ul>${got.map(([a,b])=>`<li class="dgnl" data-hk="${esc(a+">"+b)}">${lab(a)} → ${lab(b)}</li>`).join("")}</ul>`:`<p class="muted">None yet.</p>`}</div>`}
    if(why.length) h+=`<div class="dgnt"><span class="dgnk">Questions</span><div class="dgqd">${why.map((q,i)=>{const ok=qOK(q), cur=qNow&&qNow.kind==="read"&&qNow.id===q.id, open=ok||phase()==="read"||phase()==="done";
      return `<button type="button" class="dgnq dot ${ok?"ok":""} ${cur?"cur":""}" data-nq="${esc(q.id)}" data-nk="read" ${open?"":"disabled"} aria-label="Question ${i+1}${ok?", answered":""}">${ok?ic("check",2.6):i+1}</button>`}).join("")}</div></div>`;
    return h}
  function paintClock(){if(!clockB) return; const on=!clockX||exOn(clockX.id), c=spec.clock;
    clockB.className="dgclock"+(on?" on":"")+(picked?" ready":""); clockB.setAttribute("aria-label",on?`Clock: ${c.k}, ${c.name}`:"Clock: empty. Drop the card that ticks here.");
    clockB.innerHTML=`${ic("clock",2.3)}<span>Clock:</span>${on?`<b>${esc(c.k)}</b><span class="dgcn">${esc(c.name)}</span>`:`<span class="dgcq">?</span><span class="dgcn">drop what ticks here</span>`}`}

  /* bubbles: questions and feedback that sit on the diagram, next to the part they're about */
  function anchorRect(at){if(!at||!lay) return null; const c=cv.getBoundingClientRect();
    if(at==="clock"){if(!clockB) return null; const b=clockB.getBoundingClientRect(); return {x:b.left-c.left,y:b.top-c.top,w:b.width,h:b.height}}
    const mm=svg.getScreenCTM(); if(!mm) return null; const P=(x,y)=>[mm.a*x+mm.c*y+mm.e-c.left,mm.b*x+mm.d*y+mm.f-c.top];
    const G=dgGeo(spec,lay,()=>true), k=at.replace(/^(slot:|start:|p:)/,"");
    if(k.includes(">")){const [a,b]=k.split(">"), s=G.sh[a], t=G.sh[b]; if(!s||!t) return null; const C=dgCurve(s,t,dgBend(lay,a,b)), q=P(C.mid[0],C.mid[1]); return {x:q[0]-8,y:q[1]-8,w:16,h:16}}
    const s=G.sh[k]; if(!s) return null; const e=s.k==="rect"?[s.hw,s.hh]:s.k==="circ"?[s.r,s.r]:[DGS.vrx,DGS.vrx], q=P(s.x-e[0],s.y-e[1]);
    return {x:q[0],y:q[1],w:2*e[0]*mm.a,h:2*e[1]*mm.d}}
  const aboutTxt=at=>at==="clock"?"the clock":at.includes(">")?at.split(">").map(lab).join(" → "):lab(at.replace(/^(slot:|start:|p:)/,""));
  function setBub(o){BUB=o; clearTimeout(bubT); if(!o){bub.hidden=true; bub.innerHTML=""; dock.hidden=true; dock.innerHTML=""; return}
    o.body=`${o.k!=="q"?`<button type="button" class="dgbx" data-bclose aria-label="Close">${ic("x",2.4)}</button>`:""}<div class="dgbin">${o.html}</div>`;
    if(narrow()||o.k==="q") showDock(o);
    else {dock.hidden=true; dock.innerHTML=""; bub.className="dgbub k-"+o.k; bub.innerHTML=`<span class="dgarw" aria-hidden="true"></span>`+o.body; bub.hidden=false}
    if(o.auto&&!still()) bubT=setTimeout(()=>{if(BUB===o){setBub(null); draw()}},o.auto)}
  // questions never cover the diagram: they sit in a panel beside it (wide screens) or right under it, and the part they're about is ringed
  const dockHost=o=>o.k==="q"&&twoCol()?qslot:dslot;
  function showDock(o){const host=dockHost(o); if(dock.parentNode!==host) host.appendChild(dock); bub.hidden=true; bub.innerHTML=""; dock.className="dgdock k-"+o.k+(host===qslot?" side":narrow()?"":" wide"); dock.innerHTML=(o.at?`<p class="dgabout">${ic("diagram",2.2)}<span>About <b>${aboutTxt(o.at)}</b>, ringed in the diagram</span></p>`:"")+o.body; dock.hidden=false; hydrateIcons(dock)}
  // pop-ups sit beside what they're about, on whichever side covers the least of the diagram
  const ovl=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
  function parts(){const mm=svg.getScreenCTM(); if(!mm||!lay) return null; const c=cv.getBoundingClientRect(), G=dgGeo(spec,lay,()=>true);
    const P=(x,y)=>({x:mm.a*x+mm.c*y+mm.e-c.left,y:mm.b*x+mm.d*y+mm.f-c.top}), box=(x0,y0,x1,y1)=>{const a=P(x0,y0), b=P(x1,y1); return {x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(b.x-a.x),h:Math.abs(b.y-a.y)}};
    const node=(k,withLab)=>{const n=nd(k), s=G.sh[k]; if(!n||!s) return []; const e=s.k==="rect"?[s.hw,s.hh]:s.k==="circ"?[s.r,s.r]:[DGS.vrx+6,DGS.vrx]; let x0=s.x-e[0], x1=s.x+e[0], y0=s.y-e[1], y1=s.y+e[1];
      if(withLab&&placed(k)){const lp=(lay.lp&&lay.lp[k])||(n.t==="conv"?"b":"t"); if(lp==="t") y0-=lay.tall?40:62; else if(lp==="b") y1+=lay.tall?42:64; else if(lp==="r") x1+=170; else x0-=170}
      return [box(x0,y0,x1,y1)]};
    const dots=(pts,r)=>pts.map(([x,y])=>{const q=P(x,y); return {x:q.x-r,y:q.y-r,w:2*r,h:2*r}});
    const curve=(a,b)=>{const s=G.sh[a], t=G.sh[b]; if(!s||!t) return []; const C=dgCurve(s,t,dgBend(lay,a,b)), pts=[];
      for(let i=1;i<8;i++){const u=i/8; pts.push([(1-u)*(1-u)*C.p0[0]+2*(1-u)*u*C.c[0]+u*u*C.p1[0],(1-u)*(1-u)*C.p0[1]+2*(1-u)*u*C.c[1]+u*u*C.p1[1]])} return dots(pts,11)};
    const pipe=f=>{const g=G.PG[f]; if(!g) return []; const pts=[]; for(let i=1;i<10;i++){const u=i/10; pts.push([g.A.x+(g.B.x-g.A.x)*u,g.A.y+(g.B.y-g.A.y)*u])} return dots(pts,12)};
    const end=k=>k==="cloud"?[]:node(k,false), lk=drawnLinks(), W=(rs,k)=>rs.map(r=>Object.assign(r,{k}));
    const all=[].concat(...N.map(n=>W(node(n.id,true),3)),...N.map(n=>node(n.id,false).map(r=>Object.assign(r,{k:2,shape:1}))),...lk.map(([a,b])=>W(curve(a,b),5)),...pipes.filter(laid).map(p=>W(pipe(p.f),5)));
    // what a bubble is about must stay in sight: the part, its pipe, and the connectors (with what's at their other ends)
    function key(at){if(!at||at==="clock") return []; let R=[];
      if(at.startsWith("start:")) R=node(at.slice(6),false);
      else if(at.includes(">")){const [a,b]=at.split(">"); R=curve(a,b).concat(node(a,false),node(b,false))}
      else {const k=at.replace(/^(slot:|p:)/,""); R=node(k,false);
        pipes.forEach(p=>{if(p.f===k) R=R.concat(pipe(p.f),end(p.a),end(p.b)); else if((p.a===k||p.b===k)&&laid(p)) R=R.concat(pipe(p.f))});
        lk.forEach(([a,b])=>{if(a===k||b===k) R=R.concat(curve(a,b),node(a===k?b:a,false))})}
      return R.map(r=>Object.assign(r,{k:60,key:1}))}
    return {all,key}}
  // hanging below the canvas is fine (the bench has room there); off the top or the sides is not
  function spot(a,bw,bh,obs,W,H){const cx=a.x+a.w/2, cy=a.y+a.h/2, g=15, cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v)), ys=[cy-bh/2,a.y-14,a.y+a.h+14-bh], xs=[cx-bw/2,a.x+a.w-bw+28,a.x-28];
    const cand=[]; xs.forEach(x=>{cand.push(["up",cl(x,8,W-bw-8),a.y+a.h+g]); cand.push(["down",cl(x,8,W-bw-8),a.y-bh-g])});
    ys.forEach(y=>{cand.push(["lf",a.x+a.w+g,cl(y,8,Math.max(8,H-bh-8))]); cand.push(["rt",a.x-bw-g,cl(y,8,Math.max(8,H-bh-8))])});
    let best=null; cand.forEach(([side,x,y],i)=>{const r={x,y,w:bw,h:bh}, off=Math.max(0,-y)*bw*8+Math.max(0,-x)*bh*8+Math.max(0,x+bw-W)*bh*8+Math.max(0,y+bh-H)*bw*.35;
      let sc=i*8+ovl(r,a)*30+off, kov=0, sov=0; obs.forEach(o=>{const v=ovl(r,o); sc+=v*(o.k||3); if(o.key) kov+=v; if(o.shape) sov+=v}); if(!best||sc<best.sc) best={side,x,y,sc,kov,sov}}); return best}
  function placeBub(scroll){if(!BUB) return; const toView=()=>{if(scroll) dock.scrollIntoView({block:"nearest",behavior:still()?"auto":"smooth"})};
    if(narrow()||BUB.k==="q"){if(dock.hidden||dock.parentNode!==dockHost(BUB)) showDock(BUB); return toView()}
    const a=anchorRect(BUB.at), W=cv.clientWidth, H=cv.clientHeight, bw=Math.min(BUB.k==="q"?360:320,W-16); bub.style.width=bw+"px"; const bh=bub.offsetHeight, arw=$(".dgarw",bub);
    if(!a){bub.style.left=(W-bw)/2+"px"; bub.style.top="12px"; if(arw) arw.hidden=true; return}
    const pr=parts(), b=spot(a,bw,bh,pr?pr.all.concat(pr.key(BUB.at)):[],W,H);
    bub.style.left=b.x+"px"; bub.style.top=b.y+"px"; BUB.rect={x:b.x,y:b.y,w:bw,h:bh};
    if(arw){arw.hidden=false; arw.className="dgarw "+b.side; if(b.side==="up"||b.side==="down"){arw.style.left=Math.max(18,Math.min(bw-18,a.x+a.w/2-b.x))+"px"; arw.style.top=""}
      else {arw.style.top=Math.max(18,Math.min(bh-18,a.y+a.h/2-b.y))+"px"; arw.style.left=""}}
    if(scroll){const r=bub.getBoundingClientRect(); if(r.bottom>innerHeight||r.top<0) bub.scrollIntoView({block:"nearest",behavior:still()?"auto":"smooth"})}}
  function hint(o){hideInfo(); setBub(o); draw(); placeBub(o.k==="q")}

  /* hover (or focus, or tap) to read about any part */
  function infoHTML(key){
    if(key==="clock"){const on=!clockX||exOn(clockX.id), c=spec.clock; return on?`<div class="dgih"><b>Clock: ${esc(c.k)}</b></div><p>${esc(capFirst(c.name))}. Each tick, every flow moves its stuff once. The clock isn't drawn as a shape.</p>`:`<div class="dgih"><b>The clock</b></div><p>Every model has something that ticks. Drop the card that ticks here.</p>`}
    if(key.startsWith("slot:")){const n=nd(key.slice(5)); return `<div class="dgih"><b>Empty ${n.t==="stock"?"box":n.t==="flow"?"valve":"circle"}</b></div><p>${capFirst(DGSL[n.t])}.</p>`}
    if(key.startsWith("start:")) return `<div class="dgih"><b>Starts at ?</b></div><p>The number <b>${lab(key.slice(6))}</b> starts at goes here.</p>`;
    if(key.startsWith("p:")){const p=pipes.find(x=>x.f===key.slice(2)); return p?`<div class="dgih"><b>${lab(p.f)}</b><span class="dgtype t-flow">Pipe</span></div><p>Moves stuff from ${p.a==="cloud"?"outside the model":`<b>${lab(p.a)}</b>`} to ${p.b==="cloud"?"outside the model":`<b>${lab(p.b)}</b>`}.</p>`:""}
    if(key.includes(">")){const [a,b]=key.split(">"), full=srcOf[b]&&srcOf[b].every(s=>has(s,b)||past("links"));
      return `<div class="dgih"><b>${lab(a)} → ${lab(b)}</b><span class="dgtype t-link">Connector</span></div><p><b>${lab(a)}</b> is used to work out <b>${lab(b)}</b>.${full&&spec.linkWhy&&spec.linkWhy[b]?" "+spec.linkWhy[b]:""}</p>`}
    const n=nd(key); if(!n) return ""; const lines=[], lk=drawnLinks();
    if(n.t==="stock"&&n.start) lines.push(`Starts at <b>${!n.startBy||exOn(n.startBy)?esc(n.start):"?"}</b>`);
    if(n.t==="stock"){const fin=pipes.filter(p=>p.b===n.id&&laid(p)).map(p=>lab(p.f)), fout=pipes.filter(p=>p.a===n.id&&laid(p)).map(p=>lab(p.f)); if(fin.length) lines.push(`Filled by <b>${fin.join(", ")}</b>`); if(fout.length) lines.push(`Drained by <b>${fout.join(", ")}</b>`)}
    const ins=lk.filter(([,b])=>b===n.id).map(([a])=>lab(a)), outs=lk.filter(([a])=>a===n.id).map(([,b])=>lab(b));
    if(ins.length) lines.push(`Worked out from <b>${ins.join(", ")}</b>`); if(outs.length) lines.push(`Used to work out <b>${outs.join(", ")}</b>`);
    return `<div class="dgih"><b>${esc(n.lab)}</b><span class="dgtype t-${n.t}">${DGK[n.t]}</span></div><p>${esc(n.desc||"")}${n.unit?` <span class="muted">(${esc(n.unit)})</span>`:""}</p>${lines.map(l=>`<p class="dgim">${l}</p>`).join("")}`}
  function showInfo(key){if(DR&&DR.on) return; const h=infoHTML(key); if(!h){hideInfo(); return} info.innerHTML=h; info.dataset.k=key; info.hidden=false;
    const a=anchorRect(key); if(!a){info.hidden=true; return} const W=cv.clientWidth, H=cv.clientHeight, iw=Math.min(300,W-16); info.style.width=iw+"px"; const ih=info.offsetHeight;
    const pr=parts(), obs=(pr?pr.all.concat(BUB&&BUB.k==="q"?pr.key(BUB.at):[]):[]).concat(BUB&&BUB.rect&&!bub.hidden?[Object.assign({k:200},BUB.rect)]:[]), b=spot(a,iw,ih,obs,W,H);
    info.style.left=b.x+"px"; info.style.top=b.y+"px"}
  function hideInfo(){info.hidden=true; info.dataset.k=""}
  const hoverKey=t=>{const x=t&&t.closest&&t.closest("[data-n],[data-l],[data-p],[data-slot],[data-start],#dgclock,[data-hk]"); if(!x||!bench.contains(x)) return null;
    return x.dataset.hk||x.dataset.n||x.dataset.l||(x.dataset.p?"p:"+x.dataset.p:null)||(x.dataset.slot?"slot:"+x.dataset.slot:null)||(x.dataset.start?"start:"+x.dataset.start:null)||(x.id==="dgclock"?"clock":null)};

  /* paint everything */
  function hints(){const ph=phase(), hz=$("#dghz",el), H=spec.hints||{}, list=ph==="place"?H.sort:ph==="pipes"?H.pipes:ph==="links"?H.links:null;
    goalHints(hz,st,!list?null:{k:"dg-"+ph,hints:list})}
  function refresh(){const G=PH.map(k=>({k:"dg-"+k,t:DGTT[k],ok:OK[k]()})); trackGoals(st,G); const all=G.every(g=>g.ok);
    if(all&&!D.done){D.done=true; save()} const nb=$("#nextb",el); if(nb) nb.disabled=!S.teacher&&!all;
    if(all&&!wasDone){wasDone=true; setTimeout(()=>{if(alive()) celebrate($("#dgtask .dgok",el)||$("#dgtask",el),30)},60)}}
  function paint(scroll){$(".dgbody",el).classList.toggle("ph-place",phase()==="place"); $("#dgph",el).innerHTML=phHTML(); $("#dgtask",el).innerHTML=taskHTML(); side.innerHTML=sideHTML(); paintClock(); draw(); hints(); refresh();
    if(BUB) placeBub(scroll); if(!info.hidden&&info.dataset.k) showInfo(info.dataset.k); hydrateIcons(bench)}

  /* questions on the diagram: one at a time, at the part they're about */
  const pq=f=>{const p=pipes.find(x=>x.f===f); return p&&{id:p.f,q:p.q,opts:p.opts,at:p.f}};
  function qBubble(){if(!qNow) return; const P=qNow.kind==="pipe", q=P?pq(qNow.id):why.find(x=>x.id===qNow.id); if(!q) return;
    const store=P?D.pipe:D.q, sel=store[q.id], pk=sel!=null?q.opts[sel]:null, ok=!!(pk&&pk.ok);
    const list=P?pipes.map(p=>p.f):why.map(x=>x.id), more=list.some(id=>id!==q.id&&!(P?pipeOK(pipes.find(p=>p.f===id)):qOK(why.find(x=>x.id===id))));
    const nextL=more?(P?"Next pipe":"Next question"):P?(PH.includes("links")?"Draw connectors":"Next"):"Finish";
    hint({k:"q",qid:q.id,at:q.at||null,html:`<div class="dgbk">${P?"Pipe":"Question "+(why.indexOf(q)+1)+" of "+why.length}</div><p class="dgbq">${q.q}</p>
      <div class="dgbch" role="radiogroup">${q.opts.map((o,j)=>`<button type="button" class="choice ${sel===j?(o.ok?"right":"wrong"):""}" role="radio" aria-checked="${sel===j}" data-bq="${j}" ${ok&&!S.teacher?"disabled":""}><span class="k">${"ABCD"[j]}</span><span>${o.h}</span></button>`).join("")}</div>
      ${pk?`<p class="fb ${ok?"good":"warn"}">${ok?(pk.why||"Right."):(pk.fb||"Not quite. Try another answer.")}</p>`:""}
      ${ok?`<div class="dgbnav"><button type="button" class="btn sm" data-bnext>${nextL} ${ic("arrowR",2.2)}</button></div>`:""}`})}
  function openQ(kind,id){qNow={kind,id}; paint(); qBubble()}
  function openPhase(){const ph=phase(); qNow=null;
    if(ph==="pipes"){const p=pipes.find(x=>!pipeOK(x))||pipes[0]; if(p) return openQ("pipe",p.f)}
    if(ph==="read"){const q=why.find(x=>!qOK(x))||why[0]; if(q) return openQ("read",q.id)}
    setBub(null); paint()}
  function phaseDone(k){if(!alive()) return; const pill=$(`.dgpp[data-ph="${k}"],.dgpp.on`,el); paint(); if(phase()!=="done") celebrate($(`#dgph li:nth-child(${PH.indexOf(k)+1}) .dgpp`,el)||pill,20); openPhase()}
  function answer(j){if(!qNow) return; const P=qNow.kind==="pipe", q=P?pq(qNow.id):why.find(x=>x.id===qNow.id), store=P?D.pipe:D.q; if(!q) return;
    const prior=store[q.id]; if(prior!=null&&q.opts[prior]&&q.opts[prior].ok&&!S.teacher) return;
    bump(); store[q.id]=j; if(!q.opts[j].ok){const ek=(P?"pipe:":"q:")+q.id+":"+j; D.err[ek]=(D.err[ek]||0)+1}
    save(); paint(); qBubble(); if(q.opts[j].ok&&phase()!=="done") celebrate($(".dgbub .choice.right,.dgdock .choice.right",el),14)}
  function nextQ(){const P=qNow&&qNow.kind==="pipe", list=P?pipes.map(p=>p.f):why.map(q=>q.id), ok=id=>P?pipeOK(pipes.find(p=>p.f===id)):qOK(why.find(q=>q.id===id));
    const cur=qNow&&qNow.id, i=list.indexOf(cur), nx=list.slice(i+1).concat(list.slice(0,Math.max(0,i))).find(id=>!ok(id));
    if(nx) return openQ(P?"pipe":"read",nx); qNow=null; setBub(null); phaseDone(P?"pipes":"read")}

  /* placing a card: a shape that matches, the clock, or a starting value */
  function bad(msg,at,key){D.err[key]=(D.err[key]||0)+1; save(); paint(); hint({k:"fb",at,html:`<p>${msg}</p>`});
    const c=$(`.dgtray`,el); if(c&&!still()){c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake")}}
  function good(at,msg,phaseWas){if(phaseWas==="place"&&OK.place()){paint(); hint({k:"ok",at,html:`<p>${msg}</p>`,auto:2600}); setTimeout(()=>{if(phase()!=="place") phaseDone("place")},still()?0:1100); return}
    paint(); hint({k:"ok",at,html:`<p>${msg}</p>`,auto:2600})}
  function dropCard(id,t){picked=null; bump(); const n=nd(id), x=xd(id), ph=phase();
    const S_=t.dataset.slot||t.dataset.n||null, sn=S_?nd(S_):null, T=sn?sn.t:null, startS=t.dataset.start||null, clock=t.dataset.drop==="clock", at=clock?"clock":startS?"start:"+startS:S_;
    if(n){
      if(startS) return bad(`The “starts at” space holds the number a stock starts with. <b>${lab(id)}</b> is a quantity in the model, so it gets a shape of its own.`,at,`place:${id}>start`);
      if(clock) return bad(`<b>${lab(id)}</b> is part of the model, so it gets a shape. The clock is what ticks: ${esc(spec.clock.name)}.`,at,`place:${id}>clock`);
      if(T!==n.t) return bad((spec.sortFb&&spec.sortFb[id]&&spec.sortFb[id][T])||DGFB[n.t][T],at,`place:${id}>${T}`);
      D.pl[id]=1; save(); return good(id,`<b>${lab(id)}</b>: ${(spec.sortWhy&&spec.sortWhy[id])||DGK[n.t]+"."}`,ph)}
    if(!x) return;
    if(x.to==="clock"){if(clock){D.ex[id]=1; save(); return good("clock",x.why||`<b>${lab(id)}</b> is the clock.`,ph)}
      return bad(x.fb||`<b>${lab(id)}</b> is the clock that runs the diagram, so it doesn't get a shape. Drop it on the clock above the diagram.`,at,`ex:${id}>${startS?"start":T||"?"}`)}
    const to=x.to;
    if(clock) return bad(`<b>${lab(id)}</b> doesn't tick: it's where <b>${lab(to)}</b> starts. Drop it in the “starts at” space inside that box.`,at,`ex:${id}>clock`);
    if(startS===to||(t.dataset.n===to)){D.ex[id]=1; save(); return good("start:"+to,x.why||`<b>${lab(to)}</b> starts at ${lab(id)}.`,ph)}
    if(startS||(sn&&sn.t==="stock"&&t.dataset.n)) return bad(`<b>${lab(id)}</b> is where <b>${lab(to)}</b> starts, not <b>${lab(startS||S_)}</b>.`,at,`ex:${id}>${startS||S_}`);
    if(t.dataset.slot&&T==="stock") return bad(`Put a stock in this box first. Then its starting value goes in the “starts at” space inside it.`,at,`ex:${id}>emptybox`);
    return bad(x.fb||`<b>${lab(id)}</b> is a single starting number, not a ${DGK[T].toLowerCase()}. Drop it in the “starts at” space inside the box it starts.`,at,`ex:${id}>${T}`)}

  /* connectors: drag (or tap) from what's used to what it helps work out */
  function genExtra(s,t){return `Is <b>${lab(t)}</b> really worked out from <b>${lab(s)}</b>? Picture <b>${lab(s)}</b> changing while everything else stays the same. Would <b>${lab(t)}</b> change?`}
  function flash(a,b){const fx=$("#dgfx",svg), G=dgGeo(spec,lay,()=>true), s=G.sh[a], t=G.sh[b]; if(!fx||!s||!t) return; clearTimeout(flashT);
    fx.innerHTML=dgLinkSVG(dgCurve(s,t,dgBend(lay,a,b)),"bad flash"); flashT=setTimeout(()=>{const f=$("#dgfx",svg); if(f) f.innerHTML=""},still()?2400:1600)}
  function tryLink(a,b){srcSel=null; if(!b||a===b){paint(); return} bump(); const nb=nd(b), was=OK.links();
    if(has(a,b)){paint(); return hint({k:"ok",at:a+">"+b,html:`<p>That connector is already there.</p>`,auto:2000})}
    if(isLink(a,b)){(D.ln[b]=D.ln[b]||[]).push(a); save(); const left=srcOf[b].filter(s=>!has(s,b)).length;
      const msg=left?`Yes: <b>${lab(a)}</b> is used to work out <b>${lab(b)}</b>. <b>${lab(b)}</b> needs ${left===1?"one more input":left+" more inputs"}.`:(spec.linkWhy&&spec.linkWhy[b])||`<b>${lab(b)}</b> has everything it needs.`;
      paint(); hint({k:"ok",at:a+">"+b,html:`<p>${msg}</p>`,auto:3200}); if(!was&&OK.links()) setTimeout(()=>{if(phase()!=="links") phaseDone("links")},still()?0:1300); return}
    const msg=isLink(b,a)?`Turn it around: <b>${lab(b)}</b> is used to work out <b>${lab(a)}</b>, so the arrow starts at <b>${lab(b)}</b>.`:
      nb&&nb.t==="stock"?`Connectors never point into a box: only pipes change a stock. What does <b>${lab(a)}</b> help work out?`:(spec.linkFb&&spec.linkFb[a+">"+b])||genExtra(a,b);
    D.err["link:"+a+">"+b]=(D.err["link:"+a+">"+b]||0)+1; save(); paint(); hint({k:"fb",at:b,html:`<p>${msg}</p>`}); flash(a,b)}
  function linkTap(k){if(!srcSel){srcSel=k; draw(); hint({k:"tip",at:k,html:`<p>Now tap what <b>${lab(k)}</b> helps work out. Tap <b>${lab(k)}</b> again to cancel.</p>`}); return}
    if(srcSel===k){srcSel=null; setBub(null); draw(); return} tryLink(srcSel,k)}

  /* pointer: drag a card onto the diagram, or drag from shape to shape */
  function hitAt(x,y){const e=document.elementFromPoint(x,y); if(!e||!bench.contains(e)) return null;
    const t=DR.kind==="card"?e.closest("[data-start],[data-slot],[data-n],[data-drop]"):e.closest("[data-n]"); return t&&!(DR.kind==="link"&&t.dataset.n===DR.id)?t:null}
  function follow(){if(DR.kind==="card"){DR.g.style.left=(DR.x-DR.dx)+"px"; DR.g.style.top=(DR.y-DR.dy)+"px"}
    else {const fx=$("#dgfx",svg), s=dgGeo(spec,lay,()=>true).sh[DR.id], p=toSvg(DR.x,DR.y); if(fx&&s) fx.innerHTML=`<line class="dgrub" x1="${f1(s.x)}" y1="${f1(s.y)}" x2="${f1(p.x)}" y2="${f1(p.y)}"/><circle class="dgrubh" cx="${f1(p.x)}" cy="${f1(p.y)}" r="8"/>`}
    const t=hitAt(DR.x,DR.y); if(t!==DR.t){if(DR.t) DR.t.classList.remove("over"); DR.t=t; if(t) t.classList.add("over")}}
  function scrollLoop(){if(!DR||!DR.on) return; const e=56, v=DR.y<e?-(e-DR.y)/3:DR.y>innerHeight-e?(DR.y-innerHeight+e)/3:0; if(v){scrollBy(0,v); follow()} requestAnimationFrame(scrollLoop)}
  function begin(){DR.on=true; hideInfo(); if(BUB&&BUB.k!=="q") setBub(null); picked=null; srcSel=null;
    if(DR.kind==="card"){const r=DR.src.getBoundingClientRect(); DR.dx=DR.x0-r.left; DR.dy=DR.y0-r.top; const g=DR.src.cloneNode(true); g.className="dgcard dgdrag"; g.style.width=r.width+"px"; g.removeAttribute("data-card"); document.body.appendChild(g); DR.g=g; DR.src.classList.add("lifted"); svg.classList.add("dropping"); if(clockB) clockB.classList.add("ready")}
    else {const n=svg.querySelector(`[data-n="${CSS.escape(DR.id)}"]`); if(n) n.classList.add("src")}
    document.body.classList.add("dgdragging"); requestAnimationFrame(scrollLoop)}
  function end(){const D0=DR; DR=null; removeEventListener("pointermove",onMove); removeEventListener("pointerup",onUp); removeEventListener("pointercancel",onCancel); if(!D0) return null;
    if(D0.g) D0.g.remove(); if(D0.src) D0.src.classList.remove("lifted"); if(D0.t) D0.t.classList.remove("over"); document.body.classList.remove("dgdragging");
    svg.classList.remove("dropping"); if(clockB) clockB.classList.remove("ready"); const fx=$("#dgfx",svg); if(fx&&D0.on) fx.innerHTML=""; $$(".src",svg).forEach(x=>x.classList.remove("src")); return D0}
  function onMove(e){if(!DR||e.pointerId!==DR.pid) return; DR.x=e.clientX; DR.y=e.clientY; if(!DR.on){if(Math.hypot(DR.x-DR.x0,DR.y-DR.y0)<7) return; begin()} e.preventDefault(); follow()}
  function onUp(e){if(!DR||e.pointerId!==DR.pid) return; const D0=end(); if(!D0||!D0.on) return; justDragged=true; setTimeout(()=>{justDragged=false},0); rest=[e.clientX,e.clientY];
    if(!D0.t){if(D0.kind==="link") paint(); return} if(D0.kind==="card") dropCard(D0.id,D0.t); else tryLink(D0.id,D0.t.dataset.n)}
  function onCancel(e){if(DR&&e.pointerId===DR.pid){end(); paint()}}
  bench.addEventListener("pointerdown",e=>{if(e.button>0||DR) return; const card=e.target.closest(".dgcard"), node=!card&&phase()==="links"?e.target.closest("[data-n]"):null; if(!card&&!node) return;
    DR={kind:card?"card":"link",id:card?card.dataset.card:node.dataset.n,x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY,on:false,src:card||node,pid:e.pointerId,t:null};
    addEventListener("pointermove",onMove,{passive:false}); addEventListener("pointerup",onUp); addEventListener("pointercancel",onCancel)});

  /* taps, clicks and keys */
  bench.addEventListener("click",e=>{if(justDragged){justDragged=false; return} const t=e.target;
    const bq=t.closest("[data-bq]"); if(bq){answer(+bq.dataset.bq); return}
    if(t.closest("[data-bnext]")){nextQ(); return}
    if(t.closest("[data-bclose]")){setBub(null); draw(); return}
    const pp=t.closest("[data-ph]"); if(pp&&S.teacher){const k=pp.dataset.ph; forced=k===PH.find(x=>!OK[x]())?null:k; srcSel=null; picked=null; openPhase(); return}
    const nq=t.closest("[data-nq]"); if(nq&&!nq.disabled){openQ(nq.dataset.nk,nq.dataset.nq); return}
    const card=t.closest(".dgcard"); if(card){const k=card.dataset.card; picked=picked===k?null:k; setBub(null); paint(); const again=$(`.dgcard[data-card="${CSS.escape(k)}"]`,el); if(again) again.focus({preventScroll:true}); return}
    const zone=t.closest("[data-start],[data-slot],[data-drop]"); if(zone&&picked){dropCard(picked,zone); return}
    const n=t.closest("[data-n]");
    if(n&&picked){dropCard(picked,n); return}
    if(n&&phase()==="links"){linkTap(n.dataset.n); return}
    const k=hoverKey(t); if(k){if(!info.hidden&&info.dataset.k===k) hideInfo(); else showInfo(k)}});
  bench.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches&&e.target.matches("svg [role=button]")){e.preventDefault(); e.target.dispatchEvent(new MouseEvent("click",{bubbles:true}))}
    if(e.key==="Escape"&&(picked||srcSel||BUB||!info.hidden)){e.stopPropagation(); picked=null; srcSel=null; if(BUB&&BUB.k!=="q") setBub(null); hideInfo(); paint()}});
  let rest=null; bench.addEventListener("pointermove",e=>{if(rest&&Math.hypot(e.clientX-rest[0],e.clientY-rest[1])>4) rest=null});
  bench.addEventListener("pointerover",e=>{if(e.pointerType!=="mouse"||(DR&&DR.on)||rest) return; const k=hoverKey(e.target); if(k&&info.dataset.k!==k){showInfo(k); if(e.target.closest("[data-hk]")) draw()}});
  bench.addEventListener("pointerout",e=>{if(e.pointerType!=="mouse") return; const k=hoverKey(e.target); if(k&&hoverKey(e.relatedTarget)!==k){hideInfo(); if(e.target.closest("[data-hk]")) draw()}});
  bench.addEventListener("focusin",e=>{const k=hoverKey(e.target); if(k&&e.target.matches(":focus-visible")) showInfo(k)});
  bench.addEventListener("focusout",e=>{if(hoverKey(e.target)&&!hoverKey(e.relatedTarget)) hideInfo()});
  if(window.ResizeObserver){const ro=new ResizeObserver(()=>{if(!document.body.contains(cv)){ro.disconnect(); return}
    const inDock=BUB&&(narrow()||BUB.k==="q"), want=inDock?dockHost(BUB):null, now=dock.hidden?null:dock.parentNode;
    if(dgLayoutFor(spec,cv.clientWidth||900)!==lay||(BUB&&want!==now)){const b=BUB; if(b) setBub(b); paint()} else if(BUB) placeBub(false)}); ro.observe(cv)}
  $("#back",el).onclick=ctx.back; $("#nextb",el).onclick=ctx.next;
  paint(); openPhase();
}

/* ---------- a teacher's problem: a diagram drawn from the teacher's formulas ---------- */
// Their models work each output out straight from a formula, so the diagram is converters joined by connectors.
function autoDgSpec(p){const model=probModel(p), V=p.vars, by=k=>V.find(v=>v.key===k);
  const outs=V.filter(v=>v.kind==="out"&&!model.errs[v.key]&&String(v.formula||"").trim()), deps={};
  outs.forEach(o=>{let s=[]; try{s=[...formulaVars(parseFormula(o.formula))]}catch(e){} deps[o.key]=[...new Set(s)].filter(k=>k!==o.key&&by(k))});
  const used=new Set(); outs.forEach(o=>{used.add(o.key); deps[o.key].forEach(k=>used.add(k))});
  const vs=V.filter(v=>used.has(v.key)).slice(0,14), has=k=>vs.some(v=>v.key===k);
  const short=s=>{s=String(s||"").trim(); return s.length>24?s.slice(0,23).replace(/\s+\S*$/,"")+"…":s};
  const nodes=vs.map(v=>({id:v.key,t:"conv",lab:v.key,name:short(v.name),unit:v.unit||"",kind:v.kind,
    desc:capFirst(v.name||v.key)+(v.kind==="par"?`: ${showV(v,v.val)}`:v.kind==="in"?". You slide it.":". Your model works it out.")}));
  const links=[]; outs.forEach(o=>deps[o.key].forEach(k=>{if(has(k)&&has(o.key)) links.push({a:k,b:o.key})}));
  // layers: inputs and given numbers first, then each output after everything it uses
  const depth={}, dep=k=>{if(depth[k]!=null) return depth[k]; depth[k]=0; const v=by(k); if(v&&v.kind==="out"&&deps[k]&&deps[k].length) depth[k]=1+Math.max(...deps[k].map(dep)); return depth[k]};
  vs.forEach(v=>dep(v.key));
  const cols=[]; vs.forEach(v=>{const c=depth[v.key]; (cols[c]=cols[c]||[]).push(v.key)}); for(let i=0;i<cols.length;i++) cols[i]=cols[i]||[];
  if(cols[0]) cols[0].sort((a,b)=>(by(a).kind==="in"?0:1)-(by(b).kind==="in"?0:1));
  const parents=k=>links.filter(l=>l.b===k).map(l=>l.a), kids=k=>links.filter(l=>l.a===k).map(l=>l.b);
  const pos=(arr,k)=>{for(const c of cols){const i=c.indexOf(k); if(i>=0) return i/(c.length||1)} return 0};
  for(let pass=0;pass<2;pass++){for(let c=1;c<cols.length;c++){const m=k=>{const ps=parents(k); return ps.length?ps.reduce((a,x)=>a+pos(cols,x),0)/ps.length:.5}; cols[c].sort((a,b)=>m(a)-m(b))}
    if(cols[0]){const m=k=>{const ks=kids(k); return ks.length?ks.reduce((a,x)=>a+pos(cols,x),0)/ks.length:.5}; cols[0].sort((a,b)=>m(a)-m(b))}}
  // wide: columns left to right, first-column labels on the left and last-column labels on the right, so arrows never cross a label
  // tall (phones): rows top to bottom, first-row labels above and last-row labels below
  const split=(arr,max)=>{const out=[]; for(let i=0;i<arr.length;i+=max) out.push(arr.slice(i,i+max)); return out};
  const wcols=[]; cols.forEach((c,ci)=>{if(c.length>5){const a=[],b=[]; c.forEach((k,i)=>(i%2?b:a).push(k)); wcols.push({ks:a,d:ci},{ks:b,d:ci})} else wcols.push({ks:c,d:ci})});
  const lastD=cols.length-1, wlp={}, wpos={}, gapY=c=>c.d===0||c.d===lastD?118:150;
  const colH=wcols.map(c=>c.ks.length*gapY(c)), H=Math.max(...colH,150);
  wcols.forEach((c,ci)=>{const g=gapY(c), top=(H-c.ks.length*g)/2+g/2+28; c.ks.forEach((k,i)=>{wpos[k]=[290+ci*330,top+i*g]; wlp[k]=c.d===0?"l":c.d===lastD?"r":"b"})});
  const wide={vb:[Math.max(700,290+(wcols.length-1)*330+300),H+56],pos:wpos,lp:wlp,bend:{}};
  const trows=[]; cols.forEach((c,ci)=>split(c,ci===0||ci===lastD?4:2).forEach((r,j)=>trows.push({ks:r,d:ci,sub:j})));
  const keyW=k=>String(k).length*17+34, gapX=Math.max(160,...vs.map(v=>keyW(v.key)));
  const mid=r=>r.d>0&&r.d<lastD, gapOf=r=>mid(r)?gapX+100:gapX;
  const TW=Math.max(440,...trows.map(r=>(r.ks.length-1)*gapOf(r)+(mid(r)?300:200))), tpos={}, tlp={};
  let y=80; trows.forEach((r,ri)=>{if(ri) y+=r.sub?150:175; const n=r.ks.length, g=gapOf(r), x0=TW/2-(n-1)*g/2-(mid(r)?50:0)+(r.sub%2?g/2:0);
    r.ks.forEach((k,i)=>{tpos[k]=[Math.min(TW-60,x0+i*g),y]; tlp[k]=r.d===0?"t":r.d===lastD?"b":"r"})});
  const tall={tall:true,vb:[TW,y+90],pos:tpos,lp:tlp,bend:{}};
  links.forEach(l=>{wide.bend[l.a+">"+l.b]=.08; tall.bend[l.a+">"+l.b]=.08});
  // questions that only need the arrows
  const why=[{id:"arrow",at:links[0]?links[0].a+">"+links[0].b:null,q:"In this diagram, what does an arrow from one quantity to another mean?",opts:[
      {h:"The first quantity turns into the second",fb:"Turning one thing into another is what a pipe does, in diagrams with stocks and flows. A thin connector only passes along information."},
      {h:"The second quantity is worked out using the first",ok:true,why:"A connector means “is used to work out”. The set block you build for the second one will use the first."},
      {h:"The first quantity is bigger than the second",fb:"Arrows don't say anything about size. They show what depends on what."}]}];
  const lbl=k=>esc(k), list=a=>a.map(k=>`<b>${lbl(k)}</b>`).join(", ");
  const down=k=>{const seen=new Set(), st=[k]; while(st.length){const x=st.pop(); kids(x).forEach(y=>{if(!seen.has(y)){seen.add(y); st.push(y)}})} return vs.map(v=>v.key).filter(y=>seen.has(y))};
  const inn=vs.find(v=>v.kind==="in"&&down(v.key).length)||vs.find(v=>v.kind==="par"&&down(v.key).length);
  if(inn){const all=down(inn.key), direct=kids(inn.key).filter(k=>all.includes(k)), outsAll=vs.filter(v=>v.kind==="out").map(v=>v.key), opts=[{h:list(all),ok:true,why:`Follow the arrows out of <b>${lbl(inn.key)}</b>, and keep following them: everything they reach changes.`}];
    if(direct.length&&direct.length<all.length) opts.push({h:list(direct),fb:`Those change first. But anything worked out from them changes too: keep following the arrows.`});
    if(outsAll.length>all.length) opts.push({h:list(outsAll),fb:`Not every output uses <b>${lbl(inn.key)}</b>. Follow only the arrows that start at it.`});
    if(opts.length<3&&all.length>=2) opts.push({h:list([all[0]]),fb:`<b>${lbl(all[1])}</b> uses <b>${lbl(inn.key)}</b> too. Follow every arrow that starts at it.`});
    opts.push({h:`Only <b>${lbl(inn.key)}</b> itself`,fb:`<b>${lbl(inn.key)}</b> is used to work out other quantities. Follow its arrows.`});
    const R=mulberry32(String(p.id||p.title||"x").split("").reduce((a,c)=>a*31+c.charCodeAt(0)>>>0,11)); for(let i=opts.length-1;i>0;i--){const j=Math.floor(R()*(i+1)); [opts[i],opts[j]]=[opts[j],opts[i]]}
    why.push({id:"change",at:inn.key,q:`If you change <b>${lbl(inn.key)}</b>, which quantities change with it?`,opts:opts.slice(0,4)})}
  const tgt=outs.filter(o=>has(o.key)&&deps[o.key].length).map(o=>o.key);
  const steps=[]; tgt.forEach(t=>deps[t].filter(has).forEach(k=>steps.push(`Drag from <b>${lbl(k)}</b> to <b>${lbl(t)}</b>.`))); if(steps.length>8) steps.splice(8);
  return {custom:true,sort:false,pipes:[],nodes,links,L:{wide,tall},why,note:p.steps&&p.steps.diagram,
    intro:"Before you code, draw your model as a diagram. Each circle is a quantity in the problem. This model works each output straight out of a formula, so its diagram is converters joined by connectors. (Models where something builds up or drains over time also use stocks and flows.)",
    linksLead:"Drag from a quantity to the output it helps work out, and a blue connector appears. Inputs you slide and the problem's given numbers aren't worked out from anything, so no arrow points into them.",
    linkWhy:Object.fromEntries(tgt.map(t=>[t,`${esc(t)} uses ${deps[t].filter(has).map(esc).join(", ")}.`])),
    hints:{links:["For each output, look back at the problem: which numbers would you need to work it out? Each one is an arrow into it.","Work one output out by hand with the problem's numbers. Every quantity you used is a connector into it. An output can also use another output.",hsteps(...steps)]},
    toCode:"Each circle with arrows pointing into it becomes a <b>set</b> block in Build, and the arrows tell you which variables go into it: "+tgt.map(t=>`<b>${esc(t)}</b> uses ${deps[t].filter(has).map(esc).join(", ")}`).join("; ")+"."}}
