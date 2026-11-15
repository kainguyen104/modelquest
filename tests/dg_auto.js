const ROOT=require('path').resolve(__dirname,'..');
// the auto-drawn diagram for teacher problems, wide and narrow, for two made-up problems
module.exports=async(p,H)=>{
  await H.open('home',H.state({},{sv:3})); await p.waitForTimeout(300);
  const probs={
    stream:{id:"t1",title:"Streaming showdown",steps:{},vars:[{key:"m",name:"months Leo keeps the service",unit:"months",kind:"in",min:0,max:24,step:1,start:12},{key:"fee_A",name:"StreamA's monthly price",unit:"$",kind:"par",val:15},
      {key:"join_B",name:"StreamB's sign-up fee",unit:"$",kind:"par",val:50},{key:"fee_B",name:"StreamB's monthly price",unit:"$",kind:"par",val:10},
      {key:"cost_A",name:"total cost of StreamA",unit:"$",kind:"out",formula:"fee_A*m"},{key:"cost_B",name:"total cost of StreamB",unit:"$",kind:"out",formula:"join_B + fee_B*m"}]},
    lemon:{id:"t2",title:"Lemonade stand profit",steps:{diagram:"Start with what the stand earns."},vars:[{key:"c",name:"cups sold",unit:"cups",kind:"in",min:0,max:100,step:1,start:60},{key:"price",name:"price of one cup",unit:"$",kind:"par",val:1.5},
      {key:"rent",name:"table rent",unit:"$",kind:"par",val:20},{key:"supply",name:"supplies for one cup",unit:"$",kind:"par",val:0.4},
      {key:"revenue",name:"money from cups sold",unit:"$",kind:"out",formula:"price*c"},{key:"cost",name:"rent plus supplies",unit:"$",kind:"out",formula:"rent + supply*c"},{key:"profit",name:"what the stand keeps",unit:"$",kind:"out",formula:"revenue - cost"}]}};
  for(const k in probs){
    await p.evaluate(([pr,k])=>{const sp=autoDgSpec(pr); let box=document.querySelector('#dgtest'); if(!box){box=document.createElement('div'); box.id='dgtest'; box.style.cssText='position:absolute;left:0;top:0;z-index:999;background:#FEF6F2;padding:20px;width:'+Math.min(760,innerWidth)+'px'; document.body.appendChild(box)}
      box.innerHTML=`<div class="card dgboard" style="margin-bottom:20px">${dgStatic(sp,false)}</div><div class="card dgboard" style="width:${Math.min(360,innerWidth-40)}px">${dgStatic(sp,true)}</div>`;
      window.__q=sp.why.map(q=>q.q+' → '+q.opts.map(o=>(o.ok?'*':'')+o.h.replace(/<[^>]+>/g,'')).join(' | ')).join('\n')},[probs[k],k]);
    await p.waitForTimeout(150); await (await p.$('#dgtest')).screenshot({path:`${ROOT}/shots/dgauto_${k}.png`});
    console.log(k,'\n'+await p.evaluate(()=>window.__q));
  }
};
