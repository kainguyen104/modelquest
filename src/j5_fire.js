/* ================= Mission 3 · Wildfire Watch (Build step uses the Simulation Lab reference) ================= */
(()=>{
const E=0,T=1,B=2;
const COL={e:"#DDEFFC",t:"#63C780",tk:"#3A9A57",b:"#FF8A5B",bc:"#FDE14D",ash:"#CDBCA8"};
const key=c=>`<span class="cellkey" style="background:${c}"></span>`;
// three short marks on each side of the equation badge, centred on it and pointing away from it
const EMIT=side=>{const L=side==="l", seg=(x1,y1,x2,y2)=>`<path d="M${L?x1:48-x1} ${y1}L${L?x2:48-x2} ${y2}"/>`;
  return `<span class="eqfx ${side}" aria-hidden="true"><svg viewBox="0 0 48 72" fill="none" stroke="#FDE14D" stroke-width="6.5" stroke-linecap="round">${seg(40,24,22,10)}${seg(38,36,12,36)}${seg(40,48,22,62)}</svg></span>`};
function VARS(st){const V={};
  V.p_immune={kind:"in",label:"p_immune",name:"chance a tree resists catching fire for one step",unit:"",show:x=>fmt(x,2)};
  V.p_lightning={kind:"in",label:"p_lightning",name:"chance lightning hits a tree in one step",unit:"",show:x=>fmt(x,4)};
  (st.d.mine||[]).forEach(k=>V[k]={kind:"mine",label:k,name:"a variable you made. It starts at 0 every step",unit:""});
  return V}

/* the student's rule runs once for every square, every step */
function ruleEngine(V,prog){
  const comp=compileProgram(prog,V,v=>V[v]?V[v].label||v:v), mine=Object.keys(V).filter(k=>V[k].kind==="mine");
  const env=(P,rng)=>({v:{},sq:{s:0,nb:0,next:0},rng,errs:Object.assign({},comp.errs),set:new Set(),out:[],plots:[]});
  const reset=(e,P)=>{e.v.p_immune=P.pI; e.v.p_lightning=P.pL; for(const k of mine) e.v[k]=0};
  const one=(e,s,nb)=>{const q=e.sq; q.s=s; q.nb=nb; q.next=s; comp.body(e); const o=q.next; return o===E||o===T||o===B?o:s};
  return {comp,mine,env,reset,one};
}
function makeSim(w,h,pTree,seed){const rng=seed==null?Math.random:mulberry32(seed); const N=w*h,g=new Uint8Array(N),ever=new Uint8Array(N); let t0=0;
  for(let i=0;i<N;i++){if(rng()<pTree){g[i]=T;t0++}} return {w,h,g,ever,rng,step:0,trees0:t0,burning:0,caught:0,changed:0}}
function ignite(s,where){const {w,h}=s; let best=-1;
  if(where==="center"){let bd=1e9; const cx=(w-1)/2,cy=(h-1)/2; for(let i=0;i<w*h;i++)if(s.g[i]===T){const r=(i/w|0)-cy,c=i%w-cx,d=r*r+c*c; if(d<bd){bd=d;best=i}}}
  else{const tr=[]; for(let i=0;i<w*h;i++)if(s.g[i]===T)tr.push(i); if(tr.length)best=tr[Math.floor(s.rng()*tr.length)]}
  if(best>=0){s.g[best]=B; s.ever[best]=1; s.burning=1} return best}
// one step of the student's rule; edges wrap around, as the Define step assumes
function stepSim(s,R,e,P,mode){
  const {w,h}=s,N=w*h,src=s.g,fresh=mode!=="inplace",dst=fresh?new Uint8Array(src):src,rd=fresh?src:dst;
  R.reset(e,P); let burning=0,caught=0,changed=0;
  for(let i=0;i<N;i++){const st=rd[i],r=(i/w)|0,c=i-r*w; let k=0;
    if((r>0?rd[i-w]:rd[i+N-w])===B) k++;
    if((r<h-1?rd[i+w]:rd[i-N+w])===B) k++;
    if((c>0?rd[i-1]:rd[i+w-1])===B) k++;
    if((c<w-1?rd[i+1]:rd[i-w+1])===B) k++;
    const o=R.one(e,st,k); if(o!==st) changed++; if(st===T&&o===B) caught++;
    dst[i]=o; if(o===B){burning++; s.ever[i]=1}}
  s.g=dst; s.step++; s.burning=burning; s.caught=caught; s.changed=changed; return burning}
// the textbook alternative: each burning neighbour gets its own try (used only in the optional challenge)
function refStep(s,P){const {w,h}=s,N=w*h,src=s.g,dst=new Uint8Array(src); let burning=0;
  for(let i=0;i<N;i++){const st=src[i]; let o=st;
    if(st===B) o=E;
    else if(st===T){const r=(i/w)|0,c=i-r*w; let k=0;
      if((r>0?src[i-w]:src[i+N-w])===B) k++; if((r<h-1?src[i+w]:src[i-N+w])===B) k++; if((c>0?src[i-1]:src[i+w-1])===B) k++; if((c<w-1?src[i+1]:src[i-w+1])===B) k++;
      const p=k?1-Math.pow(P.pI,k):P.pL*(1-P.pI); o=p>0&&s.rng()<p?B:T}
    dst[i]=o; if(o===B){burning++; s.ever[i]=1}}
  s.g=dst; s.step++; s.burning=burning; return burning}
function count(s,k){let c=0; const a=k==="burned"?s.ever:s.g, want=k==="tree"?T:k==="burning"?B:1; for(let i=0;i<a.length;i++)if(a[i]===want)c++; return c}
function trial(R,mode,P,n,seed,ref){const s=makeSim(n,n,P.pTree,seed); if(ignite(s,"random")<0) return 0; const e=ref?null:R.env(P,s.rng); let g=0;
  while(s.burning>0&&g++<1500){if(ref) refStep(s,P); else stepSim(s,R,e,P,mode)} return s.trees0?count(s,"burned")/s.trees0*100:0}
function probe(R,s,nb,P,n,seed){const e=R.env(P,mulberry32(seed)); R.reset(e,P); const f=[0,0,0]; for(let i=0;i<n;i++) f[R.one(e,s,nb)]++; return {f:f.map(x=>x/n),errs:e.errs}}
const median=a=>{const b=[...a].sort((x,y)=>x-y),m=b.length>>1; return b.length%2?b[m]:(b[m-1]+b[m])/2};
const sd=a=>{const m=a.reduce((x,y)=>x+y,0)/a.length; return Math.sqrt(a.reduce((x,y)=>x+(y-m)*(y-m),0)/a.length)};
const BINS=[[0,5,"0–5%"],[5,25,"5–25%"],[25,50,"25–50%"],[50,75,"50–75%"],[75,95,"75–95%"],[95,100.01,"95–100%"]];
function runBatch(n,job,each,done){let k=0,dead=false; const tick=()=>{if(dead)return; const t0=performance.now(); while(k<n&&performance.now()-t0<28){each(k,job(k));k++} if(k<n)setTimeout(tick,0); else done()}; tick(); const stop=()=>{dead=true}; TIMERS.add(stop); return stop}
const tipping=sw=>{for(let i=1;i<sw.length;i++){const [d0,y0]=sw[i-1],[d1,y1]=sw[i]; if(y0<50&&y1>=50) return d0+(50-y0)/(y1-y0)*(d1-d0)} return NaN};

/* goals for the rule, judged by running it on squares where the answer is known */
function checks(st,R){const d=st.d, G=[], errs={};
  const P=(pI,pL)=>({pI,pL}), pr=(s,nb,p,n,seed)=>{const r=probe(R,s,nb,p,n,seed); Object.assign(errs,r.errs); return r.f};
  const red=()=>Object.keys(errs).length>0, pc=x=>fmt(x*100)+"%";
  const b=[pr(B,0,P(.3,0),60,11),pr(B,2,P(0,1),60,12),pr(B,4,P(1,.5),60,13)];
  const burn={ok:b.every(f=>f[E]===1)};
  if(!burn.ok) burn.fb=red()?redFix(errs):b.some(f=>f[B]>0)?"A burning square is still burning after a step. What should a fire leave behind?":"A burning square turned back into a tree. A fire should leave empty ground.";
  G.push({k:"burn",t:"A burning square <b>burns out</b>: next step it's empty",...burn,hints:[
    "Picture one square that is on fire right now. After one step, the fire has used up the tree. What should that square be then: a tree, burning, or empty?",
    "Your rule runs once for every square, every step. So first ask about the square: <i>is it burning?</i> If it is, it becomes <b>empty</b> for the next step.",
    hsteps("From <b>Logic</b>, drag an <b>if</b> block under the top block.","From <b>Logic</b>, drop an <b>=</b> block into its pointy slot.","From <b>Forest</b>, put <b>state of this square</b> in the left slot of the =, and a state name block in the right slot. Choose <b>burning</b> in its menu.","From <b>Forest</b>, put a <b>become</b> block inside the if and choose <b>empty</b>. It should read: if state of this square = burning then become empty.")]});
  const s7=pr(T,1,P(.3,0),3000,21), s0=pr(T,1,P(0,0),200,22), s1=pr(T,1,P(1,0),200,23), s4=pr(T,4,P(.3,0),1000,24), en=pr(E,3,P(0,0),100,25), r7=s7[B];
  const spread={ok:false};
  if(s7[E]>0||s4[E]>0) spread.fb="A tree turned into empty ground without burning. Trees should only catch fire or stay trees.";
  else if(en[B]>0) spread.fb="An empty square next to the fire caught fire. Only trees burn: check that the square is a tree first.";
  else if(Math.abs(r7-.7)<=.04&&s0[B]===1&&s1[B]===0&&s4[B]>=.65) spread.ok=true;
  else if(red()) spread.fb=redFix(errs);
  else if(r7===0) spread.fb="Trees next to a fire never catch yet. Use <b>burning neighbours</b> to spot a fire nearby.";
  else if(r7===1) spread.fb="Trees next to a fire always catch. Use <b>random 0 to 1</b> so they catch only some of the time.";
  else if(Math.abs(r7-.3)<=.04) spread.fb="With p_immune = 0.3, your trees next to a fire catch about 30% of the time. That's the chance they <i>resist</i>. Catching is the opposite.";
  else if(Math.abs(r7-.7)<=.04) spread.fb=s0[B]<1?"With p_immune = 0, every tree next to a fire should catch. Use the p_immune variable, not a typed number.":s1[B]>0?"With p_immune = 1, no tree should catch. Use the p_immune variable, not a typed number.":"A tree with four burning neighbours should catch at least as often as a tree with one.";
  else spread.fb=`With p_immune = 0.3, your trees next to a fire catch ${pc(r7)} of the time. They should catch 70% of the time.`;
  G.push({k:"spread",t:"A tree <b>next to a fire</b> catches with chance <b>1 − p_immune</b>",...spread,hints:[
    "With p_immune = 0.3, a tree next to a fire catches 70% of the time. How could a computer do something 70% of the time? Think of picking a random number between 0 and 1.",
    "<b>random 0 to 1</b> is less than 0.7 about 70% of the time. Since 0.7 = 1 − p_immune, test <b>random 0 to 1 &lt; 1 − p_immune</b>. Drag in the p_immune block (don't type 0.3), so the slider still changes your rule.",
    hsteps("Add another <b>if</b> block: if <b>state of this square = tree</b>.","Inside it, add an <b>if … else</b> block from Logic. In its pointy slot, put a <b>&gt;</b> block with <b>burning neighbours</b> (from Forest) on the left and <b>0</b> typed on the right.","In the top part of the if … else, add an <b>if</b> block with a <b>&lt;</b> block: <b>random 0 to 1</b> (from Forest) on the left.","For the right slot of the &lt;, drop a <b>−</b> block from Math, type <b>1</b> on its left and drag <b>p_immune</b> from Variables to its right.","Inside that if, put <b>become burning</b>.","Check: the badge above your code should say P(spread) ≈ 0.70.")]});
  const l=pr(T,0,P(.3,.5),3000,31), l0=pr(T,0,P(.3,0),300,32), l1=pr(T,0,P(1,1),200,33), lf=pr(T,0,P(0,1),200,34), le=pr(E,0,P(0,1),100,35), rl=l[B];
  const light={ok:false};
  if(l[E]>0) light.fb="A tree turned into empty ground without burning. Trees should only catch fire or stay trees.";
  else if(le[B]>0) light.fb="An empty square caught fire. Only trees burn: check that the square is a tree first.";
  else if(Math.abs(rl-.35)<=.035&&l0[B]===0&&l1[B]===0&&lf[B]===1) light.ok=true;
  else if(red()) light.fb=redFix(errs);
  else if(rl===0) light.fb="Trees with no fire nearby never catch yet. Lightning can start new fires.";
  else if(Math.abs(rl-.5)<=.035) light.fb="With p_lightning = 0.5, your lone trees catch about 50% of the time. Lightning has to hit <i>and</i> the tree has to fail to resist.";
  else if(Math.abs(rl-.15)<=.035) light.fb="Your lone trees catch when lightning hits and they <i>resist</i>. They should catch when it hits and they don't.";
  else if(Math.abs(rl-.35)<=.035) light.fb=l0[B]>0?"With p_lightning = 0, no lone tree should catch. Use the p_lightning variable, not a typed number.":"Use the p_lightning and p_immune variables, not typed numbers, so the sliders change your rule.";
  else light.fb=`With p_lightning = 0.5 and p_immune = 0.3, your lone trees catch ${pc(rl)} of the time. They should catch 35% of the time.`;
  G.push({k:"light",t:"A tree with <b>no fire nearby</b> catches only if lightning hits <b>and</b> it doesn't resist",...light,hints:[
    "A tree with no burning neighbours catches only when two things both happen: lightning hits it, <i>and</i> it fails to resist. You worked out this chance in Define: 0.001 × 0.7 = 0.0007.",
    "When two independent things must both happen, multiply their chances: <b>p_lightning × (1 − p_immune)</b>. Use it like the spread rule: random 0 to 1 &lt; that chance.",
    hsteps("Use the <b>else</b> part of your burning neighbours &gt; 0 block. It runs when no neighbour is burning.","Add an <b>if</b> block there, with a <b>&lt;</b> block: <b>random 0 to 1</b> on the left.","For the right slot, drop a <b>×</b> block from Math. Drag <b>p_lightning</b> into its left slot, and build <b>1 − p_immune</b> in its right slot with a − block.","Inside that if, put <b>become burning</b>.","Check: drag the p_lightning slider up a little and press Step. New fires should pop up far from the first one.")]});
  if(d.tasks&&d.tasks.count){const cnt={ok:false};
    if(!R.mine.length) cnt.fb="Make a variable in <b>Variables</b> first, for example caught.";
    else{const s=makeSim(30,30,.85,99); ignite(s,"center"); const p=P(.3,.002), e=R.env(p,s.rng), tally=R.mine.map(()=>[]), truth=[];
      for(let k=0;k<6;k++){stepSim(s,R,e,p,"next"); truth.push(s.caught); R.mine.forEach((m,j)=>tally[j].push(e.v[m]))}
      Object.assign(errs,e.errs);
      const j=R.mine.findIndex((m,j)=>tally[j].every((x,i)=>near(x,truth[i],1e-9)));
      if(j>=0&&truth.some(x=>x>0)) cnt.ok=true;
      else if(tally.every(a=>a.every(x=>x===0))) cnt.fb=`Your variable${R.mine.length>1?"s stay":" stays"} at 0. Add 1 to it whenever a tree <b>becomes burning</b>.`;
      else{const jj=Math.max(0,tally.findIndex(a=>a.some(x=>x!==0))), i=Math.max(0,tally[jj].findIndex((x,i)=>!near(x,truth[i],1e-9)));
        cnt.fb=`In a test step, ${truth[i]} tree${truth[i]===1?"":"s"} caught fire, but your ${esc(R.mine[jj])} = ${sayText(tally[jj][i])}.`}}
    G.push({k:"count",t:"Count how many trees <b>catch fire</b> in each step, in a variable you make",tag:"new task",isNew:true,...cnt,hints:[
      "Every time your rule sets a tree on fire, that's one more tree caught this step. Where in your rule does that happen? Look for your become burning blocks.",
      "Make a variable such as <b>caught</b>. It goes back to 0 at the start of every step, so you only need to add 1 each time a tree becomes burning.",
      hsteps("In <b>Variables</b>, type <b>caught</b> in the “new variable” box and press <b>Make</b>.","Find each <b>become burning</b> block in your rule. There are two: one for spreading and one for lightning.","Right under each one, add <b>change caught by 1</b> from Variables (choose caught in its menu).","Check: press Step. The lab shows caught after each step.")]})}
  const ruleOK=burn.ok&&spread.ok&&light.ok, run={ok:d.mode==="next"&&!!d.ranOut&&ruleOK};
  if(!run.ok) run.fb=!d.mode?"Choose where each step writes, in the top block.":d.mode==="inplace"?"With “the same forest”, a fire can race across in a single step. Every square should read the same snapshot.":ruleOK?"Press <b>Run</b> with p_lightning at 0 and let a fire burn out.":"";
  G.push({k:"run",t:"Write each step to <b>a fresh copy</b>, then <b>Run</b> a fire until it burns out",...run,hints:[
    "Press Step once with one burning tree. How many trees caught fire? In one step, can a fire really jump more than one square?",
    "If squares change one by one in the same forest, squares checked later see neighbours that already caught fire during this step, so the fire races across. Every square should read the same snapshot of the forest.",
    hsteps("In the top block (each step, every square writes to …), choose <b>a fresh copy</b>.","Make sure the <b>p_lightning</b> slider is at 0.","Press <b>Run</b> and wait. The bear says “Burned out!” when the fire is over.")]});
  return {G,errs,ruleOK};
}

/* coloured icons in the mockup's style */
const SIC={
  tree:`<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 9 18h6L7 30h26l-8-12h6z" fill="#7DDB94" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><path d="M20 30v7" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/></svg>`,
  shield:`<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4 7 9v10c0 8 5.6 13.6 13 16.6 7.4-3 13-8.6 13-16.6V9z" fill="#CDB6FB" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><path d="M14 20l4.2 4.2L26.5 16" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  bolt:`<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M23 3 8 22h10l-2 15 16-21H22z" fill="#FDE14D" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/></svg>`,
  play:`<svg class="ico" viewBox="0 0 40 40" aria-hidden="true"><path d="M11 6.5v27L33 20z" fill="#52D67C" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></svg>`
};
const CHIP_FIRE=`<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4c1.6 7.6 11.4 10.8 11.4 21a11.4 11.4 0 0 1-22.8 0c0-5.2 2.6-8 4.2-11.2 1.6 2.4 3.2 4.4 3.2 7.2C22.6 17 24.4 10.6 24 4z" fill="#FF8A5B" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/><path d="M24 27c1.9 3 4.6 4 4.6 7.6a4.6 4.6 0 0 1-9.2 0c0-2.4 1.4-3.6 2.4-5.2" fill="#FDE14D" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/></svg>`;
const ASM=[{k:"sync",t:"Every square changes at the same moment",ok:true,sug:true},
  {k:"once",t:"A burning tree burns out after one step",ok:true},
  {k:"wrap",t:"The forest wraps around: the left edge touches the right",ok:true},
  {k:"still",t:"No wind or slope: fire spreads the same way in every direction",ok:true},
  {k:"more",t:"A tree with four burning neighbours is likelier to catch than a tree with one",ok:false,why:"Not in this model: one burning neighbour or four gives the same 0.7. Hold on to that doubt; you can test it later."}];

/* ---- Equation step: the rule's two probabilities as equations, why, then what they mean over many steps ---- */
const EQ={
  intro:"Your rule decides, square by square, whether a tree catches fire. Behind it are two probabilities. Write them as equations, make sense of them, then use them to answer a question about lightning.",
  SY:{p_immune:{b:"p",s:"immune",name:"Chance a tree resists catching fire for one step",unit:"",role:"par",val:0.3,show:"0.3",range:[0.02,0.98]},
    p_lightning:{b:"p",s:"lightning",name:"Chance lightning hits a tree in one step",unit:"",role:"par",val:0.001,show:"0.001",range:[0.0005,0.05]},
    P_near:{b:"P",s:"near",name:"Chance a tree next to a fire catches in one step",unit:"",role:"out"},
    P_lone:{b:"P",s:"lone",name:"Chance a tree with no fire nearby catches in one step",unit:"",role:"out"}},
  syms:["p_immune","p_lightning","P_near","P_lone"],
  tiles:["P_near","P_lone","p_immune","p_lightning","1","=","+","-","*","/","(",")"],
  buildLead:"Your rule has no set blocks for these chances, but it uses them: look at the conditions in your if blocks. Tap the tiles to build each equation: the symbol for the chance, then =, then how it's worked out.",
  eqs:[
    {out:"P_near",f:"1 - p_immune",
      mistakes:[{f:"p_immune",fb:"That's the chance it resists. Catching is the other outcome, and the two chances add up to 1."},
        {f:"1 + p_immune",fb:"A probability can't be more than 1. Catching and resisting add up to 1, so catching is 1 minus resisting."},
        {f:"p_immune - 1",fb:"That's below 0, and a probability can't be negative. Which way round does the subtraction go?"}],
      hints:["Start with {{P_near}} and =. In one step, a tree next to a fire can do only two things: catch, or resist.","The chances of those two outcomes add up to 1, and {{p_immune}} is the chance it resists."]},
    {out:"P_lone",f:"p_lightning*(1 - p_immune)",
      mistakes:[{f:"p_lightning",fb:"That's the chance lightning hits. The tree also has to fail to resist."},
        {f:"p_lightning*p_immune",fb:"That's lightning hitting and the tree resisting, so it doesn't catch. Use the chance it does not resist."},
        {f:"p_lightning + 1 - p_immune",fb:"Adding is for “one or the other”. Here both have to happen: lightning hits and the tree fails to resist. Multiply."},
        {f:"p_lightning*1 - p_immune",fb:"Check the brackets: all of {{(1 - p_immune)}} is multiplied by {{p_lightning}}."},
        {f:"1 - p_lightning*p_immune",fb:"Build it from the two things that must both happen: lightning hits ({{p_lightning}}), and the tree doesn't resist ({{1 - p_immune}})."}],
      hints:["Start with {{P_lone}} and =. Two things must both happen for a lone tree to catch. What are they?","Lightning hits, with chance {{p_lightning}}, and the tree fails to resist, with chance {{1 - p_immune}}. When two independent things must both happen, multiply their chances."]}],
  why:[
    {id:"comp",q:"Why is {{P_near = 1 - p_immune}}?",opts:[
      {h:"Because fire makes trees weaker",fb:"The equation isn't about weakness. It only uses the two possible outcomes: catch or resist."},
      {h:"A tree next to a fire either catches or resists, so the two chances add up to 1",ok:true,why:"That's the complement rule: {{P_near = 1 - 0.3 = 0.7}}."},
      {h:"Because {{p_immune}} is always small",fb:"It works for any {{p_immune}}: at 0.9, a tree next to a fire catches with chance 0.1."}]},
    {id:"mult",q:"Why multiply {{p_lightning}} by {{(1 - p_immune)}}?",opts:[
      {h:"Both must happen, lightning hits and the tree doesn't resist, and the two are independent",ok:true,why:"For independent events, P(A and B) = P(A) × P(B): {{0.001*0.7 = 0.0007}}."},
      {h:"Either one can start a fire",fb:"“Either one” would mean adding. Here lightning has to hit and the tree has to fail to resist."},
      {h:"To make the number smaller",fb:"It does come out smaller, but that's the result, not the reason. Both things have to happen."}]},
    {id:"four",q:"In your rule, a tree with 4 burning neighbours catches with chance…",opts:[
      {h:"{{4*(1 - p_immune)}}",fb:"With {{p_immune = 0.3}} that's 2.8, and a probability can't be more than 1."},
      {h:"{{(1 - p_immune)^4}}",fb:"That would be the chance it catches from all four, one after another. Your rule checks once: is any neighbour burning?"},
      {h:"{{1 - p_immune}}, the same as with 1 burning neighbour",ok:true,why:"Your rule only asks whether any neighbour is burning. That's an assumption of the model. In Test you can compare it with a rule where each neighbour gets its own try."}]}],
  solve:{title:"how likely is a lone tree to get through 1,000 steps?",intro:"Lightning is rare in any one step, but the forest runs for many steps. Use your equation to find the chance a lone tree is still unburned after 1,000 steps.",
    start:"P_lone = p_lightning*(1 - p_immune)",startNote:"your equation",
    steps:[
      {q:"Put in the numbers: {{p_lightning = 0.001}} and {{p_immune = 0.3}}.",opts:[
        {h:"{{P_lone = 0.001*0.3 = 0.0003}}",fb:"0.3 is the chance it resists. Use {{1 - 0.3}}."},
        {h:"{{P_lone = 0.001*(1 - 0.3) = 0.0007}}",ok:true,to:"P_lone = 0.001*(1 - 0.3) = 0.0007",note:"numbers in"},
        {h:"{{P_lone = 0.001 + 0.7 = 0.701}}",fb:"Both must happen, so multiply."}]},
      {q:"In one step, what's the chance a lone tree does <b>not</b> catch fire?",opts:[
        {h:"{{0.0007}}",fb:"That's the chance it does catch."},
        {h:"{{1 - 0.001 = 0.999}}",fb:"That's the chance lightning misses. Even when lightning hits, the tree can still resist."},
        {h:"{{1 - 0.0007 = 0.9993}}",ok:true,to:"1 - 0.0007 = 0.9993",note:"complement rule"}]},
      {q:"What's the chance it gets through 1,000 steps in a row without catching?",opts:[
        {h:"{{0.9993^1000}}",ok:true,to:"0.9993^1000",note:"independent steps multiply"},
        {h:"{{1000*0.9993}}",fb:"That's 999.3, and a probability can't be more than 1. Getting through every step means multiplying the chances."},
        {h:"{{0.9993/1000}}",fb:"It has to get through step 1, and step 2, and step 3…: multiply 0.9993 by itself 1,000 times."}]}],
    final:{q:"Work it out with a calculator:",inputs:[{pre:"{{0.9993^1000}} ≈",ans:0.4965,tol:.006,post:""}],
      ok:"About 0.50: a coin flip.",fb:"Not yet. On a calculator, type 0.9993, then the power key (^ or xʸ), then 1000."},
    interp:{id:"interp",q:"What does that mean for the forest?",opts:[
      {h:"Lightning almost never starts fires",fb:"In one step it's rare, but over 1,000 steps the chance of escaping it drops to about a half."},
      {h:"About half of the lone trees catch a lightning fire within 1,000 steps",ok:true,why:"A tiny chance in each step adds up over many steps. That's why the district plans for fires instead of hoping lightning misses."},
      {h:"Every lone tree catches fire within 1,000 steps",fb:"About half are still unburned after 1,000 steps."}]}}};
/* ---- Diagram step: the forest as three stocks joined by two pipes, like the book's SIR epidemic model ---- */
const DG={
  intro:"Before you code the rule, draw the whole forest the way modelers do: as a <b>stock-and-flow diagram</b>. Count the squares in each state, and ask what moves squares from one state to the next. It looks a lot like the diagram scientists draw for an epidemic: healthy, sick, recovered.",
  clock:{k:"step",name:"one step of the fire"},
  nodes:[
    {id:"trees",t:"stock",lab:"trees",name:"unburned trees",desc:"Number of trees that haven't caught fire yet",unit:"trees",start:"all the trees"},
    {id:"catch_fire",t:"flow",lab:"catch_fire",name:"catching per step",desc:"Trees that catch fire in one step",unit:"trees per step"},
    {id:"burning",t:"stock",lab:"burning",name:"squares on fire",desc:"Number of squares on fire right now",unit:"squares",start:"1 (the strike)"},
    {id:"burn_out",t:"flow",lab:"burn_out",name:"fires out per step",desc:"Burning squares that burn out in one step",unit:"squares per step"},
    {id:"burned",t:"stock",lab:"burned",name:"burned out",desc:"Number of squares that have burned and are now empty",unit:"squares",start:"0"},
    {id:"P_near",t:"conv",lab:"P_near",name:"chance near a fire",desc:"Chance a tree next to a fire catches in one step: 1 − p_immune = 0.7",unit:""},
    {id:"P_lone",t:"conv",lab:"P_lone",name:"chance, no fire near",desc:"Chance a tree with no fire nearby catches in one step: 0.0007",unit:""},
    {id:"p_immune",t:"conv",lab:"p_immune",name:"chance a tree resists",desc:"Chance a tree next to a fire resists it for one step: 0.3",unit:""},
    {id:"p_lightning",t:"conv",lab:"p_lightning",name:"chance lightning hits",desc:"Chance lightning hits a tree in one step: 0.001",unit:""}],
  sortFb:{
    trees:{flow:"trees is a count, not a rate per step. It's how many unburned trees there are right now.",conv:"trees carries over from one step to the next and drains as trees catch fire. That's a stock."},
    burning:{flow:"burning counts the squares on fire right now. That's an amount, so it's a stock, even though it changes fast.",conv:"burning fills as trees catch and drains as fires burn out. Something that fills and drains is a stock."},
    burned:{flow:"burned is how many squares have burned so far: an amount that only grows. That's a stock.",conv:"burned carries over and keeps growing as fires burn out. That's a stock."},
    catch_fire:{stock:"Look at the unit: trees per step is a rate. catch_fire moves trees into burning, so it's a flow.",conv:"catch_fire is worked out from other quantities, but it's also what moves trees into burning. A rate that moves squares between stocks is a flow."},
    burn_out:{stock:"squares per step is a rate: burn_out moves squares from burning to burned. That's a flow.",conv:"burn_out is what moves squares from burning to burned each step. A rate that moves squares between stocks is a flow."},
    P_near:{stock:"A chance doesn't build up: it's worked out fresh from p_immune. That's a converter.",flow:"A chance isn't squares moving anywhere. It's used to work out catch_fire, so it's a converter."},
    P_lone:{stock:"A chance doesn't build up: it's worked out fresh from the other chances. That's a converter.",flow:"A chance isn't squares moving anywhere. It's used to work out catch_fire, so it's a converter."},
    p_immune:{stock:"A given chance stays the same every step. That's a converter.",flow:"It's a probability from the brief, not a rate that moves squares. That's a converter."},
    p_lightning:{stock:"A given chance stays the same every step. That's a converter.",flow:"It's a probability from the brief, not a rate that moves squares. That's a converter."}},
  extras:[{id:"step",lab:"step",desc:"One step of the fire: every square updates once",unit:"",to:"clock",why:"The <b>step</b> is the clock. In each step, every pipe moves its squares at once.",fb:"The <b>step</b> is what ticks in this model, so it isn't a shape. Drop it on the clock above the diagram."}],
  sortWhy:{trees:"Stock: it drains as trees catch fire.",burning:"Stock: it fills and drains.",burned:"Stock: it only fills.",catch_fire:"Flow: trees per step.",burn_out:"Flow: squares per step.",P_near:"Converter: worked out from p_immune.",P_lone:"Converter: worked out from the brief's chances.",p_immune:"Converter: a chance from the brief.",p_lightning:"Converter: a chance from the brief."},
  notDrawn:"The clock is the <b>step</b>: in each step, every pipe moves its squares at once. Squares that were empty from the start aren't in any box, because they never change.",
  pipes:[{f:"catch_fire",a:"trees",b:"burning",q:"Where does <b>catch_fire</b> move squares from, and where to?",opts:[
      {h:"From burning into trees",fb:"Fire doesn't turn back into trees. catch_fire takes trees and sets them on fire."},
      {h:"From trees into burning",ok:true,why:"A tree that catches stops being an unburned tree and starts burning."},
      {h:"From trees into burned",fb:"A tree burns for a step before it's burned out, so it goes through burning first."}]},
    {f:"burn_out",a:"burning",b:"burned",q:"Where does <b>burn_out</b> move squares from, and where to?",opts:[
      {h:"From burning into burned",ok:true,why:"After one step, a burning square is burned out: empty ground."},
      {h:"From burned into trees",fb:"Burned ground doesn't grow back in this model. Look at what happens to a square that's on fire."},
      {h:"From burning to outside the model",fb:"The model keeps counting burned squares: they're how you measure the damage. So burn_out fills burned."}]}],
  links:[{a:"trees",b:"catch_fire"},{a:"burning",b:"catch_fire"},{a:"P_near",b:"catch_fire"},{a:"P_lone",b:"catch_fire"},{a:"burning",b:"burn_out"},
    {a:"p_immune",b:"P_near"},{a:"p_immune",b:"P_lone"},{a:"p_lightning",b:"P_lone"}],
  linkFb:{"!trees>catch_fire":"Only trees can catch fire. If no trees were left, nothing could catch. Which stock does catch_fire need?",
    "!burning>catch_fire":"Fire spreads from squares that are already burning: the more squares burn, the more trees catch. Which stock is that?",
    "!P_near>catch_fire":"A tree next to a fire catches with chance P_near. catch_fire needs it.",
    "!P_lone>catch_fire":"A tree with no fire nearby can still catch, from lightning, with chance P_lone. catch_fire needs that too.",
    "p_immune>catch_fire":"catch_fire uses p_immune only through P_near and P_lone. Point p_immune at those, and them at catch_fire.",
    "p_lightning>catch_fire":"catch_fire uses p_lightning only through P_lone.",
    "burned>catch_fire":"Burned ground can't catch fire again, and it doesn't spread fire. catch_fire doesn't need burned.",
    "burn_out>catch_fire":"burn_out doesn't change how many trees catch in this step. Squares going out and trees catching both depend on what's burning now.",
    "!burning>burn_out":"Which squares burn out? Every square that's burning now. So burn_out needs burning.",
    "!p_immune>P_near":"P_near = 1 − p_immune. Which quantity is it worked out from?",
    "!p_immune>P_lone":"P_lone = p_lightning × (1 − p_immune). It needs two quantities.",
    "!p_lightning>P_lone":"P_lone = p_lightning × (1 − p_immune). It needs two quantities.",
    "p_lightning>P_near":"A tree next to a fire catches from the fire, not from lightning: P_near = 1 − p_immune."},
  linkWhy:{catch_fire:"Trees next to a fire catch with chance P_near, and the rest with chance P_lone.",burn_out:"burn_out = burning: every fire goes out after one step.",P_near:"P_near = 1 − p_immune.",P_lone:"P_lone = p_lightning × (1 − p_immune)."},
  linksLead:"Drag from a quantity to the flow or converter it helps work out, and a blue connector appears. The brief's chances, p_immune and p_lightning, aren't worked out from anything, so no arrow points into them.",
  why:[
    {id:"conn",at:"burning>catch_fire",q:"What does the connector from burning to catch_fire mean?",opts:[
      {h:"Burning squares move into catch_fire",fb:"Connectors don't move anything: only pipes do. A connector means “is used to work out”."},
      {h:"The more squares are burning, the more trees catch fire in the next step",ok:true,why:"Fire spreads from burning squares. In your rule, that's the burning neighbours check."},
      {h:"burning and catch_fire are always equal",fb:"catch_fire also depends on trees, P_near and P_lone. burning is one of its inputs, not its value."}]},
    {id:"out",at:"burn_out",q:"burn_out has only one connector, from burning. What does that tell you?",opts:[
      {h:"Every burning square burns out next step, whatever else is going on",ok:true,why:"burn_out = burning. That's your first rule: if a square is burning, it becomes empty."},
      {h:"Squares burn out only when p_immune is high",fb:"No connector comes from p_immune, so the chances don't affect burning out."},
      {h:"Burned squares can catch fire again",fb:"No pipe leaves burned, so once a square has burned, it stays burned."}]},
    {id:"stop",at:"burning",q:"What happens to catch_fire when burning drops to 0?",opts:[
      {h:"It stays the same",fb:"catch_fire depends on burning. With nothing burning, no tree is next to a fire."},
      {h:"trees drops to 0",fb:"trees only drains through catch_fire. With almost nothing catching, the trees that are left stay trees."},
      {h:"Almost nothing catches: only lightning, with chance P_lone, can start a new fire",ok:true,why:"That's why a fire that can't reach more trees dies out, and why lightning matters over many steps."}]},
    {id:"code",at:"catch_fire",q:"In Build you'll code a rule that every square follows. Which part of the diagram is a “become burning” block?",opts:[
      {h:"The catch_fire pipe: it moves a square from trees to burning",ok:true,why:"And “become empty” for a burning square is the burn_out pipe. The connectors into each pipe are what your if blocks check."},
      {h:"The burning box",fb:"The box counts burning squares. A become block moves a square from one box to another: that's a pipe."},
      {h:"The P_near circle",fb:"P_near is a chance your rule checks in an if. The become block is what happens when the check passes."}]}],
  toCode:"Your rule is this diagram, one square at a time. <b>burn_out</b>: if a square is burning, it becomes empty. <b>catch_fire</b>: if a tree has a burning neighbour, it catches with chance P_near; if not, with chance P_lone. Each connector into a pipe is something your if blocks check.",
  hints:{sort:["Ask about each quantity: is it a count that builds up or drains? A number of squares moving each step? Or a chance?","Counts of squares, like trees, burning and burned, are stocks. Numbers per step, like catch_fire and burn_out, are flows. Chances are converters.",hsteps("trees, burning and burned go in the boxes: they're stocks.","catch_fire and burn_out go in the valves: they're flows.","P_near, P_lone, p_immune and p_lightning go in the circles: they're converters.","step goes on the clock.")],
    pipes:["Follow one square through a fire. What is it before it catches? While it burns? After?","A tree catches fire and starts burning. After one step it's burned out. Nothing goes backwards.",hsteps("catch_fire: from trees into burning.","burn_out: from burning into burned.")],
    links:["Pick a flow or converter and ask: what would I need to know to work it out? Each answer is a connector into it.","How many trees catch depends on how many trees there are, how many squares are burning, and the two chances. Each chance comes from the probabilities in the brief.",hsteps("Drag from trees, burning, P_near and P_lone to catch_fire.","Drag from burning to burn_out.","Drag from p_immune to P_near.","Drag from p_immune and from p_lightning to P_lone.")]},
  L:{wide:{vb:[1100,650],pos:{trees:[120,175],catch_fire:[330,175],burning:[540,175],burn_out:[750,175],burned:[960,175],P_near:[285,380],P_lone:[385,380],p_immune:[285,545],p_lightning:[500,545]},
      lp:{P_near:"l",P_lone:"r"},bend:{"trees>catch_fire":.35,"burning>catch_fire":-.35,"P_near>catch_fire":-.1,"P_lone>catch_fire":.1,"burning>burn_out":.35,"p_immune>P_near":.1,"p_immune>P_lone":.12,"p_lightning>P_lone":.12}},
    tall:{tall:true,vb:[620,630],pos:{trees:[110,150],catch_fire:[290,150],burning:[480,150],burn_out:[480,290],burned:[480,430],P_near:[175,360],P_lone:[300,360],p_immune:[175,540],p_lightning:[360,540]},
      lp:{burn_out:"l",burned:"b",P_near:"l",P_lone:"r"},bend:{"trees>catch_fire":.35,"burning>catch_fire":-.35,"P_near>catch_fire":-.06,"P_lone>catch_fire":.06,"burning>burn_out":-.45,"p_immune>P_near":.08,"p_immune>P_lone":.12,"p_lightning>P_lone":.1}}}};
MISSIONS.fire={
  id:"fire",title:"Wildfire Watch",art:"fire",icon:"fire",chip:"var(--yellow-soft)",introBg:"#FDE7A6",defBg:"#FDE7A6",bar:"#C8B6FF",lab:true,
  chipIcon:CHIP_FIRE, introChip:CHIP_FIRE, defIcon:CIC.trees,
  tagline:"Lightning will strike this forest. Code how fire spreads, then use hundreds of fires to decide how much to thin the trees.",
  blurb:"Code how fire spreads, then decide how much to thin the forest.", short:"Code a wildfire, then thin the forest.",
  brief:"Lightning will strike this forest sooner or later. Code how fire spreads, then tell the fire district how much thinning is enough.",
  tags:["Math","Biology"],diff:"Hard",time:"~ 50 min",minutes:50,subj:"Probability, Ecology",grade:"High School",
  scene:()=>`${img("scene-fire.svg")}<img class="sbear talk" src="${A(BEARS.flask)}" alt="ModelQuest bear" data-sx=".62" data-sy=".05" style="right:6.5%;top:31%;width:18.5%">`,
  modeDesc:["Meet the forest.","Turn the brief into probabilities.","Draw the forest as stocks, flows and chances.","Code the rule every square follows.","Write the rule's probabilities as equations.","Trust the rule, then run hundreds of fires.","Advise the district using a distribution."],
  doneLine:"You coded a probabilistic rule, checked it where chance disappears, and used hundreds of fires to find where thinning actually pays off.",
  talk:["One fire is a story. Two hundred fires are evidence!","Probabilities that add to 1 are complements.","Every square decides using the same snapshot.","Below a certain density, fires fizzle out."],
  problem:st=>{const V=VARS(st), as=(st.d.def&&st.d.def.as)||ASM.filter(a=>a.sug).map(a=>a.k);
    if(st.step<=1) return `<p class="lead" style="margin-top:0">Lightning will strike this forest sooner or later, and the fire district wants to know how much to thin the trees. Your model is a grid of squares. Each square is ${key(COL.e)} empty, ${key(COL.t)} a tree, or ${key(COL.b)} burning, and every square follows the same rule each step.</p>
      <div class="pcards"><div class="pcard" style="--k:#FDC3CD"><b>Burning square</b><span>burns out after one step</span></div><div class="pcard" style="--k:#C1FBE1"><b>Tree next to a fire</b><span>resists catching with chance</span><span>p_immune = 0.3</span></div><div class="pcard" style="--k:#FDE7A6"><b>Tree with no fire nearby</b><span>lightning hits it with chance</span><span>p_lightning = 0.001 each step,</span><span>and it can still resist</span></div></div>
      <h3 class="ph">The question</h3><p class="ptext">How much should the district thin the forest so that a fire usually stays small?</p>
      <h3 class="ph">What you'll work out</h3><ul class="plist"><li>The chance that a tree <b>next to a fire</b> catches. In one step it either catches or resists: nothing else can happen.</li><li>The chance that a tree with <b>no fire nearby</b> catches. Lightning has to hit it, <i>and</i> it has to fail to resist.</li></ul>`;
    return `<p class="lead" style="margin-top:0">Lightning will strike this forest sooner or later, and the fire district wants to know how much to thin the trees. Each square is ${key(COL.e)} empty, ${key(COL.t)} a tree, or ${key(COL.b)} burning, and every square follows the same rule each step.</p>
      <div class="pcards"><div class="pcard" style="--k:#FDC3CD"><b>Burning square</b><span>burns out after one step</span></div><div class="pcard" style="--k:#C1FBE1"><b>Tree next to a fire</b><span>resists with chance</span><span>p_immune = 0.3</span></div><div class="pcard" style="--k:#FDE7A6"><b>Tree with no fire nearby</b><span>lightning hits with chance</span><span>p_lightning = 0.001, and it can still resist</span></div></div>
      <h3 class="ph">What you worked out</h3><ul class="plist"><li>A tree next to a fire catches with chance 1 − 0.3 = 0.7</li><li>A tree with no fire nearby catches with chance 0.001 × 0.7 = 0.0007</li></ul>
      <h3 class="ph">Variables</h3>${varTable(V)}
      <h3 class="ph">Your assumptions</h3><ul class="plist">${ASM.filter(a=>as.includes(a.k)).map(a=>`<li>${esc(a.t)}</li>`).join("")||"<li class=muted>None picked yet.</li>"}</ul>`},
  evidence:st=>[["Validation checks",st.d.passed!=null?`${st.d.passed} / 5`:"—"],["Trials run",st.d.trial?String(st.d.trial.n):"—"],["Density sweep",st.d.sweep?"Done":"—"]],
  steps:[
  (el,st,ctx)=>introStep(el,MISSIONS.fire,st,ctx),
  (el,st,ctx)=>{const d=st.d.def||(st.d.def={});
    defineShell(el,MISSIONS.fire,`
      <p class="lead" style="margin:-1.6rem 0 2.6rem">Each square is ${key(COL.e)} empty, ${key(COL.t)} a tree, or ${key(COL.b)} burning. Two probabilities decide what happens to a tree.</p>
      <div class="frow"><div class="chip" style="background:var(--mint-soft)">${ic("shield",2.4)}</div><div class="nm">p_immune = 0.3<small>Chance a tree next to a fire resists it for one step</small></div><span class="pill ink given">given</span></div>
      <div class="frow"><div class="chip" style="background:var(--purple-chip)">${ic("percent",2.4)}</div><div class="nm">So a tree next to a fire catches with probability<small>Use the complement</small></div>
        <label class="ufield inl" id="w-q1"><input id="d-q1" inputmode="decimal" placeholder="?" value="${esc(d.q1??"")}" aria-label="Probability that a tree next to a fire catches"></label></div>
      <div class="frow"><div class="chip" style="background:var(--yellow-soft)">${ic("bolt",2.4)}</div><div class="nm">p_lightning = 0.001<small>Chance lightning hits a tree in one step</small></div><span class="pill ink given">given</span></div>
      <div class="frow"><div class="chip" style="background:var(--blue-soft)">${ic("dice",2.4)}</div><div class="nm">A tree with no fire nearby catches only if lightning hits <u>and</u> it doesn't resist<small>Both have to happen</small></div>
        <label class="ufield inl" id="w-q2"><input id="d-q2" inputmode="decimal" placeholder="?" value="${esc(d.q2??"")}" aria-label="Probability that a tree with no fire nearby catches"></label></div>
      <p class="fb" id="qfb"></p>
      ${assumptionsHTML(ASM,d)}
      <div class="nextrow"><button class="btn next" id="dnext" disabled>Next ${ic("arrowR",2.8)}</button></div>`);
    const check=()=>{const a=$("#d-q1",el).value.trim(),b=$("#d-q2",el).value.trim(); d.q1=a; d.q2=b;
      const okA=a!==""&&near(+a,0.7,1e-9), okB=b!==""&&near(+b,0.0007,1e-9);
      $("#w-q1",el).className="ufield inl "+(a===""?"":okA?"ok":"bad"); $("#w-q2",el).className="ufield inl "+(b===""?"":okB?"ok":"bad");
      $("#qfb",el).textContent=a!==""&&!okA?(near(+a,0.3,1e-9)?"0.3 is the chance it resists. Catching is the opposite event.":"Catching and resisting are complements: together they add to 1."):b!==""&&!okB?(near(+b,0.001,1e-9)?"That's lightning alone. The tree also has to fail to resist: multiply by 0.7.":"Two independent things both have to happen: multiply their probabilities."):okA&&okB?"Complement rule, then multiplication rule. That's all the probability the rule needs.":"";
      const asOK=assumptionsCheck(el,ASM,d);
      $("#dnext",el).disabled=!S.teacher&&!(okA&&okB&&asOK); save()};
    $$("input",el).forEach(x=>x.addEventListener("input",check)); check(); $("#dnext",el).onclick=ctx.next;
  },
  (el,st,ctx)=>diagramStep(el,MISSIONS.fire,st,ctx,DG),
  (el,st,ctx)=>{ /* ---------- Build = Simulation Lab ---------- */
    const d=st.d; d.tasks=d.tasks||{}; d.mine=d.mine||[]; const prog=d.prog||(d.prog={body:[]});
    const P=d.P||(d.P={pTree:0.85,pI:0.3,pL:0}); d.seed=d.seed||1;
    const W=48,H=24; let sim=null,timer=null,ran=false,E0=null,ruleOK=false,lastMine=null;
    let V=VARS(st), R=ruleEngine(V,prog);
    el.innerHTML=`<div class="lab-top">
        ${rays(1.4,2.4,6.9,0,true)}${confetti(1.1,12,3.2,"#FD9374",-20)}
        <h1>Simulation Lab</h1>${squiggle("sq")}
        ${confetti(72.3,10,2.6,"#4BE5D9",0,"dia")}
        <div class="obub"><svg viewBox="0 0 262 118" preserveAspectRatio="none" aria-hidden="true"><path d="M126 5C61 5 7 28 7 59s54 54 119 54c45 0 83-11 103-27l27 3-17-17c4-5 6-9 6-13C245 28 191 5 126 5z" fill="#FFFDFB" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/></svg><span id="lbub" aria-live="polite">Try changing<br>the variables!</span></div>
        
        <div class="blob lblob"></div>
        <img class="bear lbear" id="lbear" src="${A(BEARS.wave)}" alt="ModelQuest bear" role="button" tabindex="0">
      </div>
      <div class="lab-panels">
        <div class="card lpanel l">
          <div class="lh"><span class="ico">${CIC.trees}</span><span class="vsep"></span><span>Forest Fire Simulation</span></div>
          <div class="simbox"><canvas id="cv3" role="img" aria-label="Forest grid"></canvas><div class="stats" id="fstats"></div><button class="stepbtn" id="fstep" title="Advance one step">${ic("step",2.6)}Step</button></div>
          ${[["pTree","Tree density",SIC.tree,"#D9F07C",0,1,0.01,2],["pI","p_immune",SIC.shield,"#CDB6FB",0,1,0.01,2],["pL","p_lightning",SIC.bolt,"#9EF1CB",0,0.01,0.0005,4]].map(([k,l,i,c,a,b,s,dg])=>
            `<label class="srow"><span class="ic">${i}</span><b ${k==="pTree"?"":`data-var="${k==="pI"?"p_immune":"p_lightning"}"`}>${l}</b><input class="rng" type="range" id="p-${k}" min="${a}" max="${b}" step="${s}" value="${P[k]}" style="--c:${c}" aria-label="${l}"><output id="o-${k}">${(+P[k]).toFixed(dg)}</output></label>`).join("")}
          <div class="labbtns"><button class="btn" id="frun">${SIC.play}<span>Run</span></button><button class="btn lav" id="freset">${ic("refresh",2.6)}Reset</button></div>
          <div class="tipbox goalsbox"><span class="ico">${CIC.bulb}</span><span class="vsep"></span><ul id="tips"></ul></div>
        </div>
        <div class="card lpanel r">
          <div class="lh"><span class="ico">${ic("code",2.8)}</span><span class="vsep"></span><span>Model Translation</span><button class="btn sm white probbtn" id="probbtn">${ic("doc",2.4)}Problem info</button></div>
          <div class="eqzone"><div class="eqwrap">${EMIT("l")}<div class="eqbig" id="eqbig"></div>${EMIT("r")}</div></div>
          <div class="palette hz" id="pal"></div>
          <div class="canvasbox lcanvas" id="cv"></div>
        </div>
      </div>
      <div class="labfoot">${ctx.stepsHTML()}
        <div class="ex-btns" style="margin-left:0"><button class="btn back" id="back">${ic("arrowL",2.8)}Diagram</button><button class="btn submit" id="nextb" disabled>Equations ${ic("arrowR",2.8)}</button></div>
        <div class="hintzone" id="hintzone"></div></div>`;
    const cv=$("#cv3",el), bub=$("#lbub",el);
    let bubT=0; const say=(t,hold)=>{if(bub.dataset.t===t)return; bub.dataset.t=t; bub.innerHTML=t; const o=bub.parentElement; o.classList.remove("pop"); void o.offsetWidth; o.classList.add("pop"); clearTimeout(bubT); if(!hold) bubT=setTimeout(()=>say("Try changing<br>the variables!",true),5200)};
    const fit=()=>{const r=cv.getBoundingClientRect(), dpr=Math.min(2,devicePixelRatio||1); cv.width=Math.max(10,Math.round(r.width*dpr)); cv.height=Math.max(10,Math.round(r.height*dpr)); paint()};
    const paint=()=>{if(!sim)return; const ctx2=cv.getContext("2d"),Wc=cv.width,Hc=cv.height,pad=Math.round(Wc*0.03);
      const px=Math.min((Wc-2*pad)/W,(Hc-2*pad)/H), ox=(Wc-px*W)/2, oy=(Hc-px*H)/2, fl=sim.step%2, lw=Math.max(1,px*0.09);
      ctx2.clearRect(0,0,Wc,Hc); ctx2.lineWidth=lw;
      for(let i=0;i<W*H;i++){const v=sim.g[i]; if(v===E&&!sim.ever[i]) continue; const cx=ox+(i%W+.5)*px, cy=oy+(((i/W)|0)+.5)*px;
        if(v===T){ctx2.beginPath(); ctx2.arc(cx,cy,px*0.43,0,7); ctx2.fillStyle=COL.t; ctx2.fill(); ctx2.strokeStyle="#2E7D47"; ctx2.stroke();
          ctx2.beginPath(); ctx2.arc(cx-px*0.12,cy-px*0.12,px*0.12,0,7); ctx2.fillStyle="#9BE3AE"; ctx2.fill()}
        else if(v===B){ctx2.beginPath(); ctx2.arc(cx,cy,px*(fl?0.5:0.46),0,7); ctx2.fillStyle=COL.b; ctx2.fill(); ctx2.strokeStyle="#B4452A"; ctx2.stroke();
          ctx2.beginPath(); ctx2.arc(cx,cy,px*(fl?0.22:0.17),0,7); ctx2.fillStyle=COL.bc; ctx2.fill()}
        else{ctx2.beginPath(); ctx2.arc(cx,cy,px*0.2,0,7); ctx2.fillStyle=COL.ash; ctx2.fill()}}
      const b=count(sim,"burned");
      $("#fstats",el).innerHTML=`<span>Step ${sim.step}</span><span>${key(COL.t)}${count(sim,"tree")} trees</span><span>${key(COL.b)}${sim.burning} burning</span><span>${sim.trees0?fmt(b/sim.trees0*100):0}% burned</span>`+
        (lastMine&&sim.step?Object.keys(lastMine).map(k=>`<span class="mv">${esc(k)} = ${sayText(lastMine[k])}</span>`).join(""):"")};
    const stop=()=>{clearInterval(timer); timer=null; $("#frun",el).innerHTML=SIC.play+"<span>Run</span>"};
    const reset=()=>{stop(); sim=makeSim(W,H,P.pTree,d.seed); ignite(sim,"center"); E0=R.env(P,sim.rng); ran=false; lastMine=null; paint()};
    TIMERS.add(stop);
    const needMode=()=>{say("First choose where<br>each step writes!",true); const s=$("#fmode",el); if(s){s.classList.remove("nudge"); void s.offsetWidth; s.classList.add("nudge"); s.focus({preventScroll:true})}};
    const tick=()=>{if(!sim) return false; if(!d.mode){stop(); needMode(); return false}
      stepSim(sim,R,E0,P,d.mode); ran=true; lastMine=R.mine.length?Object.fromEntries(R.mine.map(k=>[k,E0.v[k]])):null; paint();
      if(Object.keys(E0.errs).length) studio.mark(Object.assign({},E0.errs));
      const pct=sim.trees0?count(sim,"burned")/sim.trees0*100:0;
      if(d.mode==="inplace"&&sim.step===1&&pct>8) say("Whoa, way too fast!<br>Fresh copy?",true);
      if(sim.burning>0&&sim.changed===0&&P.pL===0){stop(); say("The fire is stuck!<br>Do fires burn out?",true); return false}
      if(sim.burning===0&&P.pL===0){stop(); if(ruleOK&&d.mode==="next"&&sim.step>1&&!d.ranOut){d.ranOut=true; save(); update()} say(`Burned out!<br>${fmt(pct)}% burned.`); return false}
      if(sim.step>400){stop(); say("Paused after<br>400 steps.",true); return false}
      return true};
    const hatHTML=()=>`<div class="blk hat fhat"><i class="hf"></i>${FLAG}<span>each step, every square writes to</span><select class="bsel hatsel ${d.mode?"":"q"}" id="fmode" aria-label="Where each step writes the new states">${d.mode?"":`<option value="" selected>choose</option>`}<option value="next" ${d.mode==="next"?"selected":""}>a fresh copy</option><option value="inplace" ${d.mode==="inplace"?"selected":""}>the same forest</option></select></div>`;
    const fireLib=cat=>{const mine=d.mine.map(k=>({type:"var",f:{v:k}}));
      if(cat==="v") return [{head:"Set by the sliders"},{type:"var",f:{v:"p_immune"}},{type:"var",f:{v:"p_lightning"}},
        ...(mine.length?[{head:"Your variables"},...mine,{head:"Commands"},{type:"set",f:{v:d.mine[0]}},{type:"change",f:{v:d.mine[0]}}]:[{note:"Make a variable to use <b>set</b> and <b>change</b>. Your variables start at 0 every step."}]),{make:true}];
      if(cat==="m") return [{type:"add"},{type:"sub"},{type:"mul"},{type:"div"}];
      if(cat==="l") return [{type:"lt"},{type:"gt"},{type:"eq"},{type:"and"},{type:"or"},{type:"not"},{type:"if"},{type:"ifelse"}];
      if(cat==="f") return [{head:"This square"},{type:"fstate"},{type:"fnb"},{type:"fkind",f:{k:"1"}},{head:"Change it"},{type:"fbecome",f:{k:"2"}},{head:"Chance"},{type:"frand"}];
      return []};
    const tipFor=(k,x)=>x.kind==="in"?varTipHTML(k,x,k==="p_immune"?P.pI:P.pL):`<div class="vtip"><b>${esc(k)}</b><span>A variable you made. It starts at 0 every step.</span>${lastMine&&Number.isFinite(lastMine[k])?`<span>After the last step: ${sayText(lastMine[k])}</span>`:""}</div>`;
    const studio=blockStudio({pal:$("#pal",el),canvas:$("#cv",el),prog,cats:["v","m","l","f"],get hat(){return hatHTML()},hatName:"each step, every square…",horizontal:true,
      vars:()=>V, lib:fireLib, makeVar:makeVarFn(st,()=>V), varTip:tipFor, onChange:kind=>{st.runs=(st.runs||0)+1; save(); if(kind!=="var") reset(); update()}});
    $("#cv",el).addEventListener("change",e=>{if(e.target.id!=="fmode") return; d.mode=e.target.value; st.runs=(st.runs||0)+1; save(); studio.draw(); reset(); update();
      say(d.mode==="next"?"Same snapshot<br>for every square!":"Run it and watch<br>the fire speed…")});
    const update=()=>{
      V=VARS(st); R=ruleEngine(V,prog); if(sim&&!timer) E0=R.env(P,sim.rng);
      const C=checks(st,R), G=C.G, first=G.find(g=>!g.ok); ruleOK=C.ruleOK; studio.mark(C.errs);
      $("#tips",el).innerHTML=G.map(g=>`<li class="${g.ok?"ok":g===first?"cur":""} ${g.isNew&&!g.ok?"new":""}">${g.t}${g.tag&&!g.ok?`<em class="gtag">${g.tag}</em>`:""}${g===first&&g.fb?`<small class="gfb">${g.fb}</small>`:""}</li>`).join("");
      goalHints($("#hintzone",el),st,first); trackGoals(st,G);
      const r=probe(R,T,1,{pI:P.pI,pL:0},2000,77).f[B], eqb=$("#eqbig",el);
      eqb.innerHTML=`P(spread) ≈ ${fmt(r,2)}`; eqb.title=`Measured by running your rule on 2,000 trees next to a fire, with p_immune = ${fmt(P.pI,2)}.`;
      if(ruleOK&&d.mode==="next") award("rulemaker");
      $("#nextb",el).disabled=!S.teacher&&!(G.every(g=>g.ok)&&d.tasks.count);
      if(ruleOK&&!d.tasks.count){d.tasks.count=true; save();
        setTimeout(()=>taskPopup({eyebrow:"A request from the fire district",title:"How many trees catch fire each step?",html:`<p>“Your rule works. Now we need numbers: how many trees catch fire in each step? That tells us how many crews to send.”</p><p>Make a variable of your own and use it to <b>count the trees that catch fire</b> during a step. The lab shows its value after every step.</p><div class="tasknote">${ic("vars",2.4)}<span>Make the variable in <b>Variables</b>. Your variables start again at 0 at the start of every step.</span></div>`,onClose:update}),700); return update()}
    };
    [["pTree",2],["pI",2],["pL",4]].forEach(([k,dg])=>{const rg=$("#p-"+k,el); paintRange(rg); rg.oninput=()=>{paintRange(rg); P[k]=+rg.value; $("#o-"+k,el).textContent=P[k].toFixed(dg); save(); if(k==="pTree")reset(); update()}});
    $("#frun",el).onclick=()=>{if(timer){stop();return} if(!d.mode){needMode(); return}
      if(!sim||sim.burning===0||ran&&sim.burning===0)reset(); st.runs=(st.runs||0)+1; save(); say("It's spreading!",true); timer=setInterval(()=>{if(!tick())stop()},90); $("#frun",el).innerHTML=ic("x",2.6)+"<span>Pause</span>"};
    $("#fstep",el).onclick=()=>{stop(); if(!d.mode){needMode(); return} if(!sim||sim.burning===0&&ran)reset(); tick()};
    $("#freset",el).onclick=()=>{d.seed++; save(); reset(); say("A brand-new<br>forest!")};
    const lb=$("#lbear",el), poke=()=>{const pool=["One fire is<br>just a story!","Change one<br>thing at a time!","Same snapshot<br>for every square!","Try density<br>0.55, then 0.7!","Complements<br>add to 1!"]; let t; do{t=pool[(Math.random()*pool.length)|0]}while(t===bub.dataset.t); say(t); lb.classList.remove("hop"); void lb.offsetWidth; lb.classList.add("hop")};
    lb.onclick=poke; lb.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();poke()}};
    $("#back",el).onclick=()=>{stop();ctx.back()}; $("#nextb",el).onclick=()=>{stop();ctx.next()};
    reset(); update(); requestAnimationFrame(fit);
    if(window.ResizeObserver){const ro=new ResizeObserver(()=>fit()); ro.observe(cv); TIMERS.add(()=>ro.disconnect())}
  },
  (el,st,ctx)=>equationStep(el,MISSIONS.fire,st,ctx,EQ),
  (el,st,ctx)=>{ /* ---------- Test ---------- */
    const V=VARS(st), R=ruleEngine(V,st.d.prog||{body:[]}), mode=st.d.mode||"next", red=Object.keys(R.comp.errs).length>0;
    TIPV=k=>V[k]?varTipHTML(k,V[k]):null;
    const sim1=(pTree,P)=>{const s=makeSim(30,30,pTree,7); const c=ignite(s,"center"); return {s,c,e:R.env(P,s.rng)}};
    const VC=[
      {id:"t1",name:"Fires burn out",code:"check the first tree stops burning after one step",ic:"fire",chip:"var(--pink-soft)",f:()=>{const P={pI:1,pL:0},{s,c,e}=sim1(1,P); stepSim(s,R,e,P,mode); return [s.g[c]===E,s.g[c]===B?"it is still burning":s.g[c]===T?"it turned back into a tree":"it burned out"]}},
      {id:"t2",name:"Immune trees stop the fire",code:"check only the first tree burns when p_immune = 1",ic:"shield",f:()=>{const P={pI:1,pL:0},{s,e}=sim1(1,P); let k=0; while(s.burning&&k++<200) stepSim(s,R,e,P,mode); const b=count(s,"burned"); return [b===1&&s.burning===0,s.burning?"the fire never went out":`${b} tree${b>1?"s":""} burned`]}},
      {id:"t3",name:"No immunity, full forest",code:"check every tree burns when p_immune = 0, density = 1",ic:"tree",f:()=>{const P={pI:0,pL:0},{s,e}=sim1(1,P); let k=0; while(s.burning&&k++<400) stepSim(s,R,e,P,mode); const pc=count(s,"burned")/s.trees0*100; return [near(pc,100,0.01)&&s.burning===0,`${fmt(pc)}% burned${s.burning?", still burning":""}`]}},
      {id:"t4",name:"Fire moves one square per step",code:"check one step from one fire lights at most 4 trees",ic:"step",chip:"var(--sky)",f:()=>{const P={pI:0,pL:0},{s,c,e}=sim1(1,P); stepSim(s,R,e,P,mode); let nw=0; for(let i=0;i<s.g.length;i++)if(s.g[i]===B&&i!==c)nw++; return [nw<=4&&nw>0,`${nw} new fire${nw===1?"":"s"}`]}},
      {id:"t5",name:"Immune trees resist lightning",code:"check nothing burns when p_immune = 1, p_lightning = 1",ic:"bolt",chip:"var(--yellow-soft)",f:()=>{const P={pI:1,pL:1}; const s=makeSim(30,30,1,7), e=R.env(P,s.rng); let any=0; for(let i=0;i<5;i++){stepSim(s,R,e,P,mode); any+=s.burning} return [any===0,any?`${fmt(count(s,"burned"))} trees caught fire`:"nothing burned"]}}];
    const tr=st.d.trialCfg||(st.d.trialCfg={p:0.6,n:200});
    el.innerHTML=`<div class="card tsec reveal"><div class="tsec-h"><h2>1 · Can you trust the rule?</h2><button class="btn" id="runall">${ic("playf",2)}Run all checks</button></div>
        <p class="lead">A random model can't be checked against one exact number, except where the randomness disappears. These checks run your rule where the chances are 0 or 1.</p>
        ${red?`<div class="callout pink" style="margin-bottom:2rem"><div><h4>Your rule has a block marked in red.</h4><p>Go back to Build and fix it first.</p></div></div>`:""}
        <div class="tests" data-stagger>${VC.map(testCard).join("")}</div><div id="tfb" style="margin-top:2.2rem"></div></div>
      <div class="card tsec reveal" id="inv">
        <div class="tsec-h"><h2>2 · One fire tells you nothing</h2></div>
        <p class="lead">Run many fires at one density, each starting from a random tree. Settings: 30 × 30 forest, your rule, p_immune = 0, no lightning.</p>
        <label class="srow solo"><span class="ic">${SIC.tree}</span><b>Density</b><input class="rng" type="range" id="tp" min="0.3" max="0.9" step="0.05" value="${tr.p}" style="--c:#9EF1CB" aria-label="Density for the trials"><output id="tpo">${tr.p.toFixed(2)}</output></label>
        <div class="tbtns"><button class="btn" id="trun">${ic("dice",2.4)}Run 200 fires</button><button class="btn white sm" id="trun1">Run just 1 fire</button></div>
        <div class="progressline" id="tprog" hidden><i></i></div>
        <div class="split" style="margin-top:2.4rem" id="tres"></div>
      </div>
      <div class="card tsec reveal">
        <div class="tsec-h"><h2>3 · Where is the tipping point?</h2></div>
        <p class="lead">Repeat the experiment across 13 densities, 30 fires each, and plot the average burn.</p>
        <button class="btn" id="srun">${ic("graph",2.4)}Sweep densities</button><div class="progressline" id="sprog" hidden><i></i></div>
        <div id="sres" style="margin-top:2rem"></div>
      </div>
      <div class="card tsec reveal">
        <div class="tsec-h"><div class="chip" style="width:5.4rem;height:5.4rem;background:var(--pink-soft)">${ic("users",2.4)}</div><h2>Challenge the rule (optional)</h2></div>
        <p class="lead">Your rule gives a tree the same 1 − p_immune chance whether one neighbour burns or four. What if each burning neighbour got its own try? Then the tree survives only if it resists every one: p_immune<sup>k</sup>.</p>
        <button class="btn sm pink" id="crun">${ic("play",2.4)}Compare both rules at density 0.8, p_immune 0.3</button><div id="cres" style="margin-top:2rem"></div>
      </div>
      <div class="ex-btns" style="margin-left:0"><button class="btn back" id="back">${ic("arrowL",2.8)}Equation</button><button class="btn submit" id="nextb" disabled>Explain ${ic("arrowR",2.8)}</button></div>`;
    const gate=()=>{const ok=st.d.passed===5&&st.d.trial&&st.d.trial.n>=200&&st.d.sweep; $("#nextb",el).disabled=!S.teacher&&!ok;
      const open=st.d.passed===5||S.teacher; $("#inv",el).style.opacity=open?1:.55; $$("#trun,#trun1,#srun,#crun",el).forEach(b=>b.disabled=!open)};
    const runAll=fresh=>{let n=0; VC.forEach(t=>{const [p,said]=t.f(); if(p)n++; setTest(el,t.id,p,`Your model: <b>${esc(said)}</b>`)}); st.d.passed=n; save();
      $("#tfb",el).innerHTML=n===5?`<div class="callout mint"><div><h4>All five checks pass.</h4><p>Now the interesting part: your rule is random, so the real answer is a distribution.</p></div></div>`:`<div class="callout pink"><div><h4>${5-n} check${5-n>1?"s":""} failed.</h4><p>${!VC[3].f()[0]?"Check 4 is the classic one: if one step lights a whole streak, your update is reading squares it has already changed.":"Go back to Build and look at the part of your rule that check exercises."}</p></div></div>`;
      if(fresh&&n===5) celebrate($("#runall",el)); gate()};
    $("#runall",el).onclick=()=>runAll(true); if(st.d.passed!=null) runAll(false); else gate();
    const tp=$("#tp",el); paintRange(tp); tp.oninput=()=>{paintRange(tp); tr.p=+tp.value; $("#tpo",el).textContent=tr.p.toFixed(2); save()};
    const showTrials=(vals,p)=>{const mean=vals.reduce((a,b)=>a+b,0)/vals.length, med=median(vals);
      const bins=BINS.map(([a,b,l])=>({label:l,n:vals.filter(v=>v>=a&&v<b).length})); const mi=BINS.findIndex(([a,b])=>mean>=a&&mean<b);
      const runm=[]; let acc=0; vals.forEach((v,i)=>{acc+=v; runm.push([i+1,acc/(i+1)])});
      $("#tres",el).innerHTML=vals.length<2?`<div class="callout sky" style="grid-column:1/-1"><div><h4>One fire at density ${p}: ${fmt(vals[0],1)}% burned.</h4><p>Run it again and you'll get a different number. Which one is the answer?</p></div></div>`:
        `<div><div class="mstat"><span style="background:var(--yellow-soft)">mean ${fmt(mean,1)}%</span><span style="background:var(--lav)">median ${fmt(med,1)}%</span><span>spread (SD) ${fmt(sd(vals),1)}</span></div>
          ${barChart({bins,ymax:Math.max(10,Math.ceil(Math.max(...bins.map(b=>b.n))/25)*25+5),color:"#FF9C7C",mark:mi,markText:`the mean, ${fmt(mean,1)}%, lands here`,xl:"share of the forest burned in one fire",aria:"Distribution of burn outcomes"})}</div>
         <div><b style="font-size:2rem">Running average as fires are added</b>${lineChart({w:560,h:360,L:78,R:26,x:[1,vals.length],y:[0,100],xt:[1,Math.round(vals.length/4),Math.round(vals.length/2),Math.round(vals.length*3/4),vals.length],yt:[0,25,50,75,100],yf:y=>y+"%",xl:"fires so far",
            series:[{pts:runm,color:"#7C5CFF",sw:3.5}],aria:"Running mean of percent burned",hover:x=>{const i=clamp(Math.round(x),1,vals.length); return {x:i,html:`after ${i} fires<br><b>average ${fmt(runm[i-1][1],1)}%</b>`}}})}
          <p class="fb">The first fire said ${fmt(vals[0],1)}%. ${vals.length>=50?`After ${vals.length}, the average has settled near ${fmt(mean,0)}%.`:""}</p></div>`;
      wireHover(el)};
    const go=N=>{const vals=[],bar=$("#tprog",el),p=tr.p; bar.hidden=false; $("#trun",el).disabled=true;
      runBatch(N,k=>trial(R,mode,{pTree:p,pI:0,pL:0},30,7000+k+(N===1?Math.floor(Math.random()*1e6):0)),(k,v)=>{vals.push(v); $("i",bar).style.width=((k+1)/N*100)+"%"},
        ()=>{bar.hidden=true; $("#trun",el).disabled=false; showTrials(vals,p); if(N>=200){st.d.trial={p,n:N,mean:vals.reduce((a,b)=>a+b,0)/N,median:median(vals),vals:vals.map(v=>Math.round(v*10)/10)}; award("lln"); save(); gate()}})};
    $("#trun",el).onclick=()=>go(200); $("#trun1",el).onclick=()=>go(1);
    if(st.d.trial&&st.d.trial.vals) showTrials(st.d.trial.vals,st.d.trial.p);
    const showSweep=sw=>{const tp2=tipping(sw);
      $("#sres",el).innerHTML=`<div style="max-width:86rem">`+lineChart({w:760,h:400,R:30,x:[0.3,0.9],y:[0,100],xt:[0.3,0.4,0.5,0.6,0.7,0.8,0.9],yt:[0,25,50,75,100],xf:t=>t.toFixed(1),yf:y=>y+"%",xl:"tree density",yl:"average % burned",
        bands:[[0.55,0.65,"rgba(255,156,124,.18)"]],series:[{pts:sw,color:"#FF7A59",sw:4,dots:sw,marker:"circle"}],marks:Number.isFinite(tp2)?[{x:tp2,y:50,text:`tipping point ≈ ${tp2.toFixed(2)}`,dx:14,dy:-16,anchor:"start"}]:[],aria:"Average burn against tree density",
        hover:x=>{const q=sw.reduce((a,b)=>Math.abs(b[0]-x)<Math.abs(a[0]-x)?b:a); return {x:q[0],html:`density ${q[0].toFixed(2)}<br><b>${fmt(q[1],1)}% burned</b>`}}})+
        `<p class="fb">Between densities 0.5 and 0.7 the average goes from ${fmt((sw.find(q=>near(q[0],0.5,1e-6))||[0,NaN])[1],0)}% to ${fmt((sw.find(q=>near(q[0],0.7,1e-6))||[0,NaN])[1],0)}%. The shaded band is where single fires are least predictable.</p></div>`; wireHover(el)};
    $("#srun",el).onclick=()=>{const D=[];for(let i=0;i<=12;i++)D.push(Math.round((0.3+i*0.05)*100)/100);
      const res=D.map(()=>[]),bar=$("#sprog",el); bar.hidden=false; $("#srun",el).disabled=true;
      runBatch(D.length*30,k=>trial(R,mode,{pTree:D[k%D.length],pI:0,pL:0},30,7919+k),(k,v)=>{res[k%D.length].push(v); $("i",bar).style.width=((k+1)/(D.length*30)*100)+"%"},
        ()=>{bar.hidden=true; $("#srun",el).disabled=false; const sw=D.map((d,i)=>[d,res[i].reduce((a,b)=>a+b,0)/res[i].length]); st.d.sweep=sw; save(); showSweep(sw); gate()})};
    if(st.d.sweep) showSweep(st.d.sweep);
    $("#crun",el).onclick=()=>{const a=[],b=[]; $("#crun",el).disabled=true;
      runBatch(160,k=>trial(R,mode,{pTree:0.8,pI:0.3,pL:0},30,500+(k>>1),k%2===1),(k,v)=>(k%2?b:a).push(v),()=>{$("#crun",el).disabled=false;
        const m=x=>x.reduce((p,q)=>p+q,0)/x.length;
        $("#cres",el).innerHTML=`<div class="tw"><table class="tbl"><thead><tr><th>Rule</th><th>Average burned (80 fires)</th></tr></thead><tbody><tr><td>Your rule: any burning neighbour gives 1 − p_immune</td><td>${fmt(m(a),1)}%</td></tr><tr class="hl"><td>Each neighbour tries: 1 − p_immune<sup>k</sup></td><td>${fmt(m(b),1)}%</td></tr></tbody></table></div>
          <p class="fb">Same brief, two defensible rules, different forests. Neither is "the" answer. Which one fits real fires better is a question for evidence, and worth a line in your limitations.</p>`; st.d.challenged=true; save()})};
    $("#back",el).onclick=ctx.back; $("#nextb",el).onclick=ctx.next;
  },
  (el,st,ctx)=>{ /* ---------- Explain ---------- */
    const sw=st.d.sweep, at=p=>sw?(sw.find(q=>near(q[0],p,1e-6))||[0,NaN])[1]:NaN, tp=sw?tipping(sw):NaN;
    const plans=[[0.9,0.8],[0.8,0.7],[0.7,0.55],[0.55,0.45]];
    const tr=st.d.trial;
    const asl={sync:"Same moment",once:"Burns out in one step",wrap:"Edges wrap around",still:"No wind or slope"};
    const chosen=((st.d.def&&st.d.def.as)||[]).filter(k=>asl[k]);
    explainShell(el,MISSIONS.fire,`
      <div class="result"><span class="k">Tipping Point</span><span class="vsep"></span><span class="v">${Number.isFinite(tp)?`≈ ${tp.toFixed(2)} density`:"run the sweep"}</span></div>
      <div class="erow"><span class="etag adv">Advice</span><div><p class="q">The district can afford one thinning plan. Which buys the most protection?</p>
        ${choiceList("ad",plans.map(([a,b])=>({v:a+"-"+b,l:`Thin from ${a} to ${b}`,s:sw?`your model: ${fmt(at(a),0)}% → ${fmt(at(b),0)}% burned`:""})),st.d.ad)}</div></div>
      <div class="erow"><span class="etag spr">Spread</span><div><p class="q">${tr?`At density ${tr.p}, your ${tr.n} fires averaged ${fmt(tr.mean,0)}% burned, with a median of ${fmt(tr.median,0)}%.`:"Think about your trials at one density."} What usually happens?</p>
        ${choiceList("sp",[{v:"avg",l:`About ${tr?fmt(tr.mean,0):"the average"}% of the forest burns`},{v:"two",l:"Most fires either die early or burn most of the forest"},{v:"all",l:"The whole forest burns every time"}],st.d.sp)}</div></div>
      <div class="erow"><span class="etag why">Why?</span><textarea class="etext" id="why" rows="2" placeholder="Below about 0.6, fires usually die out, because …">${esc(st.d.why||"")}</textarea></div>
      <div class="erow"><span class="etag lim">Limitations</span><div>${chosen.length?`<div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1.2rem">${chosen.map(k=>`<span class="pill easy aspill">${asl[k]}</span>`).join("")}</div>`:""}
        <textarea class="etext" id="lim" rows="2" placeholder="Real fires have wind and slopes. My rule gives a tree the same chance whether one or four neighbours burn …">${esc(st.d.lim||"")}</textarea></div></div>
      <p class="fb" id="xfb"></p>`);
    bindChoices(el,"ad",v=>{st.d.ad=v; save()}); bindChoices(el,"sp",v=>{st.d.sp=v; save()});
    ["why","lim"].forEach(k=>$("#"+k,el).addEventListener("input",e=>{st.d[k]=e.target.value; save()}));
    $("#back",el).onclick=ctx.back;
    $("#sub",el).onclick=()=>{const fb=$("#xfb",el);
      if(st.d.ad!=="0.7-0.55"){fb.textContent=st.d.ad?"Compare how many percentage points each plan saves, using your sweep. Where is the curve steepest?":"Choose a thinning plan.";return}
      if(st.d.sp!=="two"){fb.textContent=st.d.sp==="avg"?"Look at your histogram: how many fires actually landed near the average?":st.d.sp?"Did any of your fires burn very little?":"Answer the question about what usually happens.";return}
      if($("#why",el).value.trim().length<15){fb.textContent="Add a sentence to Why? that uses a number from your sweep or your trials.";return}
      fb.textContent=""; completeMission("fire")};
  }]
};
MISSIONS.fire.eq=EQ; MISSIONS.fire.dg=DG;
/* ---- answer key (teacher mode): each task fills its answer into the step, and the run tasks run the lab and the trials.
   The trial and sweep numbers are what any working rule gives: with p_immune = 0 and no lightning the spread doesn't depend
   on chance, and the forests come from fixed seeds. ---- */
akLazy(MISSIONS.fire,()=>{const v=BK.v, op=BK.op, N=BK.n;
  const is=k=>op("eq",N("fstate"),N("fkind",{k})), become=k=>N("fbecome",{k}), count=c=>c?[BK.change("caught",1)]:[];
  const burn=()=>BK.iff(is("2"),[become("0")]);
  const spread=c=>BK.iff(op("lt",N("frand"),op("sub","1",v("p_immune"))),[become("2")].concat(count(c)));
  const light=c=>BK.iff(op("lt",N("frand"),op("mul",v("p_lightning"),op("sub","1",v("p_immune")))),[become("2")].concat(count(c)));
  const tree=(c,lit)=>BK.iff(is("1"),[BK.ifelse(op("gt",N("fnb"),"0"),[spread(c)],lit?[light(c)]:[])]);
  const MODEL=["prog","tasks","mine","mode","P","ranOut"];
  const build=(st,upto)=>{const d=st.d; d.prog={body:upto===0?[burn()]:[burn(),tree(upto>=3,upto>=2)]}; d.tasks=d.tasks||{};
    if(upto>=3){d.tasks.count=true; d.mine=d.mine||[]; if(!d.mine.includes("caught")) d.mine.push("caught")}
    if(upto>=4){d.mode="next"; d.P=Object.assign({pTree:0.85,pI:0.3,pL:0},d.P||{},{pL:0})}};
  const works=st=>{const d=st.d; if(!d.prog||!d.tasks||!d.tasks.count||d.mode!=="next") return false; try{const C=checks(st,ruleEngine(VARS(st),d.prog)); return C.ruleOK&&C.G.filter(g=>g.k!=="run").every(g=>g.ok)}catch(e){return false}};
  const ensure=st=>{if(!works(st)){build(st,4); st.d.ranOut=true}}, withModel=more=>st=>(works(st)?[]:MODEL).concat(more);
  // the Explain step needs the trials and the sweep: run them the way the Test step does, with the same seeds
  const runs=st=>new Promise(res=>{const d=st.d, R=ruleEngine(VARS(st),d.prog||{body:[]}), mode=d.mode||"next";
    const sweep=()=>{if(d.sweep) return res(true); const D=[]; for(let i=0;i<=12;i++) D.push(Math.round((0.3+i*0.05)*100)/100); const r=D.map(()=>[]);
      runBatch(D.length*30,k=>trial(R,mode,{pTree:D[k%D.length],pI:0,pL:0},30,7919+k),(k,x)=>r[k%D.length].push(x),()=>{d.sweep=D.map((x,i)=>[x,r[i].reduce((a,b)=>a+b,0)/r[i].length]); save(); res(true)})};
    if(d.trial&&d.trial.n>=200) return sweep();
    const vals=[], p=(d.trialCfg&&d.trialCfg.p)||0.6;
    runBatch(200,k=>trial(R,mode,{pTree:p,pI:0,pL:0},30,7000+k),(k,x)=>vals.push(x),()=>{d.trial={p,n:200,mean:vals.reduce((a,b)=>a+b,0)/200,median:median(vals),vals:vals.map(x=>Math.round(x*10)/10)}; save(); sweep()})});
  const def=st=>st.d.def||(st.d.def={});
  return {
  0:()=>[
    {t:"What's the question?",html:akP("How much should the fire district thin the forest so that a fire usually stays small?")},
    {t:"What do we know?",html:akKV([["Each square","empty, a tree, or burning"],["A burning square","burns out after one step"],["A tree next to a fire","resists catching with chance p_immune = 0.3"],["A tree with no fire nearby","lightning hits it with chance p_lightning = 0.001 each step, and it can still resist"]])},
    {t:"What will the model work out?",html:akP("The chance that each kind of tree catches, then a rule that every square follows each step. Running hundreds of fires at different tree densities shows how much of the forest usually burns.")},
    {t:"Where the class should end up",html:akP("There's a tipping point near a density of <b>0.56</b>: below it most fires die out early, and above it most burn nearly everything. Thinning from <b>0.7 to 0.55</b> buys the most protection.")}],
  1:()=>[
    {t:"A tree next to a fire catches with probability…",keys:["def"],target:"#w-q1",apply:st=>{def(st).q1="0.7"},note:"Complement rule: it either catches or resists, so 1 − 0.3 = 0.7."},
    {t:"A tree with no fire nearby catches with probability…",keys:["def"],target:"#w-q2",apply:st=>{def(st).q2="0.0007"},note:"Multiplication rule: lightning hits and the tree fails to resist, so 0.001 × 0.7 = 0.0007."},
    {t:"Assumptions",keys:["def"],target:".dcard .callout.asm",apply:st=>{def(st).as=ASM.filter(a=>a.ok).map(a=>a.k)},note:"Ticked: every assumption the model makes. Left unticked: the one it doesn't."}],
  3:()=>["A burning square <b>burns out</b>: next step it's empty","A tree <b>next to a fire</b> catches with chance <b>1 − p_immune</b>","A tree with <b>no fire nearby</b> catches only if lightning hits <b>and</b> it doesn't resist",
      "Count how many trees <b>catch fire</b> in each step","Write each step to <b>a fresh copy</b>, then <b>Run</b> a fire until it burns out"].map((t,i)=>({t,tag:i===3?"new task":"",keys:MODEL,target:i===4?"#cv3":"#cv",
      apply:st=>build(st,i),after:i===4?akClick("#frun",()=>/Run/.test(($("#frun")||{}).textContent||""),40000):null,
      note:["The rule runs once for every square, every step.","Check: the P(spread) badge reads about 0.70 at p_immune = 0.3. Press Step to watch it spread.","The lightning test goes in the else part. With the rule complete, the counting task pops up: close it to go on.",
        "The variable caught is made in Variables first. It starts at 0 every step, so it needs no set block.","Each square reads the same snapshot of the forest, so the fire moves one square per step. The bear says “Burned out!” at the end."][i]})),
  5:()=>[
    {t:"Run all checks",keys:withModel(["passed"]),target:".tests",apply:st=>{ensure(st); st.d.passed=0},note:"All five pass: fires burn out, immune trees stop the fire and resist lightning, a full forest burns, and fire moves one square per step."},
    {t:"Run 200 fires at density 0.6",keys:["trial","trialCfg"],target:"#inv",apply:st=>{st.d.trialCfg=Object.assign(st.d.trialCfg||{},{p:0.6,n:200})},after:akClick("#trun",()=>{const t=S.missions.fire.d.trial; return !!t&&t.n>=200&&!!document.querySelector("#tres .mstat")}),
      note:"Mean about 68%, median about 84%: most fires either die early or burn most of the forest, so the mean describes almost none of them."},
    {t:"Where is the tipping point?",keys:["sweep"],target:"#sres",apply:()=>{},after:akClick("#srun",()=>!!S.missions.fire.d.sweep&&!!document.querySelector("#sres svg")),
      note:"The average burn shoots up between 0.55 and 0.6: the tipping point is about 0.56."},
    {t:"Challenge the rule (optional)",keys:["challenged"],target:"#cres",apply:()=>{},after:akClick("#crun",()=>!!document.querySelector("#cres table")),
      note:"The each-neighbour rule burns more: about 74% against about 63%."}],
  6:()=>[
    {t:"Tipping point",keys:withModel(["trial","sweep"]),target:".ex .result",apply:ensure,after:st=>st.d.sweep&&st.d.trial?false:runs(st),note:"≈ 0.56 density, from the sweep."},
    {t:"Advice: which thinning plan buys the most protection?",keys:["ad"],target:"[data-ad]",apply:st=>{st.d.ad="0.7-0.55"},note:"Thin from 0.7 to 0.55: the average burn drops from about 98% to about 38%, by far the biggest saving."},
    {t:"Spread: what usually happens?",keys:["sp"],target:"[data-sp]",apply:st=>{st.d.sp="two"},note:"Most fires either die early or burn most of the forest."},
    {t:"Why?",keys:["why"],target:"#why",apply:st=>{st.d.why="Above a density of about 0.56, trees are close enough that a fire almost always finds a path across the forest, so most fires burn nearly everything. Thinning from 0.7 to 0.55 takes the forest below the tipping point: the average burn drops from about 98% to about 38%."},note:"A sample answer. Look for a number from the sweep or the trials."},
    {t:"Limitations",keys:["lim"],target:"#lim",apply:st=>{st.d.lim="Real fires have wind and slopes, and a real forest has edges instead of wrapping around. Every square changes at the same moment. My rule gives a tree the same chance whether one neighbour burns or four, and the each-neighbour rule burns more. Lightning was off in the trials."},note:"A sample answer."}]}});
})();
