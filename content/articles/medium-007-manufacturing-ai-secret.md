# 38 Employees, $53M Revenue. The Real Secret Isn't AI.

*Published in HARMONIC insight on Medium*

---

There's a manufacturing company in Ishikawa, Japan. 38 employees. $53 million in annual revenue.

Their AI system calculates optimal machining conditions from 57.6 trillion possible combinations. An untrained worker can produce the same quality output as a veteran craftsman with 30 years of experience.

The headlines say: *"AI automates manufacturing."*

That's the wrong takeaway.

---

## What Everyone Gets Wrong

When you hear "AI in manufacturing," you probably imagine:

* Cameras detecting defects on an assembly line
* Machine learning models trained on thousands of images
* A chatbot answering questions from a manual

None of that is what happened here.

---

What this company — Arum Inc. — actually did was far more fundamental.

They didn't start with AI.

**They started with their craftsmen's heads.**

---

## The Four Steps Nobody Talks About

### Step 1: Force-decompose intuition into physical variables

In 2015, Arum acquired a machining company staffed with engineers who had 20–30 years of experience.

These craftsmen made decisions by feel:

* The angle to approach the material
* How fast to move the cutting tool
* How deep to cut in a single pass
* The rotation speed of the spindle

Arum designed a proprietary input format and systematically forced these craftsmen to express every decision as a numerical value.

Not a vague interview. Not a video recording. Not "watch me and learn."

**A structured matrix of physical variables — angle, feed rate, depth of cut, spindle speed — for every combination of material and tool.**

This is the difference between *recording* knowledge and *parameterizing* it. Recordings can't be reused by a system. Parameters can.

---

### Step 2: Validate theory against reality

A craftsman's numbers carry personal bias. Safety margins that are too conservative. Settings that only work on a specific machine.

So Arum ran thousands of test cuts — varying tools, materials, and conditions.

They measured:

* Tool wear patterns
* Surface roughness of finished parts
* Cutting resistance
* Thermal variation

Then they merged the craftsman's theoretical values with physical measurements.

**Intuition became data. Data became science.**

---

### Step 3: Turn data into equations

This is the critical step.

They didn't throw the data into a neural network and hope for the best.

They applied **linear regression** — a statistical method that defines the mathematical relationship between input variables and optimal outputs.

```
X (input):  material hardness, tool diameter, blade length, cutting width...
Y (output): optimal rotation speed, feed rate...
```

*"For this material, with this tool, at this angle — what's the optimal speed?"*

The answer isn't retrieved from a database of past jobs. It's **calculated from an equation**, on the spot.

This is how 57.6 trillion machining conditions became computable — not stored, but derived.

---

### Step 4: Auto-extract variables from designs

Equations are useless if a human has to manually input every parameter.

Arum developed a proprietary shape analysis method called "half-edge analysis":

1. Slice 3D CAD data along the Z-axis
2. Capture XY coordinates at 5-micron pitch
3. Automatically classify the shape (threaded hole, reamer hole, pocket, etc.)
4. Trigger the appropriate equation based on shape type
5. Generate the complete NC program — **in about 3 minutes, fully automated**

---

## Here's the Problem: "It Took 10 Years" Is Not a Win

Read the above and you might think: *"Amazing. Let's do the same."*

**That impulse is exactly why most companies fail at AI.**

Arum acquired their machining company in 2015. They spent years — trial and error, proprietary formats, thousands of test cuts, custom-built analysis methods — to arrive at the system they have today.

**But "it took years and we finally got there" is not a methodology. It's a survival story.**

No company has 10 years to figure this out. Markets don't wait. Competitors don't wait. By the time you've reinvented the same wheel through trial and error, the window has closed.

| What Arum did | The real problem |
|---|---|
| Spent years designing a "proprietary format" | With a format design standard, this takes months, not years |
| Ran "extensive test cuts" through trial and error | No defined criteria for what "sufficient" testing looks like |
| Eventually arrived at linear regression | With a statistical method selection guideline, no trial and error needed |
| Developed half-edge analysis in-house | Company-specific technology, not transferable |

**The process that produced the success is itself trapped in people's heads. And it took a decade to emerge.**

This is the pattern I've seen across 28 years and 100+ companies: a company succeeds after years of struggle, the industry celebrates the outcome, everyone tries to replicate it without the blueprint — and they spend years failing. The rare company that eventually succeeds becomes the next celebrated case study.

**This cycle produces stories, not systems. And stories don't scale.**

---

## The Difference Between "Trying" and "Designing"

What Arum did retrospectively maps to a clear structure:

| Layer | What they did |
|---|---|
| **Source** | Craftsmen's tacit knowledge — the origin of all decisions |
| **Input** | Physical variables, parameterized and validated against test data |
| **Process** | Linear regression algorithms + shape analysis engine |
| **Output** | Auto-generated NC programs (57.6 trillion conditions, 3 minutes) |

But they arrived at this structure through years of iteration — not by design.

**What if you could define this structure from day one?**

That's what the SIPO framework does. SIPO (Source-Input-Process-Output) doesn't just say "define your source of truth." It specifies — for each step — three things:

| For each step | What it defines |
|---|---|
| **Procedure** | What to do, in what order |
| **Tools** | What specific tools to use, and how to use them |
| **Completion criteria** | How to know when the step is done |

### What Arum's case looks like when designed with SIPO:

| SIPO Step | Procedure | Tools | Completion Criteria |
|---|---|---|---|
| **Source identification** | List all 3 object types (Human, Material, Machine) and enumerate tacit knowledge held by each | Interview sheet + variable matrix template | Every decision factor is recorded as a numbered physical variable |
| **Input conversion** | Validate parameterized values against physical measurements, correct for theory-reality gaps | Test cuts + measurement instruments + statistical analysis (linear regression, etc.) | Deviation between theoretical and measured values is within defined tolerance |
| **Process design** | Build algorithms from validated data, connect to automated input analysis engine | Regression engine + shape analysis tool + CAD integration API | System produces computed output for unknown input data |
| **Output verification** | Confirm auto-generated output meets quality standards | Quality specification + sample output measurement | Output quality matches or exceeds expert-level baseline |

**Without this table, all you can do is "try." With this table, you can execute by design.**

### Why tool specification is non-negotiable

"Parameterize your experts' tacit knowledge" — anyone can say that.

The question is: **with what tool, and how?**

* What does the interview format look like? → SIPO provides a variable matrix template
* How do you choose the right statistical method? → SIPO includes selection guidelines based on data characteristics
* How do you know you've tested enough? → SIPO defines completion criteria with tolerance thresholds

A framework that only defines steps is just a to-do list. A framework that specifies tools and completion criteria **minimizes judgment and maximizes execution**.

---

## 10 Years Is Not a Strategy

Arum's result is impressive. 38 people, $53M revenue.

**But "it took 10 years of figuring it out" is not something to celebrate. It's something to eliminate.**

The question isn't "how did Arum succeed?" The question is: **how do you get the same result in months, not years — and in any industry, not just machining?**

That requires a design blueprint. Not steps alone — steps can be written on a napkin. A real blueprint specifies:

1. **What to do** (procedure)
2. **What to use** (tools — specific, named, with usage guidelines)
3. **When you're done** (completion criteria — measurable, not subjective)

SIPO provides all three, for every phase:

| SIPO Step | Procedure | Tools | Done when... |
|---|---|---|---|
| **Source** | Identify all knowledge holders and enumerate their tacit decisions | Interview sheet + variable matrix template | Every decision factor is a numbered variable |
| **Input** | Validate parameters against physical measurement | Test protocol + statistical analysis (selection guideline provided) | Theory-reality deviation within defined tolerance |
| **Process** | Build algorithms, connect to automated input parsing | Regression engine + domain-specific analysis tool | System produces output for unknown inputs |
| **Output** | Verify against expert baseline | Quality spec + sample measurement | Output quality meets or exceeds expert level |

**Arum took 10 years to discover this structure through trial and error. With SIPO, you start with it.**

That's not an incremental improvement. It's the difference between exploring a continent without a map and flying there with GPS coordinates.

---

*SIPO is a process design framework — not just steps, but tools and completion criteria for every phase. The goal: months, not years. Design, not luck. Learn more at [insight-office.com](https://www.insight-office.com/en).*
