# <h1 align="center">AgentifUI – Enterprise-Grade Intelligent Chat Platform</h1>

> **Community Edition** – Apache 2.0
> **Enterprise Edition** – Commercial License (contact [license@iflabx.com](mailto:license@iflabx.com))
> Maintained by the **ifLabX community** and sponsored by **ifLabX Corp**.

AgentifUI is a modern, multi-device intelligent-chat front-end built with the Next.js 15 App Router.
By combining **Supabase Auth**, **Dify API**, **Zustand** state management and layered data services, it delivers a secure, scalable and easy-to-maintain LLM chat experience—ideal for corporate knowledge bases, AI assistants and other enterprise scenarios.

| Edition        | License     | Scope & Extras                                                     |
| -------------- | ----------- | ------------------------------------------------------------------ |
| **Community**  | Apache 2.0  | Core chat UI, REST/GraphQL API, single-tenant                      |
| **Enterprise** | Proprietary | ✅ Multi-tenant ✅ SAML/LDAP ✅ SLA & Support ✅ Brand-removal/OEM |

---

## ✨ Key Features

- Responsive chat UI (desktop & mobile)
- Multiple apps / conversation management
- Message persistence with resume-from-breakpoint
- **Dify API** integration with streaming responses
- **Supabase** authentication & role-based access
- Encrypted API-key storage and per-user / per-instance key rotation
- High-performance message pagination & caching
- Light/Dark theme switch & a11y-friendly components
- Robust error handling and real-time state sync

---

## 🛠 Tech Stack

| Layer                 | Tools                                                         |
| --------------------- | ------------------------------------------------------------- |
| Framework             | **Next.js 15** (App Router), **React 18**, **Tailwind CSS 4** |
| State                 | **Zustand**                                                   |
| Back end-as-a-Service | **Supabase** (Auth + Postgres DB + Storage)                   |
| LLM / Chat API        | **Dify**, OpenAI, others                                      |
| Utilities             | clsx/cn, Lucide Icons, lodash, date-fns                       |
| Language              | **TypeScript** everywhere                                     |

---

## 🔗 Architecture Overview

```
UI Components (React)
↓
Custom Hooks (use-*)
↓
DB Access Layer  (lib/db/*)
↓
Service Layer    (lib/services/*)
↓
Supabase Client
```

### Core Design Highlights

| Area                 | Why it matters                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| **Security**         | Relies on DB-verified conversation IDs only—no transient state writes, guaranteeing consistency. |
| **Maintainability**  | Seamless conversion between temporary IDs, Dify IDs and DB IDs makes the data-flow resilient.    |
| **Easy Integration** | Encrypted API-key vault, per-user/instance key scope and graceful fallback mechanism.            |
| **Data Sovereignty** | Strict end-to-end TypeScript types + Supabase **RLS** ensure row-level isolation.                |

---

## 🚀 Quick Start (Community Edition)

### 🏃‍♂️ Quick Server Deployment

> 📋 **New to deployment?** See our streamlined guide: [`docs/QUICK-DEPLOYMENT.md`](./docs/QUICK-DEPLOYMENT.md)

```bash
# Quick deployment on Ubuntu/Debian server
# Installs: NVM, pnpm, PM2, Supabase CLI, Docker, Dify, AgentifUI

# Follow the 13-step guide in docs/QUICK-DEPLOYMENT.md
```

### 💻 Local Development

For local development and testing:

```bash
# 1 — Install dependencies
pnpm install

# 2 — Copy environment template and configure
cp .env.example .env.local
# Edit .env.local with your Supabase and other settings

# 3 — Run development server
pnpm run dev

# 4 — Open your browser
http://localhost:3000
```

**Prerequisites for local development:**

- Node.js 18+ (22+ recommended)
- pnpm 9+
- Supabase account or local Supabase instance

### Development Tools

The project includes comprehensive code quality and formatting tools:

```bash
# Format all code
pnpm run format

# Check code formatting
pnpm run format:check

# Run type checking
pnpm run type-check

# Build project
pnpm run build
```

**Automatic Formatting**:

- **VSCode**: Install Prettier extension for real-time formatting on save
- **Git Hooks**: Husky automatically formats code on commit
- **Supported Files**: TypeScript, React, JSON, Markdown, CSS, YAML

---

## 📂 Project Structure

| Path          | Purpose                                  |
| ------------- | ---------------------------------------- |
| `app/`        | Next.js routes & pages                   |
| `components/` | Shared & domain UI components            |
| `lib/`        | Data, services, hooks, state             |
| `docs/`       | Architecture, DB schema & API-key design |
| `supabase/`   | SQL migrations & RLS policies            |

---

## 🤝 Getting Help / Contributing

- **Issues & PRs**: Please open them on [GitHub Issues](https://github.com/ifLabX/AgentifUI/issues). All contributors must pass the CLA bot check.
- **Security reports**: Please email [security@iflabx.com](mailto:security@iflabx.com)
- **Enterprise/OEM inquiries**: For commercial support or integration, email [license@iflabx.com](mailto:license@iflabx.com)

> AgentifUI is dual-licensed. The Community Edition is open source under **Apache 2.0**; the Enterprise Edition adds multi-tenant, SAML/LDAP, branding removal and SLA support under a commercial license. See `LICENSE`, `NOTICE` and `TRADEMARK_POLICY.md` for details.
