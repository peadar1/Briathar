# Briathra

**A Conjuguemos-style trainer for Irish verb conjugation (An Caighdeán Oifigiúil).**

Timed drills, instant corrections and a rule-by-rule explanation of every mistake for 148 verbs
(all 11 irregulars plus 137 common regular verbs), in four tenses, four sentence forms and every
person, including the saorbhriathar.

![Home page](docs/screenshots/home.jpg)

| Wrong answer → explanation | Results | Mobile, Irish UI |
| --- | --- | --- |
| ![Explanation](docs/screenshots/explanation.jpg) | ![Results](docs/screenshots/results.jpg) | ![Mobile](docs/screenshots/mobile-ga.jpg) |

## Features

- **Four modes:** timed (2/5/10 min), set length, untimed practice, and fill-in-the-whole-table.
- **Two prompt styles:** grammar labels (`téigh · Aimsir Chaite · mé · Diúltach`) or English
  sentences (`I didn't go`).
- **Explanations, not just answers.** Every answer carries a derivation trace from the engine:
  irregular-verb notes, dependent forms, particles, séimhiú/urú, synthetic forms and accepted
  alternatives.
- **Retype to continue.** Like Conjuguemos, a wrong answer has to be typed correctly before you
  move on. Only the first attempt is scored.
- **Fada-friendly input:** on-screen á é í ó ú keys that insert at the cursor, plus Alt + vowel.
  Strict or lenient fada marking.
- **Server-authoritative scoring.** The server issues questions without answers, grades every
  submission and enforces the timer, so a score can't be forged from the browser.
- **Presets** (irregulars, each tense, each conjugation, exam mix) plus a fully custom picker.
- English / Gaeilge interface, light/dark themes, mobile-first, keyboard-only play, reduced-motion
  support.

## How correctness is guaranteed

Irish verb morphology is full of traps (*ní bhfuair*, *an ndúirt*, *níor ceannaíodh*, *chuathas*),
so answers aren't hand-written.

1. **Data.** Verb stems come from [BuNaMo](https://github.com/michmech/BuNaMo), Foras na Gaeilge's
   national morphology database. `data/scripts/extract.ts` compiles the 148 chosen verbs into a
   compact `lexicon.json`.
2. **Engine.** `@briathra/conjugator` applies particles, mutations and synthetic/analytic person
   rules as data tables (`rules.ts`), with irregular-verb exceptions as declarative overrides.
3. **Oracle.** `data/oracle` is a small .NET program that runs Foras na Gaeilge's own grammar
   library, [Gramadán](https://github.com/michmech/Gramadan), over the same data and writes golden
   fixtures.
4. **Tests.** The engine must reproduce Gramadán exactly, including every accepted alternative,
   for all 18,944 verb × tense × form × person combinations. Unit tests cover mutations, answer
   checking, English generation and explanations.

## Architecture

```mermaid
flowchart LR
  subgraph data [Data pipeline]
    B[BuNaMo XML] -->|extract.ts| L[lexicon.json]
    B -->|Gramadán oracle| G[golden fixtures]
  end
  subgraph pkg [packages]
    C["@briathra/conjugator<br/>rules · mutations · explanations · checker"]
    S["@briathra/shared<br/>Zod contracts · presets"]
  end
  L --> C
  G -. tests .-> C
  C --> S
  S --> API["apps/api<br/>Fastify · Drizzle · Postgres/PGlite"]
  S --> WEB["apps/web<br/>React · Vite · Tailwind"]
  WEB -- "/api/sessions" --> API
```

| Package | Stack |
| --- | --- |
| `packages/conjugator` | Pure TypeScript, zero runtime dependencies, Vitest |
| `packages/shared` | Zod 4 schemas shared by client and server, practice presets |
| `apps/api` | Fastify 5, Drizzle ORM, PostgreSQL (or embedded PGlite), rate limiting |
| `apps/web` | React 19, React Router, Tailwind CSS 4, Radix UI, i18next, Testing Library |

## Getting started

Requires Node 24+ and pnpm.

```bash
pnpm install
pnpm dev
```

This starts the API on `:3001` and the web app on [localhost:5173](http://localhost:5173). With no
`DATABASE_URL`, the API uses embedded PGlite stored in `apps/api/.pglite`, so you don't need a
database server. To use real Postgres:

```bash
docker compose up -d
```

then set `DATABASE_URL=postgres://briathra:briathra@localhost:5432/briathra` in `apps/api/.env`.

| Command | What it does |
| --- | --- |
| `pnpm test` | All test suites |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript across the monorepo |
| `pnpm --filter @briathra/data fetch` | Download BuNaMo and Gramadán sources into `data/.cache` |
| `pnpm data:extract` | Rebuild `lexicon.json` from BuNaMo |
| `pnpm --filter @briathra/data oracle` | Regenerate golden fixtures with Gramadán (.NET 8 SDK) |

Add or change verbs in `data/verbs.config.json` (lemma + English glosses), then re-run extract and
the oracle.

## Roadmap

- [x] Conjugation engine, oracle-verified, with explanations
- [x] Guest play: all four modes, both prompt types, fada handling, results review
- [ ] Accounts (Google, email/password) and leaderboards per preset and duration
- [ ] Stats dashboard, spaced-repetition review of weak spots, streaks and badges
- [ ] Publish `@briathra/conjugator` to npm
- [ ] Deployment

## Credits

Verb data © Foras na Gaeilge (BuNaMo, ODbL 1.0). Grammar rules adapted from Gramadán (MIT). See
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Code is MIT-licensed.
