---
alwaysApply: true
---

# Cursor Rules Master Index

**SINGLE SOURCE OF TRUTH:** This document is the authoritative index of all development rules. AI agents MUST consult this file first to understand rule hierarchy and dependencies.

## 🎯 AI MODEL REQUIREMENTS

### MANDATORY CONSULTATION
- AI agents MUST read this master index before any development task
- AI agents MUST follow the specified rule dependencies
- AI agents MUST NOT proceed with tasks without consulting relevant rules

### ENFORCEMENT LEVELS
- **CRITICAL**: Development-blocking rules that MUST be followed
- **STANDARD**: Required rules with enforcement validation
- **ADVISORY**: Best practices with recommended compliance

## 📋 Available Rules

### Core Development Rules (CRITICAL)

- **development-workflow-rule**: MUST read before starting any development task or code changes
  - *Dependencies*: comment-rule, git-commit-rule
  - *Enforcement*: TypeScript check, build validation required

- **comment-rule**: MUST read when writing code comments or documenting functions
  - *Dependencies*: None
  - *Enforcement*: English-only, JSDoc format required

- **git-commit-rule**: MUST read before making any git commits or writing commit messages
  - *Dependencies*: None
  - *Enforcement*: Conventional commit format required

### Specialized Domain Rules (STANDARD)

- **database-development-rule**: MUST read before making any database schema changes or migrations
  - *Dependencies*: development-workflow-rule, git-commit-rule
  - *Enforcement*: Migration validation, type sync required

- **i18n**: MUST read when adding translation keys or working with i18n
  - *Dependencies*: development-workflow-rule
  - *Enforcement*: Structure validation, key consistency required

- **test**: MUST read when writing tests or working with testing framework
  - *Dependencies*: development-workflow-rule
  - *Enforcement*: Test coverage, mocking patterns required

### Technical Integration Rules (STANDARD)

- **dify-integration-rule**: MUST read when developing Dify API integrations
  - *Dependencies*: api-routes, development-workflow-rule
  - *Enforcement*: 3-layer architecture compliance required

- **api-routes**: MUST read when creating or modifying API routes
  - *Dependencies*: development-workflow-rule
  - *Enforcement*: Route structure, error handling required

- **dify-api-endpoints**: MUST read when working with specific Dify API endpoints
  - *Dependencies*: dify-integration-rule
  - *Enforcement*: Type safety, service pattern required

## 🔄 Rule Dependencies

```
development-workflow-rule (ROOT)
├── comment-rule
├── git-commit-rule
├── database-development-rule
├── i18n
├── test
└── dify-integration-rule
    ├── api-routes
    └── dify-api-endpoints
```

## 🎯 Task-Based Rule Application

### Before Starting Development (MANDATORY SEQUENCE)
1. **development-workflow-rule** - Read this FIRST for any coding task
2. **comment-rule** - When documenting code
3. **git-commit-rule** - Before making commits

### Domain-Specific Tasks (MANDATORY)
- **Database changes** → **database-development-rule**
- **Translation work** → **i18n**
- **Testing work** → **test**
- **Dify API work** → **dify-integration-rule** + **dify-api-endpoints**
- **API route creation** → **api-routes**

### Cross-Domain Tasks (MULTIPLE RULES)
- **New feature development** → development-workflow-rule + comment-rule + git-commit-rule
- **Database + API changes** → database-development-rule + api-routes + development-workflow-rule
- **I18n + Frontend** → i18n + comment-rule + development-workflow-rule
- **Testing + Feature** → test + development-workflow-rule + comment-rule

## 🔧 AI Agent Usage Protocol

### MANDATORY STEPS
1. **Consult Master Index**: Always read cursor-rules.mdc first
2. **Identify Dependencies**: Check rule dependency tree
3. **Apply in Order**: Follow dependency hierarchy
4. **Validate Compliance**: Ensure all requirements met

### VALIDATION COMMANDS
```bash
# Required validation before commits
pnpm run type-check
pnpm run i18n:check
pnpm run build
```

## 📝 Enforcement Standards

### MUST Requirements
- All rules marked as CRITICAL or STANDARD MUST be followed
- Dependencies MUST be resolved before proceeding
- Validation commands MUST pass before commits

### MUST NOT Violations
- MUST NOT skip rule consultation
- MUST NOT proceed without dependency resolution
- MUST NOT commit without validation

### SHOULD Recommendations
- SHOULD document any rule deviations with justification
- SHOULD update rules when patterns evolve
- SHOULD maintain rule clarity and actionability

*This master index ensures consistent, AI-compliant development practices across the AgentifUI project.*
