# ModelQuest: the Equation step

Added 10 Nov 2026 to all three pilot missions and to teacher-made problems. Companion to
*Block system and three pilot missions*.

## Flow

Every mission now runs **Understand → Define → Build → Equation → Test → Explain**. The new step sits after
Build so students formalize the block model they just made, then solve it, before validating in Test.
Saves and class progress from the five-step version are renumbered automatically (Test 3→4, Explain 4→5), and the
class dashboard has an eighth level, *Equation*, on the same one-hue ramp (re-validated).

## The four parts

Four parts, unlocked in order (teachers see all of them):

1. **Know your symbols** — match each symbol (math form, e.g. cost_A, N₀, p_immune) to its meaning; the matching
   block chip sits beside it. Once correct, the row shows its unit and role (you slide it / given / the model works it out).
2. **Write the equations** — build each equation from tiles (symbols, numbers, + − × ÷ ^ brackets, =). A live
   "Reads as" preview renders it as math, so missing brackets show up visually. Checking is by numeric equivalence at
   random points with the given values also randomized, so any correct arrangement passes but numbers-for-symbols
   does not. Known mistakes get targeted feedback (flat-fee fumble, `0.5^t/H` missing brackets, linear decay,
   `p_lightning·p_immune`, …). Hint 3 shows the student's *own blocks* rendered as an equation, when they are right.
   Their block program is shown read-only beside the builder.
3. **Make sense of the equations** — 3–4 multiple-choice questions on why the equation has its shape; every option
   carries an explanation.
4. **Final steps** — solve with chosen moves; each correct move adds the next line to a ledger with its note
   (−3g on both sides, power rule, …), then a numeric answer and an interpretation question.

## Per mission

| Mission | Equations built | Final steps |
|---|---|---|
| Plan Puzzle | cost_A = fixed_A + rate_A·g; cost_B = fixed_B + rate_B·g | cost_A = cost_B → g = 5 GB, $60 → Plan B at 8 GB |
| Decay Mystery | N = N₀·0.5^(t/H) | 41 = 100·0.5^(t/5730) → ln → t ≈ 7,370 yr → matches the age block |
| Wildfire Watch | P_near = 1 − p_immune; P_lone = p_lightning(1 − p_immune) | 0.0007 → 0.9993 → 0.9993¹⁰⁰⁰ ≈ 0.50 (about half of lone trees catch within 1,000 steps) |

## Teacher-made problems

Teacher-made problems get the same step generated from the teacher's formulas: symbols from the variable names,
one equation per output (up to 3), questions on direction and rate of change (rate only if linear), and a final step
that substitutes the story's numbers and computes the output. Teachers can add an Equation tip in the editor.

## Pilot note

Code **S-syntax** vs **S-math** separately for the Equation step (tile mechanics vs equation structure);
the missing-brackets mistake is now observable in both representations, which is worth comparing.
