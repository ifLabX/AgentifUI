# Contributing to AgentifUI (ifLabX community)

First off, **thank you** for taking the time to contribute!

Because AgentifUI uses a dual-licensing model (Apache 2.0 Community
Edition + proprietary Enterprise Edition), **all external contributors
must sign our Contributor License Agreement (CLA)**. The CLA ensures
Example Corp can distribute your code under both licenses.

## 0 – Getting Started

### Before You Start

- **Check existing issues** - Look for [good first issues](https://github.com/ifLabX/AgentifUI/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) to get started
- **Read the documentation** - Familiarize yourself with our [architecture](./docs/architecture.md) and [setup requirements](./docs/SETUP-REQUIREMENTS.md)
- **Join our community** - Connect with other contributors for support and discussion

### Development Setup

1. **Prerequisites**: Node.js 18.17+, pnpm 8.0+, Git
2. **Clone and install**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/AgentifUI.git
   cd AgentifUI
   pnpm install
   ```
3. **Environment setup**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```
4. **Start development**:
   ```bash
   pnpm run dev
   ```

For detailed setup instructions, see [SETUP-REQUIREMENTS.md](./docs/SETUP-REQUIREMENTS.md).

## 1 – Sign the CLA

- Visit <https://cla.iflabx.com> and follow the on-screen steps.
- You’ll receive email confirmation; keep a copy for your records.
- Pull-request checks will fail if the CLA bot cannot verify your
  signature.

## 2 – Fork → Branch → Pull Request

1. Fork `ifLabX/AgentifUI` to your account.
2. Create a feature branch off `main`:
   ```bash
   git checkout -b feat/your-feature-name
   # or for bug fixes:
   git checkout -b fix/issue-description
   ```
3. Write code & tests; run quality checks:
   ```bash
   pnpm run type-check
   pnpm run format
   ```
4. Push and open a PR; follow the PR template.

## 3 – Coding Standards

- **TypeScript/React**: `Prettier` with automatic formatting
- **Code Formatting**: Run `pnpm run format` to format all files
- **Pre-commit Hooks**: Husky automatically formats staged files on commit
- **Editor Setup**: VSCode with Prettier extension for real-time formatting
- **Commit Messages**: Follow conventional commits format: `feat(scope):`, `fix(scope):`, `docs:`, `style:` etc.

### Development Commands

```bash
# Format all files
pnpm run format

# Check formatting without changes
pnpm run format:check

# Run type checking
pnpm run type-check

# Run internationalization checks
pnpm run i18n:check
pnpm run i18n:validate
```

### Code Quality Tools

- **Prettier**: Automatic code formatting for TS/TSX/JSON/MD/CSS
- **Husky**: Git hooks for pre-commit formatting
- **lint-staged**: Performance optimization for large codebases

## 4 – Issue Guidelines

### Bug Reports

When reporting bugs, please include:

- **Clear title** - Descriptive summary of the issue
- **Environment** - OS, browser, Node.js version
- **Steps to reproduce** - Detailed reproduction steps
- **Expected vs actual behavior** - What should happen vs what happens
- **Screenshots/logs** - Visual evidence and error logs
- **Additional context** - Any other relevant information

### Feature Requests

When requesting features, please include:

- **Clear title** - Descriptive summary of the feature
- **Problem statement** - What problem does this solve?
- **Proposed solution** - How should it work?
- **Use cases** - When would this be used?
- **Additional context** - Mockups, examples, etc.

## 5 – Third-party Code

- Only Apache 2.0 / MIT / BSD-style dependencies are accepted.
- New dependencies should be discussed in an issue before adding.
- Update `package.json` with proper version constraints.

## 6 – Community and Support

### Getting Help

- **GitHub Issues** - For bug reports and feature requests
- **GitHub Discussions** - For questions and community discussion
- **Documentation** - Check our [docs](./docs/) first
- **Discord** - For real-time chat and support (if available)

### Recognition

Contributors will be:

- Added to our [contributors list](https://github.com/ifLabX/AgentifUI/graphs/contributors)
- Mentioned in release notes for significant contributions

---

By submitting code, you agree it may become part of future proprietary
releases of AgentifUI under the terms of the CLA.
