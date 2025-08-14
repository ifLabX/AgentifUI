import { MediaResponseHandler } from '@lib/api/dify/handlers/media-response-handler';
import { getDifyAppConfig } from '@lib/config/dify-config';
import { type DifyAppConfig } from '@lib/config/dify-config';
import { createClient } from '@lib/supabase/server';
import {
  type DifyAppType,
  isTextGenerationApp,
  isWorkflowApp,
} from '@lib/types/dify-app-types';

import { type NextRequest, NextResponse } from 'next/server';

// app/api/dify/[appId]/[...slug]/route.ts
export const dynamic = 'force-dynamic';

// define interface for route parameters
interface DifyApiParams {
  appId: string;
  slug: string[];
}

/**
 * 🎯 New: Function to adjust API path based on Dify app type
 * Different types of Dify apps use different API endpoints
 */
function adjustApiPathByAppType(
  slug: string[],
  appType: string | undefined
): string {
  const originalPath = slug.join('/');

  if (!appType) {
    return originalPath; // if no app type info, keep original path
  }

  // workflow apps: need workflows prefix, but exclude common APIs
  if (isWorkflowApp(appType as DifyAppType)) {
    // common APIs like file upload, audio-to-text don't need workflows prefix
    const commonApis = ['files/upload', 'audio-to-text'];
    const isCommonApi = commonApis.some(api => originalPath.startsWith(api));

    if (!isCommonApi && !originalPath.startsWith('workflows/')) {
      return `workflows/${originalPath}`;
    }
  }

  // text generation apps: use completion-messages endpoint
  if (isTextGenerationApp(appType as DifyAppType)) {
    if (originalPath === 'messages' || originalPath === 'chat-messages') {
      return 'completion-messages';
    }
    if (originalPath.startsWith('chat-messages')) {
      return originalPath.replace('chat-messages', 'completion-messages');
    }
  }

  return originalPath;
}

// helper function: create minimal response headers with Content-Type
function createMinimalHeaders(contentType?: string): Headers {
  const headers = new Headers();

  // set Content-Type if provided
  if (contentType) {
    headers.set('Content-Type', contentType);
  }
  return headers;
}

// core helper function: execute proxy request to Dify
async function proxyToDify(
  req: NextRequest, // original Next.js request object
  // modification point 1: receive context object containing params
  context: { params: Promise<DifyApiParams> } // Unified use of Promise type
) {
  // 🔒 security: authenticate user before processing request
  const supabase = await createClient();

  // use getUser() to verify authentication with Supabase Auth server
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // modification point 2: use await to get the value of params
  const params = await context.params;
  const appId = params.appId;
  const slug = params.slug;

  // check if there is temporary configuration (for form synchronization)
  // if the request body contains _temp_config, use temporary configuration instead of database configuration
  // avoid reading the request body repeatedly, clone the request to preserve the original request body
  let tempConfig: { apiUrl: string; apiKey: string } | null = null;
  let requestBody: Record<string, unknown> | null = null;

  if (req.method === 'POST') {
    try {
      // clone request to avoid consuming original request body
      const clonedReq = req.clone();
      const body = await clonedReq.json();
      requestBody = body; // Save parsed request body

      if (
        body._temp_config &&
        body._temp_config.apiUrl &&
        body._temp_config.apiKey
      ) {
        tempConfig = body._temp_config;

        // Remove temporary configuration fields to avoid passing to Dify API
        requestBody = body;
      }
    } catch {
      // if parsing the request body fails, continue using normal process
      requestBody = null;
    }
  }

  // validate slug to prevent constructing invalid target URLs
  if (!slug || slug.length === 0) {
    console.error(
      `[App: ${appId}] [${req.method}] Invalid request: Slug path is missing.`
    );
    const baseResponse = new Response(
      JSON.stringify({ error: 'Invalid request: slug path is missing.' }),
      {
        status: 400,
        headers: createMinimalHeaders('application/json'), // use helper function
      }
    );

    return baseResponse;
  }

  // 1. Get Dify app configuration
  // use temporary configuration (form synchronization) first, otherwise get from database
  let difyApiKey: string;
  let difyApiUrl: string;
  let difyConfig: DifyAppConfig | null = null;

  if (tempConfig) {
    // use temporary configuration
    difyApiKey = tempConfig.apiKey;
    difyApiUrl = tempConfig.apiUrl;
  } else {
    // get configuration from database
    difyConfig = await getDifyAppConfig(appId);

    // validate database configuration
    if (!difyConfig) {
      console.error(`[App: ${appId}] [${req.method}] Configuration not found.`);
      // return 400 Bad Request, indicating that the provided appId is invalid or not configured
      const baseResponse = NextResponse.json(
        { error: `Configuration for Dify app '${appId}' not found.` },
        { status: 400 }
      );

      return baseResponse;
    }

    difyApiKey = difyConfig.apiKey;
    difyApiUrl = difyConfig.apiUrl;
  }

  // check if the obtained key and url are valid again
  if (!difyApiKey || !difyApiUrl) {
    console.error(
      `[App: ${appId}] [${req.method}] Invalid configuration loaded (missing key or URL).`
    );
    // return 500 Internal Server Error, indicating server-side configuration issues
    const baseResponse = NextResponse.json(
      { error: `Server configuration error for app '${appId}'.` },
      { status: 500 }
    );

    return baseResponse;
  }

  try {
    // construct target Dify URL
    const slugPath = adjustApiPathByAppType(slug, difyConfig?.appType);
    const targetUrl = `${difyApiUrl}/${slugPath}${req.nextUrl.search}`;

    // prepare forwarding request headers
    const headers = new Headers();
    // only copy necessary request headers
    if (req.headers.get('Content-Type')) {
      headers.set('Content-Type', req.headers.get('Content-Type')!);
    }
    if (req.headers.get('Accept')) {
      headers.set('Accept', req.headers.get('Accept')!);
    }
    // add Dify authentication header
    headers.set('Authorization', `Bearer ${difyApiKey}`);
    // add other fixed request headers as needed

    // execute fetch request forwarding
    // prepare request body and headers, handle special cases
    let finalBody: BodyInit | null = null;

    // handle request body: use previously parsed and cleaned request body
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (tempConfig) {
        // when using temporary configuration, the request body should be empty (because these are info/parameters query requests)
        finalBody = null;
      } else if (requestBody !== null) {
        // use previously parsed request body
        finalBody = JSON.stringify(requestBody);
      } else {
        // if no request body has been parsed, use the original request body
        finalBody = req.body;
      }
    }

    const finalHeaders = new Headers(headers);
    const originalContentType = req.headers.get('Content-Type');

    // special handling for multipart/form-data requests (file upload and audio-to-text)
    if (
      (slugPath === 'files/upload' || slugPath === 'audio-to-text') &&
      originalContentType?.includes('multipart/form-data')
    ) {
      try {
        // parse form data
        const formData = await req.formData();
        finalBody = formData;
        // important: remove Content-Type, let fetch automatically set multipart/form-data with correct boundary
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

    // prepare fetch options
    // temporary configuration requests should use GET method to call Dify API
    const actualMethod = tempConfig ? 'GET' : req.method;

    const fetchOptions: RequestInit & { duplex: 'half' } = {
      method: actualMethod,
      headers: finalHeaders,
      body: finalBody,
      redirect: 'manual',
      cache: 'no-store',
      // [important] add duplex option and use type assertion to solve TS(2769)
      duplex: 'half',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await fetch(targetUrl, fetchOptions as any);

    // handle successful 204 No Content responses directly
    if (response.status === 204) {
      // forward 204 status and necessary response headers, ensure body is null
      // clone headers to forward
      const headersToForward = new Headers();
      response.headers.forEach((value, key) => {
        // avoid forwarding headers meaningless or invalid for 204, such as content-length, content-type
        if (
          !['content-length', 'content-type', 'transfer-encoding'].includes(
            key.toLowerCase()
          )
        ) {
          headersToForward.set(key, value);
        }
      });

      // return 204 response, body must be null, middleware will automatically add CORS headers
      const baseResponse = new Response(null, {
        status: 204,
        statusText: 'No Content',
        headers: headersToForward,
      });

      return baseResponse;
    }

    // handle and forward Dify'
    if (response.ok && response.body) {
      const responseContentType = response.headers.get('content-type');

      // handle streaming responses (SSE) - use manual read/write for enhanced robustness
      if (responseContentType?.includes('text/event-stream')) {
        // keep SSE headers returned by Dify, and supplement our standard CORS headers
        const sseHeaders = createMinimalHeaders(); // start with minimal CORS headers
        response.headers.forEach((value, key) => {
          // copy essential SSE headers from Dify response
          if (
            key.toLowerCase() === 'content-type' ||
            key.toLowerCase() === 'cache-control' ||
            key.toLowerCase() === 'connection'
          ) {
            sseHeaders.set(key, value);
          }
        });

        // create a new readable stream, used to manually push data blocks to the client
        const stream = new ReadableStream({
          async start(controller) {
            const reader = response.body!.getReader(); // ensure response.body exists

            // handle client disconnection
            req.signal.addEventListener('abort', () => {
              reader.cancel('Client disconnected');
              // note: controller may already be closed, trying to close here may cause an error, but is usually harmless
              try {
                controller.close();
              } catch {
                /* Ignore */
              }
            });

            try {
              while (true) {
                // check if the client has disconnected
                if (req.signal.aborted) {
                  // no need to manually cancel reader, cancel in addEventListener will handle it
                  break;
                }

                const { done, value } = await reader.read();

                if (done) {
                  break; // dify stream finished, exit loop
                }

                // push the data block read from Dify to the stream we created
                controller.enqueue(value);
              }
            } catch (error) {
              // if an error occurs while reading the Dify stream (e.g. Dify server disconnected)
              console.error(
                `[App: ${appId}] [${req.method}] SSE Stream: Error reading from Dify stream:`,
                error
              );
              // trigger an error on the stream we created, notify downstream consumers
              controller.error(error);
            } finally {
              // ensure the controller is closed regardless (if not already closed or errored)
              try {
                controller.close();
              } catch {
                /* Ignore if already closed or errored */
              }
              // ensure reader is released (cancel will also release the lock, this is a double check)
              // reader.releaseLock(); // reader will automatically release after done=true or error
            }
          },
          cancel() {
            // if the stream we created is cancelled (e.g. cancel() is called on the Response object)
            // if needed, additional cleanup logic can be added here.
          },
        });

        // return the response containing the stream we manually created, middleware will automatically add CORS headers
        const baseResponse = new Response(stream, {
          status: response.status,
          statusText: response.statusText,
          headers: sseHeaders,
        });

        return baseResponse;
      }

      // Try to handle as media response (audio, video, PDF, image) using centralized handler
      else {
        const mediaResponse = MediaResponseHandler.handleMediaResponse(
          response,
          appId,
          req.method
        );

        if (mediaResponse) {
          return mediaResponse;
        }

        // handle regular response (mainly JSON or Text) - fallback when not a media type
        // handle non-streaming response
        const responseData = await response.text();
        try {
          const jsonData = JSON.parse(responseData);
          // use minimal header helper
          const baseResponse = new Response(JSON.stringify(jsonData), {
            status: response.status,
            statusText: response.statusText,
            headers: createMinimalHeaders('application/json'), // use helper function
          });

          return baseResponse;
        } catch {
          // not JSON, return text
          // use minimal header helper
          const originalDifyContentType =
            response.headers.get('content-type') || 'text/plain';
          const baseResponse = new Response(responseData, {
            status: response.status,
            statusText: response.statusText,
            headers: createMinimalHeaders(originalDifyContentType), // use helper function and pass original type
          });

          return baseResponse;
        }
      }
    } else {
      // handle cases with no response body or failure
      if (!response.body) {
        // Empty response body case
      }
      // try to read error information
      try {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          // use minimal header helper
          const baseResponse = new Response(JSON.stringify(errorJson), {
            status: response.status,
            statusText: response.statusText,
            headers: createMinimalHeaders('application/json'),
          });

          return baseResponse;
        } catch {
          // error response is not JSON, return text
          // use minimal header helper
          const originalDifyErrorContentType =
            response.headers.get('content-type') || 'text/plain';
          const baseResponse = new Response(errorText, {
            status: response.status,
            statusText: response.statusText,
            headers: createMinimalHeaders(originalDifyErrorContentType),
          });

          return baseResponse;
        }
      } catch {
        // if even reading the error response fails
        const finalErrorHeaders = createMinimalHeaders('application/json'); // use helper function
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
  } catch (error) {
    // catch errors in fetch or response processing
    const baseResponse = NextResponse.json(
      {
        error: `Failed to connect or process response from Dify service for app '${appId}' during ${req.method}.`,
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 } // 502 Bad Gateway
    );

    return baseResponse;
  }
}

// export corresponding HTTP method handler functions
// create handler functions that meet the requirements of Next.js 15 for each HTTP method

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

/**
 * Explicit OPTIONS handler
 * @description add explicit OPTIONS request handler to ensure CORS preflight requests respond correctly in various deployment environments
 */
export async function OPTIONS() {
  const baseResponse = new Response(null, {
    status: 204, // no content for preflight
    headers: createMinimalHeaders(),
  });

  return baseResponse;
}
