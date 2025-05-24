import {
    generateText as originalGenerateText,
    streamText as originalStreamText,
    generateObject as originalGenerateObject,
    // We can also re-export other necessities if ai.ts relies on them from this module,
    // but for now, focusing on the functions we need to mock.
} from 'ai';

import type {
    Tool,
    CoreMessage,
    LanguageModel,
    ToolCall,
    ToolResult,
    FinishReason,
    GenerateObjectResult
} from 'ai';

// These are exported as `let` so they can be replaced by sinon stubs in tests.
export let generateText = originalGenerateText;
export let streamText = originalStreamText;
export let generateObject = originalGenerateObject;

// Re-export types that might be convenient for ai.ts to get from here,
// or it can continue to import them directly from 'ai'.
export type {
    Tool,
    CoreMessage,
    LanguageModel,
    ToolCall,
    ToolResult,
    FinishReason,
    GenerateObjectResult
}; 