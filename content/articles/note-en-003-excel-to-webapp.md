# From Excel to Web App: Building an Asset Management System with SFAD

*Published on note.com — HARMONIC insight (English)*

---

In the previous two articles, I explained [why vibe coding fails in enterprise](link) and introduced [SFAD's 10-step methodology](link). 

Now let's see it in action.

This is a real case study. A mid-sized construction company needed to replace their Excel-based asset management process. They had 3,000+ assets tracked across 12 Excel files on a shared drive, managed by 4 department managers who spent 2-3 hours every month manually consolidating reports.

Here's how we built their system using SFAD — from Excel to production — in 8 weeks.

---

## The Starting Point

**The company's situation:**

- 350 employees, 15 construction sites
- Asset data spread across 12 Excel files (equipment, vehicles, tools, IT assets)
- Monthly reports required manual merging by department managers
- No central search — finding an asset meant opening multiple files
- Annual audit took 2 weeks of manual checking

**What they wanted:**

- One place to see all assets
- Search and filter by site, category, status
- Upload from their existing Excel files (they didn't want to re-enter data)
- Export for monthly reports
- Role-based access (not everyone should see costs)

**Budget:** They had been quoted $120,000 by their SI vendor for a custom system. Delivery: 8 months.

They asked if there was another way.

---

## Step 1: Project Setup (Day 1)

Time spent: 2 hours

I set up the environment:

```
npx create-next-app@latest asset-management
cd asset-management
git init && git remote add origin [GitHub URL]
vercel link
```

Then configured `CLAUDE.md`:

```markdown
# Asset Management System

## Business Context
- Construction company, 350 employees, 15 sites
- Currently tracking 3,000+ assets in Excel files
- Users: department managers (4), site managers (15), admin (2)

## Tech Stack
- Next.js 14 (App Router)
- Tailwind CSS
- Excel I/O via xlsx library
- Later: Neon + Prisma

## Conventions
- Japanese UI labels (users are Japanese-speaking)
- English code and comments
- File naming: kebab-case
- Components in /components, pages in /app
```

**Key point:** The `CLAUDE.md` file gives Claude Code the business context it needs. Every prompt from here on out benefits from this foundation.

I deployed the empty project to Vercel. The client could already see a live URL — even though there was nothing there yet.

---

## Step 2: Central Backlog (Day 2-3)

Time spent: 4 hours (including 2-hour meeting with stakeholders)

I sat down with the 4 department managers and the IT lead. We filled out the Central Backlog in Excel:

| ID | Feature | Priority | Phase | Who Asked |
|---|---|---|---|---|
| REQ-001 | Upload asset list from Excel | Must | 1 | All |
| REQ-002 | Display all assets in searchable table | Must | 1 | All |
| REQ-003 | Filter by site, category, status | Must | 1 | Site managers |
| REQ-004 | Export filtered results to Excel | Must | 1 | Dept. managers |
| REQ-005 | Dashboard with asset count by category | Should | 1 | IT lead |
| REQ-006 | Asset detail view with edit | Should | 1 | Dept. managers |
| REQ-007 | Bulk status update | Could | 1 | Site managers |
| REQ-008 | Role-based access (4 levels) | Must | 2 | IT lead |
| REQ-009 | Audit log | Should | 2 | IT lead |
| REQ-010 | Photo attachment | Could | 2 | Site managers |
| REQ-011 | QR code for physical labeling | Could | 3 | Operations |
| REQ-012 | Mobile-responsive layout | Should | 1 | Site managers |

**12 requirements. Phase 1 had 8.** Clear, prioritized, agreed upon.

The meeting took 2 hours. Organizing the Excel file took another 2 hours. Total: half a day.

Compare that to a traditional requirements document: 2-4 weeks, 50+ pages, and still ambiguous.

---

## Step 3: Menu Structure (Day 3)

Time spent: 30 minutes

Based on the Central Backlog, I proposed this menu structure:

```
Asset Manager
├── Dashboard
├── Assets
│   ├── Asset List (search, filter, export)
│   └── Upload (Excel import)
├── Reports
│   └── Monthly Summary
└── Settings (Phase 2)
    ├── Users
    └── Categories
```

I sent this to the stakeholders on Slack. They approved it in 15 minutes.

**Total time for requirements + menu structure: 1 day.**

---

## Step 4: Screen Design (Day 4-5)

Time spent: 6 hours

This is where the AI starts to shine.

I prompted Claude Code:

> Build the Asset List page. It should display a data table with columns: Asset ID, Name, Category, Location (Site), Status, Purchase Date, Purchase Cost. Include a search bar at the top that filters across all text columns, and dropdown filters for Category, Site, and Status. Add an Export to Excel button. Use the DataTable component pattern. Japanese labels for the UI.

Claude Code generated a complete page in about 3 minutes. I deployed it to Vercel.

Then I shared the preview URL with the department managers:

> "Take a look at this. Is this what you had in mind?"

Their feedback:

- "Can you add a 'Department' column?"
- "The status should be color-coded — green for Active, yellow for Maintenance, red for Retired"
- "I need the cost column to show yen format with commas"

Each piece of feedback took 2-3 minutes to implement with Claude Code. Within an hour, they had exactly the screen they wanted.

**This is the power of SFAD Step 4.** Stakeholders aren't reviewing a mockup — they're reviewing a working screen. Their feedback is specific and actionable because they can interact with it.

I repeated this for the Dashboard page and the Upload page. Total: 6 hours across 2 days.

---

## Step 5: Excel I/O (Day 6-8)

Time spent: 8 hours

This was the "aha moment."

The department managers sent me their actual Excel files. Real data. Real formatting quirks. Real column names that didn't match any standard.

I prompted Claude Code:

> Implement Excel upload for the Asset List page. The upload should accept .xlsx files. Parse the following columns: [listed the actual column names from their files]. Map them to our data model. Display a preview before confirming the import. Handle errors gracefully — show which rows had issues.

Claude Code built the upload flow, including:
- File drag-and-drop
- Column mapping (auto-detected + manual override)
- Preview table showing parsed data
- Error highlighting for invalid rows
- Confirmation before import

I uploaded one of the actual files. 847 assets appeared in the application. Searchable. Filterable. Exportable.

I shared the preview URL. The department manager's response:

> "This is all our data? Already? I can search by site? ...Can we start using this now?"

**That's Step 5.** No database. No authentication. Just Excel in → web app out. And the client already wants to use it.

---

## Step 6: Priority Build (Week 2-3)

Time spent: 20 hours

With the prototype validated, I worked through the remaining Phase 1 requirements:

- **REQ-005 Dashboard:** KPI cards (total assets, by status, by category) + bar chart by site. Claude Code built it in 30 minutes.
- **REQ-006 Asset Detail:** Click on any row → detail view with edit capability. 45 minutes.
- **REQ-007 Bulk Status Update:** Select multiple rows → change status. 20 minutes.
- **REQ-012 Mobile Responsive:** Tailwind responsive classes. Claude Code refactored all pages in 15 minutes.

Each feature: prompt → generate → review → deploy → validate with stakeholders.

**Week 3 result:** All 8 Phase 1 requirements completed. The application had:
- Excel upload with auto-mapping
- Searchable, filterable asset table
- Dashboard with KPIs and charts
- Asset detail view with editing
- Bulk operations
- Excel export
- Mobile-responsive layout

Running on a Vercel preview URL. No database. No login. But fully functional with their real data.

---

## Step 7: DB Migration (Week 4)

Time spent: 6 hours

Now it was time to make it production-grade.

I prompted Claude Code:

> Create a Prisma schema based on our current asset data model. Fields: [listed all fields]. Set up Neon database connection. Generate migration. Update all data access to use Prisma instead of in-memory Excel parsing. Add a data import script to migrate the current Excel data to the database.

Claude Code:
1. Generated the Prisma schema (10 minutes)
2. Created the migration (5 minutes)
3. Rewrote the data access layer (30 minutes)
4. Built the import script (15 minutes)

I ran the migration against a Neon database. Imported 3,000+ assets. Verified everything worked identically.

**Total migration time: 6 hours** including testing.

The users didn't notice any difference — which is exactly the point. The switch from Excel-based to database-backed was invisible to them.

---

## Step 8: Feedback Loop (Week 5-6)

Time spent: 10 hours

With 4 department managers and 15 site managers using the application daily, feedback came quickly.

Sample feedback and response times:

| Feedback | Type | Response Time |
|---|---|---|
| "Can I sort by purchase date?" | Improvement | 5 minutes |
| "The export doesn't include the department column" | Bug | 10 minutes |
| "I want to see assets expiring within 30 days" | Improvement | 20 minutes |
| "Can we add a notes field?" | Improvement | 15 minutes (schema change + UI) |
| "I need a report showing assets by department and category" | Improvement | 30 minutes |

Every improvement request went into the feedback backlog. We prioritized weekly. Critical items were implemented same-day.

**The AI made this sustainable.** Without AI, each of these changes would require a developer spending 2-4 hours. With Claude Code, most took 5-30 minutes. I could handle 3-5 feedback items per day while keeping up with other work.

---

## Step 9: Access Control (Week 7)

Time spent: 8 hours

Using the SFAD Access Control template:

| Role | Dashboard | Asset List | Upload | Edit | Delete | Export | Settings |
|---|---|---|---|---|---|---|---|
| Admin | Full | Full | Yes | Yes | Yes | Yes | Full |
| Manager | Own dept. | Own dept. | Yes | Yes | No | Yes | No |
| Editor | Own dept. | Own dept. | No | Yes | No | No | No |
| Viewer | All | All | No | No | No | Yes | No |

I filled out this matrix in 10 minutes. Then prompted Claude Code:

> Implement role-based access control based on this access matrix: [pasted the matrix]. Create middleware that checks user role on each request. Filter data by department for Manager and Editor roles. Hide UI elements that the user's role cannot access.

Claude Code generated the middleware, the role checks, and the UI adjustments. 

Testing each role with real scenarios took the most time — about 4 hours. But the implementation itself was fast.

---

## Step 10: Production Release (Week 8)

Time spent: 6 hours

Final steps:

1. Custom domain setup on Vercel (asset.company-name.co.jp)
2. Production database on Neon (separate from development)
3. Email-based authentication (NextAuth.js)
4. User accounts created for all 21 users
5. 30-minute training session (most users already knew the app from prototype testing)
6. Go live

**The training session was almost unnecessary.** Users had been interacting with the app since Week 1. By Week 8, they already knew how to use it.

---

## The Results

| Metric | Before (Excel) | After (SFAD) |
|---|---|---|
| Monthly report preparation | 2-3 hours × 4 managers | 2 clicks (export) |
| Finding a specific asset | 5-15 minutes (open multiple files) | 3 seconds (search) |
| Annual audit preparation | 2 weeks | 1 day |
| Data accuracy | Varies (manual entry errors) | High (single source of truth) |
| Access control | None (shared drive) | 4-level role-based |

**Project totals:**

| | SFAD | SI Vendor Quote |
|---|---|---|
| Duration | 8 weeks | 8 months |
| Cost | ~$8,000 | $120,000 |
| User satisfaction | High (involved from Day 1) | Unknown |
| Time to first usable version | 1 week | 4-5 months |

---

## What Made This Work

Looking back, three things made the difference:

### 1. Excel-first approach

Starting with their real Excel files — not a blank database schema — meant the application was useful from Week 1. Users could see their data immediately. Feedback was based on reality, not imagination.

### 2. Continuous validation

The Vercel preview URL meant stakeholders saw every change within minutes. There was never a "big reveal" moment where expectations didn't match reality. By the time we reached production, the application was exactly what they wanted — because they'd been shaping it for 8 weeks.

### 3. AI as accelerator, not architect

Claude Code wrote probably 90% of the actual code. But every line was directed by the methodology: what to build (Central Backlog), what it should look like (Screen Design), what data it uses (Excel I/O), and who can access it (Access Control matrix).

**The AI didn't make architecture decisions. The methodology did.**

---

## Can You Do This?

If you're thinking "this sounds great, but I'm not a developer" — that's exactly who SFAD is designed for.

The person who built this system (me) is not a traditional web developer. I'm a business consultant who understands systems, processes, and data flows. Claude Code handles the programming. SFAD handles the methodology.

What you need:

- Deep understanding of your business processes
- The ability to describe what you want clearly
- 2-4 hours per day for 8-12 weeks
- Willingness to iterate based on user feedback

What you don't need:

- A computer science degree
- Experience with JavaScript, React, or Next.js
- A development team
- A $100,000 budget

---

## What's Next

This case study is one example. SFAD works for any internal business application:

- Inventory management
- Project tracking
- Employee onboarding
- Purchase order management
- Inspection checklists
- Customer relationship management (internal)

The methodology is the same. The 10 steps are the same. Only the business context changes.

I'm currently packaging SFAD into a complete methodology kit — guidebook, templates, starter code, and video training — so that teams can follow this process independently.

If you're interested, follow this account. I'll share more details soon.

---

*I'm Hiroyuki Seta, founder of HARMONIC insight. 28 years building enterprise systems for 100+ companies. Now making AI-assisted development accessible to business teams through structured methodology.*

---

**Previous:** "SFAD: A 10-Step Methodology for Structured Vibe Coding"

#SFAD #VibeCoding #CaseStudy #ClaudeCode #EnterpriseDevelopment #ExcelToWebApp #AI #DX
