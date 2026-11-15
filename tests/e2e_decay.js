const ROOT=require('path').resolve(__dirname,'..');
module.exports=async(p,H)=>{
  const st=H.state({decay:{step:1,reached:1,d:{}}});
  await H.open('decay',st);
  // Define: values + assumptions (pick a wrong one first)
  await p.fill('#d-n0','100'); await p.fill('#d-h','5730'); await p.check('[data-as="lin"]');
  console.log('define fb (wrong pick):',await p.textContent('#asfb'),'| next disabled:',await p.evaluate(()=>document.querySelector('#dnext').disabled));
  await H.shot('dc_define',true);
  await p.uncheck('[data-as="lin"]'); await p.check('[data-as="clean"]');
  console.log('define fb:',await p.textContent('#asfb'),'| next disabled:',await p.evaluate(()=>document.querySelector('#dnext').disabled));
  await p.click('#dnext'); await p.waitForTimeout(300);
  console.log('diagram step done:',await require(ROOT+'/tests/dgsolve.js')(p,'MISSIONS.decay.dg')); await H.shot('e2e_decay_dg',true); await p.click('#nextb'); await p.waitForTimeout(400);
  const closePop=async(n)=>{await p.waitForSelector('#modal .modal',{timeout:4000}); await H.shot('dc_pop'+n); await p.click('#modal [data-close].btn'); await p.waitForTimeout(150)};
  const lastSel=async(val,root='#cv .stack.root > .b:last-child')=>{await p.locator(root+' select.bsel').first().selectOption(val)};
  // a linear first try to see the feedback
  await H.tap('v','Add set block N'); await H.tap('m','Add − block'); await H.tap('v','Add variable block N0'); await H.tap('m','Add × block');
  await p.locator('#cv input.bin[value=""]').first().fill('50'); await H.tap('m','Add ÷ block'); await H.tap('v','Add variable block t'); await H.tap('v','Add variable block H');
  console.log('linear try:\n'+(await H.goals()).join('\n'));
  await p.click('[data-tool="clear"]'); await p.click('[data-tool="yes"]');
  // N = N0 × 0.5 ^ (t ÷ H)
  await H.tap('v','Add set block N'); await H.tap('m','Add × block'); await H.tap('v','Add variable block N0'); await H.tap('m','Add ^ block');
  await p.locator('#cv input.bin[value=""]').first().fill('0.5'); await H.tap('m','Add ÷ block'); await H.tap('v','Add variable block t'); await H.tap('v','Add variable block H');
  await H.tap('g','Add plot block');
  await closePop(1);
  console.log('after N:\n'+(await H.goals()).join('\n'));
  // age = H × (ln(f ÷ N0) ÷ ln(0.5))
  await H.tap('v','Add set block N'); await lastSel('age'); await H.tap('m','Add × block'); await H.tap('v','Add variable block H'); await H.tap('m','Add ÷ block');
  await H.tap('m','Add function block'); await H.tap('m','Add ÷ block'); await H.tap('v','Add variable block f'); await H.tap('v','Add variable block N0');
  await H.tap('m','Add function block'); await p.locator('#cv input.bin[value=""]').first().fill('0.5');
  await p.waitForTimeout(150); console.log('age built:\n'+(await H.goals()).join('\n')); console.log(await p.evaluate(()=>{const f=n=>n&&typeof n==='object'?n.type+(n.f.v?'['+n.f.v+']':'')+(n.f.fn?'['+n.f.fn+']':'')+'('+Object.values(n.a).map(f).join(', ')+')':JSON.stringify(n); return JSON.parse(localStorage.getItem('modelquest.v4')).missions.decay.d.prog.body.map(f).join('\n')}), await p.evaluate(()=>[...document.querySelectorAll('#cv .b.bad')].map(b=>b.title).join(' | ')));
  await closePop(2);
  console.log('after age:\n'+(await H.goals()).join('\n'));
  await H.shot('dc_build_age');
  // loop: left, k
  await H.cat('v'); await p.fill('#mkv','left'); await p.click('.mkvar button'); await p.waitForTimeout(150); await p.fill('#mkv','k'); await p.click('.mkvar button'); await p.waitForTimeout(150);
  await H.tap('v','Add set block N'); await lastSel('left'); await H.tap('v','Add variable block N0');
  await H.tap('v','Add set block N'); await lastSel('k'); await p.locator('#cv .stack.root > .b:last-child input.bin').fill('0');
  await H.tap('o','Add repeat until block'); await H.tap('l','Add < block'); await H.tap('v','Add variable block left'); await p.locator('#cv input.bin[value=""]').first().fill('1');
  // say a typed number first, to see the feedback
  const loopMouth=p.locator('#cv .stack.root > .b:last-child > .mouth');
  await loopMouth.click(); await H.tap('v','Add set block N'); await lastSel('left','#cv .stack.root > .b:last-child > .mouth > .b:last-child');
  await H.tap('m','Add × block'); await H.tap('v','Add variable block left'); await p.locator('#cv input.bin[value=""]').first().fill('0.5');
  await H.tap('v','Add change block left'); await lastSel('k','#cv .stack.root > .b:last-child > .mouth > .b:last-child');
  {const bb=await p.locator('#cv').boundingBox(); await p.mouse.click(bb.x+bb.width-30,bb.y+bb.height-30)}
  await H.tap('g','Add say block'); await p.locator('#cv .stack.root > .b:last-child input.bin').fill('7'); await p.waitForTimeout(100);
  console.log('typed say:\n'+(await H.goals()).slice(-1).join('\n'));
  await p.locator('#cv .stack.root > .b:last-child input.bin').fill(''); await H.tap('v','Add variable block k');
  console.log('final:\n'+(await H.goals()).join('\n'));
  console.log('next enabled:',await p.evaluate(()=>!document.querySelector('#nextb').disabled), '| console:',await p.textContent('#out'));
  await H.shot('dc_final'); await H.shot('dc_final_full',true);
  // f slider changes the chart
  await p.click('#nextb'); await p.waitForTimeout(400); console.log('equation step done:',await require(ROOT+'/tests/eqsolve.js')(p,'MISSIONS.decay.eq')); await H.shot('e2e_decay_eq',true); await p.click('#nextb'); await p.waitForTimeout(300); await p.click('#runall'); await p.fill('#b1','0'); await p.fill('#b2','-50'); await p.click('#bcheck');
  for(const b of ['e','10','2']) await p.click(`[data-b="${b}"]`);
  console.log('test passed:',await p.evaluate(()=>document.querySelectorAll('.status.pass').length),'explain enabled:',await p.evaluate(()=>!document.querySelector('#nextb').disabled));
  await H.shot('dc_test',true);
  await p.click('#nextb'); await p.waitForTimeout(300); console.log('age shown:',await p.textContent('.result .v'));
  await p.fill('#why','25% left is two half-lives: 2 × 5,730 = 11,460 years.'); await p.click('#sub'); await p.waitForTimeout(300); await p.click('[data-tw="no"]'); await p.click('#twgo'); await p.waitForTimeout(800);
  console.log('done:',await p.evaluate(()=>JSON.parse(localStorage.getItem('modelquest.v4')).missions.decay.done));
  require('fs').writeFileSync(ROOT+'/tests/fx_decay.json',await p.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('modelquest.v4')).missions.decay)));
};
