export interface Act {
  kicker: string;
  heading: string;
  emphasis: string;
  headingTail: string;
  body: string;
  chips: readonly string[];
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
      side: 'left',
    },
    {
      kicker: '02 — Extraction',
      heading: 'Messy in, ',
      emphasis: 'schema',
      headingTail: ' out',
      body: "HR emails and scanned receipts flow through extract, validate, store. What the model isn't sure about gets flagged for a human instead of quietly guessed at.",
      chips: ['Python', 'FastAPI', 'Structured output', 'PostgreSQL'],
      side: 'right',
    },
    {
      kicker: '03 — Agents',
      heading: 'Tools, not ',
      emphasis: 'chat',
      headingTail: '',
      body: 'A router reads the question and hands it to the specialist agent that can answer it. Twelve typed tools underneath. Agents propose changes; a person approves them, applied in one transaction, logged.',
      chips: ['OpenAI Agents SDK', 'Responses API', 'Tool calling', 'NestJS'],
      side: 'left',
    },
    {
      kicker: '04 — Shipped',
      heading: 'Running in ',
      emphasis: 'production',
      headingTail: '',
      body: 'Three internal apps at ProSiebenSat.1, a pricing engine across 111 licensors, and a 200-endpoint platform. All on AWS, provisioned in Terraform, released on merge.',
      chips: ['ECS Fargate', 'Aurora', 'Terraform', 'GitLab CI/CD'],
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
  ] as readonly Role[],

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
    phone: '+49 170 9055176',
    linkedin: 'https://linkedin.com/in/anas-baqai-bo21',
    github: 'https://github.com/AnasBaqai',
    cv: '/anas-cv.pdf',
  },

  languages: 'English (C1), German (A1)',
  authorisation: 'Student visa, eligible for EU Blue Card',
} as const;
