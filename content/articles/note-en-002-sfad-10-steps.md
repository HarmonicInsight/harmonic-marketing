# SFAD: A 10-Step Methodology for Structured Vibe Coding

*Published on note.com — HARMONIC insight (English)*

---

In my previous article, I explained why vibe coding fails in enterprise settings. The short version: **the AI is powerful, but the process is missing.**

Today, I'm going to show you the process.

It's called **SFAD — Screen First AI Development**. It's a 10-step methodology for building production-grade business applications with AI, designed for teams that understand their business but don't have dedicated engineering resources.

I developed this methodology over 28 years of enterprise system implementation — and refined it over the last two years by applying AI-assisted development (specifically Claude Code) to real business projects.

This isn't theory. Every step has been tested on real systems in production.

---

## The Core Philosophy: Three Zeros

Before the steps, you need to understand the mindset.

SFAD is built on three principles:

| Principle | Meaning |
|---|---|
| **Zero Time** | Eliminate waiting. No 6-month waterfall. Prototype in hours, iterate in days. |
| **Zero Effort** | Let the AI do the heavy lifting. Your job is to think, not to type. |
| **Zero Mistakes** | Structure prevents errors. Each step validates before moving forward. |

These aren't aspirational goals. They're design constraints. Every step in SFAD is designed to minimize time, effort, and mistakes simultaneously.

---

## The 10 Steps

Here's the complete methodology, from zero to production.

```
Step 1   Project Setup
Step 2   Central Backlog
Step 3   Menu Structure
Step 4   Screen Design
Step 5   Excel I/O
  ↑ Prototype Phase (Excel-driven, no database)
  ────────────────────────────────────
  ↓ Production Phase (database, auth, deploy)
Step 6   Priority Build
Step 7   DB Migration
Step 8   Feedback Loop
Step 9   Access Control
Step 10  Production Release
```

The key insight: **Steps 1-5 use Excel as the database.** This isn't a shortcut — it's a strategy. Your users already know Excel. By keeping the data in Excel during the prototype phase, you remove the infrastructure barrier and let everyone focus on whether the application actually solves the problem.

Database migration happens in Step 7, *after* the business logic is proven.

Let me walk through each step.

---

### Step 1: Project Setup

**Input:** A business problem that needs a software solution
**Output:** A configured development environment ready to go

This is where most teams already lose structure. They open an AI coding tool and start prompting randomly.

In SFAD, Step 1 is deliberate:

1. Create a GitHub repository with a defined structure
2. Set up Next.js with the SFAD starter template
3. Configure Claude Code with a project-specific `CLAUDE.md` file
4. Connect Vercel for instant preview deployments

**Why `CLAUDE.md` matters:** This file tells the AI *how* to work on your project. It defines naming conventions, file structure, coding patterns, and project-specific rules. Without it, the AI makes its own decisions — and those decisions won't be consistent.

Think of `CLAUDE.md` as the onboarding document you'd give a new developer. Except this developer writes code at 100x speed and follows instructions literally.

**Completion criteria:** You can run `claude` in your project directory and the AI understands your project context.

---

### Step 2: Central Backlog

**Input:** Business requirements (usually scattered across emails, meeting notes, and people's heads)
**Output:** A single Excel file containing every requirement, prioritized

This is the most underrated step in the entire methodology.

Most vibe coding projects fail because requirements live in someone's head. When they prompt the AI, they describe what they remember — not what the business actually needs.

SFAD uses a **Central Backlog** — a single Excel file with every requirement:

| ID | Feature | Priority | Phase | Status | Notes |
|---|---|---|---|---|---|
| REQ-001 | Upload asset list from Excel | Must | 1 | Pending | Current process uses shared Excel on file server |
| REQ-002 | Display assets in searchable table | Must | 1 | Pending | Users need to find assets by location/category |
| REQ-003 | Export filtered data to Excel | Should | 1 | Pending | Monthly reporting requirement |
| REQ-004 | Role-based access control | Must | 2 | Pending | 4 role levels: admin/manager/editor/viewer |

**Why Excel, not Jira?** Because your stakeholders — the department managers, the operations leads, the people who actually know the business — already use Excel. Asking them to learn Jira is a barrier. Asking them to review an Excel file is not.

**The critical distinction:** SFAD separates **requirements** from **improvement requests**. Requirements are defined upfront and don't change within a phase. Improvement requests go into a separate backlog for the next phase. This prevents scope creep — the #1 killer of enterprise projects.

**Completion criteria:** Every stakeholder has reviewed the backlog and agreed on Phase 1 priorities.

---

### Step 3: Menu Structure

**Input:** Central Backlog (prioritized)
**Output:** Application menu structure agreed upon by stakeholders

Before writing any code, you need agreement on what the application *looks like* at the highest level.

This means sitting with stakeholders and defining:

- What are the main menu items?
- What pages does each menu item lead to?
- Who has access to which menu items?

```
Asset Management System
├── Dashboard (KPIs, charts)
├── Asset List (search, filter, export)
├── Asset Upload (Excel import)
├── Reports
│   ├── Monthly Summary
│   └── Category Breakdown
└── Settings (admin only)
    ├── User Management
    └── Category Master
```

This takes 30 minutes in a meeting. But it prevents weeks of rework.

**Why this matters for AI development:** When you prompt the AI to build a feature, you can now say "build the Asset List page as defined in the menu structure" instead of "build some kind of asset listing thing." Precision in prompting comes from precision in planning.

**Completion criteria:** A menu structure document that stakeholders have signed off on.

---

### Step 4: Screen Design

**Input:** Menu structure + Central Backlog
**Output:** Screen layout designs for each page

This is where SFAD and traditional development diverge sharply.

In traditional development, screen design means Figma mockups, design reviews, pixel-perfect specifications. That takes weeks.

In SFAD, screen design means **collaborating with the AI to generate actual screens:**

1. You describe the screen purpose and data to Claude Code
2. Claude Code generates a working page
3. You show it to stakeholders on a Vercel preview URL
4. They give feedback on a *working* screen, not a static mockup
5. You iterate with the AI until it's right

**The key advantage:** Stakeholders are reviewing a real, interactive application — not a picture of one. They can click buttons, scroll tables, and say "this column should be wider" or "I need a filter here" with zero ambiguity.

**Completion criteria:** Every page in the menu structure has a working screen design that stakeholders have approved.

---

### Step 5: Excel I/O

**Input:** Approved screen designs + sample Excel data from current operations
**Output:** Working data flow: Excel upload → display → export

This is the step that proves the concept works.

You take the actual Excel files that the business currently uses — the ones sitting on the shared drive — and make the application read them.

```
Current State:
  Shared Drive → Excel File → Manual lookup → Manual reporting

After Step 5:
  Excel Upload → Web App → Search/Filter → Excel Export
```

**Why this is powerful:** The moment a department manager uploads their real data and sees it displayed in a searchable, filterable web interface, they understand the value. No demo data. No fake scenarios. *Their* data, in a better format.

At this point, you have a working prototype with no database, no authentication, no deployment complexity. Just Excel in, application out. And it's running on a Vercel preview URL that anyone can access.

**This is the "aha moment" for stakeholders.** Everything after this step is refinement.

**Completion criteria:** Users can upload their real Excel files and see their data in the application.

---

### Step 6: Priority Build

**Input:** Validated prototype + Central Backlog Phase 1 items
**Output:** All Phase 1 features implemented and validated

Now you build features in priority order from the Central Backlog.

The AI accelerates this dramatically. But the methodology keeps it structured:

1. Pick the highest-priority unfinished requirement
2. Prompt the AI with specific context: the requirement, the existing code, the screen design
3. Review and test the output
4. Deploy to Vercel preview
5. Get stakeholder validation
6. Mark the requirement as complete
7. Repeat

**One requirement at a time.** Not five. Not "build all the remaining features." One. Validate. Next.

**Completion criteria:** All Phase 1 requirements are marked as complete in the Central Backlog.

---

### Step 7: DB Migration

**Input:** Working application with Excel-based data
**Output:** Same application, now running on a proper database (Neon + Prisma)

This is where the application becomes production-grade.

Up to this point, the data lived in Excel files. That was fine for prototyping and validation. But for production, you need:

- Persistent storage
- Concurrent access
- Data integrity
- Query performance

SFAD uses **Neon** (serverless Postgres) and **Prisma** (ORM) because:

- Neon is free for small projects and scales automatically
- Prisma generates type-safe database code from a schema definition
- Claude Code is exceptionally good at Prisma migrations

**The migration process:**

1. Define the Prisma schema based on the Excel column structure (the AI does this)
2. Generate the migration (Prisma CLI)
3. Update the data access layer to use Prisma instead of Excel parsing
4. Import existing Excel data into the database
5. Verify that the application works identically

**Why wait until Step 7?** Because migrating to a database before the business logic is proven is wasted effort. If stakeholders change their mind about the data structure in Step 4, you'd have to redo the migration. By waiting until the prototype is validated, you migrate once.

**Completion criteria:** The application runs on Neon/Prisma with all existing data migrated.

---

### Step 8: Feedback Loop

**Input:** Production-ready application + user feedback
**Output:** Improvement requests implemented, application refined

Now that real users are using the application, feedback comes in.

SFAD handles this with a strict separation:

- **Bug:** Something doesn't work as specified → Fix immediately
- **Improvement request:** "It would be nice if..." → Goes into the improvement backlog
- **New requirement:** Major new functionality → Goes into the next Phase

The AI handles improvement requests efficiently:

1. User submits feedback (via form, email, or meeting)
2. You add it to the improvement backlog (Excel)
3. You prioritize with stakeholders
4. You prompt the AI: "Implement this improvement: [description]. Current code is [file]. Expected behavior is [specification]."
5. Review, test, deploy

**The discipline:** Not every request gets implemented. Not every request gets implemented *now*. The backlog and prioritization prevent the application from becoming a feature graveyard.

**Completion criteria:** All critical improvement requests are addressed. The application is stable.

---

### Step 9: Access Control

**Input:** Stable application + access control requirements from Central Backlog
**Output:** Role-based access control implemented

Access control comes late in SFAD — deliberately.

Building authentication and authorization in Step 1 is a common mistake. You spend days on login screens and role management before the application even does anything useful.

In SFAD, access control is layered on after the application works:

**Four access levels:**

| Level | Example | Can do |
|---|---|---|
| Admin | System administrator | Everything |
| Manager | Department head | View all, edit own department |
| Editor | Team member | View and edit assigned items |
| Viewer | Executive, auditor | View only |

The AI generates the middleware, the role checks, and the UI adjustments for each role. You define the access matrix in an Excel template (part of the SFAD package), and the AI implements it.

**Completion criteria:** Each role can only access what the access matrix specifies. Tested with real user accounts.

---

### Step 10: Production Release

**Input:** Complete, tested application with access control
**Output:** Live production application with custom domain

The final step:

1. Configure production environment on Vercel
2. Set up custom domain
3. Enable production database (Neon production branch)
4. Implement login (email/password or SSO)
5. Set up monitoring and error tracking
6. User training (usually a 30-minute session — the app is already familiar from prototype testing)
7. Go live

**Total time from Step 1 to Step 10:** 2-4 months, depending on complexity.
**Total cost:** $5,000-$15,000 (mostly AI API costs and your time).

Compare that to $50,000-$200,000 and 6-18 months with a traditional SI vendor.

---

## The Tech Stack

SFAD is opinionated about the tech stack. This is intentional — decision fatigue kills projects.

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js (App Router) | Full-stack in one framework. AI excels at it. |
| Hosting | Vercel | Zero-config deployment. Preview URLs for every change. |
| Database | Neon (Postgres) | Serverless. Free tier. Scales automatically. |
| ORM | Prisma | Type-safe. Schema-driven. AI generates migrations easily. |
| AI | Claude Code | Best at full-stack development. Understands project context via CLAUDE.md. |
| Templates | Excel (.xlsx) | Your stakeholders already use it. Zero learning curve. |

**You don't need to evaluate alternatives.** SFAD has already made those decisions. Just follow the steps.

---

## Who Is SFAD For?

SFAD is designed for a specific type of team:

**You're a good fit if:**

- You understand your business processes deeply
- You've been relying on SI vendors for custom applications
- You have budget pressure to reduce IT costs
- You want to build internal tools but don't have a development team
- You have someone who can dedicate 2-4 hours/day to the project

**You're NOT a good fit if:**

- You need a consumer-facing application (SFAD is for internal tools)
- You have no clarity on your business requirements
- You expect the AI to do everything with zero human guidance
- You need real-time systems or high-frequency transaction processing

---

## What's Next

In the next article, I'll walk through a complete case study: **building an asset management system from Excel to production using SFAD.**

You'll see every step in action — the prompts, the stakeholder conversations, the mistakes, and the final result.

If you're evaluating whether structured AI development could work for your organization, that article will give you a concrete picture.

Follow this account to get notified.

---

*I'm Hiroyuki Seta, founder of HARMONIC insight. 28 years of enterprise system implementation across 100+ companies. Now building tools and methodologies to make AI-assisted development accessible to business teams.*

---

**Previous:** "Why Vibe Coding Fails in Enterprise — And What to Do Instead"
**Next:** "From Excel to Web App: Building an Asset Management System with SFAD"

#SFAD #VibeCoding #AI #EnterpriseDevelopment #ClaudeCode #DX #Methodology #StructuredDevelopment
