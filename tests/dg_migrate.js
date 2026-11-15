const ROOT=require('path').resolve(__dirname,'..');
module.exports=async(p,H)=>{
  const st=H.state({decay:{step:3,reached:4,opened:true,d:{def:{n0:"100",h:"5730"},prog:{body:[]}}},fire:{step:5,reached:6,done:true,opened:true,d:{}},plans:{step:1,reached:1,opened:true,d:{}}},{sv:2});
  await H.open('decay',st); await p.waitForTimeout(400);
  const S=()=>p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('modelquest.v4')); return JSON.stringify({sv:s.sv,decay:[s.missions.decay.step,s.missions.decay.reached,s.missions.decay.dgSkip],fire:[s.missions.fire.step,s.missions.fire.reached,s.missions.fire.dgSkip],plans:[s.missions.plans.step,s.missions.plans.reached,s.missions.plans.dgSkip]})});
  await p.waitForTimeout(300); console.log('after load:',await S());
  console.log('decay mode pill:',await p.textContent('.mhead .mode'));
  const circ=async()=>p.$$eval('.steps-c .st',b=>b.map(x=>x.querySelector('.lab').textContent+(x.classList.contains('done')?'✓':x.classList.contains('on')?'●':x.disabled?'🔒':'○')).join(' '));
  console.log('decay steps:',await circ());
  await p.click('.steps-c .st[data-step="2"]'); await p.waitForTimeout(300);
  console.log('diagram opened:',await p.evaluate(()=>!!document.querySelector('.dgstep')),'| next disabled:',await p.evaluate(()=>document.querySelector('#nextb').disabled));
  console.log('solver:',await require(ROOT+'/tests/dgsolve.js')(p,'MISSIONS.decay.dg')); await p.waitForTimeout(200);
  console.log('decay steps after drawing:',await circ());
  await p.evaluate(()=>{location.hash='fire'}); await p.waitForTimeout(400); console.log('fire (done) steps:',await circ());
};
