// app/api/dify/[appId]/[...slug]/route.ts
export const dynamic = 'force-dynamic';

import { type NextRequest, NextResponse } from 'next/server';
import { getDifyAppConfig } from '@lib/config/dify-config';

// 定义路由参数的接口
interface DifyApiParams {
  appId: string;
  slug: string[];
}

// --- 辅助函数：创建带有基本 CORS 和 Content-Type 的最小化响应头 ---
function createMinimalHeaders(contentType?: string): Headers {
  const headers = new Headers();
  // 设置基础的 CORS 头 (生产环境应配置更严格的源)
  headers.set('Access-Control-Allow-Origin', '*'); 
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
  context: { params: Promise<DifyApiParams> | DifyApiParams } // 允许 Promise 或直接对象以兼容不同 Next.js 版本或场景
) {

  // 修改点 2：使用 await 获取 params 的值
  const params = await context.params;
  const appId = params.appId;
  const slug = params.slug;

  // --- BEGIN OPTIMIZATION: Validate slug --- 
  // 检查 slug 是否有效，防止构造无效的目标 URL
  if (!slug || slug.length === 0) {
    console.error(`[App: ${appId}] [${req.method}] Invalid request: Slug path is missing.`);
    return new Response(JSON.stringify({ error: 'Invalid request: slug path is missing.' }), {
      status: 400,
      headers: createMinimalHeaders('application/json') // 使用辅助函数
    });
  }
  // --- END OPTIMIZATION ---

  // --- BEGIN COMMENT ---
  // 1. 获取特定 Dify 应用的配置。
  //    `getDifyAppConfig` 函数现在从数据库获取 appId 对应的 apiKey 和 apiUrl。
  //    如果数据库中没有找到配置，将返回 null。
  // --- END COMMENT ---
  // --- BEGIN COMMENT ---
  // 注意: 我们已经实现了从数据库获取配置的功能。
  // getDifyAppConfig 内部实现已经更新为：
  // 1. 首先检查缓存，如果有有效缓存则直接返回。
  // 2. 连接数据库，根据传入的 appId 查询提供商、服务实例和 API 密钥。
  // 3. 使用加密主密钥解密 API 密钥。
  // 4. 返回配置并更新缓存。
  // 这种方式提高了安全性，并支持集中管理多个 Dify 应用的凭据。
  // --- END COMMENT ---
  console.log(`[App: ${appId}] [${req.method}] Attempting to get configuration...`);
  const difyConfig = await getDifyAppConfig(appId);

  // 2. 验证配置
  if (!difyConfig) {
    console.error(`[App: ${appId}] [${req.method}] Configuration not found.`);
    // 返回 400 Bad Request，表明客户端提供的 appId 无效或未配置
    return NextResponse.json(
      { error: `Configuration for Dify app '${appId}' not found.` },
      { status: 400 }
    );
  }

  const { apiKey: difyApiKey, apiUrl: difyApiUrl } = difyConfig;

  // 再次检查获取到的 key 和 url 是否有效
  if (!difyApiKey || !difyApiUrl) {
     console.error(`[App: ${appId}] [${req.method}] Invalid configuration loaded (missing key or URL).`);
     // 返回 500 Internal Server Error，表明服务器端配置问题
     return NextResponse.json({ error: `Server configuration error for app '${appId}'.` }, { status: 500 });
  }
  console.log(`[App: ${appId}] [${req.method}] Configuration loaded successfully.`);

  try {
    // 3. 构造目标 Dify URL
    const slugPath = slug.join('/');
    const targetUrl = `${difyApiUrl}/${slugPath}${req.nextUrl.search}`;
    console.log(`[App: ${appId}] [${req.method}] Proxying request to target URL: ${targetUrl}`);

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
    let finalBody: BodyInit | null = req.method !== 'GET' && req.method !== 'HEAD' ? req.body : null;
    const finalHeaders = new Headers(headers);
    const originalContentType = req.headers.get('Content-Type');

    // 特殊处理 multipart/form-data 请求（文件上传和语音转文本）
    if ((slugPath === 'files/upload' || slugPath === 'audio-to-text') && 
        originalContentType?.includes('multipart/form-data')) {
      console.log(`[App: ${appId}] [${req.method}] Handling multipart/form-data for ${slugPath}`);
      try {
        // 解析表单数据
        const formData = await req.formData();
        finalBody = formData;
        // 重要：移除 Content-Type，让 fetch 自动设置包含正确 boundary 的 multipart/form-data
        finalHeaders.delete('Content-Type');
      } catch (formError) {
        console.error(`[App: ${appId}] [${req.method}] Error parsing FormData:`, formError);
        return NextResponse.json(
          { error: 'Failed to parse multipart form data', details: (formError as Error).message },
          { status: 400 }
        );
      }
    }

    // 准备 fetch 选项
    const fetchOptions: RequestInit & { duplex: 'half' } = {
        method: req.method,
        headers: finalHeaders,
        body: finalBody,
        redirect: 'manual',
        cache: 'no-store',
        // 【重要】添加 duplex 选项并使用类型断言解决 TS(2769)
        duplex: 'half'
    };

    const response = await fetch(targetUrl, fetchOptions as any);
    console.log(`[App: ${appId}] [${req.method}] Dify response status: ${response.status}`);

    // --- BEGIN MODIFICATION / 开始修改 ---
    // 直接处理成功的 204 No Content 响应
    if (response.status === 204) {
      console.log(`[App: ${appId}] [${req.method}] 收到 204 No Content，直接转发响应.`);
      // 转发 204 状态和必要的响应头, 确保 body 为 null
      // 克隆需要转发的响应头
      const headersToForward = new Headers();
      response.headers.forEach((value, key) => {
         // 避免转发对 204 无意义或无效的头，如 content-length, content-type
         if (!['content-length', 'content-type', 'transfer-encoding'].includes(key.toLowerCase())) {
            headersToForward.set(key, value);
         }
      });
      // 添加 CORS 响应头 (生产环境应配置更严格的源)
      headersToForward.set('Access-Control-Allow-Origin', '*'); 
      headersToForward.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      headersToForward.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      // 返回 204 响应，body 必须为 null
      return new Response(null, {
        status: 204,
        statusText: 'No Content',
        headers: headersToForward
      });
    }
    // --- END MODIFICATION / 结束修改 ---

    // 6. 处理并转发 Dify 的响应
    if (response.ok && response.body) {
      const responseContentType = response.headers.get('content-type');

      // --- BEGIN SSE Robust Handling ---
      // 处理流式响应（SSE）- 使用手动读取/写入以增强健壮性
      if (responseContentType?.includes('text/event-stream')) {
        console.log(`[App: ${appId}] [${req.method}] Streaming response detected. Applying robust handling.`);

        // 保留 Dify 返回的 SSE 相关头，并补充我们标准的 CORS 头
        const sseHeaders = createMinimalHeaders(); // Start with minimal CORS headers
        response.headers.forEach((value, key) => {
          // Copy essential SSE headers from Dify response
          if (key.toLowerCase() === 'content-type' || key.toLowerCase() === 'cache-control' || key.toLowerCase() === 'connection') {
             sseHeaders.set(key, value);
          }
        });


        // 创建一个新的可读流，用于手动将数据块推送给客户端
        const stream = new ReadableStream({
          async start(controller) {
            console.log(`[App: ${appId}] [${req.method}] SSE Stream: Starting to read from Dify.`);
            const reader = response.body!.getReader(); // 确定 response.body 存在
            const decoder = new TextDecoder(); // 用于调试日志输出

            // 处理客户端断开连接
            req.signal.addEventListener('abort', () => {
              console.log(`[App: ${appId}] [${req.method}] SSE Stream: Client disconnected, cancelling Dify read.`);
              reader.cancel('Client disconnected');
              // 注意：controller 可能已经 close，这里尝试 close 可能会报错，但通常无害
              try { controller.close(); } catch { /* Ignore */ }
            });

            try {
              while (true) {
                 // 检查客户端是否已断开
                 if (req.signal.aborted) {
                   console.log(`[App: ${appId}] [${req.method}] SSE Stream: Abort signal detected before read, stopping.`);
                   // 无需手动取消 reader，addEventListener 中的 cancel 会处理
                   break;
                 }

                const { done, value } = await reader.read();

                if (done) {
                  console.log(`[App: ${appId}] [${req.method}] SSE Stream: Dify stream finished.`);
                  break; // Dify 流结束，退出循环
                }

                // 将从 Dify 读取到的数据块推送到我们创建的流中
                controller.enqueue(value);
                // 可选：打印解码后的数据块用于调试
                // console.log(`[App: ${appId}] [${req.method}] SSE Chunk:`, decoder.decode(value, { stream: true }));

              }
            } catch (error) {
              // 如果读取 Dify 流时发生错误（例如 Dify 服务器断开）
              console.error(`[App: ${appId}] [${req.method}] SSE Stream: Error reading from Dify stream:`, error);
              // 在我们创建的流上触发错误，通知下游消费者
              controller.error(error);
            } finally {
              console.log(`[App: ${appId}] [${req.method}] SSE Stream: Finalizing stream controller.`);
              // 确保无论如何都关闭控制器 (如果尚未关闭或出错)
              try { controller.close(); } catch { /* Ignore if already closed or errored */ }
              // 确保 reader 被释放 (cancel 也会释放锁，这里是双重保险)
              // reader.releaseLock(); // reader 在 done=true 或 error 后会自动释放
            }
          },
          cancel(reason) {
            console.log(`[App: ${appId}] [${req.method}] SSE Stream: Our stream was cancelled. Reason:`, reason);
            // 如果我们创建的流被取消（例如 Response 对象的 cancel() 被调用），
            // 理论上 reader 应该已经在 abort 事件监听中被 cancel 了。
            // 如果需要，这里可以添加额外的清理逻辑。
          }
        });

        // 返回包含我们手动创建的流的响应
        return new Response(stream, {
          status: response.status,
          statusText: response.statusText,
          headers: sseHeaders, // 使用包含必要 SSE 头和 CORS 头的 Headers
        });
      }
      // --- END SSE Robust Handling ---

      // 处理音频响应（文本转语音）- 保留简单的直接管道方式
      else if (responseContentType?.startsWith('audio/')) {
        console.log(`[App: ${appId}] [${req.method}] Audio response detected.`);
        const audioHeaders = createMinimalHeaders(); // Start with minimal CORS
         response.headers.forEach((value, key) => {
           // Copy essential audio headers
           if (key.toLowerCase().startsWith('content-') || key.toLowerCase() === 'accept-ranges' || key.toLowerCase() === 'vary') {
              audioHeaders.set(key, value);
           }
         });
        // 对于一次性流，直接管道通常是高效且足够稳定的
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: audioHeaders,
        });
      }
      // 处理常规响应 (主要是 JSON 或 Text)
      else {
        // 处理非流式响应
        const responseData = await response.text();
        try {
          const jsonData = JSON.parse(responseData);
          console.log(`[App: ${appId}] [${req.method}] Returning native Response with minimal headers for success JSON.`);
          // --- REFACTOR: Use minimal header helper --- 
          return new Response(JSON.stringify(jsonData), {
            status: response.status,
            statusText: response.statusText,
            headers: createMinimalHeaders('application/json'), // 使用辅助函数
          });
          // --- END REFACTOR ---
        } catch (parseError) {
           // 非 JSON，返回文本
           console.log(`[App: ${appId}] [${req.method}] JSON parse failed, returning plain text with minimal headers.`);
           // --- REFACTOR: Use minimal header helper --- 
           const originalDifyContentType = response.headers.get('content-type') || 'text/plain';
           return new Response(responseData, {
               status: response.status,
               statusText: response.statusText,
               headers: createMinimalHeaders(originalDifyContentType), // 使用辅助函数，并传递原始类型
           });
           // --- END REFACTOR ---
        }
      }
    } else {
      // 处理无响应体或失败的情况
      if (!response.body) {
        console.log(`[App: ${appId}] [${req.method}] Empty response body with status: ${response.status}`);
      }
      // 尝试读取错误信息
      try {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          console.log(`[App: ${appId}] [${req.method}] Returning native Response with minimal headers for error JSON.`);
          // --- REFACTOR: Use minimal header helper --- 
          return new Response(JSON.stringify(errorJson), {
            status: response.status,
            statusText: response.statusText,
            headers: createMinimalHeaders('application/json'), // 使用辅助函数
          });
          // --- END REFACTOR ---
        } catch {
          // 错误响应不是 JSON，返回文本
          console.log(`[App: ${appId}] [${req.method}] Error response is not JSON, returning plain text with minimal headers.`);
          // --- REFACTOR: Use minimal header helper --- 
          const originalDifyErrorContentType = response.headers.get('content-type') || 'text/plain';
          return new Response(errorText, {
            status: response.status,
            statusText: response.statusText,
            headers: createMinimalHeaders(originalDifyErrorContentType), // 使用辅助函数
          });
          // --- END REFACTOR ---
        }
      } catch (readError) {
        // 如果连读取错误响应都失败了
        console.error(`[App: ${appId}] [${req.method}] Failed to read Dify error response body:`, readError);
        const finalErrorHeaders = createMinimalHeaders('application/json'); // 使用辅助函数
        return new Response(JSON.stringify({ error: `Failed to read Dify error response body. Status: ${response.status}`}), {
             status: 502,
             headers: finalErrorHeaders
        });
      }
    }
  } catch (error: any) {
    // 捕获 fetch 或响应处理中的错误
    console.error(`[App: ${appId}] [${req.method}] Dify proxy fetch/processing error:`, error);
    return NextResponse.json(
      { error: `Failed to connect or process response from Dify service for app '${appId}' during ${req.method}.`, details: error.message },
      { status: 502 } // 502 Bad Gateway
    );
  }
}

// --- 导出对应 HTTP 方法的处理函数 ---
// 直接将 proxyToDify 赋给需要支持的方法

export {
    proxyToDify as GET,
    proxyToDify as POST,
    proxyToDify as PUT,
    proxyToDify as DELETE,
    proxyToDify as PATCH
    // OPTIONS 通常由 Next.js 或 Vercel 自动处理 CORS 预检，但如果需要自定义可以添加
};

// --- BEGIN OPTIMIZATION: Explicit OPTIONS handler --- 
// 添加明确的 OPTIONS 请求处理函数，以确保 CORS 预检请求在各种部署环境下都能正确响应
export async function OPTIONS() {
  console.log('[OPTIONS Request] Responding to preflight request.');
  return new Response(null, {
    status: 204, // No Content for preflight
    headers: createMinimalHeaders() // 使用辅助函数设置 CORS 头
  });
}
// --- END OPTIMIZATION --- 