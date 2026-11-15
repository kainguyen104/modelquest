const ROOT=require('path').resolve(__dirname,'..');
// tablet (touch, 820 wide, stacked layout): card strip above the diagram, questions under it with choices in a row
module.exports=async(p,H)=>{
  const st=H.state({plans:{step:2,reached:2,d:{}},fire:{step:2,reached:2,d:{}}},{sv:3});
  await H.open('plans',st); await p.waitForTimeout(400);
  const ovf=async()=>p.evaluate(()=>({docw:document.documentElement.scrollWidth-document.documentElement.clientWidth,tray:getComputedStyle(document.querySelector('.dgtray')||document.body).display}));
  console.log('plans start:',JSON.stringify(await ovf()));
  await (await p.$('#dgb')).screenshot({path:ROOT+'/shots/dg2t_start.png'});
  // drag a card down onto its box with touch-like pointer moves (mouse in this harness)
  console.log('solver:',await require(ROOT+'/tests/dgsolve.js')(p,'MISSIONS.plans.dg'));
  await p.evaluate(()=>{location.hash='fire'}); await p.waitForTimeout(500);
  const spec=await p.evaluate(()=>JSON.parse(JSON.stringify(MISSIONS.fire.dg)));
  for(const n of spec.nodes){await p.tap(`.dgcard[data-card="${n.id}"]`); await p.waitForTimeout(60); await p.tap(`[data-slot="${n.id}"]`); await p.waitForTimeout(60)}
  for(const x of spec.extras||[]){await p.tap(`.dgcard[data-card="${x.id}"]`); await p.waitForTimeout(60); await p.tap(x.to==='clock'?'#dgclock':`[data-start="${x.to}"]`); await p.waitForTimeout(60)}
  await p.waitForTimeout(300);
  console.log('fire pipes → dock:',await p.evaluate(()=>{const d=document.querySelector('#dgdock'); return d.hidden?'(hidden)':d.className+' | in '+d.parentNode.id}));
  await (await p.$('#dgb')).screenshot({path:ROOT+'/shots/dg2t_pipe.png'});
  console.log('fire solver:',await require(ROOT+'/tests/dgsolve.js')(p,'MISSIONS.fire.dg'));
  console.log('end:',JSON.stringify(await ovf()));
};
