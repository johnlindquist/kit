import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { xai } from '@ai-sdk/xai'
import { openrouter } from '@openrouter/ai-sdk-provider'
// Import AI SDK functions from our local wrapper for mocking
import * as aiSdk from 'ai';
// Import types directly from 'ai' or from our wrapper, direct is fine for types.
import type {
    CoreMessage, Tool, ToolCall, FinishReason, LanguageModel,
    GenerateTextResult, StreamTextResult, CoreAssistantMessage,
    LanguageModelV1,
    ToolCallPart
} from 'ai';
// Import zod types for TypeScript compilation (runtime uses global z)
import type { ZodTypeAny, infer as ZodInfer } from 'zod';

// Import globals to ensure z is available
import '../api/global.js';

// Type for supported AI providers
type AIProvider = 'openai' | 'anthropic' | 'google' | 'xai' | 'openrouter';

// ModelFactory type and PROVIDERS map
type ModelFactory = (id: string) => LanguageModelV1;
const PROVIDERS: Record<AIProvider, ModelFactory> = {
    openai: openai,
    anthropic: anthropic,
    google: google,
    xai: xai,
    openrouter: openrouter
};

// Cache environment variables at module load
const ENV_PROVIDER = (process.env.AI_DEFAULT_PROVIDER ?? 'openai') as AIProvider;
const ENV_MODEL = process.env.AI_DEFAULT_MODEL ?? 'gpt-4o';

// Function to resolve model based on provider and model string
export const resolveModel = (
    modelString?: string,
    explicitProvider?: AIProvider
): LanguageModelV1 => {
    if (!modelString) {
        return PROVIDERS[explicitProvider ?? ENV_PROVIDER](ENV_MODEL);
    }

    const prefixMatch = modelString.match(/^(\w+?):(.+)$/);
    if (prefixMatch) {
        const [, prov, id] = prefixMatch;
        // Ensure 'prov' is a valid AIProvider before indexing
        if (prov in PROVIDERS) {
            return PROVIDERS[prov as AIProvider](id);
        }
        // Fallback or error handling if provider from string is unknown
        console.warn(`Unknown provider prefix '${prov}' in model string. Falling back to default.`);
        return PROVIDERS[ENV_PROVIDER](id); // Or use ENV_MODEL if 'id' is not suitable alone
    }

    return PROVIDERS[explicitProvider ?? ENV_PROVIDER](modelString);
};

// Interface for injectable SDK functions for testability
interface InjectedSdk {
    generateText: typeof import('ai').generateText;
    streamText: typeof import('ai').streamText;
    generateObject: typeof import('ai').generateObject;
}

// Configuration system for dependency injection
interface AiConfig {
    sdk: InjectedSdk;
}

// Default configuration using the real AI SDK
let currentConfig: AiConfig = {
    sdk: aiSdk
};

// Configuration API for dependency injection (useful for testing and custom providers)
export const configure = (config: Partial<AiConfig>) => {
    currentConfig = { ...currentConfig, ...config };
};

// Reset configuration to defaults
export const resetConfig = () => {
    currentConfig = { sdk: aiSdk };
};

// Get current SDK instance
const getSdk = () => currentConfig.sdk;

interface AiOptions {
    model?: string | LanguageModel
    temperature?: number
    maxTokens?: number
    tools?: Record<string, Tool<any, any>>
    maxSteps?: number
    autoExecuteTools?: boolean // New option
}

// Define Tokens type (assuming similar to existing usage structure)
type Tokens = { promptTokens: number; completionTokens: number; totalTokens: number };

// Define AssistantOutcome
export type AssistantOutcome =
    | { kind: 'text'; text: string; usage?: Tokens }
    | { kind: 'toolCalls'; calls: ToolCallPart[]; usage?: Tokens } // Using ToolCallPart as per playbook item 6
    | { kind: 'error'; error: string; usage?: Tokens };

interface StreamResult {
    stream: AsyncGenerator<string, void, unknown>
    stop: () => void
    abortController: AbortController
}

// Comment out or remove old AssistantGenerateResult if it's fully replaced
// export interface AssistantGenerateResult {
//     text: string;
//     toolCalls?: ToolCall<string, any>[];
//     finishReason: FinishReason;
//     response?: GenerateTextResult<Record<string, Tool<any, any>>, string>['response'];
//     usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
// }

export interface AssistantLastInteraction {
    finishReason: FinishReason;
    toolCalls?: ToolCallPart[];
    textContent?: string;
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
    response?: GenerateTextResult<Record<string, Tool<any, any>>, string>['response'];
}

interface AssistantInstance {
    addUserMessage: (content: string | any[]) => void
    addSystemMessage: (content: string) => void
    addAssistantMessage: (text?: string, options?: { toolCalls?: ToolCallPart[]; parts?: CoreMessage['content'] }) => void
    addMessage: (message: CoreMessage) => void
    get textStream(): AsyncGenerator<string, void, unknown>
    stop: () => void
    generate: (abortSignal?: AbortSignal) => Promise<AssistantOutcome> // Updated return type
    messages: CoreMessage[]
    lastInteraction?: AssistantLastInteraction | null
    get autoExecuteTools(): boolean // Getter
    set autoExecuteTools(value: boolean) // Setter
}

// Define AssistantContent type for addAssistantMessage
type AssistantContent = {
    text?: string;             // plain text
    parts?: CoreMessage['content'];     // advanced parts (using CoreMessage['content'] for flexibility with string | Part[])
    toolCalls?: ToolCallPart[];// tool calls, using ToolCallPart for consistency
};

// Type for the generateObject function we'll add as global.generate
interface GlobalGenerate {
    <Schema extends ZodTypeAny>(
        promptOrMessages: string | CoreMessage[],
        schema: Schema,
        options?: Omit<AiOptions, 'tools' | 'maxSteps' | 'autoExecuteTools'>
    ): Promise<ZodInfer<Schema>>;
}

// Type for the generateObject function we'll add to global.ai
interface AiGenerateObject {
    <Schema extends ZodTypeAny>(
        promptOrMessages: string | CoreMessage[],
        schema: Schema,
        options?: Omit<AiOptions, 'tools' | 'maxSteps' | 'autoExecuteTools'>
    ): Promise<ZodInfer<Schema>>;
}

// Existing global.ai structure (function returning an input handler)
// Updated to reflect the new addAssistantMessage signature in the conceptual AiGlobalFull for casting
interface AiGlobalFull extends AiGlobal {
    assistant: (
        systemPrompt: string,
        options?: AiOptions
    ) => {
        addUserMessage: (content: string | any[]) => void;
        addSystemMessage: (content: string) => void;
        addAssistantMessage: (text?: string, options?: { toolCalls?: ToolCallPart[]; parts?: CoreMessage['content'] }) => void; // Updated signature here
        addMessage: (message: CoreMessage) => void;
        textStream: AsyncGenerator<string, void, unknown>;
        stop: () => void;
        generate: (abortSignal?: AbortSignal) => Promise<AssistantOutcome>;
        messages: CoreMessage[];
        lastInteraction?: AssistantLastInteraction | null;
        autoExecuteTools: boolean;
    };
}

interface AiGlobal {
    (systemPrompt: string, options?: Omit<AiOptions, 'autoExecuteTools'>): (input: string) => Promise<string>; // autoExecuteTools not relevant here
    object: AiGenerateObject;
}

// This is the actual function that creates the AI-powered input handler
const aiPoweredInputHandlerFactory = (systemPrompt: string, options: Omit<AiOptions, 'autoExecuteTools' | 'tools' | 'maxSteps'> = {}) => {
    const { model, temperature = Number(process.env.AI_DEFAULT_TEMPERATURE) || 0.7, maxTokens = Number(process.env.AI_DEFAULT_MAX_TOKENS) || 1000 } = options;
    const resolvedModel: LanguageModelV1 = typeof model === 'string' || typeof model === 'undefined'
        ? resolveModel(model)
        : model as LanguageModelV1;

    return async (input: string): Promise<string> => {
        try {
            const result = await getSdk().generateText<Record<string, Tool<any, any>>, string>({
                model: resolvedModel,
                temperature,
                maxTokens,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: input }
                ]
            });
            return result.text;
        } catch (error) {
            throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
};

// Re-assign to global.ai with the extended AiGlobal interface
global.ai = aiPoweredInputHandlerFactory as AiGlobal;

// Implementation for global.generate and global.ai.object
const generateObjectFunction = async <Schema extends ZodTypeAny>(
    promptOrMessages: string | CoreMessage[],
    schema: Schema,
    options: Omit<AiOptions, 'tools' | 'maxSteps' | 'autoExecuteTools'> = {}
): Promise<ZodInfer<Schema>> => {
    const { model, temperature, maxTokens } = options;
    const resolvedModel: LanguageModelV1 = typeof model === 'string' || typeof model === 'undefined'
        ? resolveModel(model)
        : model as LanguageModelV1;

    let messages: CoreMessage[];
    if (typeof promptOrMessages === 'string') {
        messages = [{ role: 'user', content: promptOrMessages }];
    } else {
        messages = promptOrMessages;
    }

    try {
        const { object } = await getSdk().generateObject<Schema>({
            model: resolvedModel,
            temperature,
            maxTokens,
            messages,
            schema,
            // mode, maxRetries, etc. could be added to options if needed
        });
        return object;
    } catch (error) {
        throw new Error(`AI object generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// Assign the global.generate function
global.generate = (promptOrMessages, schema, options) =>
    generateObjectFunction(promptOrMessages, schema, options);

// Assign the .object function to the existing global.ai for backward compatibility
if (global.ai) {
    (global.ai as AiGlobal).object = (promptOrMessages, schema, options) =>
        generateObjectFunction(promptOrMessages, schema, options);
}

// Internal function to create assistant instance
const createAssistantInstance = (systemPrompt: string, options: AiOptions = {}): AssistantInstance => {
    const sdk = getSdk();
    const resolvedModelOption = options.model;
    const resolvedModel: LanguageModelV1 = typeof resolvedModelOption === 'string' || typeof resolvedModelOption === 'undefined'
        ? resolveModel(resolvedModelOption)
        : resolvedModelOption as LanguageModelV1;

    const {
        temperature = 0.7,
        maxTokens = 1000,
        tools: providedTools,
        maxSteps = 3,
        autoExecuteTools: initialAutoExecuteTools = true // Default to true
    } = options;

    const _definedTools = providedTools;
    let _autoExecuteTools = initialAutoExecuteTools;

    const messages: CoreMessage[] = [
        { role: 'system', content: systemPrompt }
    ]

    let _abortController: AbortController | null = null;
    let lastInteractionData: AssistantLastInteraction | null = null;

    const addUserMessage = (content: string | any[]) => {
        messages.push({ role: 'user', content: typeof content === 'string' ? content : content })
    }

    const addSystemMessage = (content: string) => {
        messages.push({ role: 'system', content: content })
    }

    const addAssistantMessage = (text?: string, options?: { toolCalls?: ToolCallPart[]; parts?: CoreMessage['content'] }) => {
        const assistantMsg: CoreAssistantMessage = {
            role: 'assistant',
            content: "" // Placeholder, will be replaced
        };

        const hasOptions = options && ((options.toolCalls && options.toolCalls.length > 0) || (options.parts && (typeof options.parts === 'string' ? options.parts.length > 0 : options.parts.length > 0)));

        if (text !== undefined && !hasOptions) {
            assistantMsg.content = text;
        } else {
            const messageContentParts: any[] = [];
            if (text) {
                messageContentParts.push({ type: 'text', text: text });
            }

            if (options?.parts) {
                if (typeof options.parts === 'string') {
                    // Only add if 'text' wasn't the primary and this provides different content.
                    // This logic might be redundant if text is always pushed first.
                    // Consider if options.parts (string) should override or supplement 'text'.
                    // For now, if 'text' is present, it's the main text part.
                    // If 'text' is not present, then options.parts (string) can be the text.
                    if (!text && options.parts.length > 0) {
                        messageContentParts.push({ type: 'text', text: options.parts });
                    } else if (text && options.parts !== text && options.parts.length > 0) {
                        // This case is ambiguous: if text = "Hello" and options.parts = "World", what should happen?
                        // Current logic: parts (if string) is only used if text is not primary.
                        // To be safer, let's assume parts get added if they are actual content parts, not a redundant string.
                    }
                } else { // It's ContentPart[]
                    messageContentParts.push(...options.parts);
                }
            }

            if (options?.toolCalls && options.toolCalls.length > 0) {
                messageContentParts.push(...options.toolCalls);
            }
            assistantMsg.content = messageContentParts.filter(p => p != null);
        }
        messages.push(assistantMsg);
    }

    const addMessage = (message: CoreMessage) => {
        if (message.role === 'assistant') {
            let primaryText: string | undefined = undefined;
            const callOptions: { toolCalls?: ToolCallPart[]; parts?: CoreMessage['content'] } = {};
            let hasComplexParts = false;

            if (typeof message.content === 'string') {
                primaryText = message.content;
            } else if (Array.isArray(message.content)) {
                hasComplexParts = true; // Mark that content is definitely an array
                const toolCallPartsInContent = message.content.filter(part => part.type === 'tool-call') as ToolCallPart[];
                const otherParts = message.content.filter(part => part.type !== 'tool-call');

                // Attempt to find a primary text part if no simple string content was found first
                if (!primaryText && otherParts.length === 1 && otherParts[0].type === 'text') {
                    // If only one 'text' part remains after extracting tool calls, use its text as primaryText
                    // and don't put it in callOptions.parts to avoid duplication.
                    primaryText = (otherParts[0] as { type: 'text'; text: string }).text;
                } else if (otherParts.length > 0) {
                    callOptions.parts = otherParts;
                }

                if (toolCallPartsInContent.length > 0) {
                    callOptions.toolCalls = toolCallPartsInContent;
                }
            }

            // Legacy tool_calls property handling
            if ('tool_calls' in message && message.tool_calls && Array.isArray(message.tool_calls)) {
                hasComplexParts = true; // Presence of legacy tool_calls implies complex message
                const legacyToolCalls = message.tool_calls as ToolCall<string, any>[];
                const convertedLegacyToolCalls: ToolCallPart[] = legacyToolCalls.map(tc => ({
                    type: 'tool-call',
                    toolCallId: tc.toolCallId,
                    toolName: tc.toolName,
                    args: tc.args
                }));
                callOptions.toolCalls = [...(callOptions.toolCalls || []), ...convertedLegacyToolCalls];
            }

            // If primaryText is undefined after processing array content (e.g. content was `[]` or only tool_calls),
            // and the original message.content was actually an empty string, preserve that.
            if (primaryText === undefined && typeof message.content === 'string') {
                primaryText = message.content; // Handles case of message.content === ""
            }


            // Determine if options should be passed or if it's a simple text-only message
            const shouldPassOptions = (callOptions.parts && callOptions.parts.length > 0) ||
                (callOptions.toolCalls && callOptions.toolCalls.length > 0) ||
                (hasComplexParts && primaryText === undefined); // if original was array, and no text extracted, pass empty options

            addAssistantMessage(primaryText, shouldPassOptions ? callOptions : undefined);

        } else {
            messages.push(message);
        }
    }

    // Internal actual generation function without auto-execution logic
    const _internalGenerate = async (currentMessages: CoreMessage[], signal?: AbortSignal): Promise<GenerateTextResult<Record<string, Tool<any, any>>, string>> => {
        const generateOptions: any = {
            model: resolvedModel,
            temperature,
            maxTokens,
            messages: [...currentMessages], // Use a snapshot of messages for this attempt
            tools: _definedTools,
            abortSignal: signal,
        };

        // Only pass maxSteps when autoExecuteTools is true
        if (_autoExecuteTools) {
            generateOptions.maxSteps = maxSteps;
        }

        return sdk.generateText<Record<string, Tool<any, any>>, string>(generateOptions);
    };

    const generate = async (abortSignal?: AbortSignal): Promise<AssistantOutcome> => { // Updated return type
        stop(); // Abort any previous generation/stream
        _abortController = new AbortController();
        if (abortSignal) {
            linkSignals(abortSignal, _abortController); // Use linkSignals here
        }
        const currentSignal = _abortController.signal; // Define after potential linking

        try {
            let currentResult = await _internalGenerate(messages, currentSignal);
            let stepsRemaining = _autoExecuteTools && _definedTools ? maxSteps : 0;

            while (
                _autoExecuteTools &&
                _definedTools &&
                currentResult.toolCalls &&
                currentResult.toolCalls.length > 0 &&
                stepsRemaining > 0
            ) {
                if (currentSignal.aborted) {
                    throw new Error("Aborted during tool execution loop.");
                }

                // Updated call to addAssistantMessage
                const assistantContentForToolLoop: AssistantContent = {};
                if (currentResult.text) assistantContentForToolLoop.text = currentResult.text;
                if (currentResult.toolCalls && currentResult.toolCalls.length > 0) {
                    assistantContentForToolLoop.toolCalls = currentResult.toolCalls.map(tc => ({ type: 'tool-call', toolCallId: tc.toolCallId, toolName: tc.toolName, args: tc.args }));
                }
                addAssistantMessage(assistantContentForToolLoop.text, { toolCalls: assistantContentForToolLoop.toolCalls });

                const toolResultsContent: { type: 'tool-result'; toolCallId: string; toolName: string; result: any; }[] = [];

                for (const toolCall of currentResult.toolCalls) {
                    const toolDefinition = _definedTools[toolCall.toolName];
                    // Correctly type and construct toolContext
                    const toolContext = {
                        toolCallId: toolCall.toolCallId,
                        signal: currentSignal, // Pass along the abort signal
                        messages: [...messages] // Include messages in context (use the messages array from closure)
                    };

                    if (toolDefinition && typeof toolDefinition.execute === 'function') {
                        try {
                            const executionResult = await toolDefinition.execute(toolCall.args, toolContext);
                            toolResultsContent.push({
                                type: 'tool-result',
                                toolCallId: toolCall.toolCallId,
                                toolName: toolCall.toolName,
                                result: executionResult,
                            });
                        } catch (error) {
                            console.error(`Error executing tool ${toolCall.toolName}:`, error);
                            toolResultsContent.push({
                                type: 'tool-result',
                                toolCallId: toolCall.toolCallId,
                                toolName: toolCall.toolName,
                                result: { error: error instanceof Error ? error.message : "Tool execution failed" },
                            });
                        }
                    } else {
                        console.warn(`Tool ${toolCall.toolName} not found or not executable, skipping.`);
                        toolResultsContent.push({
                            type: 'tool-result',
                            toolCallId: toolCall.toolCallId,
                            toolName: toolCall.toolName,
                            result: { error: `Tool ${toolCall.toolName} not found or not executable.` },
                        });
                    }
                }

                if (toolResultsContent.length > 0) {
                    addMessage({ role: 'tool', content: toolResultsContent });
                }

                stepsRemaining--;
                if (currentSignal.aborted) throw new Error("Aborted after tool execution.");

                // Always generate after tool execution, but check if we have more steps for additional tool calls
                currentResult = await _internalGenerate(messages, currentSignal);

                // If steps are exhausted and the model still wants to call tools, break the loop
                if (stepsRemaining <= 0 && currentResult.toolCalls && currentResult.toolCalls.length > 0) {
                    console.warn("Max tool execution steps reached. Returning last intermediate result from LLM.");
                    break;
                }
            }

            // Final processing of the last result from _internalGenerate
            if (currentResult.finishReason === 'stop' && (!currentResult.toolCalls || currentResult.toolCalls.length === 0)) {
                // Only add assistant message if it's a final stop without further tool calls
                // If loop broke due to maxSteps, this might be an assistant message with tool_calls, already added.
                if (!messages.some(m => m.role === 'assistant' && m.content === currentResult.text)) {
                    // Avoid duplicate assistant messages if already added by tool loop
                    const lastMessage = messages[messages.length - 1];
                    // Check if the last message is the assistant's response that led to tool calls
                    // or if the currentResult is a new textual response after tool processing.
                    let shouldAddFinalAssistantMessage = true;
                    if (lastMessage.role === 'assistant' && lastMessage.content && Array.isArray(lastMessage.content)) {
                        const lastContent = lastMessage.content as any[];
                        if (lastContent.some(part => part.type === 'tool-call')) {
                            // If the last message was already the one with tool_calls, and currentResult is just that same message,
                            // don't add it again. This happens if maxSteps is reached.
                            if (currentResult.toolCalls && currentResult.toolCalls.length > 0) {
                                shouldAddFinalAssistantMessage = false;
                            }
                        }
                    }
                    if (shouldAddFinalAssistantMessage) {
                        // Updated call to addAssistantMessage
                        let textForFinalCall: string | undefined = currentResult.text;
                        let optionsForFinalCall: { toolCalls?: ToolCallPart[] } = {};
                        if (currentResult.toolCalls && currentResult.toolCalls.length > 0) {
                            optionsForFinalCall.toolCalls = currentResult.toolCalls.map(tc => ({ type: 'tool-call', toolCallId: tc.toolCallId, toolName: tc.toolName, args: tc.args }));
                        }
                        // Ensure text is not undefined if it's an empty string from result.text
                        if (currentResult.text === '') textForFinalCall = '';

                        addAssistantMessage(textForFinalCall, (Object.keys(optionsForFinalCall).length > 0 || textForFinalCall === undefined) ? optionsForFinalCall : undefined);
                    }
                }
            }

            lastInteractionData = {
                finishReason: currentResult.finishReason,
                toolCalls: currentResult.toolCalls && currentResult.toolCalls.length > 0
                    ? currentResult.toolCalls.map(tc => ({ type: 'tool-call', toolCallId: tc.toolCallId, toolName: tc.toolName, args: tc.args }))
                    : undefined,
                textContent: currentResult.text,
                usage: currentResult.usage,
                response: currentResult.response
            };
            _abortController = null; // Clear abort controller

            // Updated return logic based on finishReason
            if (currentResult.finishReason === 'stop') {
                return { kind: 'text', text: currentResult.text, usage: currentResult.usage };
            }
            if (currentResult.finishReason === 'tool-calls' && currentResult.toolCalls && currentResult.toolCalls.length > 0) {
                const tcParts: ToolCallPart[] = currentResult.toolCalls.map(tc => ({
                    type: 'tool-call',
                    toolCallId: tc.toolCallId,
                    toolName: tc.toolName,
                    args: tc.args,
                }));
                return { kind: 'toolCalls', calls: tcParts, usage: currentResult.usage };
            }
            // Handle other finishReasons as errors or specific kinds if needed
            const errorMessage = `Unknown or unhandled finish reason: ${currentResult.finishReason}`;
            console.warn(errorMessage, currentResult); // Log for debugging
            return { kind: 'error', error: errorMessage, usage: currentResult.usage };

        } catch (error) {
            if (_abortController && !_abortController.signal.aborted) {
                _abortController.abort(); // Ensure cleanup if not already aborted
            }
            _abortController = null; // Clear controller after operation finishes or is aborted
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (error instanceof Error && error.name === 'AbortError') {
                return { kind: 'error', error: 'Aborted' }; // Provide usage if available/relevant
            }
            lastInteractionData = null; // Clear last interaction on error
            // Ensure usage is passed if available, even in error cases
            // This part is tricky as currentResult might not be defined if error happens early
            // Consider how to best capture usage if an error occurs mid-process
            return { kind: 'error', error: `Assistant generation failed: ${errorMessage}` };
        } finally {
            // Ensure _abortController is nulled out AFTER its potential use in abort()
            const controllerToFinalize = _abortController;
            _abortController = null; // Nullify the instance variable first
            if (controllerToFinalize && !controllerToFinalize.signal.aborted) {
                controllerToFinalize.abort(); // Ensure cleanup of linked signals
            }
        }
    };

    const stop = () => {
        if (_abortController) {
            _abortController.abort();
            _abortController = null;
        }
    };

    // textStream needs to be updated if it's to support autoExecuteTools as well.
    // For now, it will behave as before (no auto tool execution).
    // A similar loop logic would be needed inside its async generator if desired.
    function getStreamGenerator(): AsyncGenerator<string, void, unknown> {
        stop();
        _abortController = new AbortController();
        const currentAbortController = _abortController;

        return (async function* () {
            let streamResult: StreamTextResult<Record<string, Tool<any, any>>, string> | null = null;
            let fullResponseText = "";
            let streamedToolCalls: ToolCallPart[] = [];

            try {
                const streamOptions: any = {
                    model: resolvedModel,
                    temperature,
                    maxTokens,
                    messages: [...messages],
                    tools: _definedTools,
                    abortSignal: currentAbortController.signal
                };

                // For streaming, we don't auto-execute tools, so don't pass maxSteps
                // This avoids the "maxSteps must be at least 1" validation error

                streamResult = sdk.streamText<Record<string, Tool<any, any>>>(streamOptions);

                for await (const part of streamResult.fullStream) {
                    if (currentAbortController.signal.aborted) {
                        break;
                    }

                    switch (part.type) {
                        case 'text-delta':
                            fullResponseText += part.textDelta;
                            yield part.textDelta;
                            break;
                        case 'tool-call':
                            streamedToolCalls.push({ type: 'tool-call', toolCallId: part.toolCallId, toolName: part.toolName, args: part.args });
                            break;
                        case 'finish':
                            // Set lastInteractionData immediately when finish is received
                            lastInteractionData = {
                                finishReason: part.finishReason || 'stop',
                                toolCalls: streamedToolCalls.length > 0
                                    ? streamedToolCalls
                                    : undefined,
                                textContent: fullResponseText,
                                usage: part.usage,
                                response: undefined
                            };
                            break;
                    }
                }

                // Add assistant message after the stream completes
                if (_autoExecuteTools && _definedTools && streamedToolCalls.length > 0) {
                    // Updated call to addAssistantMessage
                    addAssistantMessage(fullResponseText || "", { toolCalls: streamedToolCalls });
                    console.warn("Streaming with autoExecuteTools=true encountered tool calls. Manual handling required.");
                } else {
                    // Always add assistant message for completed streams
                    // Updated call to addAssistantMessage
                    addAssistantMessage(
                        fullResponseText || "",
                        (streamedToolCalls.length > 0)
                            ? { toolCalls: streamedToolCalls }
                            : undefined
                    );
                }

                if (currentAbortController.signal.aborted && !lastInteractionData) {
                    lastInteractionData = {
                        finishReason: 'stop' as FinishReason,
                        toolCalls: streamedToolCalls.length > 0
                            ? streamedToolCalls
                            : undefined,
                        textContent: fullResponseText,
                        usage: undefined,
                        response: undefined
                    };
                }

            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    return;
                }
                if (!currentAbortController.signal.aborted) {
                    lastInteractionData = null;
                    throw new Error(`Assistant streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            } finally {
                // Ensure currentAbortController is nulled out AFTER its potential use in abort()
                // Also, only act on the controller relevant to this specific stream invocation.
                if (currentAbortController === _abortController) {
                    _abortController = null;
                }
                if (currentAbortController && !currentAbortController.signal.aborted) {
                    currentAbortController.abort(); // Ensure cleanup of linked signals
                }
            }
        })();
    }

    return {
        addUserMessage,
        addSystemMessage,
        addAssistantMessage,
        addMessage,
        generate,
        messages,
        stop,
        get textStream() {
            return getStreamGenerator();
        },
        get lastInteraction() {
            return lastInteractionData;
        },
        get autoExecuteTools() {
            return _autoExecuteTools;
        },
        set autoExecuteTools(value: boolean) {
            _autoExecuteTools = value;
        }
    };
};

// Assign the factory function to global.assistant
global.assistant = createAssistantInstance as AiGlobalFull['assistant'];

// Utility function to link AbortSignals
const linkSignals = (src: AbortSignal, dst: AbortController) => {
    const onAbort = () => dst.abort();
    src.addEventListener('abort', onAbort);
    // When the destination aborts (e.g. manually or due to its own timeout/logic),
    // we should remove the listener from the source to prevent memory leaks
    // and to stop dst.abort() being called again if src aborts later.
    dst.signal.addEventListener('abort', () =>
        src.removeEventListener('abort', onAbort)
    );
};

export { } 