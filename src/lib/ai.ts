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

// Function to resolve model based on provider and model string
const resolveModel = (modelString?: string, providerOverride?: AIProvider): LanguageModelV1 => {
    // Use environment variables for defaults
    const defaultProvider = (process.env.AI_DEFAULT_PROVIDER as AIProvider) || 'openai';
    const defaultModel = process.env.AI_DEFAULT_MODEL || 'gpt-4o';

    // If no model string provided, use defaults
    if (!modelString) {
        const provider = providerOverride || defaultProvider;
        switch (provider) {
            case 'openai': return openai(defaultModel);
            case 'anthropic': return anthropic(defaultModel);
            case 'google': return google(defaultModel);
            case 'xai': return xai(defaultModel);
            case 'openrouter': return openrouter(defaultModel);
            default: return openai(defaultModel);
        }
    }

    // Check if model string contains provider prefix (e.g., "anthropic:claude-3-5-sonnet-latest")
    const providerMatch = modelString.match(/^(openai|anthropic|google|xai|openrouter):(.+)$/);

    if (providerMatch) {
        const [, provider, model] = providerMatch;
        switch (provider as AIProvider) {
            case 'openai': return openai(model);
            case 'anthropic': return anthropic(model);
            case 'google': return google(model);
            case 'xai': return xai(model);
            case 'openrouter': return openrouter(model);
            default: return openai(model);
        }
    }

    // Use provider override or default provider
    const provider = providerOverride || defaultProvider;
    switch (provider) {
        case 'openai': return openai(modelString);
        case 'anthropic': return anthropic(modelString);
        case 'google': return google(modelString);
        case 'xai': return xai(modelString);
        case 'openrouter': return openrouter(modelString);
        default: return openai(modelString);
    }
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

interface StreamResult {
    stream: AsyncGenerator<string, void, unknown>
    stop: () => void
    abortController: AbortController
}

export interface AssistantGenerateResult {
    text: string;
    toolCalls?: ToolCall<string, any>[];
    finishReason: FinishReason;
    response?: GenerateTextResult<Record<string, Tool<any, any>>, string>['response'];
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface AssistantLastInteraction {
    finishReason: FinishReason;
    toolCalls?: ToolCall<string, any>[];
    textContent?: string;
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
    response?: GenerateTextResult<Record<string, Tool<any, any>>, string>['response'];
}

interface AssistantInstance {
    addUserMessage: (content: string | any[]) => void
    addSystemMessage: (content: string) => void
    addAssistantMessage: (content: string | any[], toolCalls?: ToolCall<string, any>[]) => void
    addMessage: (message: CoreMessage) => void
    get textStream(): AsyncGenerator<string, void, unknown>
    stop: () => void
    generate: (abortSignal?: AbortSignal) => Promise<AssistantGenerateResult>
    messages: CoreMessage[]
    lastInteraction?: AssistantLastInteraction | null
    get autoExecuteTools(): boolean // Getter
    set autoExecuteTools(value: boolean) // Setter
}

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

    const addAssistantMessage = (content: string | any[], toolCalls?: ToolCall<string, any>[]) => {
        // If we have a simple string and no tool calls, use simple content format
        if (typeof content === 'string' && (!toolCalls || toolCalls.length === 0)) {
            messages.push({
                role: 'assistant',
                content: content
            });
            return;
        }

        // Otherwise, use the array-based content format
        const assistantMsg: CoreAssistantMessage = {
            role: 'assistant',
            content: [] // Initialize content as an array
        };

        // Handle textual content
        if (typeof content === 'string') {
            (assistantMsg.content as any[]).push({ type: 'text', text: content });
        } else {
            // If content is already an array (presumably of parts), add them
            (assistantMsg.content as any[]).push(...content);
        }

        // Handle tool calls
        if (toolCalls && toolCalls.length > 0) {
            const toolCallParts: ToolCallPart[] = toolCalls.map(tc => ({
                type: 'tool-call',
                toolCallId: tc.toolCallId,
                toolName: tc.toolName,
                args: tc.args,
            }));
            (assistantMsg.content as any[]).push(...toolCallParts);
        }

        messages.push(assistantMsg);
    }

    const addMessage = (message: CoreMessage) => {
        // Handle assistant messages with tool_calls property by converting them to the new format
        if (message.role === 'assistant' && 'tool_calls' in message && message.tool_calls) {
            addAssistantMessage(message.content, message.tool_calls as ToolCall<string, any>[]);
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

    const generate = async (abortSignal?: AbortSignal): Promise<AssistantGenerateResult> => {
        stop(); // Abort any previous generation/stream
        _abortController = new AbortController();
        const currentSignal = _abortController.signal;
        if (abortSignal) {
            const externalAbort = () => _abortController?.abort();
            abortSignal.addEventListener('abort', externalAbort);
            currentSignal.addEventListener('abort', () => abortSignal.removeEventListener('abort', externalAbort));
        }

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

                addAssistantMessage(currentResult.text || "", currentResult.toolCalls as ToolCall<string, any>[]);

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
                        addAssistantMessage(currentResult.text || "", currentResult.toolCalls as ToolCall<string, any>[] | undefined);
                    }
                }
            }

            lastInteractionData = {
                finishReason: currentResult.finishReason,
                toolCalls: currentResult.toolCalls && currentResult.toolCalls.length > 0
                    ? currentResult.toolCalls.map(tc => ({ toolCallId: tc.toolCallId, toolName: tc.toolName, args: tc.args }))
                    : undefined,
                textContent: currentResult.text,
                usage: currentResult.usage,
                response: currentResult.response
            };
            _abortController = null; // Clear abort controller

            return {
                text: currentResult.text,
                toolCalls: currentResult.toolCalls && currentResult.toolCalls.length > 0
                    ? currentResult.toolCalls.map(tc => ({ toolCallId: tc.toolCallId, toolName: tc.toolName, args: tc.args }))
                    : undefined,
                finishReason: currentResult.finishReason,
                response: currentResult.response,
                usage: currentResult.usage
            };

        } catch (error) {
            _abortController = null;
            if (error instanceof Error && error.name === 'AbortError') {
                throw error;
            }
            lastInteractionData = null;
            throw new Error(`Assistant generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            let streamedToolCalls: ToolCall<string, any>[] = [];

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
                            streamedToolCalls.push({ toolCallId: part.toolCallId, toolName: part.toolName, args: part.args });
                            break;
                        case 'finish':
                            // Set lastInteractionData immediately when finish is received
                            lastInteractionData = {
                                finishReason: part.finishReason || 'stop',
                                toolCalls: streamedToolCalls.length > 0
                                    ? streamedToolCalls.map(tc => ({ toolCallId: tc.toolCallId, toolName: tc.toolName, args: tc.args }))
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
                    addAssistantMessage(fullResponseText || "", streamedToolCalls);
                    console.warn("Streaming with autoExecuteTools=true encountered tool calls. Manual handling required.");
                } else {
                    // Always add assistant message for completed streams
                    addAssistantMessage(fullResponseText || "", streamedToolCalls.length > 0 ? streamedToolCalls : undefined);
                }

                if (currentAbortController.signal.aborted && !lastInteractionData) {
                    lastInteractionData = {
                        finishReason: 'stop' as FinishReason,
                        toolCalls: streamedToolCalls.length > 0
                            ? streamedToolCalls.map(tc => ({ toolCallId: tc.toolCallId, toolName: tc.toolName, args: tc.args }))
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
                if (currentAbortController === _abortController) _abortController = null;
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
global.assistant = createAssistantInstance;

export { } 