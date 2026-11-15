const ROOT=require('path').resolve(__dirname,'..');
module.exports=async(p,H)=>{
  const dg={sort:{N:"stock",decay:"flow",k:"conv",H:"conv"},try:{},pipe:{decay:1},ln:{decay:["N","H"],k:[]},lnOK:{},q:{}};
  const st=H.state({decay:{step:2,reached:3,opened:true,d:{dg,def:{n0:"100",h:"5730"}}},plans:{step:5,reached:5,opened:true,d:{}}},{sv:3,teacher:true});
  await H.open('class',st); await p.waitForTimeout(600);
  console.log('legend:',await p.$$eval('.lvlegend span',s=>s.slice(0,9).map(x=>x.textContent).join(' | ')));
  await p.click('#cl-sample'); await p.waitForTimeout(400);
  console.log('sample rows:',await p.$$eval('.hm tbody tr',r=>r.length),'| stuck:',await p.$$eval('.rbl',r=>r.slice(0,6).map(x=>x.textContent).join(' / ')));
  await H.shot('dg_class_sample',true);
  await p.click('#cl-sample'); await p.waitForTimeout(400);
  console.log('local cells:',await p.$$eval('.hm tbody tr:first-child .hcell',c=>c.map(x=>x.textContent).join(' | ')));
  await p.click('.sname'); await p.waitForTimeout(300);
  await p.click('[data-sd="decay"]'); await p.waitForTimeout(300);
  console.log('their diagram links:',await p.evaluate(()=>[...document.querySelectorAll('#sd-decay .dglink')].length),'| note:',await p.textContent('#sd-decay .sdnote'));
  await H.shot('dg_student_modal');
  const box=await p.$('#sd-decay'); await box.screenshot({path:ROOT+'/shots/dg_student_diagram.png'});
};
