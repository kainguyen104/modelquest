const ROOT=require('path').resolve(__dirname,'..');
module.exports=async(p,H)=>{
  const st=H.state({plans:{step:2,reached:2,d:{}}},{sv:3});
  await H.open('plans',st); await p.waitForTimeout(300);
  for(let i=0;i<3;i++){await p.click('#dghz #morehint'); await p.waitForTimeout(120)}
  console.log('hints shown:',await p.$$eval('#dghz .hcard',h=>h.length),'| last:',(await p.textContent('#dghz .hcard.now')).replace(/\s+/g,' ').slice(0,160));
  await (await p.$('#dghz')).screenshot({path:ROOT+'/shots/dg_hints.png'});
  console.log('solver:',await require(ROOT+'/tests/dgsolve.js')(p,'MISSIONS.plans.dg'));
  await p.click('#nextb'); await p.waitForTimeout(400);
  console.log('build back label:',(await p.textContent('#back')).trim(),'| step:',await p.evaluate(()=>JSON.parse(localStorage.getItem('modelquest.v4')).missions.plans.step));
  await p.click('#back'); await p.waitForTimeout(300); console.log('back to diagram:',await p.evaluate(()=>!!document.querySelector('.dgstep')),'| still done:',await p.evaluate(()=>!document.querySelector('#nextb').disabled));
  await H.shot('dg_back_done',true);
};
