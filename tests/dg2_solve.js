const ROOT=require('path').resolve(__dirname,'..');
// the keyboard solver finishes every mission's diagram (student), and the saved state says done
module.exports=async(p,H)=>{
  const st=H.state({decay:{step:2,reached:2,d:{def:{n0:"100",h:"5730",as:["half","clean"]}}},plans:{step:2,reached:2,d:{}},fire:{step:2,reached:2,d:{}}},{sv:3});
  await H.open('decay',st);
  for(const id of ['decay','plans','fire']){
    await p.evaluate(id=>{location.hash=id},id); await p.waitForTimeout(500);
    const ok=await require(ROOT+'/tests/dgsolve.js')(p,`MISSIONS.${id}.dg`);
    await p.waitForTimeout(200);
    console.log(id,'solved:',ok,'| saved:',await p.evaluate(id=>{const d=JSON.parse(localStorage.getItem('modelquest.v4')).missions[id].d.dg; return JSON.stringify({done:d.done,errs:Object.keys(d.err||{}).length})},id));
  }
};
