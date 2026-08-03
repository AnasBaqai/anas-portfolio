# Portfolio Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page portfolio for Muhammad Anas (Full-Stack & AI Engineer, Munich) targeting EU/German recruiters, whose signature element is one particle system that morphs across five formations and traverses the viewport, driven purely by scroll offset.

**Architecture:** Next.js App Router with a single route. All copy lives in one typed content module. The animation is split into pure, testable modules (formations, neighbour-linking, overlay draw functions, scroll math) with exactly one stateful component — `Subject.tsx` — owning the canvas and the animation frame loop. No animation library.

**Tech Stack:** Next.js 16.2, React 19, TypeScript, Tailwind CSS v4, Vitest (unit), Playwright (regression). Deployed to Vercel.

## Global Constraints

Copied from `docs/superpowers/specs/2026-08-03-portfolio-website-design.md`. Every task's requirements implicitly include this section.

- **Runtime dependencies beyond Next/React/Tailwind: none.** No GSAP, no animation library, no icon package — icons are inline SVG.
- **Content accuracy:** every string and number traces to `anas_two_pages.pdf`. No invented metrics, employers, dates, or technologies.
- **Particle position is a pure function of scroll offset.** No physics, no easing-toward-target, no one-shot triggers. Scrolling up must morph backwards exactly. The only non-deterministic component is a sinusoidal idle drift of ±0.012 local units.
- **No scroll hijacking.** No pinned sections, no scroll interception. The canvas is `position: fixed` and reads `scrollY`; sections scroll natively.
- **Five formations is fixed.** Do not add a sixth.
- **Mobile keeps the animation.** Degrade by reducing particle count (180 → 90 under 768px, escape hatch 60), never by disabling the morph.
- **Every canvas colour is read from CSS custom properties** via `getComputedStyle`, re-cached on theme change. One `data-theme` flip drives DOM and canvas together.
- **Accessibility:** `prefers-reduced-motion: reduce` renders the current section's formation statically. Canvas is `aria-hidden="true"`. All content readable with JS disabled — panels default to `opacity: 1` in CSS. Contrast ≥4.5:1 body / ≥3:1 large text in **both** themes. Visible focus rings. Heading hierarchy `h1 → h2 → h3`, no skipped levels.
- **Performance budget:** 60fps on a mid-tier Android device. Canvas backing store capped at `devicePixelRatio ≤ 2`.

## Design Tokens

Exact values. Used verbatim in Task 1.

| Token | Dark | Light |
|---|---|---|
| `--bg` | `#0A0A0C` | `#FAFAF9` |
| `--surface` | `#111116` | `#FFFFFF` |
| `--ink` | `#F4F4F5` | `#09090B` |
| `--dim` | `#A1A1AA` | `#52525B` |
| `--faint` | `#52525B` | `#71717A` |
| `--line` | `#232329` | `#D4D4D8` |
| `--acc` | `#4F7CFF` | `#2563EB` |
| `--acc2` | `#7CE0C3` | `#0D9488` |
| `--warn` | `#FBBF24` | `#D97706` |
| `--node` | `#0A0A0C` | `#FFFFFF` |

## File Structure

| File | Responsibility |
|---|---|
| `src/app/layout.tsx` | Root layout, fonts, theme bootstrap script, metadata |
| `src/app/page.tsx` | Assembles all sections in order |
| `src/app/globals.css` | Tailwind import, token definitions for both themes, base type styles |
| `src/content/resume.ts` | Every string and number on the site, typed. Single source of truth. |
| `src/lib/math.ts` | `clamp`, `lerp`, `easeInOut`, `mulberry32` — shared pure helpers |
| `src/lib/scroll.ts` | Shared rAF loop, subscription, narrative progress calculation |
| `src/lib/formations.ts` | Build five formations + journey keyframes; interpolate to a flat buffer |
| `src/lib/neighbors.ts` | Uniform spatial grid for nearest-neighbour links |
| `src/lib/overlays.ts` | One pure draw function per overlay + particle draw |
| `src/lib/theme.ts` | Theme read/write/persist, palette extraction from CSS custom properties |
| `src/components/Subject.tsx` | The canvas: particle buffer, palette cache, draw loop. Only stateful animation module. |
| `src/components/ThemeToggle.tsx` | Header theme button |
| `src/components/Header.tsx` | Sticky nav, name mark, anchors, CV link |
| `src/components/Hero.tsx` | Eyebrow, masked line-reveal headline, summary, metrics, scroll cue |
| `src/components/Act.tsx` | One narrative act: panel copy + scroll-driven enter/exit |
| `src/components/Narrative.tsx` | The four acts in order |
| `src/components/Experience.tsx` | Four roles, reverse chronological |
| `src/components/Projects.tsx` | Three projects |
| `src/components/Skills.tsx` | Seven skill groups |
| `src/components/Credentials.tsx` | Education + IEEE publication |
| `src/components/Contact.tsx` | Plain links only — email, phone, LinkedIn, GitHub, CV |
| `src/components/Footer.tsx` | Languages, work authorisation, copyright |
| `tests/*.test.ts` | Vitest unit tests for the pure modules |
| `e2e/narrative.spec.ts` | Playwright regression guard for the morph |

---

## Task 1: Project scaffold, tokens, and theme

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.gitignore` (already exists — verify)
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `src/lib/theme.ts`
- Test: `tests/theme.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type Theme = 'dark' | 'light'`
  - `interface Palette { acc: string; acc2: string; line: string; faint: string; warn: string; node: string; ink: string }`
  - `function resolveInitialTheme(stored: string | null, prefersDark: boolean): Theme`
  - `function applyTheme(theme: Theme): void`
  - `function readPalette(): Palette`

- [ ] **Step 1: Scaffold the app**

```bash
npx create-next-app@16.2.12 . --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*" --yes
npm install -D vitest@4 jsdom @vitejs/plugin-react
```

If `create-next-app` refuses because the directory is not empty, pass `--yes` and let it merge; `docs/` and `.superpowers/` are untracked by it.

- [ ] **Step 2: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', include: ['tests/**/*.test.ts'] },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 3: Write the token stylesheet**

Replace `src/app/globals.css` entirely:

```css
@import "tailwindcss";

:root,
:root[data-theme="dark"] {
  --bg: #0A0A0C;
  --surface: #111116;
  --ink: #F4F4F5;
  --dim: #A1A1AA;
  --faint: #52525B;
  --line: #232329;
  --acc: #4F7CFF;
  --acc2: #7CE0C3;
  --warn: #FBBF24;
  --node: #0A0A0C;
}

:root[data-theme="light"] {
  --bg: #FAFAF9;
  --surface: #FFFFFF;
  --ink: #09090B;
  --dim: #52525B;
  --faint: #71717A;
  --line: #D4D4D8;
  --acc: #2563EB;
  --acc2: #0D9488;
  --warn: #D97706;
  --node: #FFFFFF;
}

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-ink: var(--ink);
  --color-dim: var(--dim);
  --color-faint: var(--faint);
  --color-line: var(--line);
  --color-acc: var(--acc);
  --color-acc2: var(--acc2);
  --color-warn: var(--warn);
}

body {
  background: var(--bg);
  color: var(--ink);
  transition: background 0.4s, color 0.4s;
  overflow-x: hidden;
}

/* Content must be readable before JS runs and with JS disabled.
   The scroll script only takes over opacity once it is running. */
.act-panel { opacity: 1; }

:focus-visible {
  outline: 2px solid var(--acc);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Write the failing test**

Create `tests/theme.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { resolveInitialTheme, applyTheme, readPalette } from '@/lib/theme';

describe('resolveInitialTheme', () => {
  it('honours a stored preference over the system preference', () => {
    expect(resolveInitialTheme('light', true)).toBe('light');
    expect(resolveInitialTheme('dark', false)).toBe('dark');
  });

  it('falls back to the system preference when nothing is stored', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark');
    expect(resolveInitialTheme(null, false)).toBe('light');
  });

  it('ignores a stored value that is not a valid theme', () => {
    expect(resolveInitialTheme('banana', false)).toBe('light');
  });
});

describe('applyTheme', () => {
  beforeEach(() => { document.documentElement.removeAttribute('data-theme'); });

  it('writes the theme to the document element', () => {
    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});

describe('readPalette', () => {
  it('returns a string for every palette key', () => {
    document.documentElement.style.setProperty('--acc', '#4F7CFF');
    document.documentElement.style.setProperty('--acc2', '#7CE0C3');
    document.documentElement.style.setProperty('--line', '#232329');
    document.documentElement.style.setProperty('--faint', '#52525B');
    document.documentElement.style.setProperty('--warn', '#FBBF24');
    document.documentElement.style.setProperty('--node', '#0A0A0C');
    document.documentElement.style.setProperty('--ink', '#F4F4F5');
    const p = readPalette();
    expect(p.acc).toBe('#4F7CFF');
    expect(p.node).toBe('#0A0A0C');
    for (const v of Object.values(p)) expect(v.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm test -- tests/theme.test.ts`
Expected: FAIL — cannot resolve module `@/lib/theme`.

- [ ] **Step 6: Implement the theme module**

Create `src/lib/theme.ts`:

```ts
export type Theme = 'dark' | 'light';

export interface Palette {
  acc: string;
  acc2: string;
  line: string;
  faint: string;
  warn: string;
  node: string;
  ink: string;
}

const STORAGE_KEY = 'anas-theme';

export function resolveInitialTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === 'dark' || stored === 'light') return stored;
  return prefersDark ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  // Private-mode Safari throws on setItem. A missing preference is recoverable;
  // a crashed toggle is not.
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* preference simply will not persist */
  }
}

export function loadStoredTheme(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function readPalette(): Palette {
  const s = getComputedStyle(document.documentElement);
  const g = (n: string) => s.getPropertyValue(n).trim();
  return {
    acc: g('--acc'),
    acc2: g('--acc2'),
    line: g('--line'),
    faint: g('--faint'),
    warn: g('--warn'),
    node: g('--node'),
    ink: g('--ink'),
  };
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test -- tests/theme.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 8: Bootstrap the theme before first paint**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Archivo, Space_Grotesk, Instrument_Serif } from 'next/font/google';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'], display: 'swap', variable: '--font-display',
  weight: ['400', '500', '600', '800', '900'],
});
const grotesk = Space_Grotesk({
  subsets: ['latin'], display: 'swap', variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});
const serif = Instrument_Serif({
  subsets: ['latin'], display: 'swap', variable: '--font-accent',
  weight: ['400'], style: ['italic'],
});

export const metadata: Metadata = {
  title: 'Muhammad Anas — Full-Stack & AI Engineer',
  description:
    'Full-Stack and AI Engineer in Munich. Production LLM agents with tool calling and RAG, the services around them, and the AWS infrastructure underneath.',
};

// Runs before first paint so the correct theme is applied without a flash.
const THEME_BOOTSTRAP = `(function(){try{
var s=localStorage.getItem('anas-theme');
var t=(s==='dark'||s==='light')?s:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
document.documentElement.dataset.theme=t;
}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className={`${archivo.variable} ${grotesk.variable} ${serif.variable}`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 9: Verify the app boots**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: page renders on the dark background `#0A0A0C`. Run `npm run build` and confirm it completes with no type errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js app with design tokens and theme module"
```

---

## Task 2: Content module

**Files:**
- Create: `src/content/resume.ts`
- Test: `tests/resume.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `resume` object with the exact shape below. Every later component imports from here and **never hardcodes copy**.

- [ ] **Step 1: Write the failing test**

Create `tests/resume.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resume } from '@/content/resume';

describe('resume content', () => {
  it('has the four narrative acts in order', () => {
    expect(resume.acts).toHaveLength(4);
    expect(resume.acts.map((a) => a.kicker)).toEqual([
      '01 — Retrieval', '02 — Extraction', '03 — Agents', '04 — Shipped',
    ]);
  });

  it('has four roles, most recent first', () => {
    expect(resume.experience).toHaveLength(4);
    expect(resume.experience[0].company).toBe('Redseven Entertainment GmbH');
  });

  it('has three projects and seven skill groups', () => {
    expect(resume.projects).toHaveLength(3);
    expect(resume.skills).toHaveLength(7);
  });

  it('exposes contact links only — no form endpoint', () => {
    expect(resume.contact.email).toBe('anashabib139@gmail.com');
    expect(resume.contact).not.toHaveProperty('formEndpoint');
  });

  it('gives every act a formation index matching its position', () => {
    resume.acts.forEach((act, i) => expect(act.formation).toBe(i + 1));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/resume.test.ts`
Expected: FAIL — cannot resolve `@/content/resume`.

- [ ] **Step 3: Write the content module**

Create `src/content/resume.ts`. Every value below traces to the resume PDF:

```ts
export interface Act {
  kicker: string;
  heading: string;
  emphasis: string;
  headingTail: string;
  body: string;
  chips: readonly string[];
  formation: number;
  side: 'left' | 'right';
}

export interface Role {
  title: string;
  company: string;
  context?: string;
  location: string;
  period: string;
  bullets: readonly string[];
}

export const resume = {
  name: 'Muhammad Anas',
  role: 'Full-Stack & AI Engineer',
  location: 'Munich, Germany',
  eyebrow: 'Munich, Germany — EU Blue Card eligible',
  summary:
    'Full-stack & AI engineer. Production LLM agents with tool calling and RAG, the TypeScript and Python services around them, and the AWS infrastructure underneath.',
  metrics: [
    { value: '2+', label: 'Years shipping' },
    { value: '10h', label: 'Saved / week' },
    { value: '111', label: 'Licensors priced' },
  ],

  acts: [
    {
      kicker: '01 — Retrieval',
      heading: 'Finding the ',
      emphasis: 'right',
      headingTail: ' context',
      body: 'Documents become vectors. A question becomes a vector too. The neighbourhood that lights up is what the model actually gets to see — get this wrong and nothing downstream matters.',
      chips: ['pgvector', 'Pinecone', 'LangChain', 'RAG'],
      formation: 1,
      side: 'left',
    },
    {
      kicker: '02 — Extraction',
      heading: 'Messy in, ',
      emphasis: 'schema',
      headingTail: ' out',
      body: "HR emails and scanned receipts flow through extract, validate, store. What the model isn't sure about gets flagged for a human instead of quietly guessed at.",
      chips: ['Python', 'FastAPI', 'Structured output', 'PostgreSQL'],
      formation: 2,
      side: 'right',
    },
    {
      kicker: '03 — Agents',
      heading: 'Tools, not ',
      emphasis: 'chat',
      headingTail: '',
      body: 'A router reads the question and hands it to the specialist agent that can answer it. Twelve typed tools underneath. Agents propose changes; a person approves them, applied in one transaction, logged.',
      chips: ['OpenAI Agents SDK', 'Responses API', 'Tool calling', 'NestJS'],
      formation: 3,
      side: 'left',
    },
    {
      kicker: '04 — Shipped',
      heading: 'Running in ',
      emphasis: 'production',
      headingTail: '',
      body: 'Three internal apps at ProSiebenSat.1, a pricing engine across 111 licensors, and a 200-endpoint platform. All on AWS, provisioned in Terraform, released on merge.',
      chips: ['ECS Fargate', 'Aurora', 'Terraform', 'GitLab CI/CD'],
      formation: 4,
      side: 'right',
    },
  ] as const satisfies readonly Act[],

  experience: [
    {
      title: 'Full-Stack AI Engineer',
      company: 'Redseven Entertainment GmbH',
      context: 'ProSiebenSat.1 Group',
      location: 'Munich, Germany',
      period: 'Mar 2026 — Present',
      bullets: [
        'Shipped three internal web applications in NestJS, Next.js and PostgreSQL that replaced Excel- and email-based workflows for TV production teams, saving them 10+ hours a week of manual data entry',
        'Designed "Nellie", an AI assistant that lets rights and finance staff ask licensing cost questions in plain English — a fast routing model reads each question and hands it to the specialist agent that can answer it, built on the OpenAI Responses API',
        'Wrote the tool-calling loop behind those agents, giving them 12 typed tools for cost breakdowns and missing licensing data, and stored conversations in PostgreSQL so users resume days later',
        'Hardened the assistant for finance use: agents propose changes instead of writing them, and each approval is re-checked, applied in one database transaction, and logged. Role-based permissions block unscoped bulk edits',
        'Developed LLM extraction pipelines turning HR emails and scanned receipts into schema-validated records, flagging fields the model is unsure about instead of guessing at them',
        'Implemented the pricing engine reproducing legacy Excel cost rules across 111 licensors with live exchange rates, and integrated Microsoft Graph (Outlook, Entra ID SSO)',
        'Deployed all three to AWS on ECS Fargate with Aurora Postgres and S3, provisioned in Terraform, with Docker builds and GitLab CI/CD releasing on merge',
      ],
    },
    {
      title: 'AI Engineer',
      company: 'Arcpeak',
      location: 'Munich, Germany',
      period: 'Aug 2025 — Feb 2026',
      bullets: [
        "Built an AI business-analysis tool in Python on the OpenAI GPT APIs that reads a company's spend data and points out where enterprise clients are losing money",
        'Created the conversational side with the OpenAI Agents SDK, giving the assistant tools it could call, guardrails on what it would answer, and Redis Streams for resumable sessions — users reached an answer 60% faster than with the old report-based flow',
        'Replaced manual deploys by defining the AWS setup in Terraform (ECS Fargate, RDS, ElastiCache, ALB) and wiring GitHub Actions to build and release automatically, cutting deployment time by 80%',
        'Added JWT and OAuth 2.0 login and Stripe subscription billing, enabling the company to onboard its first paying customers',
        'Set up automated testing with Pytest, wired into the CI pipeline so tests run before anything ships',
        'Delivered the React and TypeScript dashboard where clients read those insights and track their own metrics',
      ],
    },
    {
      title: 'Backend Engineer (Freelance)',
      company: 'Boardd',
      context: 'Enterprise Business Platform',
      location: 'Remote',
      period: 'May 2025 — Present',
      bullets: [
        'Built the backend for a business-management platform in Node.js and Express on MongoDB, growing it to over 200 REST endpoints covering projects, team collaboration, and client billing',
        'Handled the money side with Stripe Connect so the platform could pay several parties at once, including Treasury accounts, virtual card issuing, recurring invoices, and onboarding for connected accounts',
        'Made the app collaborative in real time over Socket.IO, with live task editing, Kanban boards, and drag-and-drop backed by optimistic locking, plus presence indicators showing who else is in a project',
        'Secured it with JWT auth, rotating refresh tokens, Redis-backed sessions, and a role system with 40+ permissions',
        'Connected messaging and storage services: Twilio SMS, SendGrid email, Firebase push, and file sync across AWS S3, Google Drive, Dropbox, and OneDrive',
      ],
    },
    {
      title: 'Full-Stack Software Engineer',
      company: 'WorkSpin',
      location: 'Karachi, Pakistan',
      period: 'Jul 2023 — May 2024',
      bullets: [
        'Developed the backend for an event-discovery app in Node.js, using Socket.IO for live updates and adding OAuth/JWT login and Stripe checkout',
        'Cut query latency by 70% and peak database load by 50% by reshaping the MongoDB schemas and adding Redis caching. Also delivered a gym-management system with AWS S3 media storage, live streaming, and Firebase alerts',
      ],
    },
  ] as const satisfies readonly Role[],

  projects: [
    {
      name: 'InsightQL',
      tagline: 'AI Database Assistant',
      body: "A Next.js and NestJS tool that lets non-technical users query a database by typing a question in plain English, using LangChain's SQL agent over OpenAI GPT. Gets people an answer roughly 3x faster than writing the SQL themselves.",
      chips: ['Next.js', 'NestJS', 'LangChain', 'OpenAI GPT'],
    },
    {
      name: 'bugSage',
      tagline: 'AI Debugging Assistant',
      body: 'A FastAPI chatbot that pulls relevant docs and past issues out of a Pinecone vector database (RAG) before answering, so its fixes for Express.js bugs match the code you are actually running.',
      chips: ['FastAPI', 'Pinecone', 'RAG', 'PyTorch'],
    },
    {
      name: 'CLI Assistant',
      tagline: 'Agentic Terminal Tool',
      body: 'A Python assistant that runs entirely offline on a local model via Ollama, with an agentic loop that chains five tools together through function calling.',
      chips: ['Python', 'Ollama', 'Function calling'],
    },
  ],

  skills: [
    { group: 'Languages', items: ['Python', 'TypeScript', 'JavaScript', 'SQL', 'Java'] },
    { group: 'AI & LLM', items: ['OpenAI API', 'OpenAI Agents SDK', 'LangChain', 'AI Agents', 'Tool/Function Calling', 'RAG', 'Vector Databases (pgvector, Pinecone)', 'Prompt Engineering', 'PyTorch'] },
    { group: 'Backend', items: ['Node.js', 'NestJS', 'Express', 'FastAPI', 'REST APIs', 'GraphQL', 'WebSockets (Socket.IO)', 'Prisma', 'TypeORM'] },
    { group: 'Frontend', items: ['React', 'Next.js', 'Redux', 'Tailwind CSS', 'HTML/CSS'] },
    { group: 'Databases', items: ['PostgreSQL', 'MongoDB', 'Redis'] },
    { group: 'Cloud & DevOps', items: ['AWS (ECS Fargate, Aurora/RDS, S3, Secrets Manager)', 'Docker', 'Terraform', 'Kubernetes', 'GitLab CI/CD', 'GitHub Actions', 'Git'] },
    { group: 'Practices', items: ['Agile/Scrum', 'Code Review', 'Unit Testing (Jest, Pytest)', 'CI/CD', 'Microservices'] },
  ],

  education: [
    { school: 'University of Passau', degree: 'MSc in Computer Science', location: 'Passau, Germany', period: 'Oct 2024 — Present' },
    { school: 'National University of Computer and Emerging Sciences (FAST-NUCES)', degree: 'BS in Software Engineering', location: 'Karachi, Pakistan', period: 'Aug 2020 — Jun 2024' },
  ],

  publication: {
    title: 'Deep Learning for User Mobility Prediction in RIS-Assisted 6G THz Networks',
    venue: 'IEEE',
    body: 'Benchmarked deep learning models for predicting user movement in next-generation (6G) mobile networks, to keep connections stable as users move.',
  },

  contact: {
    email: 'anashabib139@gmail.com',
    phone: '+49 170 7413792',
    linkedin: 'https://linkedin.com/in/anas-baqai-bo21',
    github: 'https://github.com/AnasBaqai',
    cv: '/anas-cv.pdf',
  },

  languages: 'English (C1), German (A1)',
  authorisation: 'Student visa, eligible for EU Blue Card',
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/resume.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Add the CV asset**

Copy the resume PDF to `public/anas-cv.pdf`:

```bash
cp /Users/anasbaqai/Downloads/anas_two_pages.pdf public/anas-cv.pdf
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add typed resume content module"
```

---

## Task 3: Shared math and scroll subscription

**Files:**
- Create: `src/lib/math.ts`, `src/lib/scroll.ts`
- Test: `tests/math.test.ts`, `tests/scroll.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `function clamp(v: number, min: number, max: number): number`
  - `function lerp(a: number, b: number, t: number): number`
  - `function easeInOut(t: number): number`
  - `function mulberry32(seed: number): () => number`
  - `function narrativeProgress(scrollY: number, startY: number, endY: number): number`
  - `function panelVisibility(rectTop: number, rectHeight: number, viewportHeight: number): number`
  - `function subscribeToFrame(cb: (scrollY: number, timeSeconds: number) => void): () => void`

- [ ] **Step 1: Write the failing math test**

Create `tests/math.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { clamp, lerp, easeInOut, mulberry32 } from '@/lib/math';

describe('clamp', () => {
  it('bounds values to the range', () => {
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(0.4, 0, 1)).toBe(0.4);
  });
});

describe('lerp', () => {
  it('interpolates linearly and hits both endpoints exactly', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
});

describe('easeInOut', () => {
  it('is symmetric around the midpoint and pinned at the ends', () => {
    expect(easeInOut(0)).toBeCloseTo(0);
    expect(easeInOut(1)).toBeCloseTo(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
    // symmetry: f(t) + f(1-t) === 1
    for (const t of [0.1, 0.25, 0.4]) {
      expect(easeInOut(t) + easeInOut(1 - t)).toBeCloseTo(1, 5);
    }
  });

  it('is monotonically increasing', () => {
    let prev = -1;
    for (let t = 0; t <= 1; t += 0.05) {
      const v = easeInOut(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe('mulberry32', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });

  it('produces values in [0, 1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 200; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/math.test.ts`
Expected: FAIL — cannot resolve `@/lib/math`.

- [ ] **Step 3: Implement the math module**

Create `src/lib/math.ts`:

```ts
export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Quadratic ease-in-out. Symmetric, monotonic, pinned at 0 and 1. */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Small deterministic PRNG. Formations must be identical across reloads and
 * between server and client, so Math.random is not an option.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/math.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write the failing scroll test**

Create `tests/scroll.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { narrativeProgress, panelVisibility } from '@/lib/scroll';

describe('narrativeProgress', () => {
  it('clamps to [0, 1] outside the narrative range', () => {
    expect(narrativeProgress(0, 500, 4500)).toBe(0);
    expect(narrativeProgress(9999, 500, 4500)).toBe(1);
  });

  it('is 0.5 at the midpoint', () => {
    expect(narrativeProgress(2500, 500, 4500)).toBeCloseTo(0.5);
  });

  it('is monotonically non-decreasing in scrollY', () => {
    let prev = -1;
    for (let y = 0; y <= 5000; y += 100) {
      const p = narrativeProgress(y, 500, 4500);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });

  it('never divides by zero when the range is degenerate', () => {
    const p = narrativeProgress(500, 500, 500);
    expect(Number.isFinite(p)).toBe(true);
  });
});

describe('panelVisibility', () => {
  const VH = 900;
  const H = 990; // one act is 110vh

  it('is 0 before the panel enters and after it leaves', () => {
    expect(panelVisibility(VH, H, VH)).toBe(0);
    expect(panelVisibility(-H, H, VH)).toBe(0);
  });

  it('reaches full opacity while the panel is centred', () => {
    // act centred: its top sits just above the viewport top
    expect(panelVisibility(-(H - VH) / 2, H, VH)).toBe(1);
  });

  it('holds at 1 across a readable band rather than peaking instantaneously', () => {
    let full = 0;
    for (let top = VH; top > -H; top -= 5) {
      if (panelVisibility(top, H, VH) === 1) full++;
    }
    // the plateau must span a meaningful portion of the act's travel
    expect(full).toBeGreaterThan(50);
  });

  it('is symmetric on entry and exit', () => {
    const centre = -(H - VH) / 2;
    for (const d of [200, 400, 600]) {
      expect(panelVisibility(centre + d, H, VH)).toBeCloseTo(
        panelVisibility(centre - d, H, VH), 5,
      );
    }
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- tests/scroll.test.ts`
Expected: FAIL — cannot resolve `@/lib/scroll`.

- [ ] **Step 7: Implement the scroll module**

Create `src/lib/scroll.ts`:

```ts
import { clamp } from './math';

/** Progress through the narrative, 0 at startY and 1 at endY. */
export function narrativeProgress(scrollY: number, startY: number, endY: number): number {
  const span = endY - startY;
  if (span <= 0) return 0;
  return clamp((scrollY - startY) / span, 0, 1);
}

/**
 * Opacity for one narrative panel, from its bounding-rect top.
 * Ramps in, holds across the middle so the copy is actually readable, ramps out.
 * A pure function of scroll position — scrolling back up reverses it exactly.
 */
export function panelVisibility(
  rectTop: number,
  rectHeight: number,
  viewportHeight: number,
): number {
  // q: 0 as the act enters from the bottom, 1 as it leaves the top
  const q = clamp((viewportHeight - rectTop) / (viewportHeight + rectHeight), 0, 1);
  return clamp(Math.min((q - 0.12) / 0.2, (0.88 - q) / 0.2), 0, 1);
}

type FrameCallback = (scrollY: number, timeSeconds: number) => void;

const callbacks = new Set<FrameCallback>();
let rafId = 0;

function tick(now: number) {
  const y = window.scrollY;
  const t = now / 1000;
  for (const cb of callbacks) cb(y, t);
  rafId = requestAnimationFrame(tick);
}

/**
 * Register a per-frame callback on the single shared rAF loop.
 * One loop for the whole page — not one per component.
 * Returns an unsubscribe function.
 */
export function subscribeToFrame(cb: FrameCallback): () => void {
  callbacks.add(cb);
  if (rafId === 0) rafId = requestAnimationFrame(tick);
  return () => {
    callbacks.delete(cb);
    if (callbacks.size === 0 && rafId !== 0) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- tests/scroll.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add shared math helpers and scroll subscription"
```

---

## Task 4: Formations and the journey

This is the heart of the feature. The five formations and the interpolation between them are what make the morph scrub correctly.

**Files:**
- Create: `src/lib/formations.ts`
- Test: `tests/formations.test.ts`

**Interfaces:**
- Consumes: `mulberry32`, `lerp`, `easeInOut`, `clamp` from `@/lib/math`
- Produces:
  - `const FORMATION_COUNT = 5`
  - `const JOURNEY: readonly (readonly [number, number, number])[]` — five `[xFraction, yFraction, scaleFraction]` keyframes
  - `function buildFormations(n: number, seed?: number): Float32Array[]` — five buffers, each length `n * 2`, values in normalised local space roughly `[-1, 1]`
  - `function stageAt(progress: number): { index: number; frac: number }`
  - `function interpolateInto(formations: Float32Array[], index: number, frac: number, out: Float32Array): void`
  - `function journeyAt(index: number, frac: number, width: number, height: number): { cx: number; cy: number; scale: number }`

- [ ] **Step 1: Write the failing test**

Create `tests/formations.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  FORMATION_COUNT, JOURNEY, buildFormations, stageAt, interpolateInto, journeyAt,
} from '@/lib/formations';

const N = 180;

describe('buildFormations', () => {
  const forms = buildFormations(N, 1);

  it('returns exactly five formations', () => {
    expect(forms).toHaveLength(FORMATION_COUNT);
    expect(JOURNEY).toHaveLength(FORMATION_COUNT);
  });

  it('gives every formation exactly N points', () => {
    for (const f of forms) expect(f.length).toBe(N * 2);
  });

  it('keeps every point inside normalised bounds', () => {
    for (const f of forms) {
      for (let i = 0; i < f.length; i++) {
        expect(Math.abs(f[i])).toBeLessThanOrEqual(1.2);
      }
    }
  });

  it('is deterministic for a fixed seed', () => {
    const again = buildFormations(N, 1);
    for (let k = 0; k < FORMATION_COUNT; k++) {
      expect(Array.from(again[k])).toEqual(Array.from(forms[k]));
    }
  });

  it('makes the formations visibly distinct from one another', () => {
    // If two formations were near-identical the morph would read as static.
    for (let a = 0; a < FORMATION_COUNT; a++) {
      for (let b = a + 1; b < FORMATION_COUNT; b++) {
        let sum = 0;
        for (let i = 0; i < forms[a].length; i++) {
          sum += Math.abs(forms[a][i] - forms[b][i]);
        }
        expect(sum / forms[a].length).toBeGreaterThan(0.15);
      }
    }
  });

  it('lays the pipeline formation onto three horizontal rails', () => {
    const pipeline = forms[2];
    const ys = new Set<number>();
    for (let i = 1; i < pipeline.length; i += 2) ys.add(Math.round(pipeline[i] * 10) / 10);
    // three rails at -0.42, 0, 0.42 with small jitter
    expect(ys.size).toBeLessThanOrEqual(6);
  });
});

describe('stageAt', () => {
  it('maps progress 0..1 onto four segments between five keyframes', () => {
    expect(stageAt(0)).toEqual({ index: 0, frac: 0 });
    expect(stageAt(1).index).toBe(3);
    expect(stageAt(1).frac).toBeCloseTo(1);
  });

  it('never returns an index that would read past the last formation', () => {
    for (let p = 0; p <= 1; p += 0.01) {
      const { index } = stageAt(p);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThanOrEqual(FORMATION_COUNT - 2);
    }
  });
});

describe('interpolateInto', () => {
  const forms = buildFormations(N, 1);
  const out = new Float32Array(N * 2);

  it('reproduces a formation exactly at frac 0', () => {
    interpolateInto(forms, 2, 0, out);
    for (let i = 0; i < out.length; i++) expect(out[i]).toBeCloseTo(forms[2][i], 5);
  });

  it('reproduces the next formation exactly at frac 1', () => {
    interpolateInto(forms, 2, 1, out);
    for (let i = 0; i < out.length; i++) expect(out[i]).toBeCloseTo(forms[3][i], 5);
  });

  it('is a pure function of its inputs — scrubbing backwards matches exactly', () => {
    const forward = new Float32Array(N * 2);
    const backward = new Float32Array(N * 2);
    interpolateInto(forms, 1, 0.37, forward);
    // simulate scrolling away and returning to the same offset
    interpolateInto(forms, 3, 0.9, backward);
    interpolateInto(forms, 1, 0.37, backward);
    expect(Array.from(backward)).toEqual(Array.from(forward));
  });
});

describe('journeyAt', () => {
  it('moves the subject a long way across the viewport', () => {
    const W = 1440, H = 900;
    const a = journeyAt(0, 0, W, H);
    const b = journeyAt(1, 1, W, H); // extraction keyframe — crosses to the left
    expect(Math.abs(a.cx - b.cx) / W).toBeGreaterThan(0.35);
  });

  it('keeps the subject on screen at every point of the journey', () => {
    const W = 1440, H = 900;
    for (let i = 0; i <= FORMATION_COUNT - 2; i++) {
      for (const f of [0, 0.5, 1]) {
        const j = journeyAt(i, f, W, H);
        expect(j.cx).toBeGreaterThan(0);
        expect(j.cx).toBeLessThan(W);
        expect(j.cy).toBeGreaterThan(0);
        expect(j.cy).toBeLessThan(H);
        expect(j.scale).toBeGreaterThan(0);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/formations.test.ts`
Expected: FAIL — cannot resolve `@/lib/formations`.

- [ ] **Step 3: Implement formations**

Create `src/lib/formations.ts`:

```ts
import { clamp, easeInOut, lerp, mulberry32 } from './math';

export const FORMATION_COUNT = 5;

/**
 * Where the subject sits and how big it is, per formation:
 * [x fraction of width, y fraction of height, scale fraction of min(w,h)].
 * The large horizontal swings are the point — the subject must visibly
 * traverse the viewport, not drift.
 */
export const JOURNEY = [
  [0.72, 0.5, 0.34], // 0 cloud (hero)
  [0.74, 0.48, 0.46], // 1 embedding field
  [0.28, 0.5, 0.44], // 2 pipeline — crosses to the far left
  [0.7, 0.52, 0.4], // 3 agent graph — back right
  [0.42, 0.44, 0.5], // 4 constellation — centre-left, largest
] as const satisfies readonly (readonly [number, number, number])[];

/** Cluster centres for the constellation formation. Shared with the overlay. */
export const CLUSTERS = [
  [-0.62, -0.28],
  [0.05, 0.34],
  [0.66, -0.16],
] as const;

/** Rail offsets for the pipeline formation. Shared with the overlay. */
export const RAILS = [-0.42, 0, 0.42] as const;

/**
 * Build all five formations in normalised local space.
 * Deterministic for a given seed so reloads and SSR/CSR agree.
 */
export function buildFormations(n: number, seed = 1): Float32Array[] {
  const rand = mulberry32(seed);
  const forms = Array.from({ length: FORMATION_COUNT }, () => new Float32Array(n * 2));
  const [cloud, embed, pipeline, agent, constellation] = forms;

  for (let i = 0; i < n; i++) {
    const k = i * 2;

    // 0 · scattered cloud
    const a0 = rand() * Math.PI * 2;
    const d0 = Math.sqrt(rand()) * 0.95;
    cloud[k] = Math.cos(a0) * d0;
    cloud[k + 1] = Math.sin(a0) * d0 * 0.9;

    // 1 · embedding field — wider, denser toward the edge
    const a1 = rand() * Math.PI * 2;
    const d1 = Math.pow(rand(), 0.62);
    embed[k] = Math.cos(a1) * d1;
    embed[k + 1] = Math.sin(a1) * d1 * 0.82;

    // 2 · pipeline — three horizontal rails
    const rail = RAILS[i % 3];
    pipeline[k] = rand() * 2 - 1;
    pipeline[k + 1] = rail + (rand() - 0.5) * 0.07;

    // 3 · agent graph — router core plus seven tool clusters
    if (i < 18) {
      const a = rand() * Math.PI * 2;
      const d = rand() * 0.13;
      agent[k] = Math.cos(a) * d;
      agent[k + 1] = Math.sin(a) * d;
    } else {
      const tool = (i - 18) % 7;
      const a = -Math.PI / 2 + tool * ((Math.PI * 2) / 7);
      const spread = (Math.floor((i - 18) / 7) % 4) / 4 * 0.16;
      const r = 0.78 - spread;
      agent[k] = Math.cos(a) * r + (rand() - 0.5) * 0.1;
      agent[k + 1] = Math.sin(a) * r + (rand() - 0.5) * 0.1;
    }

    // 4 · constellation — three project clusters
    const [ccx, ccy] = CLUSTERS[i % 3];
    const a4 = rand() * Math.PI * 2;
    const d4 = Math.sqrt(rand()) * 0.3;
    constellation[k] = ccx + Math.cos(a4) * d4;
    constellation[k + 1] = ccy + Math.sin(a4) * d4 * 0.9;
  }

  return forms;
}

/** Split narrative progress into a formation index and an eased fraction. */
export function stageAt(progress: number): { index: number; frac: number } {
  const s = clamp(progress, 0, 1) * (FORMATION_COUNT - 1);
  const index = clamp(Math.floor(s), 0, FORMATION_COUNT - 2);
  return { index, frac: easeInOut(s - index) };
}

/**
 * Write the interpolated point buffer for the given stage into `out`.
 * Pure interpolation, never a simulation — this is what guarantees that
 * scrolling up morphs backwards exactly.
 */
export function interpolateInto(
  formations: Float32Array[],
  index: number,
  frac: number,
  out: Float32Array,
): void {
  const a = formations[index];
  const b = formations[index + 1];
  for (let i = 0; i < out.length; i++) out[i] = lerp(a[i], b[i], frac);
}

/** Position and scale of the whole subject in viewport pixels. */
export function journeyAt(
  index: number,
  frac: number,
  width: number,
  height: number,
): { cx: number; cy: number; scale: number } {
  const a = JOURNEY[index];
  const b = JOURNEY[index + 1];
  const min = Math.min(width, height);
  return {
    cx: lerp(a[0], b[0], frac) * width,
    cy: lerp(a[1], b[1], frac) * height,
    scale: lerp(a[2], b[2], frac) * min,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/formations.test.ts`
Expected: PASS, 13 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add five formations, journey keyframes, and scrub interpolation"
```

---

## Task 5: Spatial-grid neighbour links

The embedding overlay draws links between nearby particles. Naive comparison is O(n²) — 180 particles is ~16k pair checks every frame, which is the one real performance hazard on mobile. This task replaces it with a uniform grid.

**Files:**
- Create: `src/lib/neighbors.ts`
- Test: `tests/neighbors.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `function computeLinks(points: Float32Array, radius: number, out: Int32Array): number` — writes pairs as consecutive `i, j` **point indices** into `out`, returns the number of pairs written (not the number of ints).

- [ ] **Step 1: Write the failing test**

Create `tests/neighbors.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeLinks } from '@/lib/neighbors';

/** Reference implementation — the naive O(n²) version we are replacing. */
function naive(points: Float32Array, radius: number): Set<string> {
  const n = points.length / 2;
  const pairs = new Set<string>();
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = points[i * 2] - points[j * 2];
      const dy = points[i * 2 + 1] - points[j * 2 + 1];
      if (Math.hypot(dx, dy) < radius) pairs.add(`${i}-${j}`);
    }
  }
  return pairs;
}

function toSet(out: Int32Array, count: number): Set<string> {
  const s = new Set<string>();
  for (let p = 0; p < count; p++) {
    const a = out[p * 2];
    const b = out[p * 2 + 1];
    s.add(a < b ? `${a}-${b}` : `${b}-${a}`);
  }
  return s;
}

describe('computeLinks', () => {
  it('finds exactly the same pairs as the naive implementation', () => {
    const n = 200;
    const pts = new Float32Array(n * 2);
    let seed = 12345;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let i = 0; i < n * 2; i++) pts[i] = rnd() * 800;

    const out = new Int32Array(n * n);
    const count = computeLinks(pts, 60, out);
    expect(toSet(out, count)).toEqual(naive(pts, 60));
  });

  it('reports no pairs when every point is further apart than the radius', () => {
    const pts = new Float32Array([0, 0, 500, 0, 1000, 0]);
    const out = new Int32Array(64);
    expect(computeLinks(pts, 50, out)).toBe(0);
  });

  it('never emits a pair twice or links a point to itself', () => {
    const pts = new Float32Array([0, 0, 1, 1, 2, 2, 3, 3]);
    const out = new Int32Array(64);
    const count = computeLinks(pts, 100, out);
    const seen = toSet(out, count);
    expect(seen.size).toBe(count);
    for (const key of seen) {
      const [a, b] = key.split('-');
      expect(a).not.toBe(b);
    }
  });

  it('stops cleanly when the output buffer is full instead of overflowing', () => {
    const n = 100;
    const pts = new Float32Array(n * 2); // all coincident, so every pair is a link
    const out = new Int32Array(20); // room for 10 pairs only
    const count = computeLinks(pts, 10, out);
    expect(count).toBe(10);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/neighbors.test.ts`
Expected: FAIL — cannot resolve `@/lib/neighbors`.

- [ ] **Step 3: Implement the spatial grid**

Create `src/lib/neighbors.ts`:

```ts
/**
 * Find all point pairs closer than `radius`, using a uniform grid.
 *
 * Bucket size equals the radius, so any pair within the radius must share a
 * bucket or sit in one of the four already-visited neighbours. That turns the
 * naive O(n^2) sweep into roughly O(n) for evenly spread points — this is the
 * difference between 60fps and a stuttering hero on a mid-tier phone.
 *
 * Writes pairs as consecutive point indices into `out`.
 * Returns the number of PAIRS written, not the number of integers.
 */
export function computeLinks(points: Float32Array, radius: number, out: Int32Array): number {
  const n = points.length / 2;
  const maxPairs = Math.floor(out.length / 2);
  if (n === 0 || maxPairs === 0 || radius <= 0) return 0;

  let minX = Infinity, minY = Infinity;
  for (let i = 0; i < n; i++) {
    const x = points[i * 2];
    const y = points[i * 2 + 1];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
  }

  const cell = radius;
  const buckets = new Map<number, number[]>();
  const cols = 0x10000; // key packing stride

  const keyOf = (cx: number, cy: number) => cy * cols + cx;

  const cxOf = new Int32Array(n);
  const cyOf = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    const cx = Math.floor((points[i * 2] - minX) / cell);
    const cy = Math.floor((points[i * 2 + 1] - minY) / cell);
    cxOf[i] = cx;
    cyOf[i] = cy;
    const k = keyOf(cx, cy);
    const b = buckets.get(k);
    if (b) b.push(i);
    else buckets.set(k, [i]);
  }

  // Half-neighbourhood: own bucket plus four of the eight neighbours, so each
  // pair is considered exactly once.
  const OFFSETS: readonly (readonly [number, number])[] = [
    [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1],
  ];

  const r2 = radius * radius;
  let pairs = 0;

  for (let i = 0; i < n; i++) {
    const ix = points[i * 2];
    const iy = points[i * 2 + 1];
    for (const [ox, oy] of OFFSETS) {
      const b = buckets.get(keyOf(cxOf[i] + ox, cyOf[i] + oy));
      if (!b) continue;
      for (const j of b) {
        // Within the own bucket, only look forward to avoid duplicate pairs.
        if (ox === 0 && oy === 0 && j <= i) continue;
        const dx = ix - points[j * 2];
        const dy = iy - points[j * 2 + 1];
        if (dx * dx + dy * dy >= r2) continue;
        if (pairs >= maxPairs) return pairs;
        out[pairs * 2] = i;
        out[pairs * 2 + 1] = j;
        pairs++;
      }
    }
  }

  return pairs;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/neighbors.test.ts`
Expected: PASS, 4 tests. The first test is the important one — it proves the grid finds *exactly* the same pairs as the naive version.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "perf: replace O(n^2) neighbour search with a uniform spatial grid"
```

---

## Task 6: Overlay draw functions

**Files:**
- Create: `src/lib/overlays.ts`
- Test: `tests/overlays.test.ts`

**Interfaces:**
- Consumes: `Palette` from `@/lib/theme`; `CLUSTERS`, `RAILS` from `@/lib/formations`
- Produces:
  - `interface SubjectState { cx: number; cy: number; scale: number; spin: number; time: number; points: Float32Array }`
  - `function stageWeight(s: number, stage: number): number`
  - `function rgba(hex: string, alpha: number): string`
  - `function drawEmbedding(ctx, state, weight, palette, links, linkCount, lit): void`
  - `function drawPipeline(ctx, state, weight, palette): void`
  - `function drawAgent(ctx, state, weight, palette): void`
  - `function drawConstellation(ctx, state, weight, palette): void`
  - `function drawParticles(ctx, state, palette, lit): void`

  `lit` is a `Float32Array` of length `n` holding per-particle highlight, written by `drawEmbedding` and read by `drawParticles`.

- [ ] **Step 1: Write the failing test**

Create `tests/overlays.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { rgba, stageWeight } from '@/lib/overlays';

describe('rgba', () => {
  it('expands six-digit hex', () => {
    expect(rgba('#4F7CFF', 0.5)).toBe('rgba(79,124,255,0.5)');
  });

  it('expands three-digit shorthand hex', () => {
    expect(rgba('#FFF', 1)).toBe('rgba(255,255,255,1)');
  });

  it('tolerates the whitespace getComputedStyle leaves behind', () => {
    expect(rgba('  #0A0A0C ', 1)).toBe('rgba(10,10,12,1)');
  });
});

describe('stageWeight', () => {
  it('is 1 exactly on its stage and 0 a full stage away', () => {
    expect(stageWeight(2, 2)).toBe(1);
    expect(stageWeight(3, 2)).toBe(0);
    expect(stageWeight(1, 2)).toBe(0);
  });

  it('fades linearly between stages', () => {
    expect(stageWeight(2.5, 2)).toBeCloseTo(0.5);
    expect(stageWeight(2.5, 3)).toBeCloseTo(0.5);
  });

  it('never goes negative', () => {
    for (let s = 0; s <= 4; s += 0.1) {
      for (let stage = 0; stage < 5; stage++) {
        expect(stageWeight(s, stage)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('always has at least one overlay visible at any progress', () => {
    for (let s = 0; s <= 4; s += 0.05) {
      const total = [0, 1, 2, 3, 4].reduce((acc, st) => acc + stageWeight(s, st), 0);
      expect(total).toBeGreaterThan(0.9);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/overlays.test.ts`
Expected: FAIL — cannot resolve `@/lib/overlays`.

- [ ] **Step 3: Implement the overlays**

Create `src/lib/overlays.ts`:

```ts
import { clamp } from './math';
import { CLUSTERS, RAILS } from './formations';
import type { Palette } from './theme';

export interface SubjectState {
  cx: number;
  cy: number;
  scale: number;
  spin: number;
  time: number;
  points: Float32Array;
}

const TAU = Math.PI * 2;

/** Convert a CSS hex custom property to rgba(). Handles #RGB and #RRGGBB. */
export function rgba(hex: string, alpha: number): string {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** How visible a given overlay is, from continuous stage position s (0..4). */
export function stageWeight(s: number, stage: number): number {
  return clamp(1 - Math.abs(s - stage), 0, 1);
}

export function drawEmbedding(
  ctx: CanvasRenderingContext2D,
  st: SubjectState,
  w: number,
  p: Palette,
  links: Int32Array,
  linkCount: number,
  lit: Float32Array,
): void {
  if (w <= 0.02) return;
  const { points, cx, cy, scale, time } = st;

  ctx.lineWidth = 0.8;
  ctx.strokeStyle = rgba(p.line, w * 0.9);
  ctx.beginPath();
  for (let k = 0; k < linkCount; k++) {
    const i = links[k * 2] * 2;
    const j = links[k * 2 + 1] * 2;
    ctx.moveTo(points[i], points[i + 1]);
    ctx.lineTo(points[j], points[j + 1]);
  }
  ctx.stroke();

  // The query vector: orbits the field, lighting its neighbourhood.
  const qa = time * 0.55;
  const qr = scale * 0.44;
  const qx = cx + Math.cos(qa) * scale * 0.42;
  const qy = cy + Math.sin(qa) * scale * 0.34;

  ctx.strokeStyle = rgba(p.acc, 0.32 * w);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(qx, qy, qr, 0, TAU);
  ctx.stroke();

  const n = points.length / 2;
  ctx.lineWidth = 0.9;
  for (let i = 0; i < n; i++) {
    const dx = points[i * 2] - qx;
    const dy = points[i * 2 + 1] - qy;
    const d = Math.hypot(dx, dy);
    if (d >= qr) continue;
    const strength = (1 - d / qr) * w;
    ctx.strokeStyle = rgba(p.acc2, strength * 0.55);
    ctx.beginPath();
    ctx.moveTo(qx, qy);
    ctx.lineTo(points[i * 2], points[i * 2 + 1]);
    ctx.stroke();
    if (strength > lit[i]) lit[i] = strength;
  }

  ctx.fillStyle = rgba(p.acc, 0.13 * w);
  ctx.beginPath();
  ctx.arc(qx, qy, scale * 0.06, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(p.acc, w);
  ctx.beginPath();
  ctx.arc(qx, qy, 3.4, 0, TAU);
  ctx.fill();
}

export function drawPipeline(
  ctx: CanvasRenderingContext2D,
  st: SubjectState,
  w: number,
  p: Palette,
): void {
  if (w <= 0.02) return;
  const { cx, cy, scale, time } = st;
  const half = scale * 1.06;

  ctx.lineWidth = 1;
  ctx.strokeStyle = rgba(p.line, w);
  ctx.beginPath();
  for (const rail of RAILS) {
    ctx.moveTo(cx - half, cy + rail * scale);
    ctx.lineTo(cx + half, cy + rail * scale);
  }
  ctx.stroke();

  // Three stage gates: extract, validate, store.
  for (let g = 1; g <= 3; g++) {
    const gx = cx - half + (g * half * 2) / 4;
    ctx.strokeStyle = rgba(p.faint, 0.7 * w);
    ctx.beginPath();
    ctx.moveTo(gx, cy - 0.6 * scale);
    ctx.lineTo(gx, cy + 0.6 * scale);
    ctx.stroke();
    ctx.fillStyle = rgba(p.node, w);
    ctx.strokeStyle = rgba(p.faint, w);
    ctx.beginPath();
    ctx.rect(gx - 4, cy - 4, 8, 8);
    ctx.fill();
    ctx.stroke();
  }

  // Packets. Roughly one in seven is flagged and rerouted upward — this is
  // "flags fields the model is unsure about" made visible.
  const PACKETS = 16;
  for (let k = 0; k < PACKETS; k++) {
    const phase = (time * 0.24 + k / PACKETS) % 1;
    const rail = RAILS[k % 3];
    const flagged = k % 7 === 3;
    const divert = flagged ? clamp((phase - 0.5) * 2, 0, 1) * 0.17 : 0;
    const px = cx - half + phase * half * 2;
    const py = cy + rail * scale - divert * scale;
    const edgeFade = phase < 0.07 ? phase / 0.07 : phase > 0.93 ? (1 - phase) / 0.07 : 1;

    ctx.globalAlpha = edgeFade * w;
    ctx.fillStyle = flagged && divert > 0.02 ? p.warn : p.acc;
    ctx.fillRect(px - 6, py - 1.8, 12, 3.6);
    ctx.globalAlpha = 0.2 * w * edgeFade;
    ctx.fillRect(px - 21, py - 1.8, 15, 3.6);
  }
  ctx.globalAlpha = 1;
}

export function drawAgent(
  ctx: CanvasRenderingContext2D,
  st: SubjectState,
  w: number,
  p: Palette,
): void {
  if (w <= 0.02) return;
  const { cx, cy, scale, spin, time } = st;
  const TOOLS = 7;

  for (let s = 0; s < TOOLS; s++) {
    const a = -Math.PI / 2 + s * (TAU / TOOLS) + spin;
    const ex = cx + Math.cos(a) * scale * 0.78;
    const ey = cy + Math.sin(a) * scale * 0.78;

    ctx.strokeStyle = rgba(p.line, w);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    // A call travels out in the primary accent and the result returns in the
    // secondary — the tool-calling loop, literally.
    const phase = (time * 0.42 + s / TOOLS) % 1;
    const outbound = phase < 0.5;
    const f = outbound ? phase * 2 : (1 - phase) * 2;
    ctx.fillStyle = rgba(outbound ? p.acc : p.acc2, w);
    ctx.beginPath();
    ctx.arc(cx + (ex - cx) * f, cy + (ey - cy) * f, 3, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(p.node, w);
    ctx.strokeStyle = rgba(p.acc2, w);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(ex, ey, 6, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = rgba(p.acc, 0.1 * w);
  ctx.beginPath();
  ctx.arc(cx, cy, scale * 0.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(p.node, w);
  ctx.strokeStyle = rgba(p.acc, w);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx, cy, scale * 0.09, 0, TAU);
  ctx.fill();
  ctx.stroke();
}

export function drawConstellation(
  ctx: CanvasRenderingContext2D,
  st: SubjectState,
  w: number,
  p: Palette,
): void {
  if (w <= 0.02) return;
  const { cx, cy, scale, spin } = st;

  ctx.setLineDash([3, 5]);
  ctx.strokeStyle = rgba(p.acc2, 0.3 * w);
  ctx.lineWidth = 1;
  for (const [gx, gy] of CLUSTERS) {
    const rx = gx * Math.cos(spin) - gy * Math.sin(spin);
    const ry = gx * Math.sin(spin) + gy * Math.cos(spin);
    ctx.beginPath();
    ctx.arc(cx + rx * scale, cy + ry * scale, scale * 0.33, 0, TAU);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  st: SubjectState,
  p: Palette,
  lit: Float32Array,
): void {
  const { points } = st;
  const n = points.length / 2;
  const base = rgba(p.faint, 0.85);

  ctx.fillStyle = base;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    if (lit[i] > 0.05) continue;
    const x = points[i * 2];
    const y = points[i * 2 + 1];
    ctx.moveTo(x + 1.5, y);
    ctx.arc(x, y, 1.5, 0, TAU);
  }
  ctx.fill();

  for (let i = 0; i < n; i++) {
    if (lit[i] <= 0.05) continue;
    ctx.fillStyle = rgba(p.acc2, 0.35 + lit[i] * 0.65);
    ctx.beginPath();
    ctx.arc(points[i * 2], points[i * 2 + 1], 2.3, 0, TAU);
    ctx.fill();
    lit[i] *= 0.93;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/overlays.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add embedding, pipeline, agent and constellation overlay renderers"
```

---

## Task 7: The Subject canvas

The only stateful animation module. It owns the canvas, the particle buffer, the palette cache, and the frame loop.

**Files:**
- Create: `src/components/Subject.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `subscribeToFrame`, `narrativeProgress` from `@/lib/scroll`; `buildFormations`, `stageAt`, `interpolateInto`, `journeyAt` from `@/lib/formations`; `computeLinks` from `@/lib/neighbors`; all draw functions from `@/lib/overlays`; `readPalette` from `@/lib/theme`
- Produces: `<Subject />` — a client component rendering `<canvas id="subject" aria-hidden="true">`

- [ ] **Step 1: Implement the component**

Create `src/components/Subject.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { narrativeProgress, subscribeToFrame } from '@/lib/scroll';
import {
  buildFormations, interpolateInto, journeyAt, stageAt, FORMATION_COUNT,
} from '@/lib/formations';
import { computeLinks } from '@/lib/neighbors';
import {
  drawAgent, drawConstellation, drawEmbedding, drawParticles, drawPipeline, stageWeight,
} from '@/lib/overlays';
import { readPalette, type Palette } from '@/lib/theme';

const DESKTOP_PARTICLES = 180;
const MOBILE_PARTICLES = 90;
const MOBILE_BREAKPOINT = 768;
const LINK_RADIUS_FACTOR = 0.19;
/** Links are recomputed at ~20fps but drawn every frame — invisible, and far cheaper. */
const LINK_INTERVAL_MS = 50;
const IDLE_DRIFT = 0.012;

function particleCount(width: number): number {
  return width < MOBILE_BREAKPOINT ? MOBILE_PARTICLES : DESKTOP_PARTICLES;
}

export default function Subject() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // No canvas support: the site is fully readable without it.
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let n = 0;
    let formations: Float32Array[] = [];
    let points = new Float32Array(0);
    let lit = new Float32Array(0);
    let links = new Int32Array(0);
    let linkCount = 0;
    let lastLinkAt = -Infinity;
    let palette: Palette = readPalette();
    let visible = true;

    function rebuild() {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      n = particleCount(width);
      formations = buildFormations(n);
      points = new Float32Array(n * 2);
      lit = new Float32Array(n);
      links = new Int32Array(n * 24); // generous cap; computeLinks stops when full
      lastLinkAt = -Infinity;
    }

    rebuild();

    let resizeTimer: number | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(rebuild, 150);
    };
    window.addEventListener('resize', onResize);

    // Re-cache canvas colours when the theme flips — one data-theme change must
    // drive DOM and canvas together.
    const themeObserver = new MutationObserver(() => {
      palette = readPalette();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true, attributeFilter: ['data-theme'],
    });

    const io = new IntersectionObserver(
      ([entry]) => { visible = entry.isIntersecting; },
      { threshold: 0 },
    );
    io.observe(canvas);

    function narrativeBounds() {
      const hero = document.getElementById('hero');
      const story = document.getElementById('story');
      const heroHeight = hero?.offsetHeight ?? window.innerHeight;
      const start = heroHeight * 0.55;
      const end = story
        ? story.offsetTop + story.offsetHeight - window.innerHeight * 0.5
        : start + window.innerHeight * 4;
      return { start, end };
    }

    const unsubscribe = subscribeToFrame((scrollY, time) => {
      if (!visible || document.hidden) return;

      const { start, end } = narrativeBounds();
      const progress = narrativeProgress(scrollY, start, end);
      const { index, frac } = stageAt(progress);
      const s = progress * (FORMATION_COUNT - 1);

      const { cx, cy, scale } = journeyAt(index, frac, width, height);
      const spin = reduced ? 0 : progress * 0.9;

      interpolateInto(formations, index, frac, points);

      // Local space -> viewport pixels, with rotation and a breathing idle drift.
      const cos = Math.cos(spin);
      const sin = Math.sin(spin);
      for (let i = 0; i < n; i++) {
        let lx = points[i * 2];
        let ly = points[i * 2 + 1];
        if (!reduced) {
          lx += Math.sin(time * 0.5 + i) * IDLE_DRIFT;
          ly += Math.cos(time * 0.42 + i) * IDLE_DRIFT;
        }
        points[i * 2] = cx + (lx * cos - ly * sin) * scale;
        points[i * 2 + 1] = cy + (lx * sin + ly * cos) * scale;
      }

      const state = { cx, cy, scale, spin, time: reduced ? 0 : time, points };

      const wEmbed = stageWeight(s, 1);
      if (wEmbed > 0.02) {
        const nowMs = time * 1000;
        if (nowMs - lastLinkAt > LINK_INTERVAL_MS) {
          linkCount = computeLinks(points, scale * LINK_RADIUS_FACTOR, links);
          lastLinkAt = nowMs;
        }
      }

      ctx!.clearRect(0, 0, width, height);
      drawEmbedding(ctx!, state, wEmbed, palette, links, linkCount, lit);
      drawPipeline(ctx!, state, stageWeight(s, 2), palette);
      drawAgent(ctx!, state, stageWeight(s, 3), palette);
      drawConstellation(ctx!, state, stageWeight(s, 4), palette);
      drawParticles(ctx!, state, palette, lit);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('resize', onResize);
      window.clearTimeout(resizeTimer);
      themeObserver.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="subject"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] h-screen w-screen"
    />
  );
}
```

- [ ] **Step 2: Mount it with placeholder sections so the journey can be seen**

Replace `src/app/page.tsx`:

```tsx
import Subject from '@/components/Subject';

export default function Home() {
  return (
    <main>
      <Subject />
      <section id="hero" className="relative z-[2] min-h-screen" />
      <section id="story" className="relative z-[2]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[110vh]" />
        ))}
      </section>
      <section className="relative z-[2] min-h-[70vh]" />
    </main>
  );
}
```

- [ ] **Step 3: Verify the morph by eye, in both themes**

Run `npm run dev`. Scroll slowly from top to bottom. Confirm:
- The subject travels right → far left → right → centre-left.
- The shape changes: cloud → linked field with a sweeping query → three rails with packets → router with tool spokes → three clusters.
- Scrolling **up** morphs backwards through exactly the same states.
- In DevTools, set `document.documentElement.dataset.theme = 'light'` and confirm the particles remain clearly visible against `#FAFAF9`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add the morphing subject canvas"
```

---

## Task 8: Header, theme toggle, hero

**Files:**
- Create: `src/components/ThemeToggle.tsx`, `src/components/Header.tsx`, `src/components/Hero.tsx`
- Modify: `src/app/page.tsx`, `src/app/globals.css`

**Interfaces:**
- Consumes: `resume` from `@/content/resume`; `applyTheme`, `loadStoredTheme`, `resolveInitialTheme`, `type Theme` from `@/lib/theme`
- Produces: `<Header />`, `<Hero />` — `Hero` renders `<section id="hero">`, which `Subject` measures for narrative bounds.

- [ ] **Step 1: Add the type styles**

Append to `src/app/globals.css`:

```css
.font-display { font-family: var(--font-display), system-ui, sans-serif; }
.font-body { font-family: var(--font-body), system-ui, sans-serif; }
.font-accent { font-family: var(--font-accent), Georgia, serif; }

.display-xl {
  font-family: var(--font-display), system-ui, sans-serif;
  font-weight: 900;
  font-size: clamp(2.4rem, 7.6vw, 6.6rem);
  line-height: 0.88;
  letter-spacing: -0.055em;
  text-transform: uppercase;
}

.display-lg {
  font-family: var(--font-display), system-ui, sans-serif;
  font-weight: 900;
  font-size: clamp(1.8rem, 4.4vw, 3.5rem);
  line-height: 0.98;
  letter-spacing: -0.05em;
  text-transform: uppercase;
}

.eyebrow {
  font-family: var(--font-body), system-ui, sans-serif;
  font-weight: 500;
  font-size: 0.72rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--acc);
}

.emphasis {
  font-family: var(--font-accent), Georgia, serif;
  font-style: italic;
  font-weight: 400;
  text-transform: none;
  letter-spacing: -0.02em;
  color: var(--acc2);
}

/* Masked line reveal for the hero headline. */
.reveal-line { display: block; overflow: hidden; }
.reveal-line > span {
  display: block;
  transform: translateY(105%);
  animation: reveal-rise 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes reveal-rise { to { transform: translateY(0); } }

@media (prefers-reduced-motion: reduce) {
  .reveal-line > span { transform: none; animation: none; }
}
```

- [ ] **Step 2: Write the theme toggle**

Create `src/components/ThemeToggle.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { applyTheme, loadStoredTheme, resolveInitialTheme, type Theme } from '@/lib/theme';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  // The inline bootstrap script already set data-theme before paint;
  // this only syncs React state to it.
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(resolveInitialTheme(loadStoredTheme(), prefersDark));
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      className="cursor-pointer rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 font-body text-[11.5px] text-[var(--ink)] transition-colors hover:border-[var(--acc)]"
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
```

- [ ] **Step 3: Write the header**

Create `src/components/Header.tsx`:

```tsx
import { resume } from '@/content/resume';
import ThemeToggle from './ThemeToggle';

const NAV = [
  { href: '#story', label: 'Work' },
  { href: '#experience', label: 'Experience' },
  { href: '#projects', label: 'Projects' },
  { href: '#contact', label: 'Contact' },
];

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-md">
      <nav className="mx-auto flex max-w-[1240px] items-center gap-4 px-[6vw] py-3 md:px-8">
        <a href="#hero" className="font-display text-sm font-800 tracking-tight uppercase">
          {resume.name}
        </a>
        <ul className="ml-auto hidden items-center gap-5 md:flex">
          {NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="font-body text-[12.5px] text-[var(--dim)] transition-colors hover:text-[var(--ink)]"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={resume.contact.cv}
          download
          className="ml-auto rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 font-body text-[11.5px] transition-colors hover:border-[var(--acc)] md:ml-0"
        >
          CV
        </a>
        <ThemeToggle />
      </nav>
    </header>
  );
}
```

- [ ] **Step 4: Write the hero**

Create `src/components/Hero.tsx`:

```tsx
import { resume } from '@/content/resume';

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative z-[2] flex min-h-screen flex-col justify-center px-[6vw] pt-32 pb-20"
    >
      <p className="eyebrow">{resume.eyebrow}</p>

      <h1 className="display-xl mt-6 max-w-[14ch]">
        <span className="reveal-line"><span>Muhammad</span></span>
        <span className="reveal-line"><span style={{ animationDelay: '0.1s' }}>Anas —</span></span>
        <span className="reveal-line">
          <span style={{ animationDelay: '0.2s' }}>
            <em className="emphasis">builds</em> AI systems
          </span>
        </span>
      </h1>

      <div className="mt-10 flex max-w-[760px] flex-wrap gap-x-12 gap-y-6 border-t border-[var(--line)] pt-6">
        <p className="max-w-[360px] font-body text-[15.5px] leading-relaxed text-[var(--dim)]">
          {resume.summary}
        </p>
        <dl className="flex gap-9">
          {resume.metrics.map((m) => (
            <div key={m.label}>
              <dd className="font-display text-[30px] font-900 tracking-tight">{m.value}</dd>
              <dt className="mt-1.5 font-body text-[10px] tracking-[0.14em] uppercase text-[var(--faint)]">
                {m.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Wire them into the page**

Update `src/app/page.tsx`:

```tsx
import Subject from '@/components/Subject';
import Header from '@/components/Header';
import Hero from '@/components/Hero';

export default function Home() {
  return (
    <>
      <Header />
      <Subject />
      <main>
        <Hero />
        <section id="story" className="relative z-[2]">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[110vh]" />
          ))}
        </section>
        <section className="relative z-[2] min-h-[70vh]" />
      </main>
    </>
  );
}
```

- [ ] **Step 6: Verify**

Run `npm run dev`. Confirm the headline reveals line by line on load, the metrics read correctly, the theme toggle flips both the page and the canvas particles, and the choice survives a reload.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add header, theme toggle and hero"
```

---

## Task 9: Narrative acts

**Files:**
- Create: `src/components/Act.tsx`, `src/components/Narrative.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `resume.acts` from `@/content/resume`; `subscribeToFrame` from `@/lib/scroll`; `panelVisibility` from `@/lib/scroll`
- Produces: `<Narrative />` rendering `<section id="story">` containing four `<Act />`

- [ ] **Step 1: Write the Act component**

Create `src/components/Act.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { panelVisibility, subscribeToFrame } from '@/lib/scroll';
import type { Act as ActData } from '@/content/resume';

export default function Act({ act }: { act: ActData }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const panel = panelRef.current;
    if (!section || !panel) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return; // copy stays at the CSS default of opacity 1

    const direction = act.side === 'right' ? 1 : -1;

    return subscribeToFrame(() => {
      const rect = section.getBoundingClientRect();
      const v = panelVisibility(rect.top, rect.height, window.innerHeight);
      panel.style.opacity = String(v);
      panel.style.transform =
        `translate3d(${(1 - v) * 70 * direction}px, ${(1 - v) * 26}px, 0)`;
    });
  }, [act.side]);

  const alignment = act.side === 'right' ? 'justify-end text-right' : 'justify-start';

  return (
    <div
      ref={sectionRef}
      className={`relative flex h-[110vh] items-center px-[6vw] ${alignment}`}
    >
      <div ref={panelRef} className="act-panel max-w-[480px] will-change-transform">
        <p className="eyebrow mb-4">{act.kicker}</p>
        <h2 className="display-lg mb-5">
          {act.heading}
          <em className="emphasis">{act.emphasis}</em>
          {act.headingTail}
        </h2>
        <p className="mb-5 font-body text-[15.5px] leading-relaxed text-[var(--dim)]">
          {act.body}
        </p>
        <ul className={`flex flex-wrap gap-2 ${act.side === 'right' ? 'justify-end' : ''}`}>
          {act.chips.map((chip) => (
            <li
              key={chip}
              className="border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 font-body text-[11.5px] text-[var(--dim)]"
            >
              {chip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the Narrative wrapper**

Create `src/components/Narrative.tsx`:

```tsx
import { resume } from '@/content/resume';
import Act from './Act';

export default function Narrative() {
  return (
    <section id="story" className="relative z-[2]">
      <h2 className="sr-only">What I build</h2>
      {resume.acts.map((act) => (
        <Act key={act.kicker} act={act} />
      ))}
    </section>
  );
}
```

- [ ] **Step 3: Swap the placeholder out**

In `src/app/page.tsx`, replace the placeholder `<section id="story">` block with `<Narrative />` and add `import Narrative from '@/components/Narrative';`.

- [ ] **Step 4: Verify the acts track the morph**

Run `npm run dev`. Confirm each act's copy fades in as its formation forms, holds while readable, and fades out — and that the act text is on the opposite side of the viewport from the subject at that moment.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add scroll-driven narrative acts"
```

---

## Task 10: Experience, projects, skills, credentials

**Files:**
- Create: `src/components/Experience.tsx`, `src/components/Projects.tsx`, `src/components/Skills.tsx`, `src/components/Credentials.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `resume.experience`, `resume.projects`, `resume.skills`, `resume.education`, `resume.publication`
- Produces: four presentational server components. All headings are `h2`, all sub-headings `h3` — no skipped levels.

- [ ] **Step 1: Write Experience**

Create `src/components/Experience.tsx`:

```tsx
import { resume } from '@/content/resume';

export default function Experience() {
  return (
    <section id="experience" className="relative z-[2] px-[6vw] py-24">
      <div className="mx-auto max-w-[1240px]">
        <p className="eyebrow">Where I have shipped</p>
        <h2 className="display-lg mt-4 mb-12">Experience</h2>

        <ol className="space-y-14">
          {resume.experience.map((role) => (
            <li key={`${role.company}-${role.period}`} className="border-t border-[var(--line)] pt-6">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-display text-xl font-800 tracking-tight">{role.title}</h3>
                <span className="font-body text-[15px] text-[var(--acc)]">{role.company}</span>
                {role.context && (
                  <span className="font-body text-[13px] text-[var(--faint)]">({role.context})</span>
                )}
              </div>
              <p className="mt-1 font-body text-[12.5px] tracking-wide text-[var(--faint)]">
                {role.location} · {role.period}
              </p>
              <ul className="mt-5 space-y-3">
                {role.bullets.map((bullet, i) => (
                  <li
                    key={i}
                    className="max-w-[75ch] border-l border-[var(--line)] pl-4 font-body text-[14.5px] leading-relaxed text-[var(--dim)]"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write Projects**

Create `src/components/Projects.tsx`:

```tsx
import { resume } from '@/content/resume';

export default function Projects() {
  return (
    <section id="projects" className="relative z-[2] px-[6vw] py-24">
      <div className="mx-auto max-w-[1240px]">
        <p className="eyebrow">Built on my own time</p>
        <h2 className="display-lg mt-4 mb-12">Projects</h2>

        <div className="grid gap-5 md:grid-cols-3">
          {resume.projects.map((project) => (
            <article
              key={project.name}
              className="border border-[var(--line)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--acc)]"
            >
              <h3 className="font-display text-lg font-800 tracking-tight">{project.name}</h3>
              <p className="mt-1 font-body text-[12.5px] tracking-wide text-[var(--acc2)]">
                {project.tagline}
              </p>
              <p className="mt-4 font-body text-[14px] leading-relaxed text-[var(--dim)]">
                {project.body}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {project.chips.map((chip) => (
                  <li
                    key={chip}
                    className="border border-[var(--line)] px-2.5 py-1 font-body text-[11px] text-[var(--faint)]"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Write Skills**

Create `src/components/Skills.tsx`:

```tsx
import { resume } from '@/content/resume';

export default function Skills() {
  return (
    <section id="skills" className="relative z-[2] px-[6vw] py-24">
      <div className="mx-auto max-w-[1240px]">
        <p className="eyebrow">The toolset</p>
        <h2 className="display-lg mt-4 mb-12">Skills</h2>

        <dl className="grid gap-8 md:grid-cols-2">
          {resume.skills.map((group) => (
            <div key={group.group} className="border-t border-[var(--line)] pt-4">
              <dt className="font-body text-[11px] tracking-[0.18em] uppercase text-[var(--faint)]">
                {group.group}
              </dt>
              <dd className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 font-body text-[12px] text-[var(--dim)]"
                  >
                    {item}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Write Credentials**

Create `src/components/Credentials.tsx`:

```tsx
import { resume } from '@/content/resume';

export default function Credentials() {
  return (
    <section id="credentials" className="relative z-[2] px-[6vw] py-24">
      <div className="mx-auto grid max-w-[1240px] gap-12 md:grid-cols-2">
        <div>
          <p className="eyebrow">Education</p>
          <h2 className="display-lg mt-4 mb-8">Studied</h2>
          <ul className="space-y-6">
            {resume.education.map((entry) => (
              <li key={entry.school} className="border-t border-[var(--line)] pt-4">
                <h3 className="font-display text-base font-800 tracking-tight">{entry.school}</h3>
                <p className="mt-1 font-body text-[14px] text-[var(--dim)]">{entry.degree}</p>
                <p className="mt-1 font-body text-[12.5px] text-[var(--faint)]">
                  {entry.location} · {entry.period}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow">Published</p>
          <h2 className="display-lg mt-4 mb-8">Research</h2>
          <div className="border-t border-[var(--line)] pt-4">
            <h3 className="max-w-[45ch] font-display text-base font-800 tracking-tight">
              {resume.publication.title}
            </h3>
            <p className="mt-1 font-body text-[12.5px] tracking-wide text-[var(--acc2)]">
              {resume.publication.venue}
            </p>
            <p className="mt-3 max-w-[60ch] font-body text-[14px] leading-relaxed text-[var(--dim)]">
              {resume.publication.body}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Wire into the page and verify heading order**

Add all four to `src/app/page.tsx` after `<Narrative />`, in the order Experience → Projects → Skills → Credentials.

Run `npm run dev`, then in the DevTools console:

```js
[...document.querySelectorAll('h1,h2,h3')].map(h => h.tagName).join(' ')
```

Expected: starts with `H1`, and no `H3` ever appears before an `H2`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add experience, projects, skills and credentials sections"
```

---

## Task 11: Contact and footer

**Files:**
- Create: `src/components/Contact.tsx`, `src/components/Footer.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `resume.contact`, `resume.languages`, `resume.authorisation`
- Produces: `<Contact />`, `<Footer />`. **Links only — no form, no backend, no submit handler.**

- [ ] **Step 1: Write Contact**

Create `src/components/Contact.tsx`:

```tsx
import { resume } from '@/content/resume';

const LINKS = [
  { label: 'Email', value: resume.contact.email, href: `mailto:${resume.contact.email}` },
  { label: 'Phone', value: resume.contact.phone, href: `tel:${resume.contact.phone.replace(/\s/g, '')}` },
  { label: 'LinkedIn', value: 'anas-baqai-bo21', href: resume.contact.linkedin },
  { label: 'GitHub', value: 'AnasBaqai', href: resume.contact.github },
];

export default function Contact() {
  return (
    <section id="contact" className="relative z-[2] px-[6vw] py-24">
      <div className="mx-auto max-w-[1240px]">
        <p className="eyebrow">Open to Full-Stack and AI roles</p>
        <h2 className="display-lg mt-4 mb-10">
          Let&rsquo;s <em className="emphasis">talk</em>
        </h2>

        <ul className="grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-2">
          {LINKS.map((link) => (
            <li key={link.label} className="bg-[var(--bg)]">
              <a
                href={link.href}
                className="group flex items-baseline gap-4 p-6 transition-colors hover:bg-[var(--surface)]"
                {...(link.href.startsWith('http')
                  ? { target: '_blank', rel: 'noreferrer noopener' }
                  : {})}
              >
                <span className="w-20 shrink-0 font-body text-[11px] tracking-[0.18em] uppercase text-[var(--faint)]">
                  {link.label}
                </span>
                <span className="font-display text-lg font-800 tracking-tight transition-colors group-hover:text-[var(--acc)]">
                  {link.value}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <a
          href={resume.contact.cv}
          download
          className="mt-6 inline-block border border-[var(--acc)] px-6 py-3 font-body text-[13.5px] font-medium text-[var(--acc)] transition-colors hover:bg-[var(--acc)] hover:text-[var(--bg)]"
        >
          Download CV (PDF)
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write Footer**

Create `src/components/Footer.tsx`:

```tsx
import { resume } from '@/content/resume';

export default function Footer() {
  return (
    <footer className="relative z-[2] border-t border-[var(--line)] px-[6vw] py-10">
      <div className="mx-auto flex max-w-[1240px] flex-wrap gap-x-8 gap-y-2 font-body text-[12.5px] text-[var(--faint)]">
        <span>{resume.languages}</span>
        <span>{resume.authorisation}</span>
        <span className="ml-auto">
          © {new Date().getFullYear()} {resume.name}
        </span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Finish the page**

Final `src/app/page.tsx`:

```tsx
import Header from '@/components/Header';
import Subject from '@/components/Subject';
import Hero from '@/components/Hero';
import Narrative from '@/components/Narrative';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import Skills from '@/components/Skills';
import Credentials from '@/components/Credentials';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <Subject />
      <main>
        <Hero />
        <Narrative />
        <Experience />
        <Projects />
        <Skills />
        <Credentials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Verify there is no form**

Run: `grep -rn "<form\|onSubmit\|fetch(" src/`
Expected: no matches. Contact is links only, per the spec.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add contact links and footer"
```

---

## Task 12: Playwright regression guard for the morph

This is the automated form of the test that caught the first weak version of the animation: at different scroll depths the subject must be a **different shape in a different place**, not the same shape recoloured.

**Files:**
- Create: `playwright.config.ts`, `e2e/narrative.spec.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: the running dev server
- Produces: `npm run test:e2e`

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Configure it**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});
```

Add to `package.json` scripts: `"test:e2e": "playwright test"`.

- [ ] **Step 3: Write the failing test**

Create `e2e/narrative.spec.ts`:

```ts
import { test, expect, type Page } from '@playwright/test';

interface Sample { ink: number; centroidX: number; centroidY: number }

/** Measure what the canvas actually rendered at the current scroll offset. */
async function sampleCanvas(page: Page): Promise<Sample> {
  return page.evaluate(() => {
    const canvas = document.getElementById('subject') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let ink = 0, sx = 0, sy = 0;
    for (let i = 0; i < data.length; i += 4 * 7) {
      if (data[i + 3] > 25) {
        const px = (i / 4) % canvas.width;
        const py = Math.floor(i / 4 / canvas.width);
        ink++; sx += px; sy += py;
      }
    }
    return { ink, centroidX: sx / ink / canvas.width, centroidY: sy / ink / canvas.height };
  });
}

async function scrollToFraction(page: Page, fraction: number) {
  await page.evaluate((f) => {
    window.scrollTo(0, (document.body.scrollHeight - window.innerHeight) * f);
  }, fraction);
  await page.waitForTimeout(400);
}

test.describe('the morphing subject', () => {
  test('renders a different shape in a different place at each scroll depth', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(600);

    const samples: Sample[] = [];
    for (const f of [0.18, 0.32, 0.5, 0.68, 0.85]) {
      await scrollToFraction(page, f);
      samples.push(await sampleCanvas(page));
    }

    // Something is always drawn.
    for (const s of samples) expect(s.ink).toBeGreaterThan(100);

    // The subject traverses a long way horizontally. This is the assertion that
    // fails if the animation degenerates into "only the colour changes".
    const xs = samples.map((s) => s.centroidX);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(0.25);

    // The shape genuinely changes, not just its position.
    const inks = samples.map((s) => s.ink);
    expect(Math.max(...inks) / Math.min(...inks)).toBeGreaterThan(1.3);
  });

  test('scrubs backwards to the same state', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(600);

    await scrollToFraction(page, 0.4);
    const forward = await sampleCanvas(page);

    await scrollToFraction(page, 0.85);
    await scrollToFraction(page, 0.4);
    const returned = await sampleCanvas(page);

    // Only the idle drift differs, so allow a small tolerance.
    expect(Math.abs(returned.centroidX - forward.centroidX)).toBeLessThan(0.03);
    expect(Math.abs(returned.ink - forward.ink) / forward.ink).toBeLessThan(0.2);
  });

  test('keeps the canvas visible in light mode', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
    await scrollToFraction(page, 0.4);
    const s = await sampleCanvas(page);
    expect(s.ink).toBeGreaterThan(100);
  });

  test('every narrative panel becomes fully readable at some scroll depth', async ({ page }) => {
    await page.goto('/');
    const peak = [0, 0, 0, 0];
    for (let f = 0; f <= 1; f += 0.02) {
      await page.evaluate((frac) => {
        window.scrollTo(0, (document.body.scrollHeight - window.innerHeight) * frac);
      }, f);
      await page.waitForTimeout(60);
      const opacities = await page.$$eval('.act-panel', (els) =>
        els.map((el) => parseFloat(getComputedStyle(el).opacity)),
      );
      opacities.forEach((o, i) => { if (o > peak[i]) peak[i] = o; });
    }
    for (const p of peak) expect(p).toBeGreaterThan(0.95);
  });
});
```

- [ ] **Step 4: Run the tests**

Run: `npm run test:e2e`
Expected: 4 tests pass on the `desktop` project and 4 on `mobile`. If the mobile run fails the traversal assertion, the mobile particle count or journey scaling needs adjusting — do **not** relax the assertion.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: add Playwright regression guard for the scroll morph"
```

---

## Task 13: Reduced motion, mobile performance, and the accessibility pass

**Files:**
- Modify: `src/components/Subject.tsx`, `src/app/globals.css`
- Create: `e2e/accessibility.spec.ts`

**Interfaces:**
- Consumes: everything built so far
- Produces: no new exports; this task hardens what exists

- [ ] **Step 1: Write the failing accessibility test**

Create `e2e/accessibility.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('accessibility', () => {
  test('hides the decorative canvas from assistive technology', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#subject')).toHaveAttribute('aria-hidden', 'true');
  });

  test('keeps all narrative copy readable with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const opacities = await page.$$eval('.act-panel', (els) =>
      els.map((el) => parseFloat(getComputedStyle(el).opacity)),
    );
    // No panel may be hidden behind an animation that will never play.
    for (const o of opacities) expect(o).toBe(1);
  });

  test('starts at h1 and never skips a heading level', async ({ page }) => {
    await page.goto('/');
    const levels = await page.$$eval('h1,h2,h3,h4', (els) =>
      els.map((el) => Number(el.tagName[1])),
    );
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });

  test('exposes exactly one h1', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('h1').count()).toBe(1);
  });

  test('gives every link an accessible name', async ({ page }) => {
    await page.goto('/');
    const names = await page.$$eval('a', (els) =>
      els.map((el) => (el.textContent ?? '').trim() || el.getAttribute('aria-label') || ''),
    );
    for (const n of names) expect(n.length).toBeGreaterThan(0);
  });

  test('shows a visible focus ring on the theme toggle', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /switch to/i });
    await toggle.focus();
    const outline = await toggle.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
  });
});
```

- [ ] **Step 2: Run it and note failures**

Run: `npm run test:e2e -- e2e/accessibility.spec.ts`
Expected: the reduced-motion test may fail if `Act.tsx` left inline opacity behind from a previous non-reduced render. Everything else should already pass from earlier tasks.

- [ ] **Step 3: Make reduced motion render a static formation**

In `src/components/Subject.tsx`, inside the `subscribeToFrame` callback, snap to the nearest whole formation when reduced motion is on. Replace the line computing `frac`:

```ts
      const { index, frac: rawFrac } = stageAt(progress);
      // Reduced motion: snap to the nearest formation instead of morphing
      // between them, so the shape is still meaningful but never in transit.
      const frac = reduced ? Math.round(rawFrac) : rawFrac;
```

and use `frac` in both `journeyAt` and `interpolateInto` below it.

- [ ] **Step 4: Re-run the accessibility tests**

Run: `npm run test:e2e -- e2e/accessibility.spec.ts`
Expected: PASS, 6 tests × 2 projects.

- [ ] **Step 5: Measure the mobile frame budget**

Run `npm run dev`, open DevTools, enable CPU throttling at 4× slowdown and emulate a 390×844 viewport. Record a Performance profile while scrolling the full narrative.

Expected: no long task over 50ms, and the frame chart stays at 60fps.

If it does not, apply the escape hatch from the spec — reduce `MOBILE_PARTICLES` from 90 to 60 in `src/components/Subject.tsx`. **Do not disable the morph.**

- [ ] **Step 6: Verify contrast in both themes**

For each theme, open DevTools → Elements → Accessibility pane and check the computed contrast for: body copy (`--dim` on `--bg`), the eyebrow (`--acc` on `--bg`), and chip text (`--dim` on `--surface`).

Expected: ≥4.5:1 for body-sized text, ≥3:1 for display-sized text. If `--dim` on `--bg` falls short in light mode, darken light `--dim` from `#52525B` toward `#3F3F46` and re-check.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: honour reduced motion and harden mobile performance"
```

---

## Task 14: Production build and deploy

**Files:**
- Modify: `src/app/layout.tsx`, `README.md`
- Create: `public/og.png` (optional; skip if no image is available)

- [ ] **Step 1: Verify the production build**

```bash
npm run build
npm start
```

Expected: build completes with no type or lint errors. Visit `http://localhost:3000` and confirm the morph runs in the production bundle.

- [ ] **Step 2: Confirm no unexpected runtime dependencies crept in**

Run: `node -e "const p=require('./package.json');console.log(Object.keys(p.dependencies))"`
Expected: only `next`, `react`, `react-dom`. Tailwind lives in `devDependencies` under v4. If anything else appears, remove it — the spec allows no runtime dependencies beyond Next/React/Tailwind.

- [ ] **Step 3: Add social metadata**

In `src/app/layout.tsx`, extend the `metadata` export:

```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://anasbaqai.dev'),
  title: 'Muhammad Anas — Full-Stack & AI Engineer',
  description:
    'Full-Stack and AI Engineer in Munich. Production LLM agents with tool calling and RAG, the services around them, and the AWS infrastructure underneath.',
  openGraph: {
    title: 'Muhammad Anas — Full-Stack & AI Engineer',
    description: 'Production LLM agents, tool calling, RAG, and the AWS infrastructure underneath. Munich, Germany.',
    type: 'website',
    locale: 'en_GB',
  },
  robots: { index: true, follow: true },
};
```

Replace `https://anasbaqai.dev` with the real domain once it is chosen.

- [ ] **Step 4: Run the full test suite**

```bash
npm test
npm run test:e2e
```

Expected: all Vitest and all Playwright tests pass on both the desktop and mobile projects.

- [ ] **Step 5: Write the README**

Create `README.md`:

```markdown
# Muhammad Anas — Portfolio

Single-page portfolio. Next.js App Router, TypeScript, Tailwind v4, no animation library.

## Develop

    npm install
    npm run dev

## Test

    npm test        # Vitest — pure animation and content modules
    npm run test:e2e  # Playwright — scroll morph and accessibility

## Architecture

All copy lives in `src/content/resume.ts`. Components never hardcode text.

The signature animation is one particle system that morphs across five formations
and traverses the viewport, driven purely by scroll offset. It is split into pure,
testable modules — `lib/formations.ts`, `lib/neighbors.ts`, `lib/overlays.ts`,
`lib/scroll.ts` — with exactly one stateful component, `components/Subject.tsx`.

Particle position is a pure function of scroll offset, never a simulation. That is
what makes scrolling backwards reverse the morph exactly, and it is covered by a
Playwright regression test.

See `docs/superpowers/specs/2026-08-03-portfolio-website-design.md` for the full design.
```

- [ ] **Step 6: Deploy**

```bash
npx vercel --prod
```

Then verify on the deployed URL: the morph runs, both themes work, and the CV downloads.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: production metadata, README and deploy config"
```

---

## Self-Review

**Spec coverage** — checked each spec section against a task:

| Spec section | Task |
|---|---|
| Purpose, success criteria | 2 (content), 8 (hero above-fold metrics), 11 (contact reachable) |
| Non-goals (no form, no CMS) | 11 step 4 verifies no form exists |
| Content source (resume only) | 2 |
| Tokens, both themes | 1 |
| Typography | 8 step 1 |
| Layout, max-width, gutters | 8, 10, 11 |
| Five formations | 4 |
| Overlays | 6 |
| Journey keyframes | 4 |
| Scrub semantics | 4 (interpolation), 12 (backwards-scrub test) |
| No scroll hijacking | 7 (fixed canvas, native scroll) |
| Mobile particle counts | 7, 13 step 5 |
| Spatial grid | 5 |
| DPR cap, rAF halting | 7 |
| Reduced motion | 13 steps 3–4 |
| Canvas aria-hidden | 7, 13 |
| Readable without JS | 1 (`.act-panel { opacity: 1 }`), 9 |
| Contrast both themes | 13 step 6 |
| Focus rings | 1, 13 |
| Heading hierarchy | 10 step 5, 13 |
| Page structure (9 sections) | 8, 9, 10, 11 |
| Module table | Tasks 2–11 map 1:1 |
| Testing (3 named checks) | 4 (formations), 3 (scroll), 12 (Playwright) |
| Error handling (canvas, localStorage, fonts, resize) | 7, 1, 1 (`display: swap`), 7 (debounced rebuild) |
| No GSAP / no runtime deps | 14 step 2 verifies |

No gaps found.

**Placeholder scan** — no "TBD", no "add error handling", no "similar to Task N", no test steps without test code. Two deliberate conditionals remain, both with concrete instructions and thresholds: the mobile particle-count fallback (Task 13 step 5) and the light-mode `--dim` adjustment (Task 13 step 6). Both name the exact value to change and the value to change it to.

**Type consistency** — verified across tasks:
- `Palette` is defined once in Task 1 and imported by `overlays.ts` (Task 6) and `Subject.tsx` (Task 7). Field names `acc, acc2, line, faint, warn, node, ink` are identical in all three.
- `computeLinks(points, radius, out)` returns pair count in Task 5; Task 7 calls it with that signature and passes `linkCount` to `drawEmbedding`, whose Task 6 signature accepts `(ctx, state, weight, palette, links, linkCount, lit)`. Matches.
- `stageAt` returns `{ index, frac }` in Task 4; Task 7 destructures exactly those names.
- `interpolateInto(formations, index, frac, out)` and `journeyAt(index, frac, width, height)` share the same `index`/`frac` produced by `stageAt`. Consistent.
- `SubjectState` fields `cx, cy, scale, spin, time, points` are constructed in Task 7 exactly as declared in Task 6.
- `panelVisibility(rectTop, rectHeight, viewportHeight)` in Task 3 is called with that argument order in Task 9.
- `Act` interface is exported from `resume.ts` (Task 2) and imported by `Act.tsx` (Task 9).
