const ROOT=require('path').resolve(__dirname,'..');
// teacher opens a student whose diagram is part-way (new format, with mistakes): their diagram + what they tried
module.exports=async(p,H)=>{
  const dg={v:2,pl:{N:1,decay:1,k:1,H:1},ex:{t:1,N0:1},pipe:{decay:1},ln:{decay:["N"]},q:{},err:{"place:decay>stock":2,"ex:N0>clock":1,"pipe:decay:0":1,"link:H>decay":3,"link:decay>N":1}};
  const st=H.state({decay:{step:2,reached:3,opened:true,d:{dg,def:{n0:"100",h:"5730"}}},plans:{step:5,reached:5,opened:true,d:{}}},{sv:3,teacher:true});
  await H.open('class',st); await p.waitForTimeout(600);
  await p.click('.sname'); await p.waitForTimeout(300);
  await p.click('[data-sd="decay"]'); await p.waitForTimeout(300);
  console.log('links drawn:',await p.evaluate(()=>[...document.querySelectorAll('#sd-decay .dglink')].length),'| note:',await p.textContent('#sd-decay .sdnote'));
  console.log('tried:',await p.evaluate(()=>{const e=document.querySelector('#sd-decay .sderr'); return e?e.innerText.replace(/\s+/g,' '):'(none)'}));
  const box=await p.$('#sd-decay'); await box.screenshot({path:ROOT+'/shots/dg2_student_diagram.png'});
  // the student's own view of the same state
  await p.evaluate(()=>{location.hash='decay'}); await p.waitForTimeout(500);
  console.log('student phase:',await p.textContent('#dgtask h3'),'| links listed:',await p.$$eval('.dgnl',l=>l.map(x=>x.textContent).join(', ')));
};
