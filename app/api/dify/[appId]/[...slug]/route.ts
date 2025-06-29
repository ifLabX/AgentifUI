import { getDifyAppConfig } from '@lib/config/dify-config';
import { isTextGenerationApp, isWorkflowApp } from '@lib/types/dify-app-types';

import { type NextRequest, NextResponse } from 'next/server';

// app/api/dify/[appId]/[...slug]/route.ts
export const dynamic = 'force-dynamic';

// 定义路由参数的接口
interface DifyApiParams {
  appId: string;
  slug: string[];
}

/**
 * --- BEGIN COMMENT ---
 * 🎯 新增：根据Dify应用类型调整API路径的函数
 * 不同类型的Dify应用使用不同的API端点
 * --- END COMMENT ---
 */
function adjustApiPathByAppType(
  slug: string[],
  appType: string | undefined
): string {
  const originalPath = slug.join('/');

  if (!appType) {
    return originalPath; // --- 如果没有应用类型信息，保持原路径 ---
  }

  // --- 工作流应用：需要workflows前缀，但排除通用API ---
  if (isWorkflowApp(appType as any)) {
    // --- BEGIN COMMENT ---
    // 文件上传、音频转文本等通用API不需要workflows前缀
    // --- END COMMENT ---
    const commonApis = ['files/upload', 'audio-to-text'];
    const isCommonApi = commonApis.some(api => originalPath.startsWith(api));

    if (!isCommonApi && !originalPath.startsWith('workflows/')) {
      return `workflows/${originalPath}`;
    }
  }

  // --- 文本生成应用：使用completion-messages端点 ---
  if (isTextGenerationApp(appType as any)) {
    if (originalPath === 'messages' || originalPath === 'chat-messages') {
      return 'completion-messages';
    }
    if (originalPath.startsWith('chat-messages')) {
      return originalPath.replace('chat-messages', 'completion-messages');
    }
  }

  return originalPath;
}

// --- 辅助函数：创建带有 Content-Type 的最小化响应头 ---
function createMinimalHeaders(contentType?: string): Headers {
  const headers = new Headers();

  // 如果提供了 Content-Type，则设置它
  if (contentType) {
    headers.set('Content-Type', contentType);
  }
  return headers;
}

// --- 核心辅助函数：执行到 Dify 的代理请求 ---
async function proxyToDify(
  req: NextRequest, // 原始 Next.js 请求对象
  // 修改点 1：接收包含 params 的 context 对象
  context: { params: Promise<DifyApiParams> } // 统一使用 Promise 类型
) {
  // 修改点 2：使用 await 获取 params 的值
  const params = await context.params;
  const appId = params.appId;
  const slug = params.slug;

  // --- BEGIN COMMENT ---
  // 🎯 新增：检查是否有临时配置（用于表单同步）
  // 如果请求体中包含 _temp_config，则使用临时配置而不是数据库配置
  // 🎯 修复：避免重复读取请求体，先克隆请求以保留原始请求体
  // --- END COMMENT ---
  let tempConfig: { apiUrl: string; apiKey: string } | null = null;
  let requestBody: any = null;

  if (req.method === 'POST') {
    try {
      // 克隆请求以避免消费原始请求体
      const clonedReq = req.clone();
      const body = await clonedReq.json();
      requestBody = body; // 保存解析后的请求体

      if (
        body._temp_config &&
        body._temp_config.apiUrl &&
        body._temp_config.apiKey
      ) {
        tempConfig = body._temp_config;
        console.log(
          `[App: ${appId}] [${req.method}] 检测到临时配置，将使用表单提供的配置`
        );

        // 移除临时配置字段，避免传递给 Dify API
        const { _temp_config, ...cleanBody } = body;
        requestBody = cleanBody;
      }
    } catch (error) {
      // 如果解析请求体失败，继续使用正常流程
      console.log(
        `[App: ${appId}] [${req.method}] 无法解析请求体，使用正常配置流程`
      );
      requestBody = null;
    }
  }

  // --- BEGIN OPTIMIZATION: Validate slug ---
  // 检查 slug 是否有效，防止构造无效的目标 URL
  if (!slug || slug.length === 0) {
    console.error(
      `[App: ${appId}] [${req.method}] Invalid request: Slug path is missing.`
    );
    const baseResponse = new Response(
      JSON.stringify({ error: 'Invalid request: slug path is missing.' }),
      {
        status: 400,
        headers: createMinimalHeaders('application/json'), // 使用辅助函数
      }
    );

    return baseResponse;
  }
  // --- END OPTIMIZATION ---

  // --- BEGIN COMMENT ---
  // 1. 获取 Dify 应用配置
  // 优先使用临时配置（表单同步），否则从数据库获取
  // --- END COMMENT ---
  let difyApiKey: string;
  let difyApiUrl: string;
  let difyConfig: any = null;

  if (tempConfig) {
    // 使用临时配置
    console.log(`[App: ${appId}] [${req.method}] 使用临时配置`);
    difyApiKey = tempConfig.apiKey;
    difyApiUrl = tempConfig.apiUrl;
  } else {
    // 从数据库获取配置
    console.log(`[App: ${appId}] [${req.method}] 从数据库获取配置...`);
    difyConfig = await getDifyAppConfig(appId);

    // 验证数据库配置
    if (!difyConfig) {
      console.error(`[App: ${appId}] [${req.method}] Configuration not found.`);
      // 返回 400 Bad Request，表明客户端提供的 appId 无效或未配置
      const baseResponse = NextResponse.json(
        { error: `Configuration for Dify app '${appId}' not found.` },
        { status: 400 }
      );

      return baseResponse;
    }

    difyApiKey = difyConfig.apiKey;
    difyApiUrl = difyConfig.apiUrl;
  }

  // 再次检查获取到的 key 和 url 是否有效
  if (!difyApiKey || !difyApiUrl) {
    console.error(
      `[App: ${appId}] [${req.method}] Invalid configuration loaded (missing key or URL).`
    );
    // 返回 500 Internal Server Error，表明服务器端配置问题
    const baseResponse = NextResponse.json(
      { error: `Server configuration error for app '${appId}'.` },
      { status: 500 }
    );

    return baseResponse;
  }
  console.log(
    `[App: ${appId}] [${req.method}] Configuration loaded successfully.`
  );

  try {
    // 3. 构造目标 Dify URL
    const slugPath = adjustApiPathByAppType(slug, difyConfig?.appType);
    const targetUrl = `${difyApiUrl}/${slugPath}${req.nextUrl.search}`;
    console.log(
      `[App: ${appId}] [${req.method}] Proxying request to target URL: ${targetUrl}`
    );

    // 4. 准备转发请求头
    const headers = new Headers();
    // 只复制必要的请求头
    if (req.headers.get('Content-Type')) {
      headers.set('Content-Type', req.headers.get('Content-Type')!);
    }
    if (req.headers.get('Accept')) {
      headers.set('Accept', req.headers.get('Accept')!);
    }
    // 添加 Dify 认证头
    headers.set('Authorization', `Bearer ${difyApiKey}`);
    // 可以根据需要添加其他固定请求头

    // 5. 执行 fetch 请求转发
    // 准备请求体和头部，处理特殊情况
    let finalBody: BodyInit | null = null;

    // --- BEGIN COMMENT ---
    // 🎯 处理请求体：使用之前解析和清理过的请求体
    // --- END COMMENT ---
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (tempConfig) {
        // 使用临时配置时，请求体应该为空（因为这些是 info/parameters 查询请求）
        finalBody = null;
      } else if (requestBody !== null) {
        // 使用之前解析过的请求体
        finalBody = JSON.stringify(requestBody);
      } else {
        // 如果没有解析过请求体，使用原始请求体
        finalBody = req.body;
      }
    }

    const finalHeaders = new Headers(headers);
    const originalContentType = req.headers.get('Content-Type');

    // 特殊处理 multipart/form-data 请求（文件上传和语音转文本）
    if (
      (slugPath === 'files/upload' || slugPath === 'audio-to-text') &&
      originalContentType?.includes('multipart/form-data')
    ) {
      console.log(
        `[App: ${appId}] [${req.method}] Handling multipart/form-data for ${slugPath}`
      );
      try {
        // 解析表单数据
        const formData = await req.formData();
        finalBody = formData;
        // 重要：移除 Content-Type，让 fetch 自动设置包含正确 boundary 的 multipart/form-data
        finalHeaders.delete('Content-Type');
      } catch (formError) {
        console.error(
          `[App: ${appId}] [${req.method}] Error parsing FormData:`,
          formError
        );
        return NextResponse.json(
          {
            error: 'Failed to parse multipart form data',
            details: (formError as Error).message,
          },
          { status: 400 }
        );
      }
    }

    // 准备 fetch 选项
    // --- BEGIN COMMENT ---
    // 🎯 临时配置请求应该使用 GET 方法调用 Dify API
    // --- END COMMENT ---
    const actualMethod = tempConfig ? 'GET' : req.method;

    const fetchOptions: RequestInit & { duplex: 'half' } = {
      method: actualMethod,
      headers: finalHeaders,
      body: finalBody,
      redirect: 'manual',
      cache: 'no-store',
      // 【重要】添加 duplex 选项并使用类型断言解决 TS(2769)
      duplex: 'half',
    };

    const response = await fetch(targetUrl, fetchOptions as any);
    console.log(
      `[App: ${appId}] [${req.method}] Dify response status: ${response.status}`
    );

    // --- BEGIN MODIFICATION / 开始修改 ---
    // 直接处理成功的 204 No Content 响应
    if (response.status === 204) {
      console.log(
        `[App: ${appId}] [${req.method}] 收到 204 No Content，直接转发响应.`
      );
      // 转发 204 状态和必要的响应头, 确保 body 为 null
      // 克隆需要转发的响应头
      const headersToForward = new Headers();
      response.headers.forEach((value, key) => {
        // 避免转发对 204 无意义或无效的头，如 content-length, content-type
        if (
          !['content-length', 'content-type', 'transfer-encoding'].includes(
            key.toLowerCase()
          )
        ) {
          headersToForward.set(key, value);
        }
      });

      // 返回 204 响应，body 必须为 null，中间件会自动添加CORS头
      const baseResponse = new Response(null, {
        status: 204,
        statusText: 'No Content',
        headers: headersToForward,
      });

      return baseResponse;
    }
    // --- END MODIFICATION / 结束修改 ---

    // 6. 处理并转发 Dify 的响应
    if (response.ok && response.body) {
      const responseContentType = response.headers.get('content-type');

      // --- BEGIN SSE Robust Handling ---
      // 处理流式响应（SSE）- 使用手动读取/写入以增强健壮性
      if (responseContentType?.includes('text/event-stream')) {
        console.log(
          `[App: ${appId}] [${req.method}] Streaming response detected. Applying robust handling.`
        );

        // 保留 Dify 返回的 SSE 相关头，并补充我们标准的 CORS 头
        const sseHeaders = createMinimalHeaders(); // Start with minimal CORS headers
        response.headers.forEach((value, key) => {
          // Copy essential SSE headers from Dify response
          if (
            key.toLowerCase() === 'content-type' ||
            key.toLowerCase() === 'cache-control' ||
            key.toLowerCase() === 'connection'
          ) {
            sseHeaders.set(key, value);
          }
        });

        // 创建一个新的可读流，用于手动将数据块推送给客户端
        const stream = new ReadableStream({
          async start(controller) {
            console.log(
              `[App: ${appId}] [${req.method}] SSE Stream: Starting to read from Dify.`
            );
            const reader = response.body!.getReader(); // 确定 response.body 存在
            const decoder = new TextDecoder(); // 用于调试日志输出

            // 处理客户端断开连接
            req.signal.addEventListener('abort', () => {
              console.log(
                `[App: ${appId}] [${req.method}] SSE Stream: Client disconnected, cancelling Dify read.`
              );
              reader.cancel('Client disconnected');
              // 注意：controller 可能已经 close，这里尝试 close 可能会报错，但通常无害
              try {
                controller.close();
              } catch {
                /* Ignore */
              }
            });

            try {
              while (true) {
                // 检查客户端是否已断开
                if (req.signal.aborted) {
                  console.log(
                    `[App: ${appId}] [${req.method}] SSE Stream: Abort signal detected before read, stopping.`
                  );
                  // 无需手动取消 reader，addEventListener 中的 cancel 会处理
                  break;
                }

                const { done, value } = await reader.read();

                if (done) {
                  console.log(
                    `[App: ${appId}] [${req.method}] SSE Stream: Dify stream finished.`
                  );
                  break; // Dify 流结束，退出循环
                }

                // 将从 Dify 读取到的数据块推送到我们创建的流中
                controller.enqueue(value);
                // 可选：打印解码后的数据块用于调试
                // console.log(`[App: ${appId}] [${req.method}] SSE Chunk:`, decoder.decode(value, { stream: true }));
              }
            } catch (error) {
              // 如果读取 Dify 流时发生错误（例如 Dify 服务器断开）
              console.error(
                `[App: ${appId}] [${req.method}] SSE Stream: Error reading from Dify stream:`,
                error
              );
              // 在我们创建的流上触发错误，通知下游消费者
              controller.error(error);
            } finally {
              console.log(
                `[App: ${appId}] [${req.method}] SSE Stream: Finalizing stream controller.`
              );
              // 确保无论如何都关闭控制器 (如果尚未关闭或出错)
              try {
                controller.close();
              } catch {
                /* Ignore if already closed or errored */
              }
              // 确保 reader 被释放 (cancel 也会释放锁，这里是双重保险)
              // reader.releaseLock(); // reader 在 done=true 或 error 后会自动释放
            }
          },
          cancel(reason) {
            console.log(
              `[App: ${appId}] [${req.method}] SSE Stream: Our stream was cancelled. Reason:`,
              reason
            );
            // 如果我们创建的流被取消（例如 Response 对象的 cancel() 被调用），
            // 理论上 reader 应该已经在 abort 事件监听中被 cancel 了。
            // 如果需要，这里可以添加额外的清理逻辑。
          },
        });

        // 返回包含我们手动创建的流的响应，中间件会自动添加CORS头
        const baseResponse = new Response(stream, {
          status: response.status,
          statusText: response.statusText,
          headers: sseHeaders,
        });

        return baseResponse;
      }
      // --- END SSE Robust Handling ---

      // 处理音频响应（文本转语音）- 保留简单的直接管道方式
      else if (responseContentType?.startsWith('audio/')) {
        console.log(`[App: ${appId}] [${req.method}] Audio response detected.`);
        const audioHeaders = createMinimalHeaders(); // Start with minimal CORS
        response.headers.forEach((value, key) => {
          // Copy essential audio headers
          if (
            key.toLowerCase().startsWith('content-') ||
            key.toLowerCase() === 'accept-ranges' ||
            key.toLowerCase() === 'vary'
          ) {
            audioHeaders.set(key, value);
          }
        });
        // 对于一次性流，直接管道通常是高效且足够稳定的，中间件会自动添加CORS头
        const baseResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: audioHeaders,
        });

        return baseResponse;
      }
      // 处理常规响应 (主要是 JSON 或 Text)
      else {
        // 处理非流式响应
        const responseData = await response.text();
        try {
          const jsonData = JSON.parse(responseData);
          console.log(
            `[App: ${appId}] [${req.method}] Returning native Response with minimal headers for success JSON.`
          );
          // --- REFACTOR: Use minimal header helper ---
          const baseResponse = new Response(JSON.stringify(jsonData), {
            status: response.status,
            statusText: response.statusText,
            headers: createMinimalHeaders('application/json'), // 使用辅助函数
          });

          return baseResponse;
          // --- END REFACTOR ---
        } catch (parseError) {
          // 非 JSON，返回文本
          console.log(
            `[App: ${appId}] [${req.method}] JSON parse failed, returning plain text with minimal headers.`
          );
          // --- REFACTOR: Use minimal header helper ---
          const originalDifyContentType =
            response.headers.get('content-type') || 'text/plain';
          const baseResponse = new Response(responseData, {
            status: response.status,
            statusText: response.statusText,
            headers: createMinimalHeaders(originalDifyContentType), // 使用辅助函数，并传递原始类型
          });

          return baseResponse;
          // --- END REFACTOR ---
        }
      }
    } else {
      // 处理无响应体或失败的情况
      if (!response.body) {
        console.log(
          `[App: ${appId}] [${req.method}] Empty response body with status: ${response.status}`
        );
      }
      // 尝试读取错误信息
      try {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          console.log(
            `[App: ${appId}] [${req.method}] Returning native Response with minimal headers for error JSON.`
          );
          // --- REFACTOR: Use minimal header helper ---
          const baseResponse = new Response(JSON.stringify(errorJson), {
            status: response.status,
            statusText: response.statusText,
            headers: createMinimalHeaders('application/json'), // 使用辅助函数
          });

          return baseResponse;
          // --- END REFACTOR ---
        } catch {
          // 错误响应不是 JSON，返回文本
          console.log(
            `[App: ${appId}] [${req.method}] Error response is not JSON, returning plain text with minimal headers.`
          );
          // --- REFACTOR: Use minimal header helper ---
          const originalDifyErrorContentType =
            response.headers.get('content-type') || 'text/plain';
          const baseResponse = new Response(errorText, {
            status: response.status,
            statusText: response.statusText,
            headers: createMinimalHeaders(originalDifyErrorContentType), // 使用辅助函数
          });

          return baseResponse;
          // --- END REFACTOR ---
        }
      } catch (readError) {
        // 如果连读取错误响应都失败了
        console.error(
          `[App: ${appId}] [${req.method}] Failed to read Dify error response body:`,
          readError
        );
        const finalErrorHeaders = createMinimalHeaders('application/json'); // 使用辅助函数
        const baseResponse = new Response(
          JSON.stringify({
            error: `Failed to read Dify error response body. Status: ${response.status}`,
          }),
          {
            status: 502,
            headers: finalErrorHeaders,
          }
        );

        return baseResponse;
      }
    }
  } catch (error: any) {
    // 捕获 fetch 或响应处理中的错误
    console.error(
      `[App: ${appId}] [${req.method}] Dify proxy fetch/processing error:`,
      error
    );
    const baseResponse = NextResponse.json(
      {
        error: `Failed to connect or process response from Dify service for app '${appId}' during ${req.method}.`,
        details: error.message,
      },
      { status: 502 } // 502 Bad Gateway
    );

    return baseResponse;
  }
}

// --- 导出对应 HTTP 方法的处理函数 ---
// 为每个 HTTP 方法创建符合 Next.js 15 要求的处理函数

export async function GET(
  req: NextRequest,
  context: { params: Promise<DifyApiParams> }
) {
  return proxyToDify(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<DifyApiParams> }
) {
  return proxyToDify(req, context);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<DifyApiParams> }
) {
  return proxyToDify(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<DifyApiParams> }
) {
  return proxyToDify(req, context);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<DifyApiParams> }
) {
  return proxyToDify(req, context);
}

// --- BEGIN OPTIMIZATION: Explicit OPTIONS handler ---
// 添加明确的 OPTIONS 请求处理函数，以确保 CORS 预检请求在各种部署环境下都能正确响应
export async function OPTIONS(req: NextRequest) {
  console.log('[OPTIONS Request] Responding to preflight request.');
  const baseResponse = new Response(null, {
    status: 204, // No Content for preflight
    headers: createMinimalHeaders(),
  });

  return baseResponse;
}
// --- END OPTIMIZATION ---
