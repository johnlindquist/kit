#!/usr/bin/env node

// Test script with dummy SDK functions to figure out MCP integration
import { experimental_createMCPClient, generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { homedir } from 'os';

// Load environment variables from ~/.kenv/.env
dotenv.config({ path: resolve(homedir(), '.kenv', '.env') });

if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY not found in ~/.kenv/.env');
  process.exit(1);
}

// Dummy MCP function (mimics SDK's mcp())
function mcp(options) {
  console.log('Creating MCP client with options:', options);
  
  return {
    connect: async (transport) => {
      console.log('Connecting to MCP with transport:', transport);
      // This would normally store the client internally
    },
    tools: async () => {
      // In real implementation, this would return client.tools()
      // For now, we'll create the client here
      const client = await experimental_createMCPClient({
        transport: transport
      });
      return await client.tools();
    },
    _client: null, // Store the actual client
    close: async () => {
      if (this._client) {
        await this._client.close();
      }
    }
  };
}

// Global transport config (will be set in connect)
let globalTransport = null;

// Modified mcp function that stores transport
function createMcpWrapper(options) {
  let mcpClient = null;
  
  return {
    connect: async (transport) => {
      console.log('Connecting to MCP with transport:', transport);
      globalTransport = transport;
      mcpClient = await experimental_createMCPClient({ transport });
      return mcpClient;
    },
    tools: async () => {
      if (!mcpClient) {
        throw new Error('MCP client not connected. Call connect() first.');
      }
      return await mcpClient.tools();
    },
    close: async () => {
      if (mcpClient) {
        await mcpClient.close();
      }
    }
  };
}

// Dummy assistant function (mimics SDK's assistant())
function assistant(systemPrompt, options = {}) {
  const messages = [
    { role: 'system', content: systemPrompt }
  ];
  
  let abortController = null;
  let lastInteraction = null;
  
  const instance = {
    messages,
    
    addUserMessage: (content) => {
      messages.push({ role: 'user', content });
    },
    
    addSystemMessage: (content) => {
      messages.push({ role: 'system', content });
    },
    
    addAssistantMessage: (text, options) => {
      // This is where the SDK might be having issues
      // For now, just add text messages
      if (text) {
        messages.push({ role: 'assistant', content: text });
      }
    },
    
    generate: async () => {
      try {
        console.log('\n=== GENERATE CALLED ===');
        console.log('Messages:', JSON.stringify(messages, null, 2));
        console.log('Options:', options);
        
        // Key insight: Just pass everything to generateText and let it handle tool execution
        const result = await generateText({
          model: openai('gpt-4o'),
          messages: [...messages], // Copy to avoid mutation
          tools: options.tools,
          maxSteps: options.autoExecuteTools ? 5 : 1,
          onStepFinish: (step) => {
            console.log('\n=== STEP FINISHED ===');
            console.log('Step index:', step.stepIndex);
            console.log('Step type:', step.stepType);
            console.log('Finish reason:', step.finishReason);
            console.log('Tool calls:', step.toolCalls?.length || 0);
            console.log('Text:', step.text || '(none)');
            if (step.toolResults) {
              console.log('Tool results:', step.toolResults.length);
              step.toolResults.forEach((tr, i) => {
                console.log(`  Result ${i}: ${JSON.stringify(tr).slice(0, 100)}...`);
              });
            }
          }
        });
        
        console.log('\n=== GENERATE RESULT ===');
        console.log('Text:', result.text || '(none)');
        console.log('Finish reason:', result.finishReason);
        console.log('Steps:', result.steps?.length || 0);
        console.log('All steps:');
        result.steps?.forEach((step, i) => {
          console.log(`  Step ${i}: finishReason=${step.finishReason}, text=${step.text ? 'yes' : 'no'}, toolCalls=${step.toolCalls?.length || 0}`);
        });
        
        // Store last interaction
        lastInteraction = {
          finishReason: result.finishReason,
          toolCalls: result.toolCalls,
          text: result.text,
          usage: result.usage
        };
        
        // Add the final response to messages if it's text
        if (result.text) {
          messages.push({ role: 'assistant', content: result.text });
        }
        
        return {
          kind: result.text ? 'text' : 'error',
          text: result.text,
          error: !result.text ? 'No text generated' : undefined
        };
      } catch (error) {
        console.error('Generate error:', error);
        return {
          kind: 'error',
          error: error.message
        };
      }
    },
    
    get textStream() {
      return (async function* () {
        try {
          console.log('\n=== TEXT STREAM CALLED ===');
          console.log('Messages:', JSON.stringify(messages, null, 2));
          
          const result = streamText({
            model: openai('gpt-4o'),
            messages: [...messages],
            tools: options.tools,
            maxSteps: options.autoExecuteTools ? 5 : 1,
          });
          
          let fullText = '';
          for await (const chunk of result.textStream) {
            fullText += chunk;
            yield chunk;
          }
          
          // Wait for the full stream to complete to get final result
          const finalResult = await result;
          
          console.log('\n=== STREAM COMPLETE ===');
          console.log('Full text:', fullText || '(none)');
          console.log('Finish reason:', finalResult.finishReason);
          
          lastInteraction = {
            finishReason: finalResult.finishReason,
            toolCalls: finalResult.toolCalls,
            text: fullText,
            usage: finalResult.usage
          };
          
          // Add final text to messages
          if (fullText) {
            messages.push({ role: 'assistant', content: fullText });
          }
          
        } catch (error) {
          console.error('Stream error:', error);
          throw error;
        }
      })();
    },
    
    stop: () => {
      if (abortController) {
        abortController.abort();
      }
    },
    
    get lastInteraction() {
      return lastInteraction;
    },
    
    get autoExecuteTools() {
      return options.autoExecuteTools !== false;
    }
  };
  
  return instance;
}

// Dummy editor function
async function editor(content) {
  console.log('\n=== EDITOR OUTPUT ===');
  console.log(content);
  return content;
}

// Main test
async function runTest() {
  console.log('\n=== STARTING TEST ===\n');
  
  const client = createMcpWrapper({ name: "pieces" });
  
  await client.connect({
    type: "sse",
    url: "http://localhost:39300/model_context_protocol/2024-11-05/sse"
  });
  
  const tools = await client.tools();
  console.log(`Connected to MCP with ${Object.keys(tools).length} tools`);
  
  // Test 1: Using generate()
  console.log('\n\n=== TEST 1: Using generate() ===');
  const assistant1 = assistant('Your role is to search the pieces MCP for what I\'ve been working on.', {
    tools,
    autoExecuteTools: true
  });
  
  assistant1.addUserMessage('Summarize what I\'ve been working on for the past four hours.');
  
  const result1 = await assistant1.generate();
  console.log('\nGenerate result:', result1);
  
  if (result1.kind === 'text') {
    await editor(result1.text);
  } else {
    await editor(`Error: ${result1.error}`);
  }
  
  // Test 2: Using textStream
  console.log('\n\n=== TEST 2: Using textStream ===');
  const assistant2 = assistant('Your role is to search the pieces MCP for what I\'ve been working on.', {
    tools,
    autoExecuteTools: true
  });
  
  assistant2.addUserMessage('What have I been working on for the past four hours?');
  
  console.log('Streaming response...');
  let streamedContent = '';
  try {
    for await (const chunk of assistant2.textStream) {
      process.stdout.write(chunk);
      streamedContent += chunk;
    }
  } catch (error) {
    console.error('\nStream error:', error);
  }
  
  console.log('\n\nFinal streamed content:', streamedContent || '(none)');
  
  if (assistant2.lastInteraction) {
    console.log('\nLast interaction:');
    console.log('- Finish reason:', assistant2.lastInteraction.finishReason);
    console.log('- Tool calls:', assistant2.lastInteraction.toolCalls?.length || 0);
  }
  
  await client.close();
  console.log('\n✓ MCP client closed');
}

// Run the test
runTest().catch(console.error);