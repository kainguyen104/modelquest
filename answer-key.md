# Answer key (teacher mode)

In teacher mode every step of every mission has a **Show answers** button in the bottom-right corner. The button is hidden in Student mode. The standalone site lets each browser choose Teacher mode in Settings. On the original Claude artifact it also requires edit access.

## How it works

- The button opens a small answer-key panel listing the step's tasks in order.
- **Show answer N** fills the next task's answer into the page: the Define fields and assumption ticks, the parts, pipes and connectors in the diagram, the blocks in the Build canvas, the equations and choices in the Equation step, the Test checks and runs, the Explain choices and sample answers. The step's own checks then run, so goals tick, the graph redraws, the lab can run the fire, and the checks go green. The panel scrolls to what was filled in and makes it glow for a moment.
- Answers come out the way students meet them: in Build, filling the first goals brings up the story pop-up with the next task, just as it does for students.
- **Show all** fills every task at once (no pop-ups). Clicking a task in the list fills everything up to it, or, if it's already filled in, scrolls to it.
- **Undo** puts the step back exactly as it was before the first answer went in. What was filled in, and what it replaced, is saved with the teacher's mission state, so Undo still works after a reload.
- Steps that run the model (Test, Explain) put the full reference model in first if the one on the page doesn't pass, and Undo takes that out again too.
- Understand has nothing to fill in, so its answers (the question, what we know, what the model works out, where the class should end up) appear as a card under the brief.
- The panel steps aside (bottom right or bottom left) when it would cover what was just filled in. It can also be dragged by its header (double-click puts it back) and closed with × or Escape. On phones it's a bottom sheet. Closed, the button shows how many answers are in, e.g. 3/7.
- Badges and their pop-ups stay quiet while answers go in. Teachers' state isn't shared with the class, so nothing reaches the class dashboard.

## What each step fills in

| Step | Tasks |
|---|---|
| Understand | four notes, shown as a card on the page |
| Define | each unit or value, then the assumptions to tick |
| Diagram | Build (every card placed), Pipes, Connect, then each Explore question answered, with its explanation opened |
| Build | the reference program, one goal at a time; Wildfire's last task chooses a fresh copy and runs a fire until it burns out |
| Equation | symbols, each equation, each "make sense" question, each solving move, the final answer, the interpretation |
| Test | runs the checks, fills the bug hunt, tries every log base (Decay), runs 200 fires, the sweep and the rule comparison (Wildfire) |
| Explain | the choices, plus sample Why? and Limitations answers; Decay's last task opens "One last check" with No picked; Wildfire runs its trials and sweep first if they're missing |

## Teacher-made problems

Generated from the problem itself: the given numbers, the assumptions, a set block built from each formula (a formula that uses something the blocks can't do, like min or sin, gets a note to build it by hand), the plot, the Equation answers from the same generated spec, the checks, and written Explain answers from the formulas and the story's numbers. If the teacher saved a model answer for Explain, it's used for the Answer box, and the worked solution shows in the Understand notes.

## Code

- `src/j7f_answers.js`: the engine (`akSync`, `akPaint`, `akFill`, `akUndo`, scroll-and-glow `akGo`, `akDodge`, drag), block makers (`BK`, `akAstBlock`), equation tiles (`akToks`), and the generated Diagram (`akDiagramTasks`) and Equation (`akEquationTasks`) tasks. Each task is `{t, keys, apply(st), after?, target, note}`: `apply` changes the mission state, the step re-renders from it, and `after` runs page actions such as Run.
- Built-in tasks: `akLazy(MISSIONS.x, …)` at the end of `j3_plans.js`, `j4_decay.js`, `j5_fire.js`. Teacher-made: `m.answers` in `customMission` (`j7b_custom.js`).
- State: `S.missions[id].ak[step] = {done:[…], snap:{key:{v}|{none}}}`.
- Hooks: `renderMission` calls `akSync(m,st)`; `route()` calls `akSync(null)`; `award()` is quiet while answers go in.
- Also fixed: Plan Puzzle's break-even box showed "5.0 GB · $60.08" because its search added 0.01 at a time and drifted; it now steps by whole hundredths and shows 5 GB · $60.
- Tests: `tests/ak_walk.js` (every step of the three missions from a blank state: fill, check the step's own checks, Undo) and `tests/ak_ui.js` (button placement, the panel stepping aside, drag, Escape, students can't see it).
