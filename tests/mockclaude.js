// A test double for the claude.ai runtime: db (with the page's access rules), user, sample (canned AI), assets.
(()=>{
  const U=()=>JSON.parse(localStorage.getItem("mock.user")||'{"id":"u_teacher","name":"Ms. Rivera","canEdit":true,"isOwner":true}');
  const KEY="mock.db"; const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){return {}}};
  let data=load(); const subs=new Set(); const persist=()=>localStorage.setItem(KEY,JSON.stringify(data));
  const lvl=()=>U().canEdit?"admin":"interact";
  const canRead=p=>{const u=U(), seg=p.split("/"); if(seg[0]==="progress") return lvl()==="admin"||seg[1]===u.id; if(seg[0]==="keys") return lvl()==="admin"; return true};
  const canWrite=p=>{const u=U(), seg=p.split("/"); if(seg[0]==="progress") return lvl()==="admin"||seg[1]===u.id; if(["problems","keys","config"].includes(seg[0])) return lvl()==="admin"; return true};
  const clone=x=>x==null?x:JSON.parse(JSON.stringify(x)); const meta={fromCache:false,hasPendingWrites:false};
  const snapDoc=p=>{const ok=(p in data)&&canRead(p); return {id:p.split("/").pop(),exists:ok,data:()=>ok?clone(data[p]):undefined,metadata:meta}};
  const snapCol=c=>{const pre=c+"/"; const docs=Object.keys(data).filter(k=>k.startsWith(pre)&&!k.slice(pre.length).includes("/")&&canRead(k)).sort().map(snapDoc); return {docs,size:docs.length,empty:!docs.length,docChanges:()=>[],metadata:meta}};
  const notify=()=>subs.forEach(f=>f());
  const W=(p,fn)=>{if(!canWrite(p)) return Promise.reject({code:"invalid_argument",message:"not allowed"}); fn(); persist(); window.__writes=(window.__writes||[]).concat(p); setTimeout(notify,5); return Promise.resolve()};
  const doc=p=>({id:p.split("/").pop(),path:p,get:async()=>snapDoc(p),set:d=>W(p,()=>{data[p]=clone(d)}),update:d=>W(p,()=>{data[p]=Object.assign({},data[p],clone(d))}),delete:()=>W(p,()=>{delete data[p]}),
    onSnapshot(n){const f=()=>n(snapDoc(p)); subs.add(f); setTimeout(f,20); return ()=>subs.delete(f)},collection:s=>col(p+"/"+s)});
  const col=c=>{const q={path:c,doc:id=>doc(c+"/"+(id||Math.random().toString(36).slice(2))),get:async()=>snapCol(c),onSnapshot(n){const f=()=>n(snapCol(c)); subs.add(f); setTimeout(f,20); return ()=>subs.delete(f)},where:()=>q,orderBy:()=>q,limit:()=>q}; return q};
  const db=Object.freeze({doc,collection:col});
  const NAMES={u_teacher:"Ms. Rivera",u_s1:"Sam Lee",u_s2:"Priya Patel"};
  const user=Object.freeze({me:async()=>{const u=U(); return {id:u.id,name:u.name,email:null,avatarUrl:"",color:"#7C5CFF",isOwner:!!u.isOwner,canEdit:!!u.canEdit}},
    id:async()=>U().id,isOwner:async()=>!!U().isOwner,canEdit:async()=>!!U().canEdit,can:async n=>n==="data.write"?true:null,
    profiles:async ids=>Object.fromEntries((Array.isArray(ids)?ids:[ids]).map(i=>[i,{id:i,name:NAMES[i]||"",avatarUrl:"",color:"#999",email:null,isMe:i===U().id,guest:false}]))});
  const PROB={title:"Streaming showdown",topic:"Finance",area:"Linear functions",practices:["MP4","MP2"],grade:"Middle School",difficulty:"Easy",minutes:30,
    story:"Leo is choosing a streaming service. StreamA costs $15 a month. StreamB has a $50 sign-up fee, then costs $10 a month. Leo plans to keep the service for a year.",
    question:"Which service is cheaper for Leo, and after how many months does that change?",
    vars:[{key:"m",name:"months Leo keeps the service",unit:"months",kind:"in",min:0,max:24,step:1,start:12},{key:"fee_A",name:"StreamA's monthly price",unit:"$",kind:"par",val:15},
      {key:"join_B",name:"StreamB's sign-up fee",unit:"$",kind:"par",val:50},{key:"fee_B",name:"StreamB's monthly price",unit:"$",kind:"par",val:10},
      {key:"cost_A",name:"total cost of StreamA",unit:"$",kind:"out",formula:"fee_A * m"},{key:"cost_B",name:"total cost of StreamB",unit:"$",kind:"out",formula:"join_B + fee_B * m"}],
    assumptions:[{t:"Prices stay the same every month",ok:true,sug:true},{t:"Taxes are left out",ok:true},{t:"Leo pays for whole months only",ok:true},{t:"The sign-up fee is paid every month",ok:false,why:"The sign-up fee is paid once, at the start."}],
    goals:[{out:"cost_A",text:"Build cost_A: StreamA's total for m months",hints:["What does StreamA cost after 1 month? After 2?","Each month adds fee_A dollars.","Multiply the monthly price by the number of months."]},
      {out:"cost_B",text:"Build cost_B: StreamB's total for m months",hints:["What does StreamB cost after 0 months?","The sign-up fee is paid once; the monthly price is paid every month.","Start with join_B, then add a × block."]}],
    steps:{understand:"Picture Leo's bank statement after a few months.",define:"Every price you need is in the story.",build:"Build both totals, then plot them.",test:"Check month 0 first.",explain:"Use a number from your model."},
    explain:{prompt:"Which service should Leo choose for a year, and when would the other one be cheaper?"},explainAnswer:"StreamB: $170 vs $180 after 12 months. StreamA is cheaper before month 10.",
    solution:{steps:"cost_A = 15m\ncost_B = 50 + 10m\nEqual when 15m = 50 + 10m, so m = 10",answer:"StreamB for a year; StreamA for less than 10 months."},notes:"Check that a year means 12 months."};
  const reply=async(prompt,o={})=>{let out;
    if(/Suggest 4 different/.test(prompt)) out=[{title:"Pizza party budget",hook:"Can the class afford pizza for everyone?",model:"linear cost per slice"},{title:"Phone battery drain",hook:"Will your phone last the school trip?",model:"linear decrease"},{title:"Savings goal",hook:"When can you buy the new bike?",model:"linear growth with a start amount"},{title:"Streaming showdown",hook:"Which streaming service is cheaper?",model:"comparing two linear costs"}];
    else if(/^Check this ModelQuest/.test(prompt)) out={ok:false,issues:["The story says a year but the input range goes to 24 months; that's fine, but say so in the question."],praise:"The numbers in the story match the variables."};
    else if(/Here is a ModelQuest math-modeling problem as JSON/.test(prompt)){const j=JSON.parse(prompt.split("\n")[1]); j.difficulty="Medium"; j.notes="Made it a little harder: added a question about the break-even month."; j.question=(j.question||"")+" Find the break-even month."; out=j}
    else if(/uploaded a problem from a file/.test(prompt)) out=Object.assign({},PROB,{title:"Lemonade stand profit",topic:"Finance",story:"Maya runs a lemonade stand at the school fair. Renting the table costs $15 for the day. Each cup costs her $0.40 to make, and she sells each cup for $1.50.",
      question:"How many cups must she sell to break even?",vars:[{key:"c",name:"cups sold",unit:"cups",kind:"in",min:0,max:100,step:1,start:60},{key:"rent",name:"table rent",unit:"$",kind:"par",val:15},{key:"cost",name:"cost to make one cup",unit:"$",kind:"par",val:0.4},{key:"price",name:"price of one cup",unit:"$",kind:"par",val:1.5},{key:"profit",name:"Maya's profit",unit:"$",kind:"out",formula:"(price - cost) * c - rent"}],
      goals:[{out:"profit",text:"Build profit for c cups",hints:["What does Maya earn on one cup, after paying for it?","Each cup earns price − cost.","Multiply by c, then subtract the rent."]}],notes:"Kept the file's numbers. Added assumptions and hints."});
    else out=PROB;
    const t=JSON.stringify(out); if(o.onText){for(let i=200;i<t.length;i+=400){await new Promise(r=>setTimeout(r,15)); o.onText({text:t.slice(0,i),delta:t.slice(i-400,i)})} o.onText({text:t,delta:""})}
    window.__aiCalls=(window.__aiCalls||[]).concat(prompt.slice(0,60)); return out};
  const sample=Object.assign(async(input,o)=>({text:JSON.stringify(await reply(String(input),o)),truncated:false,modelTierApplied:"default"}),{json:(input,o)=>reply(String(input),o),limits:async()=>({maxPromptBytes:262144,images:{maxCount:5,maxInputBytes:2e7,mediaTypes:["image/png","image/jpeg"]},tools:{maxCount:8}})});
  const assets=Object.freeze({upload:async(b)=>{const id=Math.random().toString(16).slice(2).padEnd(32,"0").slice(0,32); return {id,url:"/_blob/"+id,sizeBytes:b.size,contentType:b.type}},list:async()=>({assets:[],usage:{}}),delete:async()=>({deleted:true})});
  window.claude={use:async n=>{await new Promise(r=>setTimeout(r,30)); return n==="db"?db:n==="user"?user:n==="sample"?sample:n==="assets"?(U().canEdit?assets:null):null}};
})();
