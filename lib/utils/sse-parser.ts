// lib/utils/sse-parser.ts
// Responsible for parsing Server-Sent Events (SSE) streams.
// Designed as a general SSE parser, but with special handling for Dify API JSON event format.
// Reference SSE spec: https://html.spec.whatwg.org/multipage/server-sent-events.html#parsing-an-event-stream
import type { DifySseEvent } from '@lib/services/dify/types';

// Import Dify event type for type inference

// Define possible parser result types
// - 'event': Successfully parsed a complete SSE event (including event, data, id, etc.)
// - 'error': Error occurred during parsing
export type SseParserResult =
  | { type: 'event'; event: DifySseEvent } // Successfully parsed a Dify event
  | { type: 'error'; error: Error };

// Core SSE parsing function
// Uses an async generator (AsyncGenerator) to process streaming data.
// Input: ReadableStream (usually from fetch response.body)
// Output: Asynchronously yields SseParserResult objects
export async function* parseSseStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<SseParserResult, void, undefined> {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = ''; // Stores line data that may span multiple chunks
  let currentEvent = ''; // Current event type (event: field)
  let currentData = ''; // Current event data (data: field, may be multiline)
  let currentId = ''; // Current event ID (id: field)

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // When stream ends, process any remaining data in the buffer
        buffer += decoder.decode(undefined, { stream: false }); // Decode remaining part
        if (buffer.trim()) {
          // Handle the last possibly incomplete line and try to dispatch event
          const lineResult = processLine(buffer.trim());
          if (lineResult) {
            yield lineResult;
          } else {
            // If processLine did not trigger dispatch (e.g., last line is not empty),
            // explicitly call dispatchEvent to handle any remaining data in buffer
            const finalEventResult = dispatchEvent();
            if (finalEventResult) {
              yield finalEventResult;
            }
          }
        }
        console.log('[SSE Parser] Stream finished.');
        break;
      }

      // Decode new chunk and append to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process buffer line by line
      let lineEndIndex;
      while ((lineEndIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.substring(0, lineEndIndex);
        buffer = buffer.substring(lineEndIndex + 1);
        // Process single line, yield if processLine returns an event object
        const result = processLine(line.trim());
        if (result) {
          yield result;
        }
      }
    }
  } catch (error) {
    console.error('[SSE Parser] Error reading or processing stream:', error);
    // This yield is legal in the top-level try...catch
    yield { type: 'error', error: error as Error }; // Yield error event on read error
  } finally {
    reader.releaseLock(); // Ensure reader lock is released
    console.log('[SSE Parser] Reader lock released.');
  }

  // --- Helper function: process a single line ---
  // Returns SseParserResult | undefined, indicating whether to dispatch an event
  function processLine(line: string): SseParserResult | undefined {
    console.log(`[SSE Parser] 📥 Processing line: "${line}"`);

    // Ignore empty lines (event delimiter) and comment lines
    if (line === '') {
      console.log(`[SSE Parser] 🔄 Empty line encountered, dispatching event`);
      // Empty line indicates end of event, call dispatchEvent and return result
      return dispatchEvent();
    }
    if (line.startsWith(':')) {
      console.log(`[SSE Parser] 💬 Ignoring comment line`);
      // Ignore comment
      return undefined;
    }

    // Parse field name and value
    let field = '';
    let value = '';
    const colonIndex = line.indexOf(':');

    if (colonIndex === 0) {
      // Line starts with colon, this is a comment, ignore
      console.log(`[SSE Parser] 💬 Ignoring colon-prefixed comment line`);
      return undefined;
    } else if (colonIndex > 0) {
      // Standard "field: value" format
      field = line.substring(0, colonIndex);
      value = line.substring(colonIndex + 1).trimStart(); // Remove leading spaces from value
      console.log(
        `[SSE Parser] 🔍 Parsed field - ${field}: "${value.substring(0, 100)}${value.length > 100 ? '...' : ''}"`
      );
    } else {
      // No colon, entire line is field name, value is empty (per SSE spec)
      field = line;
      value = '';
      console.log(`[SSE Parser] 🔍 Parsed field (no value) - ${field}`);
    }

    // Update current event state based on field name
    switch (field) {
      case 'event':
        currentEvent = value;
        console.log(`[SSE Parser] 🎯 Set event type: "${currentEvent}"`);
        break;
      case 'data':
        // data field may be multiline, concatenate with newline between lines
        // (Dify JSON is usually single line, but standard SSE allows multiline)
        currentData += (currentData ? '\n' : '') + value;
        console.log(
          `[SSE Parser] 📄 Accumulating data, current length: ${currentData.length}`
        );
        break;
      case 'id':
        currentId = value;
        console.log(`[SSE Parser] 🆔 Set event ID: "${currentId}"`);
        break;
      case 'retry':
        console.log(`[SSE Parser] ⏱️ Received retry field: ${value}`);
        // We can ignore retry field, browser will handle it automatically
        break;
      default:
        console.log(`[SSE Parser] ❓ Ignoring unknown field: ${field}`);
        // Ignore unrecognized fields
        break;
    }

    // Do not dispatch event when processing fields, only dispatch on empty line
    // This follows SSE spec: events are delimited by empty lines
    return undefined;
  }

  // --- Helper function: dispatch parsed event ---
  // Returns SseParserResult | undefined, indicating success/error or no event
  function dispatchEvent(): SseParserResult | undefined {
    // Only treat as a valid event if data field is not empty
    // (Spec requires at least one field to dispatch, but data is usually required)
    if (currentData === '') {
      // Reset state, prepare for next event (ignore if only event or id without data)
      resetEventState();
      return undefined; // No event to dispatch
    }

    console.log(
      `[SSE Parser] 🔧 Preparing to dispatch event - event: "${currentEvent}", data length: ${currentData.length}`
    );

    let result: SseParserResult | undefined = undefined;
    try {
      // Try to parse data as JSON (Dify data is JSON string)
      const jsonData = JSON.parse(currentData);
      console.log(
        `[SSE Parser] ✅ JSON parse success - event type: ${jsonData.event || currentEvent || 'unknown'}`
      );

      // Build DifySseEvent object.
      // Prefer event field from JSON data over SSE header event field.
      // Because Dify event type info is inside JSON, SSE header event field may be empty.
      const eventType = jsonData.event || currentEvent || 'message';
      const parsedEvent: DifySseEvent = {
        ...jsonData, // Spread JSON data
        event: eventType, // Ensure event field is correct
        // If JSON data does not have task_id or conversation_id (Dify should always provide),
        // you may consider adding defaults or throwing error, depending on requirements.
        // Here we assume Dify returns data structure matching types.ts definition.
        // id field is similar, if SSE stream has id: field, can use currentId to override or supplement.
      } as DifySseEvent; // Use type assertion since jsonData is any

      // Yield the parsed event object
      console.log(
        `[SSE Parser] 🎯 Successfully dispatched event: ${parsedEvent.event}`
      );
      result = { type: 'event', event: parsedEvent };
    } catch (jsonError) {
      console.error(
        '[SSE Parser] ❌ JSON parse failed:',
        jsonError,
        'Data was:',
        currentData
      );
      // If data cannot be parsed as JSON, return an error event object
      result = { type: 'error', error: jsonError as Error };
    }

    // After dispatching an event (success or error), reset state for next event
    resetEventState();
    return result; // Return constructed event or error object
  }

  // --- Helper function: reset current event state ---
  function resetEventState() {
    currentEvent = '';
    currentData = '';
    currentId = '';
  }
}
