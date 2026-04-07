# PLANS.md

This file defines how to write and maintain `ExecPlan` documents in this repository.

Use an ExecPlan for any complex feature, multi-step migration, risky integration, or significant refactor that is too large to execute safely from short-lived context alone.

An ExecPlan must be self-contained. A stateless agent or a new contributor should be able to read it from top to bottom and complete the work without relying on prior chat context.

## Purpose

An ExecPlan exists to bridge design and implementation.

It should:

- explain the outcome in user-visible terms;
- capture the current system context;
- describe the exact files, modules, and commands involved;
- document progress while work is happening;
- record decisions, discoveries, and outcomes as the work evolves.

## When to use an ExecPlan

Create an ExecPlan when at least one of these is true:

- the task will likely take multiple sessions or hours;
- the work spans multiple files, routes, stores, services, or UI areas;
- the task includes uncertainty, prototyping, migration, or rollback risk;
- the implementation order matters and must be preserved;
- validation requires several manual or automated checks.

Do not require an ExecPlan for a tiny copy fix, isolated style tweak, or single-file change with no meaningful risk.

## Source of truth

- ExecPlans for this repo should live under `.agent/plans/` unless a task explicitly requires another path.
- Each plan should be named with a short kebab-case slug, for example: `.agent/plans/fees-detail-redesign.md`.
- If an ExecPlan exists for active work, keep it updated as the work proceeds. Do not treat it as a static draft.

## Core rules

- Write for a reader who knows nothing about the task.
- In this repository, write ExecPlans in Russian by default unless the user explicitly requests English.
- Name real files by repository-relative path.
- Prefer concrete instructions over abstract intent.
- Describe observable outcomes, not only code changes.
- Keep the plan implementation-oriented: what to change, where, in what order, and how to verify it.
- If the plan changes mid-stream, update every affected section so the document stays internally consistent.
- Add a short revision note at the bottom whenever you materially revise the plan.

## Required sections

Every ExecPlan must contain all sections below:

1. `Purpose / Big Picture`
2. `Progress`
3. `Surprises & Discoveries`
4. `Decision Log`
5. `Outcomes & Retrospective`
6. `Context and Orientation`
7. `Plan of Work`
8. `Concrete Steps`
9. `Validation and Acceptance`
10. `Idempotence and Recovery`
11. `Artifacts and Notes`
12. `Interfaces and Dependencies`

The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` are living sections and must stay current during implementation.

## Section guidance

### Purpose / Big Picture

Explain what changes for the user or team after the work is complete. State how someone can tell the feature or refactor is working.

### Progress

Use a checkbox list with timestamps. This section must reflect the real state of the work at every stopping point.

Example:

- [x] (2026-04-05 10:30Z) Reviewed existing fees detail page structure.
- [ ] Implement new hero layout in `src/pages/fees/...`.
- [ ] Validate mobile layout and run `npm run build`.

If a step is partially done, split it into completed and remaining work instead of leaving ambiguity.

### Surprises & Discoveries

Capture unexpected technical findings, broken assumptions, performance observations, browser quirks, or framework constraints. Include brief evidence when possible.

Example:

- Observation: `scrollBehavior` in `src/router/index.js` overrides page-level scroll restoration.
  Evidence: navigating back to `/fees` always restores saved position unless route state is reset.

### Decision Log

Record meaningful implementation decisions with rationale.

Format:

- Decision: ...
  Rationale: ...
  Date/Author: ...

### Outcomes & Retrospective

Summarize what shipped, what remains open, and what was learned. Compare the result with the original goal.

### Context and Orientation

Describe the current codebase area needed for the task. Assume the reader has no prior context. Define local terms and reference the key files that must be understood before editing.

### Plan of Work

Describe the intended sequence of edits in prose. Name the file and the target area for each change. Keep it concrete.

### Concrete Steps

List the exact commands to run, including the working directory. When useful, note the expected result.

Example:

```bash
cd /Users/sergeybiryukov/Documents/Frontend/Vue/vue-smartswim
npm install
npm run build
```

Expected result: production build completes without Vite errors.

### Validation and Acceptance

Describe how to exercise the change and what behavior proves success. Prefer observable acceptance criteria over vague statements.

Examples:

- open `/fees/some-slug` and confirm the hero, meta card, and CTA render without layout jumps;
- resize to mobile width and confirm cards stack without overflow;
- run `npm run build` and expect a successful production build.

### Idempotence and Recovery

Explain which steps are safe to repeat and how to recover if a step fails. Include rollback notes for risky migrations or data changes.

### Artifacts and Notes

Store concise proof of success: command transcripts, screenshots, key diffs, or short notes that will help the next contributor.

### Interfaces and Dependencies

List the modules, utilities, route contracts, props, data shapes, and external dependencies involved. Be explicit about the final interfaces that must exist after implementation.

## Milestones, spikes, and parallel tracks

For larger work, split the plan into milestones that each produce a verifiable outcome.

- Milestones should be independently testable.
- Prototyping is allowed when it de-risks the final implementation.
- If two approaches need evaluation, describe both paths, the comparison criteria, and the decision rule for keeping one.
- Prefer additive transitions that keep the app working while the migration is in progress.

## Quality bar

A good ExecPlan is:

- self-contained;
- specific;
- novice-guiding;
- outcome-focused;
- maintainable over the full duration of the task.

If a contributor cannot execute the work from the plan alone, the plan is not complete.

## ExecPlan template

Use this template as the default starting point:

````md
# <Short action-oriented title>

This ExecPlan is a living document. Keep `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` up to date throughout implementation.

This plan follows `.agent/PLANS.md`.

## Purpose / Big Picture

<What changes, for whom, and how success is visible>

## Progress

- [ ] <Timestamped step>

## Surprises & Discoveries

- Observation: <...>
  Evidence: <...>

## Decision Log

- Decision: <...>
  Rationale: <...>
  Date/Author: <...>

## Outcomes & Retrospective

<Summary of outcomes, remaining gaps, and lessons learned>

## Context and Orientation

<Current relevant architecture, files, and constraints>

## Plan of Work

<Ordered implementation narrative>

## Concrete Steps

```bash
cd /absolute/path/to/repo
<command>
```

Expected result: <what should happen>

## Validation and Acceptance

<Manual checks, test commands, expected behaviors>

## Idempotence and Recovery

<Retry and rollback guidance>

## Artifacts and Notes

<Important snippets, outputs, screenshots, notes>

## Interfaces and Dependencies

<Files, types, props, routes, helpers, contracts, external dependencies>

---
Revision note: <what changed in this plan and why>
````

## Repo note

In this repository, an ExecPlan should respect the existing Smart Swim patterns:

- keep data separate from templates when the section already uses data modules;
- preserve the current routing and `slug` conventions;
- stay aligned with the light, sporty, glassmorphism-based visual language;
- include responsive validation and `npm run build` in acceptance whenever the task affects UI.

Source used: OpenAI Cookbook article "Using PLANS.md for multi-hour problem solving" on developers.openai.com.
