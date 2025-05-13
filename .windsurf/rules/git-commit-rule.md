---
trigger: model_decision
description: if I tell you commit to the git,you should follow this rule
globs: 
---
# Git Commit Message Guidelines

This document outlines the standard format for git commit messages in our project. Following these guidelines helps maintain a clean, understandable git history and facilitates automated changelog generation.

## Commit Message Format

Each commit message should consist of:

```
<type>(<scope>): <subject in Chinese>

<body in Chinese> (optional)

<footer> (optional)
```

### Types

The `<type>` field must be one of the following:

- **feat**: A new feature or enhancement
- **fix**: A bug fix
- **docs**: Documentation changes only
- **style**: Changes that don't affect code functionality (formatting, missing semicolons, etc.)
- **refactor**: Code changes that neither fix a bug nor add a feature
- **perf**: Performance improvements
- **test**: Adding or correcting tests
- **chore**: Changes to build process, auxiliary tools, libraries, etc.
- **revert**: Reverting a previous commit

### Scope

The `<scope>` field is optional and indicates the part of the codebase affected by the change:

- **api**: Backend API-related changes
- **ui**: User interface components
- **db**: Database-related changes
- **auth**: Authentication/authorization
- **config**: Configuration changes
- **deps**: Dependency updates
- **core**: Core functionality
- **route**: Routing changes
- **all**: Multiple parts of the codebase

### Subject (in Chinese)

The subject is a short, concise description of the change in Chinese:

- Start with a verb
- No period at the end
- Maximum 50 characters
- Use imperative, present tense (e.g., "添加..." not "添加了...")

### Body (Optional, in Chinese)

If the commit requires more explanation, add a body with details:

- Separated from subject by a blank line
- Explain what and why vs. how
- May be multiple paragraphs
- Wrap lines at 72 characters

### Footer (Optional)

Used for referencing issue trackers, noting breaking changes:

- `Closes #123, #456` to close issues
- `BREAKING CHANGE: 描述破坏性变更` for backward-incompatible changes

## Examples

Good commit messages:

```
feat(api): 添加用户认证API端点

实现基于JWT的认证机制，支持用户登录和令牌刷新功能。
添加了相应的单元测试和文档。

Closes #123
```

```
fix(ui): 修复移动端菜单显示问题
```

```
docs(readme): 更新项目安装说明
```

```
refactor(core): 重构数据处理逻辑提高可维护性
```

## Workflow for Writing Commit Messages

1. Identify the type of change you're committing
2. Determine the scope of the change
3. Write a concise subject line in Chinese
4. If needed, add a detailed body in Chinese
5. Reference any related issues in the footer

## Chinese Language Guidelines

When writing commit messages in Chinese:

1. Be concise and clear
2. Use standard Simplified Chinese
3. Avoid technical jargon when possible
4. Start with an action verb
5. Focus on what was changed and why

By following these guidelines, we ensure consistency in our commit history and make code reviews and changelog generation more effective.

## Commit Command Examples

```bash
git commit -m "feat(api): 添加用户登录API"
git commit -m "fix(ui): 修复按钮在IE11中的样式问题"
git commit -m "docs: 更新开发环境配置文档"
```

Remember to always use this format when committing changes to the repository.


