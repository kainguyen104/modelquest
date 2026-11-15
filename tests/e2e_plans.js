const ROOT=require('path').resolve(__dirname,'..');
module.exports=async(p,H)=>{
  const st=H.state({plans:{step:2,reached:2,d:{def:{ug:"GB per month",uc:"$ per month",fA:"20",rA:"8",fB:"45",rB:"3",as:["fee","tax"]}}}},{sv:3});
  await H.open('plans',st);
  console.log('diagram step done:',await require(ROOT+'/tests/dgsolve.js')(p,'MISSIONS.plans.dg')); await H.shot('e2e_plans_dg',true); await p.click('#nextb'); await p.waitForTimeout(400);
  const closePop=async()=>{await p.waitForSelector('#modal .modal',{timeout:4000}); await H.shot('pl_pop_'+(Date.now()%1000)); await p.click('#modal [data-close].btn'); await p.waitForTimeout(150)};
  const lastSel=async(val)=>{const s=p.locator('#cv .stack.root > .b:last-child select.bsel').first(); await s.selectOption(val)};
  // cost_A by tapping
  await H.tap('v','Add set block cost_A'); await H.tap('m','Add + block'); await H.tap('v','Add variable block fixed_A');
  await H.tap('m','Add × block'); await H.tap('v','Add variable block rate_A'); await H.tap('v','Add variable block g');
  // cost_B: drag a set block from the library, then drag reporters into its slot
  await H.cat('v'); await H.drag('.flyout [aria-label="Add set block cost_A"]','#cv .stack.root',{ty:9999>0?undefined:0});
  await lastSel('cost_B');
  await H.cat('m'); await H.drag('.flyout [aria-label="Add + block"]','#cv .stack.root > .b:last-child .slot[data-slot]');
  await H.cat('v'); await H.drag('.flyout [aria-label="Add variable block fixed_B"]','#cv .stack.root > .b:last-child .slot:not(.fill)[data-slot]');
  await H.cat('m'); await H.drag('.flyout [aria-label="Add × block"]','#cv .stack.root > .b:last-child .slot:not(.fill)[data-slot]',{shot:'pl_dragging'});
  await H.tap('v','Add variable block rate_B'); await H.tap('v','Add variable block g');
  console.log('after A,B:\n'+(await H.goals()).join('\n'));
  await H.tap('g','Add plot block'); await H.tap('g','Add plot block'); await lastSel('cost_B');
  await closePop();
  console.log('after plots:\n'+(await H.goals()).join('\n'));
  await H.shot('pl_after_plots');
  // if-else that says the cheaper plan
  await H.tap('l','Add if-else block'); await H.tap('l','Add < block'); await H.tap('v','Add variable block cost_A'); await H.tap('v','Add variable block cost_B');
  const mouths=p.locator('#cv .mouth[data-stack]');
  await mouths.nth(0).click(); await H.tap('g','Add say block');
  await mouths.nth(1).click(); await H.tap('g','Add say block');
  const sayIns=p.locator('#cv .mouth .b input.bin'); await sayIns.nth(1).fill('Plan B'); await sayIns.nth(1).blur();
  await p.waitForTimeout(200);
  await closePop();
  console.log('after say:\n'+(await H.goals()).join('\n'));
  // family plan, with a variable of my own
  {const bb=await p.locator("#cv").boundingBox(); await p.mouse.click(bb.x+bb.width-30,bb.y+bb.height-30)} // deselect
  await H.cat('v'); await p.fill('#mkv','total'); await p.click('.mkvar button'); await p.waitForTimeout(200);
  await H.tap('v','Add set block cost_A'); await lastSel('total');
  await H.tap('m','Add + block'); await H.tap('m','Add + block'); await H.tap('v','Add variable block base_F');
  await H.tap('m','Add × block'); await H.tap('v','Add variable block line_F'); await H.tap('v','Add variable block n');
  await H.tap('m','Add × block'); await H.tap('v','Add variable block gb_F'); await H.tap('m','Add × block'); await H.tap('v','Add variable block n'); await H.tap('v','Add variable block g');
  await H.tap('v','Add set block cost_A'); await lastSel('family_each'); await H.tap('m','Add ÷ block'); await H.tap('v','Add variable block total'); await H.tap('v','Add variable block n');
  await H.tap('g','Add plot block'); await lastSel('family_each');
  console.log('final:\n'+(await H.goals()).join('\n'));
  console.log('next enabled:',await p.evaluate(()=>!document.querySelector('#nextb').disabled));
  await H.shot('pl_final'); await H.shot('pl_final_full',true);
  // undo + clear confirm + drag to trash
  await p.click('[data-tool="undo"]'); console.log('after undo goals ok count:',(await H.goals()).filter(g=>g.startsWith('✓')).length);
  await lastSel('family_each'); console.log('redo by hand ok:',(await H.goals()).filter(g=>g.startsWith('✓')).length);
  // problem info
  await p.click('#probbtn'); await p.waitForTimeout(200); await H.shot('pl_problem'); await p.hover('.probbody .vchip >> nth=2'); await p.waitForTimeout(120); await H.shot('pl_problem_hover'); await p.click('#modal [data-close].btn');
  // hover a variable in the canvas
  await p.hover('#cv .b.vr >> nth=0'); await p.waitForTimeout(150); await H.shot('pl_hover');
  // reload: program persists
  await p.reload(); await p.waitForSelector('#goals .goal'); await p.waitForTimeout(300); console.log('after reload:\n'+(await H.goals()).join('\n'));
  // Test step
  await p.click('#nextb'); await p.waitForTimeout(400); console.log('equation step done:',await require(ROOT+'/tests/eqsolve.js')(p,'MISSIONS.plans.eq')); await H.shot('e2e_plans_eq',true); await p.click('#nextb'); await p.waitForTimeout(300); await p.click('#runall'); await p.fill('#b1','8'); await p.fill('#b2','20'); await p.click('#bcheck');
  await p.waitForTimeout(200); console.log('test passed:',await p.evaluate(()=>document.querySelectorAll('.status.pass').length),'explain enabled:',await p.evaluate(()=>!document.querySelector('#nextb').disabled));
  await H.shot('pl_test',true);
  await p.click('#nextb'); await p.waitForTimeout(300); await H.shot('pl_explain',true);
  await p.selectOption('#a1','B'); await p.selectOption('#a2','F'); await p.fill('#why','Plan B costs more to start, but at 8 GB it is $69 vs $84.'); await p.click('#sub'); await p.waitForTimeout(1200);
  console.log('done:',await p.evaluate(()=>JSON.parse(localStorage.getItem('modelquest.v4')).missions.plans.done));
  require('fs').writeFileSync(ROOT+'/tests/fx_plans.json',await p.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('modelquest.v4')).missions.plans)));
};
