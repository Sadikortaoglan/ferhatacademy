# Application Experience — Technical Documentation

## Overview

The Application Experience system provides premium, context-rich application pages with dynamic form templates, configurable page content, and submission snapshot safety.

---

## Architecture

### Separation of Concerns

| Layer | Responsibility |
|---|---|
| **Application** | Status tracking, submission, review |
| **FormTemplate** | Question definitions, field types, validation |
| **PageProfile** | Per-product page content (headline, visual, FAQ, process) |
| **Appearance** | Visual theme (handled by Visual Customizer, not here) |

Application ≠ Payment ≠ Entitlement. Approval does not grant access.

---

## Application Page Layout

Route: `/[locale]/products/[slug]/apply`

### Desktop (lg+)

Two-column grid `5/5`:
- **Left (2/5 ≈ 40%)**: `ApplicationContextPanel` — program visual, motivation, inclusions, process steps, FAQ, reassurance
- **Right (3/5 ≈ 60%)**: `ApplicationFormPanel` — sticky form card with `DynamicForm` or `LegacyApplicationForm`

### Mobile

Stacks vertically. Form appears first (order-1), context below (order-2).

### Three Layout Modes (schema-level)

`ApplicationLayout` enum:
- `SPLIT` — default two-column
- `FORM_FIRST` — form prominent, context compact sidebar
- `EDITORIAL` — large visual header, context, form below

---

## Application Page Profile

`ApplicationPageProfile` per-product content configuration:

| Field | Type | Description |
|---|---|---|
| `headlineTr/En` | String | Main page headline |
| `subtitleTr/En` | String? | Subtitle / short pitch |
| `programVisualUrl` | String? | Program cover image URL |
| `motivationTr/En` | String? | Why this application exists |
| `ctaLabelTr/En` | String | Submit button label |
| `layout` | ApplicationLayout | Layout mode |

### Content Blocks

`ApplicationPageBlock` — ordered, enable/disable per profile:

- `PROGRAM_VISUAL` — program image
- `MOTIVATION` — short credible message
- `TARGET_AUDIENCE` — who it's for
- `NOT_FOR_YOU` — honest expectations
- `BENEFITS` — what you get
- `INCLUSIONS` — from ProductInclusion
- `PROCESS` — what happens after submit
- `FAQ` — common questions
- `REASSURANCE` — privacy/care statement
- `OPTIONAL_INSTRUCTOR` — instructor block (disabled by default)

---

## Form Template System

### Default Templates

| Key | Type | Questions |
|---|---|---|
| `mentorship` | MENTORSHIP | 7 |
| `live_training` | LIVE_TRAINING | 6 |
| `consultation` | CONSULTATION | 6 |
| `cohort_premium` | COHORT_PREMIUM_PROGRAM | 10 |
| `general_custom` | GENERAL_CUSTOM | 5 |

Seeded idempotently via `src/server/seed-templates.ts`.

### Question Types

`QuestionType` enum:
- `SHORT_TEXT` → `<input type="text">`
- `LONG_TEXT` → `<textarea>`
- `PHONE` → `<input type="tel">`
- `EMAIL` → `<input type="email">`
- `NUMBER` → `<input type="number">`
- `SINGLE_SELECT` → `<select>`
- `MULTI_SELECT` → checkbox group
- `RADIO` → radio group
- `CHECKBOX` → checkbox group

### Question Sections

`QuestionSection` enum:
`BASIC_INFO` | `CURRENT_SITUATION` | `GOALS` | `CHALLENGES` | `PROGRAM_FIT` | `AVAILABILITY` | `ADDITIONAL_INFO`

### Localization

Every question has `labelTr/En`, `helperTr/En`, `placeholderTr/En`. Options have `labelTr/En`.

---

## Form Behavior

- **Short forms (≤6 questions)**: single page
- **Long forms (>6 questions)**: multi-step by section with progress indicator
- **Validation**: client-side (zod + react-hook-form) + server-side (required always enforced)
- **Dynamic form**: uses `DynamicForm` when template is linked to product
- **Legacy form**: uses `LegacyApplicationForm` for products without template

---

## Submission Snapshot Safety

`ApplicationResponse` stores:
- `responsesJson` — raw validated answers
- `snapshotJson` — array of `{ key, labelTr, labelEn, type, section, answer, optionLabels? }`

Historical applications remain readable even if template changes. The snapshot captures question labels and option labels **at submission time**.

---

## Product Linking

`Product` model has:
- `formTemplateId` → `ApplicationFormTemplate`
- `pageProfileId` → `ApplicationPageProfile`

Link via admin (or Prisma directly for now). Admin form builder for template management is planned.

---

## Existing Application State

If user has an active application (not REJECTED/CANCELLED), the apply page shows their current status with links to Applications dashboard. No duplicate submissions.

---

## Confirmation State

After successful submission: `ConfirmationState` component with:
- "Başvurunuz Alındı" heading
- Links to Applications dashboard and program page

---

## Admin Review

`/admin/applications/[id]` — detail page showing:
- Applicant info, product, status, dates
- Answers grouped by section (from snapshot)
- Legacy flat fields fallback for old applications
- Internal admin note
- Status action buttons

---

## Security

- Only authenticated users can submit applications
- Server validates all responses against template schema
- Required fields enforced server-side
- No arbitrary HTML/JS in question definitions
- Cross-user reads prevented (applications scoped to `userId`)
- Admin-only: template CRUD, profile CRUD, product linking

---

## Visual Customizer Integration

Application page respects global theme + global overrides via CSS variables. Page key `APPLICATION` may be registered for page-specific overrides.

All colors use semantic tokens (`--color-primary`, `--color-foreground`, etc.). No hardcoded hex values.

---

## Testing

- **Unit**: `tests/unit/application-templates.test.ts` — 10 tests covering template structure, required fields, option validation
- **Integration**: planned — template CRUD, question CRUD, submission + snapshot persistence
- **Component**: planned — DynamicForm field types, required errors, multi-step
- **E2E (Playwright)**: planned — mentorship flow, admin template management, review flow, historical safety

---

## Status (Updated 2026-09-26)

### Implemented ✓
- Admin Form Template Builder: list, create, edit, archive, duplicate; full question + option CRUD with reorder
- Admin Page Profile Editor: tabbed editor with General/Process/FAQ/Products tabs
- Product → Template/Profile linking in product admin
- Admin Navigation page: NavItem CRUD with navbar/footer visibility, reorder
- Member dashboard: Application detail page with snapshot answers grouped by section, status messages
- Conditional logic utility: `filterVisibleQuestions`, `evaluateRule`, `cleanHiddenAnswers`
- Snapshot safety: labels captured at submission time, readable after template changes
- Integration tests: 10 tests covering CRUD, binding, snapshot safety, authorization
- Unit tests: conditional logic (14 tests), template structure, theme presets

### Known Limitations (V2)
- Conditional logic UI builder not implemented (utility exists, no admin UI to set rules)
- Layout selector (SPLIT/FORM_FIRST/EDITORIAL) schema exists but not wired to render differences
- Step-level validation (validate before advancing step) not implemented
- `OPTIONAL_INSTRUCTOR` block UI not implemented
- `NOT_FOR_YOU` and `TARGET_AUDIENCE` blocks not in context panel
- Playwright E2E tests not yet written
- Localization: some strings still hardcoded (apply page, admin review)
