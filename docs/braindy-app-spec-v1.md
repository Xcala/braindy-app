# Braindy platform · spec v1 (app.braindy.co)
Oct 5, 2026 · Owner: Nicolas (Orchestrator) · Build in Claude Code, decisions in the Cowork project "Braindy".
Inputs: `plataforma/auditoria-apps-v1.md` (audit of the 3 apps), `marca/agentes-braindy-v2.md` (Brain Agents v2).

## 1. Purpose
One place where a client's brand lives, where they ask for work, approve it and find everything Braindy made for them, while the 4 Brain Agents do the work and Nicolas orchestrates. It replaces brief, brands and orbit without breaking them during the transition.

## 2. Users and roles
| Role | Who | Can |
|---|---|---|
| admin | Nicolas | Everything; approval queue; all brands |
| client_owner | Client lead | Their brand(s): view, request, approve, manage accesses, invite members |
| client_member | Client team | View, request, comment; approve only if granted |
| brain (service) | Backend agents | Read brand context, write drafts/plans/status on requests; never approve, never publish, never read credentials |

## 3. Modules (client view: 5 tabs + admin)
| Module | What it does | Comes from |
|---|---|---|
| **My brand** | Brand context: logo files, colors (with Pantone), typography, voice, strategy notes, approved examples, initial intake | brands.BrandBook (structured editor) + orbit Asset Vault + Artemis intake summaries |
| **My assets** | Documents and files per brand: LogoDecks, MarketMaps/research (hosted HTML with public link), PDFs, deliverables archive | brands.LogoDeck/MarketMap + orbit Asset Galaxy |
| **Ask for something** | Request flow: category → subcategory → piece (taxonomy), 3 cards (Product, Application, Scene) + moodboard + delivery details. Conversational intake for new brands or "With Nicolas" work | brief Studio + categories.ts + Artemis prompt |
| **My requests** | Private list per brand. Simple states: In production · To approve · Approved · Published. Versions (v1, v2…), comments, visual annotation on deliverables | brief Solicitados/Entregables + orbit Deliverables + VisualFeedbackCanvas |
| **Accesses** | Client credentials (social, email, Webflow, etc.), encrypted, reveal on demand with audit log | orbit Credentials & Access |
| **Team (admin)** | Approval queue, requests by brand and by Brain, Brain status board, QA | orbit Mission Control without space metaphors |

## 4. Brain Agents inside the platform
- Each request is assigned to one lead Brain (+ helpers). Routing by taxonomy: SOCIAL/GRAPHIC → Creator (+ Marketer for copy); MARKETING → Marketer; BRANDING/naming → Creator with Nicolas; research/analysis → Researcher; web/apps/automations/AI agents → Builder.
- Flow: Request → Plan (Brain proposes scope + ETA) → Approval gate → Work (drafts visible on the Brain's "desk") → Delivery (signed by the Brain's emoji) → Client approval → Learning (corrections saved to the brand context).
- Approval levels:
  | Level | Examples | Approver |
  |---|---|---|
  | Self-serve | Variations inside the approved brand line, monthly report | None (Brain delivers to client) |
  | With Nicolas | Strategy, naming, new campaign, new brand | Nicolas before client sees it |
  | With client | Publish, launch a site, spend ad budget | Client |
- Avatars show status: idle (still), working (loop of its personality animation), needs approval (highlight). Assets in `marca/brain-agents-assets.md`.
- Brains are backend agents (Claude via Agent SDK or API) with: system prompt per Brain (from `brains/<brain>/README.md`), the brand context, tools scoped by role. They never read credentials and never publish.

## 5. Data model (Firestore database `braindy-app`)
```
brands/{brandId}
  name, slug, status, logoUrl, legacyIds{brands, orbit, briefEmails[]}, createdAt
  context/{doc}            // voice, colors[], typography[], strategy, intake, approvedExamples[]
  assets/{assetId}         // type (logodeck|marketmap|research|file|deliverable), title, url|storagePath, html?, publicSlug?, lang, status
  requests/{requestId}     // category, subcategory, formatType, cards{product,application,scene}, moodboard[], dueDate,
                           // status (in_production|to_approve|approved|published), leadBrain, helperBrains[], approvalLevel,
                           // plan{scope,eta}, createdBy, legacy{briefRequestId?}
    versions/{versionId}   // n, files[], notes, brain, createdAt, approval{state,by,at}
    comments/{commentId}   // author, text, annotation?{x,y,w,h,versionId}, createdAt
  accesses/{accessId}      // platform, username, secretRef (encrypted, KMS), notes, updatedBy, lastRevealedAt
  members/{uid}            // role (client_owner|client_member), canApprove
users/{uid}                // email, name, role (admin|client), brandIds[]
audit/{eventId}            // credential reveals, approvals, role changes
brains/{brainId}           // name, verb, color, status, currentRequestId
```

## 6. Migration (read-only from old databases)
| From | To | Notes |
|---|---|---|
| brands `(default)`.clients (12) + orbit.projects (22) | brands | Merge duplicates by normalized name/slug (e.g., Mayo RD = Mayo Road, Ms Dyer = Christine Dyer). Output a merge report for Nicolas to confirm before writing |
| brands.brandingProjects | brands/{id}/context | Logos, colors, typography, voice |
| brands.marketMaps + LogoDecks (24 HTML) | brands/{id}/assets | Internal ones (Prompt Repository, AI 101, World Cup) go to an internal "Braindy" brand |
| brief.requests (69) + comments | brands/{id}/requests (+versions, comments) | Map old states to the 4 new ones; keep legacy IDs |
| orbit credentials (plain text) | brands/{id}/accesses | Encrypt on the way in; never write plain text anywhere, never log values |
| orbit artemisSessions summaries | brands/{id}/context.intake | |
| users (shared Auth) | users + members | No re-registration |
Do not read or migrate Namén Vargas collections from `(default)`.

## 7. Phases
| Phase | Scope | Done when |
|---|---|---|
| 0 · Setup | Repo, CLAUDE.md, Vite app, Firebase config, `braindy-app` database, security rules + emulator tests, backend skeleton on Cloud Run | Login works on staging with existing users |
| 1 · Brands | Brand model + migration of clients/context/assets (dry-run → report → confirm → write); My brand + My assets read views | Every client sees only their brand; Nicolas sees all |
| 2 · Requests | Ask for something + My requests + versions + approvals + comments; migrate the 69 brief requests | A real Quimiolab request goes end to end in the new app |
| 3 · Accesses | Encrypted credentials, reveal with audit | Orbit credentials migrated and orbit set to read-only |
| 4 · Brains | Backend agents per Brain, routing, plan/approval gates, status avatars, learning loop | One Brain (Marketer: monthly report) runs in production |
| 5 · Channels | WhatsApp Business intake → requests; scheduled Brain tasks | A WhatsApp message creates a request |
| Sunset | Old apps read-only, then off; brief.braindy.co / brands / orbit redirect to app.braindy.co | |

## 8. Out of scope for v1
Billing, time tracking, presences, gamified metrics, public cross-client gallery, braindy.ai domain, white-label SaaS.

## 9. Open questions
- Are the 6 brief users real client accounts to keep?
- Do Trafficking and Billing in orbit hold real data?
- Client-facing language: English only at launch, or ES/EN toggle from day one?
