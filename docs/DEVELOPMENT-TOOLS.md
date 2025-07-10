# 开发工具指南

本文档为贡献者提供开发工具和代码质量系统的使用指南。

## 工具概览

| 工具           | 用途         | 自动运行          |
| -------------- | ------------ | ----------------- |
| **Prettier**   | 代码格式化   | ✅ 保存时，提交时 |
| **ESLint**     | 代码质量检查 | ✅ 提交时         |
| **Husky**      | Git 钩子管理 | ✅ 自动           |
| **TypeScript** | 类型检查     | 手动              |

## 可用命令

### 代码格式化

```bash
# 格式化整个项目
pnpm run format

# 检查是否需要格式化
pnpm run format:check
```

### 代码质量

```bash
# TypeScript 类型检查
pnpm run type-check

# 构建项目（包含类型检查）
pnpm run build
```

## 自动化工作流

### 开发环境 (VSCode)

- **保存时**: Prettier 自动格式化当前文件
- **实时**: ESLint 显示警告/错误

### Git 提交

- **提交前钩子**: 自动运行 lint-staged
- **仅处理暂存文件**: 只格式化要提交的文件
- **自动修复**: ESLint 自动修复可修复的问题

### CI/CD 建议

```bash
pnpm run format:check  # 检查格式化
pnpm run lint         # 检查代码质量
pnpm run type-check   # 检查类型
pnpm run build        # 构建项目
```

## 最佳实践

### 开发者设置

1. **安装 VSCode 扩展**:
   - Prettier - Code formatter
   - ESLint
   - Tailwind CSS IntelliSense

2. **使用项目命令**:
   - 提交前运行 `pnpm run type-check`
   - 让 VSCode 自动格式化
   - 信任自动化工具

### 团队协作

- 所有开发者使用相同的配置
- 代码审查专注于逻辑而非格式
- 格式化自动保持一致

## 故障排除

### Prettier 在 VSCode 中不工作

1. 安装 "Prettier - Code formatter" 扩展
2. 检查 `.vscode/settings.json` 配置
3. 重启 VSCode

### 提交前钩子失败

```bash
# 检查问题
pnpm run format:check
pnpm run lint

# 重新提交
git commit -m "your message"
```

### 格式化冲突

```bash
# 保存更改
git stash

# 格式化所有文件
pnpm run format

# 恢复更改
git stash pop

# 解决合并冲突
```

## 支持的文件类型

| 文件类型 | Prettier | ESLint | 自动格式化 |
| -------- | -------- | ------ | ---------- |
| `.ts`    | ✅       | ✅     | ✅         |
| `.tsx`   | ✅       | ✅     | ✅         |
| `.js`    | ✅       | ✅     | ✅         |
| `.jsx`   | ✅       | ✅     | ✅         |
| `.json`  | ✅       | ❌     | ✅         |
| `.md`    | ✅       | ❌     | ✅         |
| `.css`   | ✅       | ❌     | ✅         |

## 配置文件

- `.prettierrc.json` - 代码格式化规则
- `.prettierignore` - 排除的文件和目录
- `.husky/pre-commit` - Git 提交前钩子
- `package.json` - lint-staged 配置
- `.vscode/settings.json` - VSCode 工作区设置

通过遵循这些工具和流程，可以确保代码质量和一致性。
