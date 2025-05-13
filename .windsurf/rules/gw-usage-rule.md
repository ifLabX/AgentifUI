---
trigger: model_decision
description: gw提交命令规范
globs: 
---
# Git 工作流助手 (`gw`) 使用规则

本规则文档详细说明了如何使用项目中的 `gw` 脚本（位于 `scripts/git_workflow.sh`）来简化和规范 Git 操作，特别是在遵循特定开发工作流时。

## 核心理念

`gw` 脚本旨在将常用的多步 Git 操作封装成简单的命令，减少记忆负担，提高效率，并通过交互式提示和检查增加操作的安全性。

## ⭐ 核心工作流命令 (推荐)

这些是 `gw` 脚本的核心，专为典型的功能开发流程设计：

1.  **`gw new <分支名> [--local] [基础分支]`**: **开始新任务**
    *   **作用:** 从最新的主分支 (`master` 或 `main`，脚本自动检测) 或指定的基础分支创建并切换到一个新的功能分支。
    *   **流程:**
        1.  (默认) 切换到基础分支 (如 `master`)。
        2.  (默认) 执行 `git pull --rebase origin <基础分支>` 拉取最新代码。
        3.  执行 `git checkout -b <新分支名>` 创建并切换。
    *   **`--local` 选项**: 如果添加了 `--local` 标志，则会跳过第 2 步的 `pull --rebase`，直接基于本地的基础分支状态创建新分支。适用于离线或想基于特定本地提交点开始的情况。
    *   **示例:**
        *   `gw new feature/user-login` (从最新的主分支创建)
        *   `gw new hotfix/issue-123 develop` (从 `develop` 分支创建)
        *   `gw new quick-test --local` (从本地的最新主分支创建，不拉取更新)

2.  **`gw save [-m "消息"] [-e] [文件...]`**: **保存开发进度**
    *   **作用:** 快速添加变更并提交。
    *   **流程:**
        1.  执行 `git add <文件>` (如果指定了文件) 或 `git add -A` (如果未指定文件)。
        2.  执行提交操作:
            *   **默认行为 (无 `-m` 或 `-e`)**: 打印出一个临时的 `COMMIT_EDITMSG` 文件路径。你需要 **在你的编辑器 (如 VS Code / Cursor) 中打开这个文件**，输入提交信息并保存。然后回到终端按 **Enter** 键，`gw` 会使用你编辑好的信息完成提交。
            *   使用 `-m "提交消息"`: 直接使用提供的消息进行提交，跳过编辑器。
            *   使用 `-e`: 强制打开 Git 配置的默认命令行编辑器 (如 Vim, Nano) 来输入提交信息。
    *   **示例:**
        *   `gw save` (添加所有变更，暂停等待编辑 COMMIT_EDITMSG)
        *   `gw save README.md src/utils.js` (添加指定文件，暂停等待编辑)
        *   `gw save -m "修复登录按钮样式"` (添加所有变更，直接提交)
        *   `gw save -e src/api.js` (添加指定文件，打开命令行编辑器)

3.  **`gw sync`**: **同步开发分支**
    *   **作用:** 将主分支的最新变更整合到你当前的开发分支，保持同步，减少最终合并冲突。
    *   **流程:** 暂存本地变更 (如有) -> 切换到主分支 -> 拉取最新代码 (`git pull`) -> 切换回原分支 -> 变基 (`git rebase`) -> 尝试恢复暂存。
    *   **注意:** 如果 Rebase 过程中出现冲突，脚本会停止并提示你手动解决。

4.  **`gw finish [-n|--no-switch]`**: **完成分支开发，准备 PR/MR**
    *   **作用:** 完成当前分支的开发工作，将其推送到远程仓库，为创建 Pull Request 或 Merge Request 做准备。
    *   **流程:** 检查未提交变更 (提示处理) -> 推送当前分支到远程 (`git push`，自动处理首次推送的 `-u` 选项) -> **默认询问**是否切换回主分支并更新 -> (若使用 `-n` 或 `--no-switch` 参数，则**跳过**切换步骤)。
    *   **关键:** 此命令执行成功后，你需要**手动**去代码托管平台 (GitHub/GitLab) 创建 PR/MR。

5.  **`gw main | master [...]`**: **推送主分支**
    *   **作用:** 明确地推送主分支 (`master` 或 `main`) 到远程仓库。主要用于主分支的维护。
    *   **注意:** 可以附加 `git push` 的参数，如 `gw main -f` 进行强制推送 (请谨慎使用)。

6.  **`gw clean <分支名>`**: **清理已合并分支**
    *   **作用:** 自动化清理已合并的功能分支。
    *   **流程:** 切换到主分支 -> 拉取最新代码 -> 删除指定的本地分支 -> 询问并删除对应的远程分支。
    *   **推荐:** 在 PR/MR 被合并后使用此命令清理。

## 开发者典型工作流示例

假设你要开发一个新功能 "添加用户头像"：

1.  **开始:** (确保在主分支并最新)
    ```bash
    gw checkout master && gw pull # 或者 gw checkout main && gw pull
    gw new feature/avatar
    ```
2.  **开发 & 保存:** (小步提交)
    ```bash
    # ... 编写代码 ...
    gw save -m "WIP: Add avatar component structure"
    # ... 编写代码 ...
    gw save src/avatar.css src/avatar.tsx # 打开编辑器写 Commit Message
    # ... 编写代码 ...
    gw save -m "Feat: Implement image upload logic"
    ```
3.  **保持同步 (可选，推荐):** (定期与主分支同步)
    ```bash
    gw sync
    # (如果遇到冲突，手动解决后 git add . && git rebase --continue)
    ```
4.  **完成 & 准备 PR:**
    ```bash
    gw finish
    # (然后去 GitHub/GitLab 创建 PR)
    ```
5.  **PR 合并后清理:**
    ```bash
    # (确保 PR 已合并)
    gw clean feature/avatar
    ```

## 其他常用 Git 操作

`gw` 也封装了其他常用的 Git 命令，增加了提示或安全性：

*   **`gw status [-r] [-l]`**: 查看状态 (默认纯本地，`-r` 获取远程，`-l` 显示日志)。
*   **`gw add [文件...]`**: 添加文件 (无参数交互式)。
*   **`gw add-all`**: 添加所有变更 (`git add -A`)。
*   **`gw commit [-m "消息"] [-a]`**: 提交 (无 `-m` 打开编辑器，`-a` 添加已跟踪文件)。
*   **`gw pull [...]`**: 拉取远程更新 (带重试)。
*   **`gw fetch [...]`**: 获取远程更新，不合并。
*   **`gw branch [...]`**: 管理分支 (用法类似 `git branch`)。
*   **`gw checkout <分支名>`**: 切换分支。
*   **`gw merge <来源分支> [...]`**: 合并分支。
*   **`gw rm <分支名|all> [-f]`**: 删除分支 (`all` 仅限主分支执行，`-f` 强制)。
*   **`gw log [...]`**: 查看提交历史 (带分页)。
*   **`gw diff [...]`**: 查看差异。
*   **`gw reset [目标]`**: (**危险!**) 重置分支 (`--hard` 模式，带强确认)。

## 兼容旧版命令

脚本还支持旧版的数字命令模式 (`1`/`first`, `2`, `3`/`other`, `4`/`current`)，用于特定的推送场景。详情请查看 `gw help`。

## 配置

可以通过环境变量进行一些配置：

*   `MAIN_BRANCH`: 指定主分支名称 (脚本会自动检测 `master` 或 `main`，但可强制指定)。
*   `REMOTE_NAME`: 指定默认远程仓库名称 (默认 `origin`)。
*   `MAX_ATTEMPTS`: 推送/拉取最大重试次数 (默认 50)。
*   `DELAY_SECONDS`: 推送/拉取重试间隔秒数 (默认 1)。

## 总结

`gw` 脚本提供了一套围绕 `new` -> `save` -> `sync` -> `finish` -> `clean` 的核心工作流，旨在简化日常开发中的 Git 操作。建议优先使用这些核心命令，并根据需要配合其他辅助命令。
