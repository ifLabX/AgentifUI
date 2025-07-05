# AgentifUI i18n重构工作流程 - 优化版本

## 概述

这是基于实际重构经验优化的i18n重构工作流程，集成了自动化验证工具，确保重构过程的安全性和一致性。

## 前置条件

### 验证工具

项目提供了两个验证脚本：

1. **`scripts/validate-i18n-consistency.py`** - 完整的一致性验证
2. **`scripts/i18n-refactor-helper.py`** - 重构助手工具

### 验证当前状态

在开始任何重构之前，必须确保当前翻译文件是一致的：

```bash
# 快速检查
python3 scripts/i18n-refactor-helper.py quick-check

# 完整验证
python3 scripts/i18n-refactor-helper.py validate
```

## 优化的重构工作流程

### 阶段0：准备和备份

```bash
# 1. 创建备份
python3 scripts/i18n-refactor-helper.py backup

# 2. 验证当前状态
python3 scripts/i18n-refactor-helper.py quick-check
```

### 阶段1：全面分析

使用`codebase_search`全面分析目标模块的所有相关文件：

```bash
# 搜索模块相关的所有文件
codebase_search "API配置模块的所有相关文件" ["app/admin/api-config/", "components/admin/api-config/"]
```

**重要原则**：

- 必须搜索目标模块的所有相关文件，不仅仅是主文件
- 包括页面、布局、组件、hooks、stores等
- 识别所有硬编码中文文本

### 阶段2：翻译结构设计

在`messages/zh-CN.json`中设计翻译结构：

**设计原则**：

- 避免重复翻译，优先复用已有翻译
- 统一命名规范（如：API"配置"而非"密钥"）
- 考虑翻译的分层和复用
- 使用层次化的键名结构

**验证步骤**：

```bash
# 每次修改后立即验证
python3 scripts/i18n-refactor-helper.py quick-check
```

### 阶段3：组件重构

逐个文件重构，严格遵循原则：

**核心原则**：

- **只做翻译国际化工作**
- **绝对不能修改原有代码逻辑、样式、功能或组件结构**
- **只能添加useTranslations并替换硬编码中文文本**

**重构步骤**：

1. 添加`useTranslations`导入
2. 创建翻译hook实例
3. 替换硬编码中文文本
4. 立即验证

```bash
# 每个文件重构后立即验证
python3 scripts/i18n-refactor-helper.py quick-check
```

### 阶段4：多语言翻译

按固定顺序添加其他语言翻译：

**翻译顺序**：

1. 英语 (en-US)
2. 西班牙语 (es-ES)
3. 繁体中文 (zh-TW)
4. 日语 (ja-JP)

**质量要求**：

- 保持所有语言文件结构完全一致
- 只翻译值，不改变键名
- 翻译准确，符合UI习惯

**验证步骤**：

```bash
# 每种语言添加后验证
python3 scripts/i18n-refactor-helper.py quick-check
```

### 阶段5：最终验证

```bash
# 完整验证
python3 scripts/i18n-refactor-helper.py validate

# 类型检查
npx tsc --noEmit

# 构建测试
pnpm run build
```

## 错误恢复

如果在任何阶段出现问题：

```bash
# 恢复备份
python3 scripts/i18n-refactor-helper.py restore

# 验证恢复状态
python3 scripts/i18n-refactor-helper.py quick-check
```

## 验证检查清单

### 自动验证项目

- ✅ 文件行数一致
- ✅ JSON格式正确
- ✅ 结构键完全一致
- ✅ TypeScript类型检查通过

### 手动验证项目

- ✅ 所有硬编码中文文本已替换
- ✅ 翻译内容准确且符合UI规范
- ✅ 组件功能完全不受影响
- ✅ 用户界面显示正常

## 最佳实践

### 1. 增量重构

- 一次只重构一个模块
- 每个文件重构后立即验证
- 发现问题立即修复

### 2. 翻译复用

- 优先使用已有翻译结构
- 避免创建重复的翻译键
- 统一命名规范

### 3. 结构设计

- 使用层次化组织
- 考虑未来扩展性
- 保持逻辑清晰

### 4. 质量保证

- 每步都要验证
- 保持备份
- 严格遵循原则

## 工具使用示例

### 日常验证

```bash
# 开始工作前
python3 scripts/i18n-refactor-helper.py quick-check

# 修改后验证
python3 scripts/i18n-refactor-helper.py quick-check

# 完成后全面验证
python3 scripts/i18n-refactor-helper.py validate
```

### 备份管理

```bash
# 重要修改前备份
python3 scripts/i18n-refactor-helper.py backup

# 出错时恢复
python3 scripts/i18n-refactor-helper.py restore
```

## 成功标准

重构完成后应该满足：

1. **功能完整性**：所有功能正常工作
2. **翻译完整性**：支持5种语言完整显示
3. **代码质量**：通过TypeScript检查和构建测试
4. **结构一致性**：所有翻译文件结构完全一致
5. **用户体验**：界面显示正常，交互无异常

## 总结

这个优化的工作流程通过以下方式提升了重构效率：

1. **自动化验证**：集成验证工具，实时检查一致性
2. **备份机制**：提供安全的恢复方案
3. **增量验证**：每步验证，及时发现问题
4. **明确原则**：严格的重构原则，避免意外修改
5. **工具集成**：简化验证流程，提高工作效率

使用这个工作流程可以确保i18n重构工作顺利进行，避免重复的检查和修复工作。
