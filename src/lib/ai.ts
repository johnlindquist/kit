import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { xai } from '@ai-sdk/xai'
// import { openrouter } from '@openrouter/ai-sdk-provider' // TODO: Update when v5-compatible version is available
// Import AI SDK functions from our local wrapper for mocking
import * as aiSdk from 'ai';
// Import types directly from 'ai' or from our wrapper, direct is fine for types.
import type {
    CoreMessage, Tool, FinishReason, LanguageModel,
    GenerateTextResult, StreamTextResult, CoreAssistantMessage
} from 'ai';
// Import zod types for TypeScript compilation (runtime uses global z)
import type { ZodTypeAny, infer as ZodInfer } from 'zod';

// Import globals to ensure z is available
import '../api/global.js';
import { EventEmitter } from 'events';

// Define branded type for ToolCallId
export type ToolCallId = string & { readonly __brand: unique symbol };

// Redefine ToolCallPart with branded ToolCallId
export interface ToolCallPart {
    type: 'tool-call';
    toolCallId: ToolCallId;
    toolName: string;
    args: unknown;
}

// Observability events interface
export interface AiObservabilityEvents {
    'assistant:created': { systemPrompt: string; options: AiOptions };
    'assistant:generate:start': { messages: CoreMessage[]; options: any };
    'assistant:generate:complete': { result: AssistantOutcome; duration: number };
    'assistant:generate:error': { error: Error; duration: number };
    'assistant:tool:execute:start': { toolName: string; args: unknown; toolCallId: ToolCallId };
    'assistant:tool:execute:complete': { toolName: string; result: unknown; duration: number; toolCallId: ToolCallId };
    'assistant:tool:execute:error': { toolName: string; error: Error; duration: number; toolCallId: ToolCallId };
    'assistant:stream:start': { messages: CoreMessage[] };
    'assistant:stream:chunk': { chunk: string };
    'assistant:stream:complete': { fullText: string; duration: number };
    'assistant:stream:error': { error: Error; duration: number };
    'assistant:history:trimmed': { beforeCount: number; afterCount: number; maxHistory: number };
}

// Global event emitter for AI observability
export const aiObservability = new EventEmitter();

// Type for supported AI providers
type AIProvider = 'openai' | 'anthropic' | 'google' | 'xai'; // | 'openrouter'; // TODO: Re-enable when v5-compatible

// ModelFactory type and PROVIDERS map
type ModelFactory = (id: string) => LanguageModel;
const PROVIDERS: Record<AIProvider, ModelFactory> = {
    openai: openai,
    anthropic: anthropic,
    google: google,
    xai: xai,
    // openrouter: openrouter // TODO: Re-enable when v5-compatible
};

// Cache environment variables at module load
const ENV_PROVIDER = (process.env.KIT_AI_DEFAULT_PROVIDER ?? 'openai') as AIProvider;
const ENV_MODEL = process.env.KIT_AI_DEFAULT_MODEL ?? 'gpt-4o';

// Cache for prompted API keys during session
const apiKeyCache = new Map<string, boolean>();

// Helper function to get environment variable name for a provider
const getProviderEnvVar = (provider: AIProvider): string => {
    const envVars: Record<AIProvider, string> = {
        openai: 'OPENAI_API_KEY',
        anthropic: 'ANTHROPIC_API_KEY',
        google: 'GOOGLE_API_KEY',
        xai: 'XAI_API_KEY',
        // openrouter: 'OPENROUTER_API_KEY' // TODO: Re-enable when v5-compatible
    };
    return envVars[provider];
};

// Helper function to get provider URL for API key generation
const getProviderUrl = (provider: AIProvider): string => {
    const urls: Record<AIProvider, string> = {
        openai: 'https://platform.openai.com/api-keys',
        anthropic: 'https://console.anthropic.com/settings/keys',
        google: 'https://makersuite.google.com/app/apikey',
        xai: 'https://console.xai.com',
        // openrouter: 'https://openrouter.ai/keys' // TODO: Re-enable when v5-compatible
    };
    return urls[provider];
};

// Helper function to get provider-specific instructions
const getProviderInstructions = (provider: AIProvider): string => {
    const instructions: Record<AIProvider, string> = {
        openai: 'Create an API key in your OpenAI dashboard under API Keys',
        anthropic: 'Generate an API key in the Anthropic Console under Settings > Keys',
        google: 'Create an API key in Google AI Studio',
        xai: 'Get your API key from the xAI console',
        // openrouter: 'Create an API key at OpenRouter.ai/keys' // TODO: Re-enable when v5-compatible
    };
    return instructions[provider];
};

// Function to ensure API key exists for a provider
const ensureApiKey = async (provider: AIProvider): Promise<void> => {
    const envVarName = getProviderEnvVar(provider);

    // Skip if already prompted this session
    if (apiKeyCache.has(envVarName)) return;

    // Check if key exists
    const existingKey = process.env[envVarName];
    if (!existingKey) {
        // Prompt for the key
        const url = getProviderUrl(provider);
        await global.env(envVarName, {
            placeholder: `Enter your ${provider} API key`,
            secret: true,
            hint: `Get your API key from <a href="${url}">${url}</a>`,
            description: getProviderInstructions(provider)
        });
    }

    apiKeyCache.set(envVarName, true);
};

// Function to resolve model based on provider and model string
export const resolveModel = async (
    modelString?: string,
    explicitProvider?: AIProvider
): Promise<LanguageModel> => {
    // Determine which provider will be used
    let targetProvider: AIProvider;
    let modelId: string;

    if (!modelString) {
        targetProvider = explicitProvider ?? ENV_PROVIDER;
        modelId = ENV_MODEL;
    } else {
        const prefixMatch = modelString.match(/^(\w+?):(.+)$/);
        if (prefixMatch && prefixMatch[1] in PROVIDERS) {
            targetProvider = prefixMatch[1] as AIProvider;
            modelId = prefixMatch[2];
        } else {
            targetProvider = explicitProvider ?? ENV_PROVIDER;
            modelId = modelString;
        }
    }

    // Ensure API key exists before creating provider
    await ensureApiKey(targetProvider);

    // Create and return the model
    return PROVIDERS[targetProvider](modelId);
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
    maxOutputTokens?: number
    tools?: Record<string, Tool<any, any>>
    maxSteps?: number
    autoExecuteTools?: boolean // New option
    maxHistory?: number; // NEW maxHistory option
    streamingToolExecution?: boolean; // ALPHA: Enable tool execution during streaming
}

// Define Tokens type - in v5, usage might have different structure
type Tokens = { promptTokens?: number; completionTokens?: number; totalTokens?: number } | any;

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
    get maxHistory(): number // Getter for maxHistory
}

// Define AssistantContent type for addAssistantMessage
type AssistantContent = {
    text?: string;             // plain text
    parts?: CoreMessage['content'];     // advanced parts (using CoreMessage['content'] for flexibility with string | Part[])
    toolCalls?: ToolCallPart[];// tool calls, using ToolCallPart for consistency
};

// Type for the generateObject function we'll add as global.generate
type GlobalGenerate =
    <Schema extends ZodTypeAny>(
        promptOrMessages: string | CoreMessage[],
        schema: Schema,
        options?: Omit<AiOptions, 'tools' | 'maxSteps' | 'autoExecuteTools'>) => Promise<ZodInfer<Schema>>

// Type for the generateObject function we'll add to global.ai
type AiGenerateObject =
    <Schema extends ZodTypeAny>(
        promptOrMessages: string | CoreMessage[],
        schema: Schema,
        options?: Omit<AiOptions, 'tools' | 'maxSteps' | 'autoExecuteTools'>) => Promise<ZodInfer<Schema>>

// Existing global.ai structure (function returning an input handler)
// Updated to reflect the new addAssistantMessage signature in the conceptual AiGlobalFull for casting
interface AiGlobalFull extends AiGlobal {
    assistant: (
        systemPrompt: string,
        options?: AiOptions
    ) => AssistantInstance;
}

interface AiGlobal {
    (systemPrompt: string, options?: Omit<AiOptions, 'autoExecuteTools'>): (input: string) => Promise<string>; // autoExecuteTools not relevant here
    object: AiGenerateObject;
}

// This is the actual function that creates the AI-powered input handler
const aiPoweredInputHandlerFactory = (systemPrompt: string, options: Omit<AiOptions, 'autoExecuteTools' | 'tools' | 'maxSteps'> = {}) => {
    const { model, temperature = Number(process.env.KIT_AI_DEFAULT_TEMPERATURE) || 0.7, maxOutputTokens = Number(process.env.KIT_AI_DEFAULT_MAX_OUTPUT_TOKENS) || 1000 } = options;

    return async (input: string): Promise<string> => {
        try {
            const resolvedModel: LanguageModel = typeof model === 'string' || typeof model === 'undefined'
                ? await resolveModel(model)
                : model as LanguageModel;

            const result = await getSdk().generateText<Record<string, Tool<any, any>>, string>({
                model: resolvedModel,
                temperature,
                maxOutputTokens,
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
    const { model, temperature, maxOutputTokens } = options;
    const resolvedModel: LanguageModel = typeof model === 'string' || typeof model === 'undefined'
        ? await resolveModel(model)
        : model as LanguageModel;

    let messages: CoreMessage[];
    if (typeof promptOrMessages === 'string') {
        messages = [{ role: 'user', content: promptOrMessages }];
    } else {
        messages = promptOrMessages;
    }

    try {
        const { object } = await getSdk().generateObject({
            model: resolvedModel,
            temperature,
            maxOutputTokens,
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
    // Emit observability event for assistant creation
    aiObservability.emit('assistant:created', { systemPrompt, options });

    const sdk = getSdk();
    const resolvedModelOption = options.model;

    // Create a lazy-loaded model resolver
    let resolvedModelPromise: Promise<LanguageModel> | null = null;
    const getResolvedModel = async (): Promise<LanguageModel> => {
        if (!resolvedModelPromise) {
            resolvedModelPromise = typeof resolvedModelOption === 'string' || typeof resolvedModelOption === 'undefined'
                ? resolveModel(resolvedModelOption)
                : Promise.resolve(resolvedModelOption as LanguageModel);
        }
        return resolvedModelPromise;
    };

    const {
        temperature = Number(process.env.KIT_AI_DEFAULT_TEMPERATURE) || 0.7,
        maxOutputTokens = Number(process.env.KIT_AI_DEFAULT_MAX_OUTPUT_TOKENS) || 1000,
        tools: providedTools,
        maxSteps = 3,
        autoExecuteTools: initialAutoExecuteTools = true, // Default to true
        maxHistory,
        streamingToolExecution = false // ALPHA feature, defaults to false
    } = options;

    const _definedTools = providedTools;
    let _autoExecuteTools = initialAutoExecuteTools;
    const _maxHistory = options.maxHistory ?? 50;
    const _streamingToolExecution = streamingToolExecution;

    const messages: CoreMessage[] = [
        { role: 'system', content: systemPrompt }
    ]

    let _abortController: AbortController | null = null;
    let lastInteractionData: AssistantLastInteraction | null = null;

    const addUserMessage = (content: string | any[]) => {
        messages.push({ role: 'user', content: typeof content === 'string' ? content : content })
        trimHistory(); // Call trim after adding
    }

    const addSystemMessage = (content: string) => {
        messages.push({ role: 'system', content: content })
        trimHistory(); // Call trim after adding (though system messages aren't directly trimmed by current logic)
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
        trimHistory(); // Call trim after adding
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
                const legacyToolCalls = message.tool_calls as any[];
                const convertedLegacyToolCalls: ToolCallPart[] = legacyToolCalls.map(tc => ({
                    type: 'tool-call',
                    toolCallId: tc.toolCallId as ToolCallId,
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
        trimHistory(); // Call trim after adding any message type via addMessage
    }

    // Function to trim message history
    const trimHistory = () => {
        // We preserve the first message (system prompt) and trim pairs after that.
        // So, effective history length for user/assistant pairs is (messages.length - 1).
        // We want to keep _maxHistory pairs, which means (2 * _maxHistory) messages + 1 system message.
        // So, if messages.length > (2 * _maxHistory + 1), we trim.

        const beforeCount = messages.length;
        const targetLength = 2 * _maxHistory + 1;

        // Special case: if maxHistory is 0, keep only the system message
        if (_maxHistory === 0) {
            messages.splice(1); // Remove everything after the system message
            if (beforeCount !== messages.length) {
                aiObservability.emit('assistant:history:trimmed', { beforeCount, afterCount: messages.length, maxHistory: _maxHistory });
            }
            return;
        }

        // Normal case: remove oldest user/assistant pairs
        while (messages.length > targetLength && messages.length >= 3) { // Ensure at least 3 messages to trim a pair after system
            messages.splice(1, 2); // drop oldest user/assistant pair (indices 1 and 2)
        }

        // Emit observability event if trimming occurred
        if (beforeCount !== messages.length) {
            aiObservability.emit('assistant:history:trimmed', { beforeCount, afterCount: messages.length, maxHistory: _maxHistory });
        }
    };

    // Internal actual generation function without auto-execution logic
    const _internalGenerate = async (currentMessages: CoreMessage[], signal?: AbortSignal): Promise<GenerateTextResult<Record<string, Tool<any, any>>, string>> => {
        const model = await getResolvedModel();
        const generateOptions: any = {
            model,
            temperature,
            maxOutputTokens,
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
        const startTime = Date.now();

        stop(); // Abort any previous generation/stream
        _abortController = new AbortController();
        if (abortSignal) {
            linkSignals(abortSignal, _abortController); // Use linkSignals here
        }
        const currentSignal = _abortController.signal; // Define after potential linking

        // Emit observability event for generation start
        aiObservability.emit('assistant:generate:start', { messages: [...messages], options: { autoExecuteTools: _autoExecuteTools, maxSteps } });

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
                    assistantContentForToolLoop.toolCalls = currentResult.toolCalls.map(tc => ({ type: 'tool-call', toolCallId: tc.toolCallId as ToolCallId, toolName: tc.toolName, args: tc.args }));
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
                        const toolStartTime = Date.now();

                        // Emit tool execution start event
                        aiObservability.emit('assistant:tool:execute:start', {
                            toolName: toolCall.toolName,
                            args: toolCall.args,
                            toolCallId: toolCall.toolCallId as ToolCallId
                        });

                        try {
                            const executionResult = await toolDefinition.execute(toolCall.args, toolContext);
                            const toolDuration = Date.now() - toolStartTime;

                            // Emit tool execution success event
                            aiObservability.emit('assistant:tool:execute:complete', {
                                toolName: toolCall.toolName,
                                result: executionResult,
                                duration: toolDuration,
                                toolCallId: toolCall.toolCallId as ToolCallId
                            });

                            toolResultsContent.push({
                                type: 'tool-result',
                                toolCallId: toolCall.toolCallId,
                                toolName: toolCall.toolName,
                                result: executionResult,
                            });
                        } catch (error) {
                            const toolDuration = Date.now() - toolStartTime;
                            const toolError = error instanceof Error ? error : new Error("Tool execution failed");

                            // Emit tool execution error event
                            aiObservability.emit('assistant:tool:execute:error', {
                                toolName: toolCall.toolName,
                                error: toolError,
                                duration: toolDuration,
                                toolCallId: toolCall.toolCallId as ToolCallId
                            });

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
            // Add the final assistant response to message history only for 'stop' finish reason
            // For tool-calls with autoExecuteTools=false, we don't add to history as the caller should handle tool calls
            if (currentResult.finishReason === 'stop' && currentResult.text) {
                addAssistantMessage(currentResult.text);
            }

            lastInteractionData = {
                finishReason: currentResult.finishReason,
                toolCalls: currentResult.toolCalls && currentResult.toolCalls.length > 0
                    ? currentResult.toolCalls.map(tc => ({ type: 'tool-call', toolCallId: tc.toolCallId as ToolCallId, toolName: tc.toolName, args: tc.args }))
                    : undefined,
                textContent: currentResult.text,
                usage: currentResult.usage as Tokens,
                response: currentResult.response
            };
            _abortController = null; // Clear abort controller

            // Updated return logic based on finishReason
            let result: AssistantOutcome;
            if (currentResult.finishReason === 'stop') {
                result = { kind: 'text', text: currentResult.text, usage: currentResult.usage as Tokens };
            } else if (currentResult.finishReason === 'tool-calls' && currentResult.toolCalls && currentResult.toolCalls.length > 0) {
                const tcParts: ToolCallPart[] = currentResult.toolCalls.map(tc => ({
                    type: 'tool-call',
                    toolCallId: tc.toolCallId as ToolCallId,
                    toolName: tc.toolName,
                    args: tc.args,
                }));
                result = { kind: 'toolCalls', calls: tcParts, usage: currentResult.usage as Tokens };
            } else {
                // Handle other finishReasons as errors or specific kinds if needed
                const errorMessage = `Unknown or unhandled finish reason: ${currentResult.finishReason}`;
                console.warn(errorMessage, currentResult); // Log for debugging
                result = { kind: 'error', error: errorMessage, usage: currentResult.usage as Tokens };
            }

            // Emit observability event for successful completion
            const duration = Date.now() - startTime;
            aiObservability.emit('assistant:generate:complete', { result, duration });

            return result;

        } catch (error) {
            if (_abortController && !_abortController.signal.aborted) {
                _abortController.abort(); // Ensure cleanup if not already aborted
            }
            _abortController = null; // Clear controller after operation finishes or is aborted
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Emit observability event for error
            const duration = Date.now() - startTime;
            const errorObj = error instanceof Error ? error : new Error(errorMessage);
            aiObservability.emit('assistant:generate:error', { error: errorObj, duration });

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

    // Enhanced textStream with optional tool execution support
    function getStreamGenerator(): AsyncGenerator<string, void, unknown> {
        const streamStartTime = Date.now();
        stop();
        _abortController = new AbortController();
        const currentAbortController = _abortController;

        return (async function* () {
            let streamResult: StreamTextResult<Record<string, Tool<any, any>>, string> | null = null;
            let fullResponseText = "";
            let streamedToolCalls: ToolCallPart[] = [];

            // Emit stream start event
            aiObservability.emit('assistant:stream:start', { messages: [...messages] });

            try {
                const model = await getResolvedModel();
                const streamOptions: any = {
                    model,
                    temperature,
                    maxOutputTokens,
                    messages: [...messages],
                    tools: _definedTools,
                    abortSignal: currentAbortController.signal
                };

                // For streaming, we don't auto-execute tools by default, so don't pass maxSteps
                // This avoids the "maxSteps must be at least 1" validation error
                // However, if streamingToolExecution is enabled, we can pass maxSteps
                if (_streamingToolExecution && _autoExecuteTools) {
                    streamOptions.maxSteps = maxSteps;
                }

                streamResult = sdk.streamText<Record<string, Tool<any, any>>>(streamOptions);

                for await (const part of streamResult.fullStream) {
                    if (currentAbortController.signal.aborted) {
                        break;
                    }

                    switch (part.type) {
                        case 'text':
                            fullResponseText += part.text;
                            // Emit chunk event for observability
                            aiObservability.emit('assistant:stream:chunk', { chunk: part.text });
                            yield part.text;
                            break;
                        case 'tool-call':
                            const toolCallPart: ToolCallPart = { type: 'tool-call', toolCallId: part.toolCallId as ToolCallId, toolName: part.toolName, args: part.args };
                            streamedToolCalls.push(toolCallPart);

                            // ALPHA: Execute tools during streaming if enabled
                            if (_streamingToolExecution && _autoExecuteTools && _definedTools) {
                                const toolDefinition = _definedTools[part.toolName];
                                if (toolDefinition && typeof toolDefinition.execute === 'function') {
                                    const toolStartTime = Date.now();

                                    // Emit tool execution start event
                                    aiObservability.emit('assistant:tool:execute:start', {
                                        toolName: part.toolName,
                                        args: part.args,
                                        toolCallId: part.toolCallId as ToolCallId
                                    });

                                    try {
                                        const toolContext = {
                                            toolCallId: part.toolCallId,
                                            signal: currentAbortController.signal,
                                            messages: [...messages]
                                        };

                                        const executionResult = await toolDefinition.execute(part.args, toolContext);
                                        const toolDuration = Date.now() - toolStartTime;

                                        // Emit tool execution success event
                                        aiObservability.emit('assistant:tool:execute:complete', {
                                            toolName: part.toolName,
                                            result: executionResult,
                                            duration: toolDuration,
                                            toolCallId: part.toolCallId as ToolCallId
                                        });

                                        // Yield a special marker for tool execution result
                                        yield `\n[Tool ${part.toolName} executed successfully]\n`;

                                    } catch (error) {
                                        const toolDuration = Date.now() - toolStartTime;
                                        const toolError = error instanceof Error ? error : new Error("Tool execution failed");

                                        // Emit tool execution error event
                                        aiObservability.emit('assistant:tool:execute:error', {
                                            toolName: part.toolName,
                                            error: toolError,
                                            duration: toolDuration,
                                            toolCallId: part.toolCallId as ToolCallId
                                        });

                                        // Yield error marker
                                        yield `\n[Tool ${part.toolName} failed: ${toolError.message}]\n`;
                                    }
                                }
                            }
                            break;
                        case 'finish':
                            // Set lastInteractionData immediately when finish is received
                            lastInteractionData = {
                                finishReason: part.finishReason || 'stop',
                                toolCalls: streamedToolCalls.length > 0
                                    ? streamedToolCalls
                                    : undefined,
                                textContent: fullResponseText,
                                usage: (part as any).totalUsage || (part as any).usage,
                                response: undefined
                            };
                            break;
                    }
                }

                // Add assistant message after the stream completes
                if (_autoExecuteTools && _definedTools && streamedToolCalls.length > 0) {
                    // Updated call to addAssistantMessage
                    addAssistantMessage(fullResponseText || "", { toolCalls: streamedToolCalls });
                    if (!_streamingToolExecution) {
                        console.warn("Streaming with autoExecuteTools=true encountered tool calls. Consider enabling streamingToolExecution for real-time tool execution.");
                    }
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

                // Emit stream completion event
                const streamDuration = Date.now() - streamStartTime;
                aiObservability.emit('assistant:stream:complete', { fullText: fullResponseText, duration: streamDuration });

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
                    // Emit stream error event
                    const streamDuration = Date.now() - streamStartTime;
                    const streamError = error instanceof Error ? error : new Error('Unknown streaming error');
                    aiObservability.emit('assistant:stream:error', { error: streamError, duration: streamDuration });

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
        },
        get maxHistory() {
            return _maxHistory;
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

// Utility function to convert MCP tools to AI SDK tools format
export const convertMCPToolsToAITools = (
    mcpTools: Record<string, any>,
    mcpClient?: { call: (toolName: string, args: any) => Promise<any> }
): Record<string, Tool<any, any>> => {
    const aiTools: Record<string, Tool<any, any>> = {};
    
    for (const [name, mcpTool] of Object.entries(mcpTools)) {
        aiTools[name] = {
            description: mcpTool.description || `MCP tool: ${name}`,
            parameters: mcpTool.inputSchema || z.object({}),
            execute: async (args: any, context: any) => {
                if (mcpClient) {
                    // Use the MCP client to call the tool
                    return await mcpClient.call(name, args);
                } else {
                    // Fallback: try to find global MCP instance
                    if (global.mcp && typeof global.mcp === 'function') {
                        throw new Error('MCP client instance required. Create an MCP client and pass it to convertMCPToolsToAITools.');
                    }
                    throw new Error('MCP client not available');
                }
            }
        };
    }
    
    return aiTools;
};

// Enhanced AiOptions to support MCP
export interface AiOptionsWithMCP extends AiOptions {
    mcpTools?: {
        tools: Record<string, any>;
        client: { call: (toolName: string, args: any) => Promise<any> };
    };
}

export { } 