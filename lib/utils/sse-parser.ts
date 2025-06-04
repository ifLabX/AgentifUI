// --- BEGIN COMMENT ---
// lib/utils/sse-parser.ts
// 负责解析 Server-Sent Events (SSE) 流。
// 设计为通用的 SSE 解析器，但会特别处理 Dify API 返回的 JSON 数据格式。
// 参考 SSE 规范: https://html.spec.whatwg.org/multipage/server-sent-events.html#parsing-an-event-stream
// --- END COMMENT ---

import type { DifySseEvent } from '@lib/services/dify/types'; // 导入 Dify 事件类型用于类型推断

// --- BEGIN COMMENT ---
// 定义解析器可能产生的事件类型
// - 'event': 解析出一个完整的 SSE 事件 (包含 event, data, id 等)
// - 'error': 解析过程中发生错误
// --- END COMMENT ---
export type SseParserResult = 
  | { type: 'event'; event: DifySseEvent } // 成功解析一个 Dify 事件
  | { type: 'error'; error: any };

// --- BEGIN COMMENT ---
// 核心 SSE 解析函数
// 使用异步生成器 (AsyncGenerator) 来处理流式数据。
// 输入: ReadableStream (通常来自 fetch 响应的 response.body)
// 输出: 异步迭代地产生 SseParserResult 对象
// --- END COMMENT ---
export async function* parseSseStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<SseParserResult, void, undefined> {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = ''; // 用于存储可能跨越多个 chunk 的行数据
  let currentEvent = ''; // 当前事件类型 (event: 字段)
  let currentData = ''; // 当前事件的数据 (data: 字段，可能有多行)
  let currentId = ''; // 当前事件的 ID (id: 字段)

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // --- BEGIN COMMENT ---
        // 流结束时，处理缓冲区中可能剩余的最后一行数据
        // --- END COMMENT ---
        buffer += decoder.decode(undefined, { stream: false }); // 解码剩余部分
        if (buffer.trim()) {
          // --- BEGIN COMMENT ---
          // 处理最后可能不完整的行，并尝试分发事件
          // --- END COMMENT ---
          const lineResult = processLine(buffer.trim()); // 处理行数据
          if (lineResult) {
            yield lineResult; // 如果 processLine 直接触发了事件分发，则 yield
          } else {
              // 如果 processLine 没有触发分发（例如，最后一行不是空行），
              // 则需要显式调用 dispatchEvent 来处理缓冲区中剩余的数据
              const finalEventResult = dispatchEvent();
              if (finalEventResult) {
                  yield finalEventResult;
              }
          }
        }
        console.log('[SSE Parser] Stream finished.');
        break;
      }

      // --- BEGIN COMMENT ---
      // 将新获取的 chunk 解码并添加到缓冲区
      // --- END COMMENT ---
      buffer += decoder.decode(value, { stream: true });

      // --- BEGIN COMMENT ---
      // 按行处理缓冲区中的数据
      // --- END COMMENT ---
      let lineEndIndex;
      while ((lineEndIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.substring(0, lineEndIndex);
        buffer = buffer.substring(lineEndIndex + 1);
        // --- BEGIN COMMENT ---
        // 处理单行，如果 processLine 返回一个事件对象，则 yield 它
        // --- END COMMENT ---
        const result = processLine(line.trim());
        if (result) {
          yield result;
        }
      }
    }
  } catch (error) {
    console.error('[SSE Parser] Error reading or processing stream:', error);
    // --- BEGIN COMMENT ---
    // 这个 yield 在顶层 try...catch 中是合法的
    // --- END COMMENT ---
    yield { type: 'error', error: error }; // 发生读取错误时产生错误事件
  } finally {
    reader.releaseLock(); // 确保释放读取器锁
    console.log('[SSE Parser] Reader lock released.');
  }

  // --- 辅助函数：处理单行数据 --- 
  // --- BEGIN COMMENT ---
  // 返回 SseParserResult | undefined，表示是否需要分发事件
  // --- END COMMENT ---
  function processLine(line: string): SseParserResult | undefined {
    console.log(`[SSE Parser] 📥 处理行: "${line}"`);
    
    // --- BEGIN COMMENT ---
    // 忽略空行 (事件分隔符) 和注释行
    // --- END COMMENT ---
    if (line === '') {
      console.log(`[SSE Parser] 🔄 遇到空行，分发事件`);
      // --- BEGIN COMMENT ---
      // 空行表示事件结束，调用 dispatchEvent 并返回结果
      // --- END COMMENT ---
      return dispatchEvent();
    }
    if (line.startsWith(':')) {
      console.log(`[SSE Parser] 💬 忽略注释行`);
      // 忽略注释
      return undefined;
    }

    // --- BEGIN COMMENT ---
    // 解析字段名和值
    // --- END COMMENT ---
    let field = '';
    let value = '';
    const colonIndex = line.indexOf(':');

    if (colonIndex === 0) {
      // 行以冒号开头，这是注释，忽略
      console.log(`[SSE Parser] 💬 忽略冒号开头的注释行`);
      return undefined;
    } else if (colonIndex > 0) {
      // 标准的 "field: value" 格式
      field = line.substring(0, colonIndex);
      value = line.substring(colonIndex + 1).trimStart(); // 去掉值前面的空格
      console.log(`[SSE Parser] 🔍 解析字段 - ${field}: "${value.substring(0, 100)}${value.length > 100 ? '...' : ''}"`);
    } else {
      // 没有冒号，整行作为字段名，值为空 (符合 SSE 规范)
      field = line;
      value = '';
      console.log(`[SSE Parser] 🔍 解析字段 (无值) - ${field}`);
    }

    // --- BEGIN COMMENT ---
    // 根据字段名更新当前事件的状态
    // --- END COMMENT ---
    switch (field) {
      case 'event':
        currentEvent = value;
        console.log(`[SSE Parser] 🎯 设置事件类型: "${currentEvent}"`);
        break;
      case 'data':
        // --- BEGIN COMMENT ---
        // data 字段可能有多行，需要拼接，并在行之间加换行符
        // (虽然 Dify 的 JSON 通常在一行，但要兼容标准 SSE)
        // --- END COMMENT ---
        currentData += (currentData ? '\n' : '') + value;
        console.log(`[SSE Parser] 📄 累积数据，当前长度: ${currentData.length}`);
        break;
      case 'id':
        currentId = value;
        console.log(`[SSE Parser] 🆔 设置事件ID: "${currentId}"`);
        break;
      case 'retry':
        console.log(`[SSE Parser] ⏱️ 收到retry字段: ${value}`);
        // --- BEGIN COMMENT ---
        // 我们可以忽略 retry 字段，浏览器会自动处理
        // console.log('[SSE Parser] Retry timeout received:', value);
        // --- END COMMENT ---
        break;
      default:
        console.log(`[SSE Parser] ❓ 忽略未知字段: ${field}`);
        // --- BEGIN COMMENT ---
        // 忽略无法识别的字段
        // console.log('[SSE Parser] Ignoring unknown field:', field);
        // --- END COMMENT ---
        break;
    }

    // --- BEGIN COMMENT ---
    // 🎯 修复：不在处理字段时分发事件，只在遇到空行时分发
    // 这符合SSE规范：事件由空行分隔
    // --- END COMMENT ---
    return undefined;
  }

  // --- 辅助函数：分发解析出的事件 --- 
  // --- BEGIN COMMENT ---
  // 返回 SseParserResult | undefined，表示成功构造事件/错误或无事件
  // --- END COMMENT ---
  function dispatchEvent(): SseParserResult | undefined {
    // --- BEGIN COMMENT ---
    // 只有当 data 字段不为空时，才认为是一个有效的事件
    // (规范要求至少有一个字段才分发，但通常 data 是必须的)
    // --- END COMMENT ---
    if (currentData === '') {
      // 重置状态，准备下一个事件 (如果只有 event 或 id 而没有 data，则忽略)
      resetEventState();
      return undefined; // 没有事件可以分发
    }

    console.log(`[SSE Parser] 🔧 准备分发事件 - event: "${currentEvent}", data长度: ${currentData.length}`);

    let result: SseParserResult | undefined = undefined;
    try {
      // --- BEGIN COMMENT ---
      // 尝试将 data 解析为 JSON (Dify 的 data 是 JSON 字符串)
      // --- END COMMENT ---
      const jsonData = JSON.parse(currentData);
      console.log(`[SSE Parser] ✅ JSON解析成功 - 事件类型: ${jsonData.event || currentEvent || 'unknown'}`);

      // --- BEGIN COMMENT ---
      // 构造 DifySseEvent 对象。
      // 🎯 修复：优先使用JSON数据中的event字段，而不是SSE头部的event字段
      // 因为Dify的事件类型信息在JSON数据内部，SSE头部的event字段可能为空
      // --- END COMMENT ---
      const eventType = jsonData.event || currentEvent || 'message'; 
      const parsedEvent: DifySseEvent = {
        ...jsonData, // 将 JSON 数据解构进来
        event: eventType, // 确保 event 字段正确
        // --- BEGIN COMMENT ---
        // 如果 JSON 数据中没有 task_id 或 conversation_id (理论上 Dify 总会提供)，
        // 可以考虑添加默认值或抛出错误，但这取决于具体需求。
        // 这里假设 Dify 返回的数据结构总是符合 types.ts 中的定义。
        // id 字段也类似处理，如果 SSE 流中有 id: 字段，可以用 currentId 覆盖或补充。
        // --- END COMMENT ---
      } as DifySseEvent; // 使用类型断言，因为 jsonData 是 any

      // --- BEGIN COMMENT ---
      // 使用 yield 将解析出的事件对象传递出去
      // --- END COMMENT ---
      console.log(`[SSE Parser] 🎯 成功分发事件: ${parsedEvent.event}`);
      result = { type: 'event', event: parsedEvent };

    } catch (jsonError) {
      console.error('[SSE Parser] ❌ JSON解析失败:', jsonError, 'Data was:', currentData);
      // --- BEGIN COMMENT ---
      // 如果 data 无法解析为 JSON，构造一个错误事件对象返回
      // --- END COMMENT ---
      result = { type: 'error', error: jsonError };
    }

    // --- BEGIN COMMENT ---
    // 分发完一个事件后（无论成功或失败），重置状态以准备解析下一个事件
    // --- END COMMENT ---
    resetEventState();
    return result; // 返回构造的事件对象或错误对象
  }
  
  // --- 辅助函数：重置当前事件状态 --- 
  function resetEventState() {
      currentEvent = '';
      currentData = '';
      currentId = '';
  }
} 