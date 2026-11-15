// Runs the main test scripts one after another and prints a short summary.
// Each script is run through bt.js, which opens index.html in a headless browser.
const {execFileSync}=require('child_process'), path=require('path');
const T=['dg2_solve','dg2_flow','e2e_plans','e2e_decay','e2e_fire','dg_migrate','dg_hint','dg2_teacher','ak_walk','t_mock'];
let bad=0;
for(const t of T){process.stdout.write(t.padEnd(14));
  try{const out=execFileSync('node',[path.join(__dirname,'bt.js'),path.join(__dirname,t+'.js')],{encoding:'utf8',timeout:300000});
    const fail=/SCRIPT ERROR|PAGEERR/.test(out); if(fail) bad++; console.log(fail?'FAIL':'ok'); if(fail) console.log(out.split('\n').filter(l=>/SCRIPT ERROR|PAGEERR/.test(l)).join('\n'))}
  catch(e){bad++; console.log('FAIL', e.message.split('\n')[0])}}
console.log(bad?`${bad} failed`:'all passed'); process.exit(bad?1:0);
