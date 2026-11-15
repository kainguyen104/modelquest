# Diagram step (stock-and-flow diagrams)

Added November 2026; rebuilt as a drag-and-drop workbench the same month. Every mission has a **Diagram** step between Define and Build, so students draw the model before they code it, following the system-dynamics notation in Shiflet & Shiflet, *Introduction to Computational Science* (Module 2.2 onward).

Steps are: Understand 0, Define 1, **Diagram 2**, Build 3, Equation 4, Test 5, Explain 6.

## The notation (as in the book)

| Part | Drawn as | Meaning |
|---|---|---|
| Stock | lavender box, "starts at …" inside | a quantity that builds up or drains away |
| Flow | grey pipe with a yellow valve, arrow shows direction | a rate that fills or drains a stock |
| Converter | white circle | a constant, or a quantity worked out from others |
| Connector | thin blue curved arrow | "is used to work out" |
| Spiral | ink spiral at a pipe's end | outside the model (source or sink) |

Starting values are written inside the stock box (as the book does). The clock (t, g, or step) is a pill above the diagram, not a shape.

## What students do

One workbench: task pills on top (**Build → Pipes → Connect → Explore**), the diagram on the right, and a side column on the left. Nothing is a separate list below the diagram.

1. **Build**: the cards (every quantity, plus the clock and the starting values) sit in the side column. Students drag each card onto the diagram's empty shapes: a stock into a dashed box, a flow into a valve, a converter into a circle, the clock card onto the clock pill, a starting value into the "starts at" space inside its box. A card dropped on the wrong kind of shape bounces back with feedback about why (unit, what builds up, what's a rate). A card dropped on the right kind of shape but the wrong spot snaps to its own spot.
2. **Pipes**: a question about the ringed valve asks where each flow moves its stuff from and to. A right answer draws the pipe with its arrow.
3. **Connect**: drag from a quantity to the flow or converter it helps work out (a rubber band follows the pointer). Right: the blue connector draws in. Backwards: "Turn it around". Into a stock: "only pipes change a stock". Not needed: a "would it change?" prompt, and the attempted arrow flashes red.
4. **Explore**: 3–4 questions, each about one part of the finished diagram, ending with one that bridges to the code.

Throughout, students can **hover** (or tap, or focus with the keyboard) any part of the diagram, including connectors, pipes and the clock, to read an info card: what it is, its unit, what it starts at, what fills or drains it, what it's worked out from and what it helps work out. The card shows only what has been drawn so far. Hovering an entry in the "Your diagram" record beside the diagram (a part or a connector) shows the same card and rings that part in the diagram.

**Where questions appear.** Questions never cover the diagram. On wide screens they sit at the top of the side column, right beside the diagram; on tablets and phones they sit right under it. The part a question is about is ringed in the diagram (a connector or pipe gets a halo), and the panel says "About *part*, ringed in the diagram". Short feedback on drops and connectors appears as a small bubble beside the part instead, placed by a scorer that avoids covering shapes, connectors and pipes.

When the diagram is done, the task bar explains how the diagram turns into code (the spec's `toCode` text, e.g. the decay formula or "each become block is a pipe"), and the finished diagram is added to **Problem info** for the later steps. Hints (3 levels) follow the same pattern as Build. Teachers get "Show the answer" and can jump to any task by its pill.

## Phones, touch and keyboard

- Phones: the cards become one strip you swipe sideways, so the diagram sits right under them. Drag a card down onto the diagram, or tap a card and then tap its spot (empty spots light up). Connectors: drag, or tap one shape and then the other. After Build, the diagram moves above the "Your diagram" record. A narrow `tall` layout is used below 560 px.
- Keyboard: Enter on a card picks it, Enter on a spot drops it; in Connect, Enter on one shape then another draws a connector; Escape cancels. All shapes are focusable buttons with labels.
- Dragging near the top or bottom of the window scrolls the page.

## The three missions

- **Decay Mystery** (like the book's carbon-14 and aspirin models): stock N (starts at N₀ = 100%) → flow `decay` → spiral. Converters k (decay constant) ← H (half-life). Connectors N → decay, k → decay, H → k. Clock: t. Extra cards: t (clock), N₀ (starts N).
- **Plan Puzzle**: each bill is a stock filled as she uses data; clock is g. Spiral → `charge_A` → cost_A (starts at fixed_A = $20), rate_A → charge_A; same for Plan B. Extra cards: g, fixed_A, fixed_B. Bridge: cost_A = fixed_A + rate_A × g.
- **Wildfire Watch** (like the book's SIR model): trees → `catch_fire` → burning → `burn_out` → burned. Converters P_near ← p_immune; P_lone ← p_lightning, p_immune. Connectors trees, burning, P_near, P_lone → catch_fire; burning → burn_out. Clock: step. Bridge: each "become" block is a pipe.

## Teacher-made problems

Their models are closed-form formulas, so the diagram is drawn automatically as converters joined by connectors (an influence diagram), laid out as a flowchart: inputs and given numbers on the left, outputs on the right. Students skip Build and Pipes: they drag the connectors for each output and answer two auto-generated questions (what an arrow means; what changes when an input changes). A teacher can add a step tip under **Diagram** in the editor.

## Class dashboard

9 levels (Not started, Understand, Define, Diagram, Build, Equation, Test, Explain, Done). "Where students are stuck" names the diagram task (Build the diagram, Point the pipes, Draw the connectors, Explore your diagram). A student's "Show their diagram" draws what they have so far (unplaced shapes dashed) and lists **Tried along the way**: their wrong moves with counts, e.g. "H → decay ×3 · decay in a box ×2 · N₀ in the clock · decay pipe: “Into N, from outside the model”".

## Data and compatibility

- Student state: `st.d.dg = {v:2, pl, ex, pipe, ln, q, err, done}`: placed cards, placed extras (clock, starting values), pipe answers, connectors drawn, question answers, and a count of each wrong move (`err` keys such as `place:decay>stock`, `ex:N0>clock`, `link:H>decay`, `pipe:decay:0`, `q:loop:0`).
- Saves from the earlier list version (`{sort, try, pipe, ln, lnOK, q, done}`) are converted on load by `dgNorm`: right sorts become placed cards, right connectors are kept, and a finished diagram stays finished.
- Saves carry `sv: 3`. Older saves (sv 1 and 2) are renumbered on load and on cloud restore; anyone already past Define gets `dgSkip`, so the Diagram step is open to them but not ticked until they draw it.

## Code

- `src/j7e_diagram.js`: shared drawing (`dgGeo`, `dgCurve`, `dgSVG`, `dgStatic`), `dgNorm`, `dgViewOf`, `dgErrList`, the workbench `diagramStep`, and `autoDgSpec` for teacher problems.
- Specs: `const DG={…}` in `j3_plans.js`, `j4_decay.js`, `j5_fire.js` (`MISSIONS.x.dg`): nodes, `extras` (cards with `to:"clock"` or `to:<stock>`), pipes with questions, links, `why` questions with an `at` key (node id, `"a>b"`, `"start:id"`, `"clock"`), hints, and a wide and a `tall` layout.
- Styles: the "diagram step (stock-and-flow, built by drag and drop)" block in `p1_head.html`.
- Tests (`tests/`): `dg2_flow.js` (full drag flow with one mistake of each kind), `dgsolve.js` (finishes the step by keyboard from the page's own spec; used by the e2e tests and `t_mock.js`), `dg2_solve.js`, `dg2_phone.js` (touch, 390 px), `dg2_teacher.js`, `dg_teacher.js`, `dg_migrate.js`, `dg_hint.js`, `dg_auto.js`.
