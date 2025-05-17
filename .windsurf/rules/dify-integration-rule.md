---
trigger: model_decision
description: 
globs: app/api/dify/**/route.ts,lib/services/dify/**/*.ts,lib/hooks/use-*.ts
---
# Dify API 集成规范与开发指南

本文档规定了在 if-agent-ui 项目中集成 Dify API 的最佳实践和开发流程，旨在确保代码清晰、模块化、低耦合且易于维护和扩展。

## 核心原则：职责分离

为了实现清晰的架构，我们将 Dify API 的集成逻辑划分为三个主要层次：

1.  **Next.js API 路由 (后端代理)**:
    *   **位置**: `app/api/dify/[appId]/[...slug]/route.ts`
    *   **职责**:
        *   接收来自前端 Service 层的请求。
        *   根据请求路径中的 `appId`，从配置源（环境变量、数据库等）安全地获取对应的 Dify API Base URL 和 API Key。
        *   **执行认证**: 向请求头中添加 `Authorization: Bearer {apiKey}`。
        *   将请求透明地**转发**给真实的 Dify API 端点。
        *   将 Dify API 的响应（包括流式响应、JSON、文件等）**转发**回给前端 Service 层。
        *   处理基本的 HTTP 细节和 CORS 配置。
    *   **关键点**: 不关心具体的业务逻辑（是聊天还是文件上传），只负责认证和转发。

2.  **Dify Service 层 (前端服务)**:
    *   **位置**: `lib/services/dify/*.ts` (按功能领域划分文件，如 `chat-service.ts`, `file-service.ts` 等)
    *   **职责**:
        *   定义与特定 Dify 功能域相关的 API 调用函数。
        *   根据 `types.ts` 中的接口定义，构造发送给**后端代理**的请求体 (`payload`)。
        *   知道要调用哪个 Dify 功能（对应代理 URL 中的 `slug`）。
        *   调用**后端代理**的 URL (格式: `/api/dify/{appId}/{slug}`), **绝不直接调用 Dify API**。
        *   处理**后端代理**返回的响应（解析 JSON、处理 Stream、格式化数据、错误处理）。
        *   向上层（React Hooks 或组件）提供简洁、类型化、与业务逻辑相关的接口。
    *   **关键点**: 不关心认证细节 (API Key/URL)，只关心业务逻辑和与代理的交互。

3.  **Dify 类型定义**:
    *   **位置**: `lib/services/dify/types.ts`
    *   **职责**:
        *   定义所有与 Dify API 交互相关的 TypeScript 数据结构、请求体接口、响应体接口（包括 SSE 事件）。
        *   作为 Service 层和（可能的）Hook 层之间数据格式的"契约"。
    *   **关键点**: 所有 Dify 相关的数据结构都应在此文件中统一定义，保持一致性。

## 如何添加新的 Dify API 集成 (后续开发流程)

遵循以下步骤，以"堆积木"的方式清晰地添加新的 Dify 功能支持：

1.  **第 1 步：定义类型 (types.ts)**
    *   查阅 Dify API 文档，了解新 API 的请求参数和响应结构。
    *   在 `lib/services/dify/types.ts` 文件中，为新的请求体和响应体（包括可能的 SSE 事件）添加相应的 TypeScript 接口或类型别名。

2.  **第 2 步：选择或创建 Service 文件 (lib/services/dify/)**
    *   根据新 API 的**功能领域** (例如：文件处理、应用管理、数据集操作等)，确定它应该属于哪个 Service 文件。
    *   如果尚无合适的 Service 文件，则在 `lib/services/dify/` 目录下创建一个新的文件，例如 `file-service.ts` 或 `app-service.ts`。
    *   **保持单一职责**: 每个 Service 文件应聚焦于一个特定的功能领域。

3.  **第 3 步：实现 Service 函数 (*-service.ts)**
    *   在选定的 Service 文件中，创建一个新的异步函数来调用该 Dify API。
    *   **函数签名**: 接收必要的参数，例如 `appId`, `user` 标识符，以及该 API 特有的数据（如文件对象、查询参数等）。返回一个 Promise，其类型应符合 `types.ts` 中定义的响应类型。
    *   **构造 Payload**: 使用传入的参数和 `types.ts` 中的接口，构建发送给**后端代理**的请求体。
    *   **确定 Slug**: 明确此 API 对应的 Dify 路径，这将作为**后端代理** URL 的一部分 (`slug`)。
    *   **调用代理**: 使用 `fetch` 调用后端代理的 URL，格式为 `` `/api/dify/${appId}/${slug}` ``。确保传递正确的 HTTP 方法 (`method`) 和请求体 (`body`)。**不要添加 `Authorization` 头，这是代理的职责。**
    *   **处理响应**:
        *   检查 `response.ok` 状态。
        *   根据预期的响应类型（JSON, text/event-stream, audio/* 等）处理 `response.body`。
        *   使用 `types.ts` 中定义的类型来解析和返回数据。
        *   实现健壮的错误处理逻辑，向上层抛出或返回明确的错误信息。
    *   **示例 (伪代码)**:
        ```typescript
        // lib/services/dify/file-service.ts
        import type { DifyFileUploadPayload, DifyFileUploadResponse } from './types';

        export async function uploadDifyFile(
          appId: string,
          payload: DifyFileUploadPayload // 使用 types.ts 定义的类型
        ): Promise<DifyFileUploadResponse> { // 返回类型也来自 types.ts
          const slug = 'files/upload'; // Dify API 路径
          const apiUrl = `/api/dify/${appId}/${slug}`; // 指向后端代理

          try {
            const response = await fetch(apiUrl, {
              method: 'POST',
              // Body 通常是 FormData，代理会处理
              body: payload.formData, // 假设 payload 包含 FormData
              // 不需要 Content-Type 和 Authorization
            });

            if (!response.ok) {
              // 处理错误响应...
              throw new Error(`Failed to upload file: ${response.statusText}`);
            }

            const result: DifyFileUploadResponse = await response.json();
            return result; // 返回符合类型定义的结果

          } catch (error) {
            console.error('[Dify File Service] Upload failed:', error);
            throw error; // 重新抛出错误
          }
        }
        ```

4.  **第 4 步：(通常不需要) 检查/更新后端代理 (route.ts)**
    *   大多数情况下，现有的代理 (`app/api/dify/[appId]/[...slug]/route.ts`) 已经足够通用，无需修改。
    *   **仅在特殊情况下**需要检查或更新：
        *   如果新 API 需要特殊的请求头（除了 `Authorization` 和 `Content-Type`）。
        *   如果新 API 返回一种代理尚未处理的特殊 `Content-Type`。
        *   如果新 API 需要特定的 CORS 配置。

5.  **第 5 步：前端调用**
    *   在需要使用该 Dify 功能的前端组件或 Hook 中：
    *   从对应的 Service 文件导入刚刚创建的函数。
    *   调用该函数，并处理其返回的 Promise (成功或失败)。
    *   根据需要更新 UI 状态。

## 好处

遵循此规范将带来：

*   **清晰性**: 每个部分的职责明确，代码易于理解。
*   **模块化**: 功能按领域划分到不同的 Service 文件，像积木一样可组合。
*   **低耦合**: Service 层不依赖认证细节，代理层不依赖业务逻辑，改动影响范围小。
*   **可维护性**: 定位和修复问题更容易，修改配置（如 API Key）只需改动一处（代理层）。
*   **可扩展性**: 添加新功能只需遵循流程创建新的类型和 Service 函数，对现有代码影响最小。

请在后续开发 Dify 相关功能时，严格遵守本规范。
