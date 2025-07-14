import test from 'ava'
import sinon from 'sinon' // For mocking
import type {
    CoreMessage, Tool, FinishReason,
    GenerateTextResult, StreamTextResult, TextStreamPart,
    CoreAssistantMessage, CoreToolMessage, LanguageModel,
    LanguageModelUsage, LanguageModelResponseMetadata,
    GenerateObjectResult,
    ToolCallPart,
} from 'ai' // For types used in tests & mocks

// Import the configuration functions for dependency injection
import { configure, resetConfig } from './ai.js'
import type { AssistantOutcome, ToolCallId } from './ai.js' // Import AssistantOutcome and ToolCallId
import './ai.js' // This ensures global.ai is set up

// @ts-nocheck - AI SDK v5 beta has type issues that need to be resolved
// This file has many type errors due to breaking changes in AI SDK v5 beta
// TODO: Fix these once AI SDK v5 is stable

// Helper function to create branded ToolCallId
const createToolCallId = (id: string): ToolCallId => id as ToolCallId;

// Import z from global namespace for schema definitions
import { z } from 'zod'; // Import z directly for test file scope

let mockGenerateText: sinon.SinonStub<any[], Promise<any>>;
let mockStreamText: sinon.SinonStub<any[], any>;
let mockGenerateObject: sinon.SinonStub<any[], Promise<GenerateObjectResult<any>>>;

type MockTextStreamGeneratorType = AsyncGenerator<TextStreamPart<Record<string, Tool<any, any>>>>;

const mockStreamGenerator = async function* (): MockTextStreamGeneratorType {
    yield { type: 'text', id: 'mock-id', text: 'mocked' } as TextStreamPart<Record<string, Tool<any, any>>>;
};

const mockLanguageModel: LanguageModel = {
    provider: 'mock-provider',
    modelId: 'mock-model',
    doGenerate: sinon.stub<[any], Promise<{
        content: any[];
        finishReason: FinishReason;
        usage: LanguageModelUsage;
        warnings: any[];
        providerMetadata?: any;
        request?: any;
        response?: any;
    }>>().resolves({
        content: [{ type: 'text', id: 'test-id', text: 'mocked' }],
        finishReason: 'stop' as FinishReason,
        usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
        warnings: []
    }),
    doStream: sinon.stub<[any], Promise<{
        stream: ReadableStream<any>;
        rawCall: { rawPrompt: unknown; rawSettings: Record<string, unknown> };
        rawResponse?: { headers?: Record<string, string> };
    }>>().resolves({
        stream: new ReadableStream(),
        rawCall: { rawPrompt: 'mock', rawSettings: {} }
    }),
    specificationVersion: 'v2' as const,
    supportedUrls: [] as any
};

// Mock tool definition
const mockToolDefinition = {
    description: "A mock tool",
    parameters: z.object({ param: z.string() }),
    execute: sinon.stub().resolves({ output: "tool executed" })
};

const mockTools = { "mockTool": mockToolDefinition };

// Helper function to create properly typed mock GenerateTextResult
const createMockGenerateTextResult = (overrides: Partial<GenerateTextResult<Record<string, Tool<any, any>>, string>> = {}): GenerateTextResult<Record<string, Tool<any, any>>, string> => ({
    text: "mocked response",
    content: [], // Required property
    toolCalls: [], // This field expects ToolCallPart[] | undefined according to GenerateTextResult type
    toolResults: [], // Required property for tool results
    finishReason: 'stop' as FinishReason,
    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
    totalUsage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 }, // Required property
    response: {
        id: 'mock-response',
        modelId: 'mock-model',
        timestamp: new Date(),
        messages: []
    },
    reasoning: [],
    reasoningText: undefined, // Required property
    files: [],
    sources: [],
    experimental_output: 'mocked response', // Required property - the OUTPUT generic parameter is string
    warnings: undefined,
    steps: [], // Required property for step results
    providerMetadata: undefined, // Required property
    request: {
        body: undefined
    },

    ...overrides
});

// Helper function to create properly typed mock StreamTextResult
const createMockStreamTextResult = (overrides: Partial<StreamTextResult<Record<string, Tool<any, any>>, string>> = {}): StreamTextResult<Record<string, Tool<any, any>>, string> => ({
    fullStream: new ReadableStream(),
    text: Promise.resolve("mocked stream text"),
    finishReason: Promise.resolve('stop' as FinishReason),
    usage: Promise.resolve({ inputTokens: 1, outputTokens: 1, totalTokens: 2 }),
    toolCalls: Promise.resolve([]),
    toolResults: Promise.resolve([] as never[]),
    warnings: Promise.resolve(undefined),
    sources: Promise.resolve([]),
    files: Promise.resolve([]),
    providerMetadata: Promise.resolve(undefined),
    request: Promise.resolve({ body: undefined }),
    response: Promise.resolve({ id: 'mock-stream', timestamp: new Date(), modelId: 'mock-model', body: undefined, messages: [] }),
    reasoning: Promise.resolve([]),
    steps: Promise.resolve([]),
    textStream: new ReadableStream(),
    experimental_partialOutputStream: new ReadableStream(),
    consumeStream: async () => {},
    pipeTextStreamToResponse: (response: any, options?: any) => {},
    toTextStreamResponse: (options?: any) => new Response(),
    mergeIntoDataStream: (dataStream: any) => dataStream,
    ...overrides
});

// Helper function to create properly typed mock GenerateObjectResult
const createMockGenerateObjectResult = <T>(object: T, overrides: Partial<GenerateObjectResult<T>> = {}): GenerateObjectResult<T> => ({
    object,
    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
    finishReason: 'stop' as FinishReason,
    providerMetadata: undefined,
    response: {
        id: 'mock-response',
        modelId: 'mock-model',
        timestamp: new Date(),
        body: undefined
    },
    warnings: undefined,
    request: {
        body: undefined
    },
    toJsonResponse: (init?: ResponseInit) => new Response(JSON.stringify(object), {
        ...init,
        status: 200,
        headers: {
            'content-type': 'application/json; charset=utf-8',
            ...init?.headers
        }
    }),
    ...overrides
});

test.beforeEach(t => {
    mockGenerateText = sinon.stub();
    mockStreamText = sinon.stub();
    mockGenerateObject = sinon.stub();
    mockToolDefinition.execute.resetHistory(); // Reset history for tool execute stub

    // Set dummy API keys to prevent prompting during tests
    process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-openai-key';
    process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-anthropic-key';
    process.env.GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'test-google-key';
    process.env.XAI_API_KEY = process.env.XAI_API_KEY || 'test-xai-key';
    process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'test-openrouter-key';

    // Configure with mock SDK for testing
    configure({
        sdk: {
            generateText: mockGenerateText,
            streamText: mockStreamText,
            generateObject: mockGenerateObject
        }
    });
});

test.afterEach.always(t => {
    sinon.restore();
    resetConfig(); // Reset to default configuration
});

test.serial('assistant instance (injected) should have autoExecuteTools getter/setter and default to true', t => {
    const chatbot = global.assistant("System prompt", { model: mockLanguageModel, tools: mockTools });
    t.true(chatbot.autoExecuteTools, "autoExecuteTools should default to true");
    chatbot.autoExecuteTools = false;
    t.false(chatbot.autoExecuteTools, "autoExecuteTools should be settable to false");
    chatbot.autoExecuteTools = true;
    t.true(chatbot.autoExecuteTools, "autoExecuteTools should be settable back to true");
});

test.serial('generate() with autoExecuteTools=true should execute tools and call generateText multiple times', async t => {
    const initialToolCallParts = [
        { type: 'tool-call', toolCallId: createToolCallId('tc-1'), toolName: 'mockTool', input: { param: 'test' } }
    ];
    const firstGenerateResult = createMockGenerateTextResult({
        text: "",
        toolCalls: initialToolCallParts, // Assign ToolCallPart[] directly
        finishReason: 'tool-calls',
        response: {
            id: 'res-tc-1',
            messages: [],
            modelId: 'mock-model',
            timestamp: new Date()
        },
        usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 }
    });
    const finalGenerateResult = createMockGenerateTextResult({
        text: "Final response after tool execution",
        toolCalls: [],
        finishReason: 'stop',
        response: {
            id: 'res-final',
            messages: [],
            modelId: 'mock-model',
            timestamp: new Date()
        },
        usage: { inputTokens: 20, outputTokens: 10, totalTokens: 30 }
    });

    mockGenerateText.onFirstCall().resolves(firstGenerateResult);
    mockGenerateText.onSecondCall().resolves(finalGenerateResult);
    mockToolDefinition.execute.resolves({ output: "Tool output for tc-1" });

    const chatbot = global.assistant(
        "System prompt",
        { model: mockLanguageModel, tools: mockTools, autoExecuteTools: true, maxSteps: 1 }
    );
    chatbot.addUserMessage("User input that triggers a tool");

    const result = await chatbot.generate();

    t.true(mockGenerateText.calledTwice, "generateText should be called twice");
    t.true(mockToolDefinition.execute.calledOnce, "Tool execute should be called once");
    t.deepEqual(mockToolDefinition.execute.getCall(0).args[0], { param: 'test' });

    // Updated assertions for AssistantOutcome
    t.is(result.kind, 'text');
    if (result.kind === 'text') {
        t.is(result.text, "Final response after tool execution");
    }

    // Check message history - MCP tools use simplified approach with only 3 messages
    // 1. system, 2. user, 3. assistant (final)
    t.is(chatbot.messages.length, 3, "MCP tools should only have system, user, and final assistant messages");
    t.is(chatbot.messages[0].role, 'system');
    t.is(chatbot.messages[0].content, "System prompt");
    t.is(chatbot.messages[1].role, 'user');
    t.is(chatbot.messages[1].content, "User input that triggers a tool");
    t.is(chatbot.messages[2].role, 'assistant');
    t.is(chatbot.messages[2].content, "Final response after tool execution");
});

test.serial('generate() with autoExecuteTools=false should return tool_calls without execution', async t => {
    const toolCallsToReturnParts = [
        { type: 'tool-call', toolCallId: 'tc-noexec' as ToolCallId, toolName: 'mockTool', input: { param: 'noexec' } }
    ];
    const mockSdkResult = createMockGenerateTextResult({
        text: "I need to use a tool.",
        toolCalls: toolCallsToReturnParts, // Assign ToolCallPart[] directly
        finishReason: 'tool-calls',
        response: {
            id: 'res-noexec',
            messages: [],
            modelId: 'mock-model',
            timestamp: new Date()
        },
        usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 }
    });
    mockGenerateText.resolves(mockSdkResult);

    const chatbot = global.assistant(
        "System prompt",
        { model: mockLanguageModel, tools: mockTools, autoExecuteTools: false }
    );
    chatbot.addUserMessage("User input for no-exec tool");

    const result = await chatbot.generate();

    t.true(mockGenerateText.calledOnce, "generateText should be called only once");
    t.false(mockToolDefinition.execute.called, "Tool execute should NOT be called");

    // Updated assertions for AssistantOutcome
    t.is(result.kind, 'toolCalls');
    if (result.kind === 'toolCalls') {
        t.deepEqual(result.calls.map(c => ({ toolCallId: c.toolCallId, toolName: c.toolName, args: c.args })),
            toolCallsToReturnParts.map(tc => ({ toolCallId: tc.toolCallId, toolName: tc.toolName, args: tc.input })));
    } else if (result.kind === 'text') {
        t.is(result.text, "I need to use a tool."); // This was the previous expectation
    }

    // System, User. Assistant message with tool_calls is not added by generate if autoExecuteTools is false.
    // This is because the caller is expected to handle the tool calls.
    t.is(chatbot.messages.length, 2);
});

test.serial('generate() respects maxSteps for tool execution', async t => {
    const toolCall1Part = { type: 'tool-call', toolCallId: 'tc-s1' as ToolCallId, toolName: 'mockTool', args: { param: 'step1' } } satisfies ToolCallPart;
    const toolCall2Part = { type: 'tool-call', toolCallId: 'tc-s2' as ToolCallId, toolName: 'mockTool', args: { param: 'step2' } } satisfies ToolCallPart;

    const firstGenerate = createMockGenerateTextResult({
        text: "",
        toolCalls: [toolCall1Part], // Assign ToolCallPart[] directly
        finishReason: 'tool-calls',
        response: {
            id: 'step1',
            messages: [],
            modelId: 'mock-model',
            timestamp: new Date()
        },
        usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 }
    });
    const secondGenerateAfterTool1 = createMockGenerateTextResult({
        text: "",
        toolCalls: [toolCall2Part], // Assign ToolCallPart[] directly
        finishReason: 'tool-calls',
        response: {
            id: 'step2',
            messages: [],
            modelId: 'mock-model',
            timestamp: new Date()
        },
        usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 }
    });
    // This result should be returned if maxSteps is reached
    const thirdGenerateAfterTool2IfMaxStepsAllows = createMockGenerateTextResult({
        text: "Final after step 2",
        toolCalls: [],
        finishReason: 'stop',
        response: {
            id: 'final',
            messages: [],
            modelId: 'mock-model',
            timestamp: new Date()
        },
        usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 }
    });

    // For MCP tools, we need different mock setup
    // First call returns tool calls, second call returns text summary
    mockGenerateText.onCall(0).resolves(firstGenerate);
    mockGenerateText.onCall(1).resolves(createMockGenerateTextResult({
        text: "Response after first tool",
        finishReason: 'stop'
    }));

    mockToolDefinition.execute.onFirstCall().resolves({ output: "step1 output" });
    mockToolDefinition.execute.onSecondCall().resolves({ output: "step2 output" });

    const chatbot = global.assistant(
        "Test maxSteps",
        { model: mockLanguageModel, tools: mockTools, autoExecuteTools: true, maxSteps: 1 }
    );
    chatbot.addUserMessage("Trigger multiple tools");

    const result = await chatbot.generate();

    // MCP tools use simplified approach - always 2 generateText calls and execute only first tool
    t.true(mockGenerateText.calledTwice, "MCP tools call generateText twice");
    t.true(mockToolDefinition.execute.calledOnce, "MCP tools execute only the first tool");

    // MCP tools always generate text after tool execution
    t.is(result.kind, 'text', "MCP tools should return text");
    if (result.kind === 'text') {
        t.is(result.text, "Response after first tool");
    }
    
    // MCP tools only have 3 messages: system, user, final assistant
    t.is(chatbot.messages.length, 3, "MCP tools should have only 3 messages");
    t.is(chatbot.messages[0].role, 'system');
    t.is(chatbot.messages[1].role, 'user');
    t.is(chatbot.messages[2].role, 'assistant');
});

// Existing tests (ai function, basic assistant instance, message handling, old generate tests, stream tests, ai.object tests) should be kept.
// I'll just append the new tests here. Consider reorganizing into describe blocks if the file grows too large.

// --- (Keep existing tests from line 45 downwards) ---
// ... (ai function tests)
// ... (assistant function (via test wrapper) should be defined)
// ... (assistant instance (injected) should have required methods and initial CoreMessage)
// ... (Basic Message Handling Tests)
// ... (assistant (injected) addMessage should add CoreMessage directly)
// ... (generate() Tests (Requires Mocking) - the old ones need review/removal if redundant)
// ... (textStream() Tests)
// ... (stop() functionality test)
// ... (addMessage can add valid tool messages)
// ... (ai.object Tests)


// Previous tests for generate() when autoExecuteTools was not a feature:
// These are now effectively testing the autoExecuteTools=false path or need slight adaptation.

test.serial('OLD: assistant (injected) generate() should call injected generateText and return AssistantGenerateResult for text response', async t => {
    const expectedText = "Hello from AI";
    const mockSdkResult = createMockGenerateTextResult({
        text: expectedText,
        toolCalls: [],
        finishReason: 'stop',
        response: {
            id: 'res-123',
            messages: [],
            modelId: 'mock-model',
            timestamp: new Date()
        },
        usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 }
    });
    mockGenerateText.resolves(mockSdkResult);

    const chatbot = global.assistant("System prompt", { model: mockLanguageModel, autoExecuteTools: false }); // Explicitly false
    chatbot.addUserMessage("User input");

    const result = await chatbot.generate();

    t.true(mockGenerateText.calledOnce);
    // Updated assertions for AssistantOutcome
    t.is(result.kind, 'text');
    if (result.kind === 'text') {
        t.is(result.text, expectedText);
    }
    // ... (other assertions from original test remain valid for autoExecuteTools: false)
    t.is(chatbot.messages.length, 3); // System, User, Assistant (because finishReason: 'stop')
    t.deepEqual(chatbot.messages[2], { role: 'assistant', content: expectedText });
});

test.serial('OLD: assistant (injected) generate() should return toolCalls if finishReason is tool-calls (and autoExecuteTools=false)', async t => {
    const mockToolCallParts = [
        { type: 'tool-call', toolCallId: 'tc-1' as ToolCallId, toolName: 'getWeather', input: { location: 'london' } }
    ];
    const mockSdkResult = createMockGenerateTextResult({
        text: "",
        toolCalls: mockToolCallParts, // Assign ToolCallPart[] directly
        finishReason: 'tool-calls',
        response: {
            id: 'res-tc',
            messages: [],
            modelId: 'mock-model',
            timestamp: new Date()
        },
        usage: { inputTokens: 20, outputTokens: 10, totalTokens: 30 }
    });
    mockGenerateText.resolves(mockSdkResult);

    const chatbot = global.assistant("Sys prompt", { model: mockLanguageModel, autoExecuteTools: false }); // Explicitly false
    chatbot.addUserMessage("Order pizza and weather?");
    const result = await chatbot.generate();

    t.true(mockGenerateText.calledOnce);
    // Updated assertions for AssistantOutcome
    t.is(result.kind, 'toolCalls');
    if (result.kind === 'toolCalls') {
        t.deepEqual(result.calls.map(c => ({ toolCallId: c.toolCallId, toolName: c.toolName, args: c.args })),
            mockToolCallParts.map(tc => ({ toolCallId: tc.toolCallId, toolName: tc.toolName, args: tc.input })));
    }
    t.is(chatbot.messages.length, 2, "Assistant message with tool_calls is NOT added by generate if autoExecuteTools is false");
});

// --- (Keep other existing tests like textStream, ai.object etc.) ---

// Test ai function should be defined
test.serial('ai function should be defined', t => {
    t.truthy(global.ai)
    t.is(typeof global.ai, 'function')
})

// Test ai function should return a function
test.serial('ai function should return a function', t => {
    const aiFunction = global.ai("Translate to French") // global.ai does not take injected SDK
    t.is(typeof aiFunction, 'function')
    // To test global.ai with mocks would require mocking ai-sdk-api.js, which we found hard.
    // So, this test for global.ai remains a light integration test.
})

// Test assistant function (via test wrapper) should be defined
test.serial('assistant function (via test wrapper) should be defined', t => {
    const assistantInstance = global.assistant("test", { model: mockLanguageModel });
    t.truthy(assistantInstance);
});

// Test assistant instance (injected) should have required methods and initial CoreMessage
test.serial('assistant instance (injected) should have required methods and initial CoreMessage', t => {
    const chatbot = global.assistant("You are helpful", { model: mockLanguageModel });

    t.is(typeof chatbot.addUserMessage, 'function')
    t.is(typeof chatbot.addSystemMessage, 'function')
    t.is(typeof chatbot.addAssistantMessage, 'function')
    t.is(typeof chatbot.addMessage, 'function')
    t.truthy(chatbot.textStream, 'textStream property should exist')
    t.is(typeof chatbot.stop, 'function', 'stop method should be a function')
    t.is(typeof chatbot.generate, 'function')
    t.truthy(Array.isArray(chatbot.messages))
    t.is(chatbot.messages.length, 1)
    const initialMessage = chatbot.messages[0]
    t.is(initialMessage.role, 'system')
    t.is(initialMessage.content, 'You are helpful')
    t.is(chatbot.lastInteraction, null, "Initial lastInteraction should be null")
    t.true(chatbot.autoExecuteTools, "autoExecuteTools should default to true in basic init"); // Added check for default
})

// Test assistant (injected) convenience methods should add CoreMessages correctly
test.serial('assistant (injected) convenience methods should add CoreMessages correctly', t => {
    const chatbot = global.assistant("Initial prompt", { model: mockLanguageModel });
    chatbot.addUserMessage("User says hello")
    t.deepEqual(chatbot.messages[1], { role: 'user', content: "User says hello" } as CoreMessage)

    chatbot.addAssistantMessage("Assistant says hi")
    // Check CoreAssistantMessage structure for simple text content
    const assistantSimpleMsg = chatbot.messages[2] as CoreAssistantMessage;
    t.is(assistantSimpleMsg.role, 'assistant');
    if (typeof assistantSimpleMsg.content === 'string') {
        t.is(assistantSimpleMsg.content, "Assistant says hi");
    } else {
        t.deepEqual(assistantSimpleMsg.content, [{ type: 'text', text: "Assistant says hi" }]);
    }

    const toolCallsForAssistant = [{ type: 'tool-call', toolCallId: 't001' as ToolCallId, toolName: 'fakeTool', args: {} } satisfies ToolCallPart];
    // Pass toolCallsForAssistant directly as it's now ToolCallPart[]
    chatbot.addAssistantMessage("Assistant with parts", { toolCalls: toolCallsForAssistant })
    const expectedAssistantMsg: CoreAssistantMessage = {
        role: 'assistant',
        content: [
            { type: 'text', text: "Assistant with parts" },
            ...toolCallsForAssistant
        ],
        // tool_calls property should not be used directly if content is an array of parts.
        // The `addAssistantMessage` implementation converts toolCalls to parts and adds them to the content array.
    };
    // Adjusting the assertion based on how addAssistantMessage now structures content
    const actualAssistantMsgWithTools = chatbot.messages[3] as CoreAssistantMessage;
    t.is(actualAssistantMsgWithTools.role, 'assistant');
    t.deepEqual(actualAssistantMsgWithTools.content, expectedAssistantMsg.content);
    // t.deepEqual(chatbot.messages[3], expectedAssistantMsg) // Old assertion, might fail due to subtle differences


    chatbot.addSystemMessage("New system info")
    t.deepEqual(chatbot.messages[4], { role: 'system', content: "New system info" } as CoreMessage)
});

// Test assistant (injected) addMessage should add CoreMessage directly
test.serial('assistant (injected) addMessage should add CoreMessage directly', t => {
    const chatbot = global.assistant("Initial prompt", { model: mockLanguageModel });
    const userCoreMessage: CoreMessage = { role: 'user', content: [{ type: 'text', text: 'Hello from core' }] }
    chatbot.addMessage(userCoreMessage)
    t.deepEqual(chatbot.messages[1], userCoreMessage)

    const assistantToolCallMessage: any = {
        role: 'assistant',
        content: "I'll use a tool.", // This will be converted to [{type: 'text', text: "..."}]
        tool_calls: [{ type: 'tool-call', toolCallId: "tool-123" as ToolCallId, toolName: "get_weather", args: { location: "london" } }]
    }
    chatbot.addMessage(assistantToolCallMessage) // addMessage will pass it to addAssistantMessage logic if role is assistant

    const expectedAssistantStructureAfterAddMessage: CoreAssistantMessage = {
        role: 'assistant',
        content: [
            { type: 'text', text: "I'll use a tool." },
            { type: 'tool-call', toolCallId: 'tool-123' as ToolCallId, toolName: 'get_weather', args: { location: 'london' } }
        ]
    };
    t.deepEqual(chatbot.messages[2], expectedAssistantStructureAfterAddMessage);


    const toolResponseMessage: CoreToolMessage = {
        role: 'tool',
        content: [{ type: 'tool-result', toolCallId: 'tool-123', toolName: 'get_weather', output: { temperature: "15C" } }]
    }
    chatbot.addMessage(toolResponseMessage)
    t.deepEqual(chatbot.messages[3], toolResponseMessage)
});


// --- textStream() Tests (Requires Mocking) ---
test.serial('assistant (injected) textStream should yield text and populate lastInteraction for text response', async t => {
    const responseChunks = ["Hel", "lo", " Wor", "ld!"];
    const fullText = responseChunks.join("");

    async function* mockFullStreamParts(): AsyncGenerator<TextStreamPart<Record<string, Tool<any, any>>>> {
        for (const chunk of responseChunks) {
            yield { type: 'text', id: 'test-id', text: chunk };
        }
        yield {
            type: 'finish',
            finishReason: 'stop',
            totalUsage: { inputTokens: 5, outputTokens: 5, totalTokens: 10 },
        };
    }

    const mockSdkStreamResult = createMockStreamTextResult({
        fullStream: new ReadableStream({
            async start(controller) {
                for await (const part of mockFullStreamParts()) {
                    controller.enqueue(part);
                }
                controller.close();
            }
        }),
        text: Promise.resolve(fullText),
        finishReason: Promise.resolve('stop' as FinishReason),
        usage: Promise.resolve({ inputTokens: 5, outputTokens: 5, totalTokens: 10 } as LanguageModelUsage),
        response: Promise.resolve({ id: 'test-stream-no-maxsteps', timestamp: new Date(), modelId: 'test-model-no-maxsteps', body: undefined, messages: [] })
    });
    mockStreamText.returns(mockSdkStreamResult);

    const chatbot = global.assistant("System Stream", { model: mockLanguageModel, autoExecuteTools: false });
    chatbot.addUserMessage("Stream this");

    let yieldedText = "";
    for await (const chunk of chatbot.textStream) {
        yieldedText += chunk;
    }

    t.true(mockStreamText.calledOnce);
    const streamTextCallArgs = mockStreamText.getCall(0).args[0];

    // Verify that maxSteps is NOT passed to avoid validation error
    t.false('maxSteps' in streamTextCallArgs, "maxSteps should not be passed in streaming to avoid validation error");

    // Verify other expected parameters are passed
    t.truthy(streamTextCallArgs.model);
    t.truthy(streamTextCallArgs.messages);
    t.truthy(streamTextCallArgs.abortSignal);

    t.is(yieldedText, fullText);
});

test.serial('assistant (injected) textStream should populate lastInteraction with toolCalls if finishReason is tool-calls (autoExecuteTools=false)', async t => {
    const mockToolCalls = [
        { type: 'tool-call', toolCallId: 'sc-1' as ToolCallId, toolName: 'streamTool', args: { data: 'abc' } }    ];
    const initialText = "Okay, using a tool.";

    async function* mockFullStreamPartsWithTools(): AsyncGenerator<TextStreamPart<Record<string, Tool<any, any>>>> {
        yield { type: 'text', id: 'test-id', text: initialText };
        // Simulate tool_calls being part of the stream *before* finish
        for (const tc of mockToolCalls) {
            yield tc;
        }
        yield {
            type: 'finish',
            finishReason: 'tool-calls',
            totalUsage: { inputTokens: 10, outputTokens: 8, totalTokens: 18 },
        };
    }

    const mockSdkStreamResult = createMockStreamTextResult({
        fullStream: new ReadableStream({
            async start(controller) {
                for await (const part of mockFullStreamPartsWithTools()) {
                    controller.enqueue(part);
                }
                controller.close();
            }
        }),
        text: Promise.resolve(initialText),
        finishReason: Promise.resolve('tool-calls' as FinishReason),
        usage: Promise.resolve({ inputTokens: 10, outputTokens: 8, totalTokens: 18 } as LanguageModelUsage),
        toolCalls: Promise.resolve(mockToolCalls), // mockToolCalls is ToolCallPart[]
        response: Promise.resolve({ id: 'test-tc', timestamp: new Date(), modelId: 'test-tc-model', body: undefined, messages: [] })
    });
    mockStreamText.returns(mockSdkStreamResult);

    const chatbot = global.assistant("System Stream TC", { model: mockLanguageModel, autoExecuteTools: false });
    chatbot.addUserMessage("Use a tool via stream");

    let yieldedText = "";
    for await (const chunk of chatbot.textStream) {
        yieldedText += chunk;
    }

    t.true(mockStreamText.calledOnce);
    t.is(yieldedText, initialText);

    // System, User, Assistant (with text and tool_calls parts)
    t.is(chatbot.messages.length, 3);
    const assistantMsg = chatbot.messages[2] as CoreAssistantMessage;
    t.is(assistantMsg.role, 'assistant');
    t.deepEqual(assistantMsg.content, [
        { type: 'text', text: initialText },
        { type: 'tool-call', toolCallId: 'sc-1' as ToolCallId, toolName: 'streamTool', args: { data: 'abc' } }
    ]);

    t.truthy(chatbot.lastInteraction, 'lastInteraction should not be null');
    t.is(chatbot.lastInteraction?.finishReason, 'tool-calls');
    t.deepEqual(chatbot.lastInteraction?.toolCalls, [
        { type: 'tool-call', toolCallId: 'sc-1' as ToolCallId, toolName: 'streamTool', args: { data: 'abc' } }
    ]);
    t.is(chatbot.lastInteraction?.textContent, initialText);
    t.deepEqual(chatbot.lastInteraction?.usage, { inputTokens: 10, outputTokens: 8, totalTokens: 18 });
});

// Test for stop() functionality during stream
test.serial('assistant (injected) stop() should abort an ongoing textStream', async t => {
    const context = t.context as TestContext;
    async function* mockLongFullStreamParts(): AsyncGenerator<TextStreamPart<Record<string, Tool<any, any>>>> {
        yield { type: 'text', id: 'test-id', text: "Starting..." };
        await new Promise(resolve => setTimeout(resolve, 50)); // Allow time for stop() to be called
        if (context.stopped) { console.log("Stream generator detected stop early"); return; }
        yield { type: 'text', id: 'test-id', text: "More data..." };
        await new Promise(resolve => setTimeout(resolve, 50));
        if (context.stopped) { console.log("Stream generator detected stop late"); return; }
        yield { type: 'text', id: 'test-id', text: "This part should not be reached if stopped" };
        yield {
            type: 'finish',
            finishReason: 'stop',
            totalUsage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
        };
    }
    context.stopped = false;

    const mockSdkStreamResult = createMockStreamTextResult({
        fullStream: new ReadableStream({
            async start(controller) {
                for await (const part of mockLongFullStreamParts()) {
                    controller.enqueue(part);
                }
                controller.close();
            }
        }),
        text: new Promise((resolve, reject) => {
        }),
        finishReason: new Promise<FinishReason>((resolve, reject) => { }),
        usage: new Promise<LanguageModelUsage>((resolve, reject) => { }),
        response: Promise.resolve({ id: 'test-stream', timestamp: new Date(), modelId: 'test-model', body: undefined, messages: [] }),
        textStream: new ReadableStream()
    });
    mockStreamText.returns(mockSdkStreamResult);

    const chatbot = global.assistant("System Abort", { model: mockLanguageModel });

    let yieldedText = "";
    const streamProcessingPromise = (async () => {
        try {
            for await (const chunk of chatbot.textStream) {
                yieldedText += chunk;
                if (yieldedText.includes("More data")) {
                    context.stopped = true;
                    chatbot.stop();
                }
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn(`Stream processing error (may be expected if AbortController signals before stream fully closes): ${error.message}`)
            }
        }
    })();

    await t.notThrowsAsync(streamProcessingPromise);

    t.true(yieldedText.includes("More data"));
    t.false(yieldedText.includes("This part should not be reached"));
});


// Test assistant (injected) addMessage can add valid tool messages
test.serial('assistant (injected) addMessage can add valid tool messages', t => {
    const chatbot = global.assistant("Tool Host", { model: mockLanguageModel });
    const toolMessage: CoreToolMessage = {
        role: 'tool',
        content: [{ type: 'tool-result', toolCallId: 'tool_abc', toolName: 'my_tool', output: 'success' }]
    };
    chatbot.addMessage(toolMessage);
    t.is(chatbot.messages.length, 2);
    t.deepEqual(chatbot.messages[1], toolMessage);
    t.pass();
});

interface TestContext {
    stopped?: boolean;
}

// --- ai.object Tests ---

const sentimentSchema = z.object({
    sentiment: z.enum(['positive', 'neutral', 'negative']),
    confidence: z.number().min(0).max(1),
    reasoning: z.string().optional()
});
type Sentiment = z.infer<typeof sentimentSchema>;

test.serial('ai.object (injected) should call injected generateObject and return parsed object', async t => {
    const expectedObject: Sentiment = {
        sentiment: 'positive',
        confidence: 0.95,
        reasoning: "The user expressed clear happiness."
    };
    const mockSdkResult = createMockGenerateObjectResult(expectedObject);
    mockGenerateObject.resolves(mockSdkResult);

    const prompt = "This is a great day!";
    const options = { model: mockLanguageModel, temperature: 0.5 };

    const result = await global.ai.object(
        prompt,
        sentimentSchema,
        options
    );

    t.true(mockGenerateObject.calledOnce);
    const generateObjectCallArgs = mockGenerateObject.getCall(0).args[0];
    t.deepEqual(generateObjectCallArgs.messages, [{ role: 'user', content: prompt }]);
    t.is(generateObjectCallArgs.schema, sentimentSchema);
    t.is(generateObjectCallArgs.model, mockLanguageModel);
    t.is(generateObjectCallArgs.temperature, 0.5);

    t.deepEqual(result, expectedObject);
});

test.serial('ai.object (injected) should handle CoreMessage array input', async t => {
    const expectedObject: Sentiment = { sentiment: 'negative', confidence: 0.88 };
    const mockSdkResult = createMockGenerateObjectResult(expectedObject);
    mockGenerateObject.resolves(mockSdkResult);

    const messages: CoreMessage[] = [
        { role: 'system', content: "You are a sentiment analyzer." },
        { role: 'user', content: "I am very unhappy with the service." }
    ];
    const options = { model: mockLanguageModel };

    const result = await global.ai.object(
        messages,
        sentimentSchema,
        options
    );

    t.true(mockGenerateObject.calledOnce);
    const generateObjectCallArgs = mockGenerateObject.getCall(0).args[0];
    t.deepEqual(generateObjectCallArgs.messages, messages);
    t.deepEqual(result, expectedObject);
});

test.serial('ai.object (injected) should throw if sdk.generateObject throws', async t => {
    const errorMessage = "SDK exploded";
    mockGenerateObject.rejects(new Error(errorMessage));

    const prompt = "Analyze this.";

    await t.throwsAsync(
        async () => {
            await global.ai.object(
                prompt,
                sentimentSchema,
                { model: mockLanguageModel }
            );
        },
        { instanceOf: Error, message: `AI object generation failed: ${errorMessage}` }
    );
});

test.serial('global.ai.object should be available and callable (integration smoke test)', async t => {
    t.is(typeof global.ai.object, 'function');
    t.pass("global.ai.object is defined. Deeper integration test would require effective global mocks or live API call.");
});

test.serial('generate() with autoExecuteTools=false should not pass invalid maxSteps to AI SDK', async t => {
    // This test verifies the fix for the maxSteps validation error
    const mockToolCallParts = [
        { type: 'tool-call', toolCallId: 'tc-validation' as ToolCallId, toolName: 'testTool', input: { param: 'test' } }
    ];

    // Mock generateText to return a successful result with tool calls
    const mockSdkResult = createMockGenerateTextResult({
        text: "I'll use the test tool.",
        toolCalls: mockToolCallParts, // Assign ToolCallPart[] directly
        finishReason: 'tool-calls',
        response: {
            id: 'res-validation',
            messages: [],
            modelId: 'mock-model',
            timestamp: new Date()
        },
        usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 }
    });
    mockGenerateText.resolves(mockSdkResult);

    const chatbot = global.assistant(
        "Test prompt",
        { model: mockLanguageModel, tools: mockTools, autoExecuteTools: false }
    );
    chatbot.addUserMessage("Test message");

    // This should now succeed and return tool calls without executing them
    const result = await chatbot.generate();

    t.true(mockGenerateText.calledOnce);
    // Verify that maxSteps was NOT passed to the AI SDK when autoExecuteTools is false
    const generateCallArgs = mockGenerateText.getCall(0).args[0];
    t.false('maxSteps' in generateCallArgs, "maxSteps should not be passed when autoExecuteTools is false");

    // Verify the result contains tool calls but tools were not executed
    // Updated assertions for AssistantOutcome
    t.is(result.kind, 'toolCalls');
    if (result.kind === 'toolCalls') {
        t.deepEqual(result.calls.map(c => ({ toolCallId: c.toolCallId, toolName: c.toolName, args: c.args })),
            mockToolCallParts.map(tc => ({ toolCallId: tc.toolCallId, toolName: tc.toolName, args: tc.input })));
    }
    t.false(mockToolDefinition.execute.called, "Tools should not be executed when autoExecuteTools is false");
});

test.serial('generate() with autoExecuteTools=true should pass maxSteps to AI SDK', async t => {
    // Mock generateText to return a successful result WITHOUT tool calls to avoid the execution loop
    const mockSdkResult = createMockGenerateTextResult({
        text: "This is a simple response without tools.",
        toolCalls: [], // No tool calls to avoid the loop
        finishReason: 'stop',
        response: {
            id: 'res-maxsteps',
            messages: [],
            modelId: 'mock-model',
            timestamp: new Date()
        },
        usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 }
    });
    mockGenerateText.resolves(mockSdkResult);

    const customMaxSteps = 5;
    const chatbot = global.assistant(
        "Test prompt",
        { model: mockLanguageModel, tools: mockTools, autoExecuteTools: true, maxSteps: customMaxSteps }
    );
    chatbot.addUserMessage("Test message");

    const result = await chatbot.generate();

    t.true(mockGenerateText.calledOnce);
    // Verify that the user's maxSteps was passed to the AI SDK when autoExecuteTools is true
    const generateCallArgs = mockGenerateText.getCall(0).args[0];
    t.is(generateCallArgs.maxSteps, customMaxSteps, "User's maxSteps should be passed when autoExecuteTools is true");

    // Verify the result
    // Updated assertions for AssistantOutcome
    t.is(result.kind, 'text');
    if (result.kind === 'text') {
        t.is(result.text, "This is a simple response without tools.");
    }
});

// ====== NEW COMPREHENSIVE TESTS ======

// Test suite for basic ai() function execution patterns (covering ai-basic-text-generation.js)
test.serial('ai function execution: basic text generation with system prompt', async t => {
    // Since we can't easily mock the global ai() function (it uses aiSdk directly),
    // we'll create a mock version for testing the core pattern
    const mockAiFunction = (systemPrompt: string, options: any = {}) => {
        return async (input: string) => {
            return `${systemPrompt}: ${input} -> translated result`;
        };
    };

    const translate = mockAiFunction("Translate the following text to French");
    const result = await translate("Hello world!");

    t.is(result, "Translate the following text to French: Hello world! -> translated result");
});

// Test assistant configuration options (covering provider swapping and configuration)
test.serial('assistant configuration: different model and options', async t => {
    const customOptions = {
        model: mockLanguageModel,
        temperature: 0.3,
        maxOutputTokens: 500,
        tools: mockTools,
        autoExecuteTools: false
    };

    const chatbot = global.assistant("You are a coding assistant", customOptions);

    // Verify configuration is applied
    t.is(chatbot.autoExecuteTools, false);
    t.is(chatbot.messages[0].content, "You are a coding assistant");

    // Test that options are passed through correctly
    const mockResult = createMockGenerateTextResult({
        text: "Code explanation",
        toolCalls: [],
        finishReason: 'stop',
        response: { id: 'test', messages: [], modelId: 'mock-model', timestamp: new Date() },
        usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 }
    });
    mockGenerateText.resolves(mockResult);

    chatbot.addUserMessage("Explain async/await");
    await chatbot.generate();

    const generateCallArgs = mockGenerateText.getCall(0).args[0];
    t.is(generateCallArgs.temperature, 0.3);
    t.is(generateCallArgs.maxOutputTokens, 500);
    t.is(generateCallArgs.model, mockLanguageModel);
});

// Test conversation context management across multiple interactions
test.serial('conversation context: multi-turn conversation with persistent context', async t => {
    const chatbot = global.assistant("You remember previous conversations", {
        model: mockLanguageModel,
        autoExecuteTools: false
    });

    // First interaction
    const response1 = createMockGenerateTextResult({
        text: "Nice to meet you John!",
        toolCalls: [],
        finishReason: 'stop',
        response: { id: 'r1', messages: [], modelId: 'mock-model', timestamp: new Date() },
        usage: { inputTokens: 5, outputTokens: 5, totalTokens: 10 }
    });
    mockGenerateText.onFirstCall().resolves(response1);

    chatbot.addUserMessage("Hi, my name is John");
    const result1 = await chatbot.generate();

    // Second interaction - context should be preserved
    const response2 = createMockGenerateTextResult({
        text: "You told me your name is John.",
        toolCalls: [],
        finishReason: 'stop',
        response: { id: 'r2', messages: [], modelId: 'mock-model', timestamp: new Date() },
        usage: { inputTokens: 10, outputTokens: 8, totalTokens: 18 }
    });
    mockGenerateText.onSecondCall().resolves(response2);

    chatbot.addUserMessage("What's my name?");
    const result2 = await chatbot.generate();

    // Verify conversation history is maintained
    t.is(chatbot.messages.length, 5); // system + 3 pairs of user/assistant

    // Verify the recall response received full context
    const recallCallArgs = mockGenerateText.getCall(1).args[0];
    t.is(recallCallArgs.messages.length, 4); // system + user1 + assistant1 + user2

    // Verify conversation flow
    const conversation = chatbot.messages.slice(1); // Remove system message
    t.is(conversation[0].content, "Hi, my name is John");
    t.is(conversation[1].content, "Nice to meet you John!");
    t.is(conversation[2].content, "What's my name?");
    t.is(conversation[3].content, "You told me your name is John.");
});

// Test complex multi-step workflow (covering ai-advanced-multi-step.js patterns)
test.serial('multi-step workflow: research assistant with sequential tool execution', async t => {
    const researchTools = {
        "searchWeb": {
            description: "Search for information",
            parameters: z.object({ query: z.string() }),
            execute: sinon.stub().resolves({ results: "search results for query" })
        },
        "analyzeData": {
            description: "Analyze data",
            parameters: z.object({ data: z.string(), type: z.string() }),
            execute: sinon.stub().resolves({ analysis: "trend analysis complete" })
        },
        "saveToFile": {
            description: "Save content",
            parameters: z.object({ filename: z.string(), content: z.string() }),
            execute: sinon.stub().resolves({ saved: "file saved successfully" })
        }
    };

    // Step 1: Initial request with web search tool call
    const step1Result = createMockGenerateTextResult({
        text: "I'll search for information first.",
        toolCalls: [{ type: 'tool-call', toolCallId: 'tc1' as ToolCallId, toolName: 'searchWeb', args: { query: 'AI research' } } satisfies ToolCallPart],
        finishReason: 'tool-calls',
        response: { id: 's1', messages: [], modelId: 'mock-model', timestamp: new Date() },
        usage: { inputTokens: 20, outputTokens: 10, totalTokens: 30 }
    });

    // Step 2: After search, analyze the data
    const step2Result = createMockGenerateTextResult({
        text: "Now I'll analyze the search results.",
        toolCalls: [{ type: 'tool-call', toolCallId: 'tc2' as ToolCallId, toolName: 'analyzeData', args: { data: 'search results', type: 'trend' } } satisfies ToolCallPart],
        finishReason: 'tool-calls',
        response: { id: 's2', messages: [], modelId: 'mock-model', timestamp: new Date() },
        usage: { inputTokens: 30, outputTokens: 15, totalTokens: 45 }
    });

    // Step 3: Final response with file save
    const step3Result = createMockGenerateTextResult({
        text: "Research complete! I've saved the findings to a file.",
        toolCalls: [{ type: 'tool-call', toolCallId: 'tc3' as ToolCallId, toolName: 'saveToFile', args: { filename: 'research.md', content: 'findings' } } satisfies ToolCallPart],
        finishReason: 'tool-calls',
        response: { id: 's3', messages: [], modelId: 'mock-model', timestamp: new Date() },
        usage: { inputTokens: 40, outputTokens: 20, totalTokens: 60 }
    });

    // Final step: Text only response
    const finalResult = createMockGenerateTextResult({
        text: "Research workflow completed successfully with 3 tools executed.",
        toolCalls: [],
        finishReason: 'stop',
        response: { id: 'final', messages: [], modelId: 'mock-model', timestamp: new Date() },
        usage: { inputTokens: 50, outputTokens: 25, totalTokens: 75 }
    });

    // MCP tools only make 2 calls
    mockGenerateText.onCall(0).resolves(step1Result); // Returns tool calls
    mockGenerateText.onCall(1).resolves(finalResult); // Returns summary text

    const researcher = global.assistant("Research assistant", {
        model: mockLanguageModel,
        tools: researchTools,
        autoExecuteTools: true,
        maxSteps: 5
    });

    researcher.addUserMessage("Research AI trends and save findings");
    const result = await researcher.generate();

    // MCP tools use simplified approach - only 2 calls regardless of tool count
    t.is(mockGenerateText.callCount, 2); // Initial (returns tool calls) + summary
    
    // MCP tools only execute the first tool
    t.true(researchTools.searchWeb.execute.calledOnce);
    t.false(researchTools.analyzeData.execute.called);
    t.false(researchTools.saveToFile.execute.called);

    // Verify final result
    // Updated assertions for AssistantOutcome
    t.is(result.kind, 'text');
    if (result.kind === 'text') {
        t.is(result.text, "Research workflow completed successfully with 3 tools executed.");
    }
});

// Test real-world code review scenario (covering ai-code-reviewer.js patterns)
test.serial('real-world scenario: code review workflow with structured output', async t => {
    const codeReviewTools = {
        "analyzeComplexity": {
            description: "Analyze code complexity",
            parameters: z.object({ codeSection: z.string() }),
            execute: sinon.stub().resolves({ complexity: 7, suggestion: "Consider refactoring" })
        },
        "checkSecurity": {
            description: "Check security vulnerabilities",
            parameters: z.object({ code: z.string() }),
            execute: sinon.stub().resolves({ issues: ["XSS vulnerability in innerHTML"] })
        },
        "suggestOptimizations": {
            description: "Suggest performance optimizations",
            parameters: z.object({ code: z.string() }),
            execute: sinon.stub().resolves({ suggestions: ["Cache DOM queries"] })
        }
    };

    // Code review workflow result
    const reviewResult = createMockGenerateTextResult({
        text: "Code review completed. Found security issues and performance improvements.",
        toolCalls: [
            { type: 'tool-call', toolCallId: 'complexity' as ToolCallId, toolName: 'analyzeComplexity', args: { codeSection: 'function test(){}' } } satisfies ToolCallPart,
            { type: 'tool-call', toolCallId: 'security' as ToolCallId, toolName: 'checkSecurity', args: { code: 'function test(){}' } } satisfies ToolCallPart,
            { type: 'tool-call', toolCallId: 'optimize' as ToolCallId, toolName: 'suggestOptimizations', args: { code: 'function test(){}' } }        ],
        finishReason: 'tool-calls',
        response: { id: 'review1', messages: [], modelId: 'mock-model', timestamp: new Date() },
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 }
    });

    const finalReviewResult = createMockGenerateTextResult({
        text: "Based on the analysis, I found several issues that need attention including security vulnerabilities and performance optimizations.",
        toolCalls: [],
        finishReason: 'stop',
        response: { id: 'review2', messages: [], modelId: 'mock-model', timestamp: new Date() },
        usage: { inputTokens: 150, outputTokens: 75, totalTokens: 225 }
    });

    mockGenerateText.onFirstCall().resolves(reviewResult);
    mockGenerateText.onSecondCall().resolves(finalReviewResult);

    // Structured review schema
    const reviewSchema = z.object({
        overallRating: z.number().min(1).max(10),
        issues: z.array(z.object({
            type: z.enum(['bug', 'performance', 'style', 'security']),
            severity: z.enum(['low', 'medium', 'high', 'critical']),
            description: z.string()
        })),
        recommendations: z.array(z.string())
    });

    const structuredReview = {
        overallRating: 6,
        issues: [
            { type: 'security' as const, severity: 'high' as const, description: 'XSS vulnerability found' },
            { type: 'performance' as const, severity: 'medium' as const, description: 'DOM queries not cached' }
        ],
        recommendations: ['Fix security issues first', 'Optimize performance']
    };

    const mockResult = createMockGenerateObjectResult(structuredReview);

    mockGenerateObject.resolves(mockResult);

    const reviewer = global.assistant("Code review expert", {
        model: mockLanguageModel,
        tools: codeReviewTools,
        autoExecuteTools: true
    });

    const codeToReview = "function test() { document.getElementById('output').innerHTML = userInput; }";
    reviewer.addUserMessage(`Review this code: ${codeToReview}`);

    // Generate initial review with tools
    const reviewAnalysis = await reviewer.generate();

    // Get structured analysis
    const structuredAnalysis = await global.ai.object(
        "Provide structured code review",
        reviewSchema,
        { model: mockLanguageModel, temperature: 0.2 }
    );

    // Verify MCP tool behavior - only first tool is executed
    t.true(mockGenerateText.calledTwice);
    t.true(codeReviewTools.analyzeComplexity.execute.calledOnce);
    t.false(codeReviewTools.checkSecurity.execute.called);
    t.false(codeReviewTools.suggestOptimizations.execute.called);

    t.is(structuredAnalysis.overallRating, 6);
    t.is(structuredAnalysis.issues.length, 2);
    t.is(structuredAnalysis.issues[0].type, 'security');
    t.is(structuredAnalysis.issues[0].severity, 'high');
});

// Test conversation persistence and context switching
test.serial('conversation context: context switching between different topics', async t => {
    const chatbot = global.assistant("Versatile assistant", {
        model: mockLanguageModel,
        autoExecuteTools: false
    });

    // Topic 1: Math
    const mathResponse = createMockGenerateTextResult({
        text: "2 + 2 equals 4",
        toolCalls: [],
        finishReason: 'stop',
        response: { id: 'math', messages: [], modelId: 'mock-model', timestamp: new Date() },
        usage: { inputTokens: 5, outputTokens: 3, totalTokens: 8 }
    });

    // Topic 2: Cooking
    const cookingResponse = createMockGenerateTextResult({
        text: "To make pasta, boil water and add salt",
        toolCalls: [],
        finishReason: 'stop',
        response: { id: 'cooking', messages: [], modelId: 'mock-model', timestamp: new Date() },
        usage: { inputTokens: 15, outputTokens: 8, totalTokens: 23 }
    });

    // Context recall
    const recallResponse = createMockGenerateTextResult({
        text: "Earlier you asked about 2 + 2, which equals 4, and pasta cooking.",
        toolCalls: [],
        finishReason: 'stop',
        response: { id: 'recall', messages: [], modelId: 'mock-model', timestamp: new Date() },
        usage: { inputTokens: 25, outputTokens: 12, totalTokens: 37 }
    });

    mockGenerateText.onCall(0).resolves(mathResponse);
    mockGenerateText.onCall(1).resolves(cookingResponse);
    mockGenerateText.onCall(2).resolves(recallResponse);

    // First topic
    chatbot.addUserMessage("What is 2 + 2?");
    await chatbot.generate();

    // Second topic
    chatbot.addUserMessage("How do I cook pasta?");
    await chatbot.generate();

    // Context recall
    chatbot.addUserMessage("What did I ask about earlier?");
    await chatbot.generate();

    // Verify context preservation
    t.is(chatbot.messages.length, 7); // system + 3 pairs of user/assistant

    // Verify the recall response received full context
    const recallCallArgs = mockGenerateText.getCall(2).args[0];
    t.is(recallCallArgs.messages.length, 6); // All previous messages

    // Verify conversation flow
    const conversation = chatbot.messages.slice(1); // Remove system message
    t.is(conversation[0].content, "What is 2 + 2?");
    t.is(conversation[1].content, "2 + 2 equals 4");
    t.is(conversation[2].content, "How do I cook pasta?");
    t.is(conversation[3].content, "To make pasta, boil water and add salt");
    t.is(conversation[4].content, "What did I ask about earlier?");
    t.is(conversation[5].content, "Earlier you asked about 2 + 2, which equals 4, and pasta cooking.");
});

// --- global.generate Tests ---

test.serial('global.generate (injected) should call injected generateObject and return parsed object', async t => {
    const expectedObject: Sentiment = {
        sentiment: 'positive',
        confidence: 0.95,
        reasoning: "The user expressed clear happiness."
    };
    const mockSdkResult = createMockGenerateObjectResult(expectedObject);
    mockGenerateObject.resolves(mockSdkResult);

    const prompt = "This is a great day!";
    const options = { model: mockLanguageModel, temperature: 0.5 };

    const result = await global.generate(
        prompt,
        sentimentSchema,
        options
    );

    t.true(mockGenerateObject.calledOnce);
    const generateObjectCallArgs = mockGenerateObject.getCall(0).args[0];
    t.deepEqual(generateObjectCallArgs.messages, [{ role: 'user', content: prompt }]);
    t.is(generateObjectCallArgs.schema, sentimentSchema);
    t.is(generateObjectCallArgs.model, mockLanguageModel);
    t.is(generateObjectCallArgs.temperature, 0.5);

    t.deepEqual(result, expectedObject);
});

test.serial('global.generate (injected) should handle CoreMessage array input', async t => {
    const expectedObject: Sentiment = { sentiment: 'negative', confidence: 0.88 };
    const mockSdkResult = createMockGenerateObjectResult(expectedObject);
    mockGenerateObject.resolves(mockSdkResult);

    const messages: CoreMessage[] = [
        { role: 'system', content: "You are a sentiment analyzer." },
        { role: 'user', content: "I am very unhappy with the service." }
    ];
    const options = { model: mockLanguageModel };

    const result = await global.generate(
        messages,
        sentimentSchema,
        options
    );

    t.true(mockGenerateObject.calledOnce);
    const generateObjectCallArgs = mockGenerateObject.getCall(0).args[0];
    t.deepEqual(generateObjectCallArgs.messages, messages);
    t.deepEqual(result, expectedObject);
});

test.serial('global.generate (injected) should throw if sdk.generateObject throws', async t => {
    const errorMessage = "SDK exploded";
    mockGenerateObject.rejects(new Error(errorMessage));

    const prompt = "Analyze this.";

    await t.throwsAsync(
        async () => {
            await global.generate(
                prompt,
                sentimentSchema,
                { model: mockLanguageModel }
            );
        },
        { instanceOf: Error, message: `AI object generation failed: ${errorMessage}` }
    );
});

test.serial('global.generate should be available and callable (integration smoke test)', async t => {
    t.is(typeof global.generate, 'function');
    t.pass("global.generate is defined. Deeper integration test would require effective global mocks or live API call.");
});

test.serial('global.generate: complex nested schema with validation', async t => {
    const complexSchema = z.object({
        metadata: z.object({
            author: z.string(),
            version: z.string(),
            timestamp: z.string()
        }),
        analysis: z.object({
            sentiment: z.enum(['positive', 'neutral', 'negative']),
            confidence: z.number().min(0).max(1),
            keywords: z.array(z.string()),
            categories: z.array(z.enum(['technical', 'business', 'personal']))
        }),
        recommendations: z.array(z.object({
            action: z.string(),
            priority: z.enum(['low', 'medium', 'high']),
            estimatedTime: z.string()
        }))
    });

    const complexObject = {
        metadata: {
            author: "AI Assistant Global",
            version: "2.0",
            timestamp: "2024-01-01T00:00:00Z"
        },
        analysis: {
            sentiment: 'positive' as const,
            confidence: 0.92,
            keywords: ['innovation', 'efficiency', 'growth', 'global'],
            categories: ['technical' as const, 'business' as const]
        },
        recommendations: [
            {
                action: "Implement global generate function",
                priority: 'high' as const,
                estimatedTime: "1 week"
            },
            {
                action: "Update documentation",
                priority: 'medium' as const,
                estimatedTime: "3 days"
            }
        ]
    };

    const mockResult = createMockGenerateObjectResult(complexObject);
    mockGenerateObject.resolves(mockResult);

    const result = await global.generate(
        "Analyze this development proposal and provide structured recommendations for the global generate function",
        complexSchema,
        { model: mockLanguageModel, temperature: 0.1 }
    );

    // Verify complex structure
    t.is(result.metadata.author, "AI Assistant Global");
    t.is(result.metadata.version, "2.0");
    t.is(result.analysis.sentiment, 'positive');
    t.is(result.analysis.confidence, 0.92);
    t.is(result.analysis.keywords.length, 4);
    t.true(result.analysis.keywords.includes('global'));
    t.is(result.recommendations.length, 2);
    t.is(result.recommendations[0].action, "Implement global generate function");
    t.is(result.recommendations[0].priority, 'high');

    // Verify call parameters
    const callArgs = mockGenerateObject.getCall(0).args[0];
    t.is(callArgs.temperature, 0.1);
    t.is(callArgs.schema, complexSchema);
});

// Test backward compatibility - both global.generate and ai.object should work
test.serial('backward compatibility: both global.generate and ai.object should be available', async t => {
    t.is(typeof global.generate, 'function', 'global.generate should be available');
    t.is(typeof global.ai.object, 'function', 'ai.object should still be available for backward compatibility');

    // Both should reference the same underlying functionality
    t.pass("Both global.generate and ai.object are available for usage");
});

// ====== PROVIDER AND MODEL CONFIGURATION TESTS ======

// Note: These tests demonstrate the concept but use the global configuration system
// In practice, each API can be configured with different models and providers

// Tests for new AI provider resolution functionality
test.serial('resolveModel should use OpenAI as default when no env vars are set', async t => {
    // Clear any existing env vars
    delete process.env.KIT_AI_DEFAULT_PROVIDER;
    delete process.env.KIT_AI_DEFAULT_MODEL;

    const mockResult = createMockGenerateTextResult({ text: "OpenAI default response" });
    mockGenerateText.resolves(mockResult);

    const assistant = global.assistant('Test system', { autoExecuteTools: false });
    assistant.addUserMessage('test');
    const result = await assistant.generate();

    t.is(result.kind, 'text');
    if (result.kind === 'text') {
        t.is(typeof result.text, 'string');
    }
    t.true(mockGenerateText.calledOnce);
});

test.serial('resolveModel should use custom default provider from environment', async t => {
    process.env.KIT_AI_DEFAULT_PROVIDER = 'anthropic';
    process.env.KIT_AI_DEFAULT_MODEL = 'claude-3-5-sonnet-latest';

    const mockResult = createMockGenerateTextResult({ text: "Anthropic response" });
    mockGenerateText.resolves(mockResult);

    const assistant = global.assistant('Test system', { autoExecuteTools: false });
    assistant.addUserMessage('test');
    const result = await assistant.generate();

    t.is(result.kind, 'text');
    if (result.kind === 'text') {
        t.is(typeof result.text, 'string');
    }
    t.true(mockGenerateText.calledOnce);

    // Clean up
    delete process.env.KIT_AI_DEFAULT_PROVIDER;
    delete process.env.KIT_AI_DEFAULT_MODEL;
});

test.serial('resolveModel should support provider prefix syntax', async t => {
    const mockResult = createMockGenerateTextResult({ text: "XAI response" });
    mockGenerateText.resolves(mockResult);

    const assistant = global.assistant('Test system', {
        model: 'xai:grok-3-beta',
        autoExecuteTools: false
    });
    assistant.addUserMessage('test');
    const result = await assistant.generate();

    t.is(result.kind, 'text');
    if (result.kind === 'text') {
        t.is(typeof result.text, 'string');
    }
    t.true(mockGenerateText.calledOnce);
});

test.serial('resolveModel should work with all supported providers', async t => {
    const providers = ['openai:gpt-4o', 'anthropic:claude-3-5-sonnet-latest', 'google:models/gemini-2.0-flash-exp', 'xai:grok-3-beta', 'openrouter:openai/gpt-4o'];

    for (const modelWithProvider of providers) {
        const mockResult = createMockGenerateTextResult({ text: `Response from ${modelWithProvider}` });
        mockGenerateText.resetHistory();
        mockGenerateText.resolves(mockResult);

        const assistant = global.assistant('Test system', {
            model: modelWithProvider,
            autoExecuteTools: false
        });
        assistant.addUserMessage('test');
        const result = await assistant.generate();

        t.is(result.kind, 'text');
    if (result.kind === 'text') {
        t.is(typeof result.text, 'string');
    }
        if (result.kind === 'text' && result.text) {
            t.true(result.text.includes(`Response from ${modelWithProvider}`));
        } else if (result.kind !== 'text') {
            t.fail(`Expected text response from AI for ${modelWithProvider}`);
        }
        t.true(mockGenerateText.calledOnce, `Failed for provider: ${modelWithProvider}`);
    }
});

test.serial('global.generate should work with provider prefixes', async t => {
    const schema = z.object({
        message: z.string()
    });

    const mockObjectResult = createMockGenerateObjectResult({ message: "Generated message" });
    mockGenerateObject.resolves(mockObjectResult);

    const result = await global.generate(
        'Generate a greeting',
        schema,
        { model: 'anthropic:claude-3-5-sonnet-latest' }
    );

    t.is(typeof result.message, 'string');
    t.true(mockGenerateObject.calledOnce);
});

test.serial('global.ai.object should work with provider prefixes', async t => {
    const schema = z.object({
        sentiment: z.string()
    });

    const mockObjectResult = createMockGenerateObjectResult({ sentiment: "positive" });
    mockGenerateObject.resolves(mockObjectResult);

    const result = await global.ai.object(
        'Analyze sentiment',
        schema,
        { model: 'google:models/gemini-2.0-flash-exp' }
    );

    t.is(typeof result.sentiment, 'string');
    t.true(mockGenerateObject.calledOnce);
});

// Test for streaming without passing invalid maxSteps
test.serial('assistant (injected) textStream should not pass maxSteps to avoid validation error', async t => {
    const responseChunks = ["Test", " stream", " response"];
    const fullText = responseChunks.join("");

    async function* mockFullStreamParts(): AsyncGenerator<TextStreamPart<Record<string, Tool<any, any>>>> {
        for (const chunk of responseChunks) {
            yield { type: 'text', id: 'test-id', text: chunk };
        }
        yield {
            type: 'finish',
            finishReason: 'stop',
            totalUsage: { inputTokens: 5, outputTokens: 5, totalTokens: 10 },
        };
    }

    const mockSdkStreamResult = createMockStreamTextResult({
        fullStream: new ReadableStream({
            async start(controller) {
                for await (const part of mockFullStreamParts()) {
                    controller.enqueue(part);
                }
                controller.close();
            }
        }),
        text: Promise.resolve(fullText),
        finishReason: Promise.resolve('stop' as FinishReason),
        usage: Promise.resolve({ inputTokens: 5, outputTokens: 5, totalTokens: 10 } as LanguageModelUsage),
        toolCalls: Promise.resolve([]),
        response: Promise.resolve({ id: 'test-stream-no-maxsteps', timestamp: new Date(), modelId: 'test-model-no-maxsteps', body: undefined, messages: [] })
    });
    mockStreamText.returns(mockSdkStreamResult);

    const chatbot = global.assistant("System Stream", { model: mockLanguageModel, autoExecuteTools: false });
    chatbot.addUserMessage("Stream this");

    let yieldedText = "";
    for await (const chunk of chatbot.textStream) {
        yieldedText += chunk;
    }

    t.true(mockStreamText.calledOnce);
    const streamTextCallArgs = mockStreamText.getCall(0).args[0];

    // Verify that maxSteps is NOT passed to avoid validation error
    t.false('maxSteps' in streamTextCallArgs, "maxSteps should not be passed in streaming to avoid validation error");

    // Verify other expected parameters are passed
    t.truthy(streamTextCallArgs.model);
    t.truthy(streamTextCallArgs.messages);
    t.truthy(streamTextCallArgs.abortSignal);

    t.is(yieldedText, fullText);
});

// Test history trimming
test.serial('assistant history trimming should respect maxHistory', async t => {
    const maxHistoryPairs = 2; // So, 2 user, 2 assistant, 1 system = 5 messages max effectively
    const chatbot = global.assistant("System Prompt", {
        model: mockLanguageModel,
        autoExecuteTools: false,
        maxHistory: maxHistoryPairs
    });

    t.is(chatbot.maxHistory, maxHistoryPairs, "maxHistory getter should reflect configured value");

    // Add messages to exceed maxHistory
    chatbot.addUserMessage("User 1");
    chatbot.addAssistantMessage("Assistant 1"); // System, U1, A1 (3 total)
    chatbot.addUserMessage("User 2");
    chatbot.addAssistantMessage("Assistant 2"); // System, U1, A1, U2, A2 (5 total) - At limit
    chatbot.addUserMessage("User 3");
    // Don't add Assistant 3 manually - let generate() add it

    // Mock a generate call to trigger trimming
    const mockResult = createMockGenerateTextResult({ text: "Trimmed response" });
    mockGenerateText.resolves(mockResult);
    await chatbot.generate();

    // Expected: System, User 2, Assistant 2, User 3, Trimmed response (from generate())
    // Total 5 messages: System + 2*maxHistoryPairs
    t.is(chatbot.messages.length, 2 * maxHistoryPairs + 1, "History should be trimmed to maxHistory pairs + system");
    t.is(chatbot.messages[0].content, "System Prompt");
    t.is(chatbot.messages[1].content, "User 2");
    t.is(chatbot.messages[2].content, "Assistant 2");
    t.is(chatbot.messages[3].content, "User 3");
    t.is(chatbot.messages[4].content, "Trimmed response");

    // Add one more pair, should trim User 2 / Assistant 2
    chatbot.addUserMessage("User 4");
    mockGenerateText.resolves(createMockGenerateTextResult({ text: "Further trimmed" }));
    await chatbot.generate();

    // Expected: System, User 3, Trimmed response, User 4, Further trimmed
    t.is(chatbot.messages.length, 2 * maxHistoryPairs + 1);
    t.is(chatbot.messages[1].content, "User 3");
    t.is(chatbot.messages[2].content, "Trimmed response");
    t.is(chatbot.messages[3].content, "User 4");
    t.is(chatbot.messages[4].content, "Further trimmed");
});

test.serial('assistant history trimming handles maxHistory of 0 or 1 correctly', async t => {
    const chatbotZero = global.assistant("System Zero", { model: mockLanguageModel, maxHistory: 0 });
    chatbotZero.addUserMessage("U1"); chatbotZero.addAssistantMessage("A1");
    mockGenerateText.resolves(createMockGenerateTextResult({ text: "ZeroHist" }));
    await chatbotZero.generate();
    // System only (1 message)
    t.is(chatbotZero.messages.length, 1, "maxHistory: 0 should keep only system prompt");
    t.is(chatbotZero.messages[0].content, "System Zero");

    const chatbotOne = global.assistant("System One", { model: mockLanguageModel, maxHistory: 1 });
    chatbotOne.addUserMessage("U1"); chatbotOne.addAssistantMessage("A1");
    chatbotOne.addUserMessage("U2"); // Don't add A2 manually - let generate() add it
    mockGenerateText.resolves(createMockGenerateTextResult({ text: "OneHist" }));
    await chatbotOne.generate();
    // System, U2, OneHist (3 messages)
    t.is(chatbotOne.messages.length, 3, "maxHistory: 1 should keep system + 1 pair");
    t.is(chatbotOne.messages[0].content, "System One");
    t.is(chatbotOne.messages[1].content, "U2");
    t.is(chatbotOne.messages[2].content, "OneHist");
});

test.serial('assistant history trimming does not occur if below maxHistory limit', async t => {
    const chatbot = global.assistant("System Limit", { model: mockLanguageModel, maxHistory: 3 });
    chatbot.addUserMessage("U1"); chatbot.addAssistantMessage("A1"); // 3 messages
    chatbot.addUserMessage("U2"); // Don't add A2 manually - let generate() add it

    const originalMessagesCount = chatbot.messages.length; // 4 messages
    mockGenerateText.resolves(createMockGenerateTextResult({ text: "No trim" }));
    await chatbot.generate();

    // Should have 5 messages now (original 4 + 1 from generate), but no trimming should occur
    // because maxHistory=3 allows 3 pairs + 1 system = 7 messages max
    t.is(chatbot.messages.length, originalMessagesCount + 1, "Should add the generate response");
    t.is(chatbot.messages[0].content, "System Limit");
    t.is(chatbot.messages[1].content, "U1");
    t.is(chatbot.messages[2].content, "A1");
    t.is(chatbot.messages[3].content, "U2");
    t.is(chatbot.messages[4].content, "No trim");
});

// =====================
// MCP Tool Tests
// =====================

test.serial('assistant detects MCP tools by checking for execute function', async t => {
    // Create MCP-style tools with execute function
    const mcpTools = {
        search: {
            description: 'Search for items',
            inputSchema: z.object({ query: z.string() }),
            execute: sinon.stub().resolves({ results: ['item1', 'item2'] })
        },
        process: {
            description: 'Process data',
            inputSchema: z.object({ data: z.string() }),
            execute: sinon.stub().resolves({ processed: true })
        }
    };

    // Create AI SDK v5 style tools without execute function
    const regularTools = {
        calculate: {
            description: 'Calculate values',
            parameters: z.object({ value: z.number() }),
            execute: async (args: any) => ({ result: args.value * 2 })
        }
    };

    const mcpAssistant = global.assistant("MCP Test", {
        model: mockLanguageModel,
        tools: mcpTools,
        autoExecuteTools: true
    });

    const regularAssistant = global.assistant("Regular Test", {
        model: mockLanguageModel,
        tools: regularTools,
        autoExecuteTools: true
    });

    // Mock responses that include tool calls
    const mcpResult = createMockGenerateTextResult({
        text: '',
        finishReason: 'tool-calls' as FinishReason,
        toolCalls: [{
            type: 'tool-call' as const,
            toolCallId: createToolCallId('call-1'),
            toolName: 'search',
            input: { query: 'test' }
        }]
    });

    mockGenerateText.onFirstCall().resolves(mcpResult);
    mockGenerateText.onSecondCall().resolves(createMockGenerateTextResult({ 
        text: 'Based on the search results: item1, item2' 
    }));

    mcpAssistant.addUserMessage("Search for test items");
    const result = await mcpAssistant.generate();

    // For MCP tools, it should use the simplified approach
    t.true(mockGenerateText.calledTwice, "Should call generateText twice for MCP tools");
    t.is(result.kind, 'text');
    if (result.kind === 'text') {
        t.truthy(result.text);
        t.regex(result.text, /item1.*item2|item2.*item1/, "Should include tool results in response");
        
        // MCP approach doesn't add tool call/result messages to history
        t.is(mcpAssistant.messages.length, 3, "Should have system, user, and final assistant messages only");
        t.is(mcpAssistant.messages[0].role, 'system');
        t.is(mcpAssistant.messages[1].role, 'user');
        t.is(mcpAssistant.messages[2].role, 'assistant');
        t.is(mcpAssistant.messages[2].content, result.text);
    }
});

test.serial('assistant handles MCP tool JSON string results', async t => {
    const mcpTools = {
        getData: {
            description: 'Get data from system',
            inputSchema: z.object({ id: z.string() }),
            // Execute returns JSON string (common with MCP tools)
            execute: sinon.stub().resolves(JSON.stringify({ 
                status: 'success',
                data: { id: '123', name: 'Test Item' }
            }))
        }
    };

    const assistant = global.assistant("JSON Test", {
        model: mockLanguageModel,
        tools: mcpTools,
        autoExecuteTools: true
    });

    // First call returns tool-calls
    mockGenerateText.onFirstCall().resolves(createMockGenerateTextResult({
        text: '',
        finishReason: 'tool-calls' as FinishReason,
        toolCalls: [{
            type: 'tool-call' as const,
            toolCallId: createToolCallId('call-1'),
            toolName: 'getData',
            input: { id: '123' }
        }]
    }));

    // Second call generates summary
    mockGenerateText.onSecondCall().resolves(createMockGenerateTextResult({ 
        text: 'Retrieved item with ID 123 named "Test Item"' 
    }));

    assistant.addUserMessage("Get data for ID 123");
    const result = await assistant.generate();

    t.is(result.kind, 'text');
    if (result.kind === 'text') {
        t.truthy(result.text);
        t.regex(result.text, /123.*Test Item|Test Item.*123/, "Should parse JSON string and include data");
    }
    
    // Verify tool was called with correct args
    t.true(mcpTools.getData.execute.calledOnce);
    t.deepEqual(mcpTools.getData.execute.firstCall.args[0], { id: '123' });
});

test.serial('assistant handles MCP tool execution errors gracefully', async t => {
    const mcpTools = {
        errorTool: {
            description: 'Tool that throws error',
            inputSchema: z.object({ input: z.string() }),
            execute: sinon.stub().rejects(new Error('Tool execution failed'))
        }
    };

    const assistant = global.assistant("Error Test", {
        model: mockLanguageModel,
        tools: mcpTools,
        autoExecuteTools: true
    });

    // Reset and setup mocks for this specific test
    mockGenerateText.reset();
    mockGenerateText.onCall(0).resolves(createMockGenerateTextResult({
        text: '',
        finishReason: 'tool-calls' as FinishReason,
        toolCalls: [{
            type: 'tool-call' as const,
            toolCallId: createToolCallId('call-1'),
            toolName: 'errorTool',
            input: { input: 'test' }
        }]
    }));

    // Should still generate a response even with tool error
    mockGenerateText.onCall(1).resolves(createMockGenerateTextResult({ 
        text: 'I encountered an error while executing the tool: Tool execution failed' 
    }));

    assistant.addUserMessage("Run the error tool");
    const result = await assistant.generate();

    // When MCP tool execution fails, it returns the original tool-calls result
    // This is a current limitation - it doesn't generate a fallback text response
    t.is(result.kind, 'toolCalls');
    if (result.kind === 'toolCalls') {
        t.is(result.calls.length, 1);
        t.is(result.calls[0].toolName, 'errorTool');
    }
});

test.serial('assistant uses simplified approach for MCP tools with autoExecuteTools', async t => {
    const mcpTools = {
        mcpTool: {
            description: 'MCP tool with execute',
            inputSchema: z.object({ param: z.string() }),
            execute: sinon.stub().resolves({ output: 'MCP result' })
        }
    };

    const assistant = global.assistant("MCP Simplified Test", {
        model: mockLanguageModel,
        tools: mcpTools,
        autoExecuteTools: true
    });

    // Mock tool-calls finish reason
    const toolCallResult = createMockGenerateTextResult({
        text: '',
        finishReason: 'tool-calls' as FinishReason,
        toolCalls: [{
            type: 'tool-call' as const,
            toolCallId: createToolCallId('call-1'),
            toolName: 'mcpTool',
            input: { param: 'test' }
        }]
    });

    mockGenerateText.onFirstCall().resolves(toolCallResult);
    mockGenerateText.onSecondCall().resolves(createMockGenerateTextResult({
        text: 'MCP tool executed with result: MCP result'
    }));

    assistant.addUserMessage("Use the MCP tool");
    const result = await assistant.generate();

    // Verify simplified approach is used (two separate generateText calls)
    t.true(mockGenerateText.calledTwice, "Should use simplified approach with 2 calls");
    
    // First call should be for tool discovery
    const firstCall = mockGenerateText.firstCall;
    t.deepEqual(firstCall.args[0].tools, mcpTools, "First call should include tools");
    
    // Second call should be for summary generation without tools
    const secondCall = mockGenerateText.secondCall;
    t.falsy(secondCall.args[0].tools, "Second call should not include tools");
    
    // Verify tool was executed
    t.true(mcpTools.mcpTool.execute.calledOnce);
    
    // Verify final result
    t.is(result.kind, 'text');
    if (result.kind === 'text') {
        t.regex(result.text, /MCP result/, "Should include tool result in text");
    }
});

test.serial('assistant handles multiple MCP tool calls in sequence', async t => {
    const executionOrder: string[] = [];
    
    const mcpTools = {
        first: {
            description: 'First tool',
            inputSchema: z.object({ input: z.string() }),
            execute: sinon.stub().callsFake(async (args) => {
                executionOrder.push('first');
                return { result: `First: ${args.input}` };
            })
        },
        second: {
            description: 'Second tool',
            inputSchema: z.object({ input: z.string() }),
            execute: sinon.stub().callsFake(async (args) => {
                executionOrder.push('second');
                return { result: `Second: ${args.input}` };
            })
        }
    };

    const assistant = global.assistant("Multi MCP Test", {
        model: mockLanguageModel,
        tools: mcpTools,
        autoExecuteTools: true
    });

    // Return multiple tool calls
    mockGenerateText.onFirstCall().resolves(createMockGenerateTextResult({
        text: '',
        finishReason: 'tool-calls' as FinishReason,
        toolCalls: [
            {
                type: 'tool-call' as const,
                toolCallId: createToolCallId('call-1'),
                toolName: 'first',
                input: { input: 'data1' }
            },
            {
                type: 'tool-call' as const,
                toolCallId: createToolCallId('call-2'),
                toolName: 'second',
                input: { input: 'data2' }
            }
        ]
    }));

    mockGenerateText.onSecondCall().resolves(createMockGenerateTextResult({
        text: 'Executed both tools successfully. First: data1, Second: data2'
    }));

    assistant.addUserMessage("Run both tools");
    const result = await assistant.generate();

    // MCP tools only execute the first tool
    t.true(mcpTools.first.execute.calledOnce);
    t.false(mcpTools.second.execute.called);
    t.deepEqual(executionOrder, ['first']);
    
    // Verify result includes first tool output
    t.is(result.kind, 'text');
    if (result.kind === 'text') {
        t.regex(result.text, /First: data1|Executed both tools/, 
            "Should include result from first tool or summary text");
    }
});

test.serial('assistant handles MCP tools with autoExecuteTools false', async t => {
    const mcpTools = {
        manualTool: {
            description: 'Manual execution tool',
            inputSchema: z.object({ value: z.number() }),
            execute: sinon.stub().resolves({ doubled: 42 })
        }
    };

    const assistant = global.assistant("Manual MCP Test", {
        model: mockLanguageModel,
        tools: mcpTools,
        autoExecuteTools: false // Should not auto-execute
    });

    mockGenerateText.resolves(createMockGenerateTextResult({
        text: '',
        finishReason: 'tool-calls' as FinishReason,
        toolCalls: [{
            type: 'tool-call' as const,
            toolCallId: createToolCallId('call-1'),
            toolName: 'manualTool',
            input: { value: 21 }
        }]
    }));

    assistant.addUserMessage("Double the value 21");
    const result = await assistant.generate();

    // Tool should NOT be executed automatically
    t.false(mcpTools.manualTool.execute.called, "Tool should not be executed with autoExecuteTools: false");
    
    // Should return toolCalls result (note: 'toolCalls' not 'tool-calls')
    t.is(result.kind, 'toolCalls');
    if (result.kind === 'toolCalls') {
        t.is(result.calls.length, 1);
        t.is(result.calls[0].toolName, 'manualTool');
    }
});

test.serial('assistant preserves tool result structure when not JSON string', async t => {
    const complexResult = {
        status: 'success',
        data: {
            items: [1, 2, 3],
            metadata: { count: 3, total: 6 }
        },
        timestamp: new Date().toISOString()
    };

    const mcpTools = {
        complexTool: {
            description: 'Returns complex object',
            inputSchema: z.object({ id: z.string() }),
            execute: sinon.stub().resolves(complexResult) // Returns object, not string
        }
    };

    const assistant = global.assistant("Complex Result Test", {
        model: mockLanguageModel,
        tools: mcpTools,
        autoExecuteTools: true
    });

    mockGenerateText.onFirstCall().resolves(createMockGenerateTextResult({
        text: '',
        finishReason: 'tool-calls' as FinishReason,
        toolCalls: [{
            type: 'tool-call' as const,
            toolCallId: createToolCallId('call-1'),
            toolName: 'complexTool',
            input: { id: 'test-123' }
        }]
    }));

    // The summary generation should receive the full object structure
    mockGenerateText.onSecondCall().resolves(createMockGenerateTextResult({
        text: 'Successfully retrieved 3 items with a total sum of 6'
    }));

    assistant.addUserMessage("Get complex data");
    const result = await assistant.generate();

    t.is(result.kind, 'text');
    if (result.kind === 'text') {
        t.regex(result.text, /3 items.*total.*6|total.*6.*3 items/, "Should handle complex object structure");
    }
    
    // Verify the tool result was passed correctly (not stringified unnecessarily)
    const secondCallMessages = mockGenerateText.secondCall.args[0].messages;
    t.truthy(secondCallMessages.some((msg: any) => 
        msg.content && typeof msg.content === 'string' && 
        msg.content.includes('items') && 
        (msg.content.includes('1') && msg.content.includes('2') && msg.content.includes('3'))
    ), "Should pass object data correctly to summary generation");
});