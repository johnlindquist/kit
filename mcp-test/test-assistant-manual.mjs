#!/usr/bin/env node

// Test script with manual tool execution to understand the flow
import { experimental_createMCPClient, generateText } from 'ai';
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

// Dummy assistant function with manual tool execution
function assistant(systemPrompt, options = {}) {
  const messages = [
    { role: 'system', content: systemPrompt }
  ];
  
  let lastInteraction = null;
  
  const instance = {
    messages,
    
    addUserMessage: (content) => {
      messages.push({ role: 'user', content });
    },
    
    generate: async () => {
      try {
        console.log('\n=== GENERATE CALLED ===');
        console.log('Current messages:', messages.length);
        
        let currentMessages = [...messages];
        let finalText = '';
        let maxIterations = options.autoExecuteTools ? 5 : 1;
        let iteration = 0;
        
        while (iteration < maxIterations) {
          iteration++;
          console.log(`\n=== ITERATION ${iteration} ===`);
          
          // Call generateText WITHOUT maxSteps
          const result = await generateText({
            model: openai('gpt-4o'),
            messages: currentMessages,
            tools: options.tools,
            // NO maxSteps - we handle iterations manually
          });
          
          console.log(`Iteration ${iteration} result:`);
          console.log('- Finish reason:', result.finishReason);
          console.log('- Text:', result.text || '(none)');
          console.log('- Tool calls:', result.toolCalls?.length || 0);
          
          // If we got text, we're done
          if (result.finishReason === 'stop' && result.text) {
            finalText = result.text;
            break;
          }
          
          // If tools were called, execute them and continue
          if (result.finishReason === 'tool-calls' && result.toolCalls && options.autoExecuteTools) {
            // Don't add tool calls to messages - AI SDK v5 handles this internally
            // Just execute the tools and let the next iteration handle it
            
            // Execute tools but DON'T add to messages
            console.log('Executing tools without adding to messages...');
            for (const toolCall of result.toolCalls) {
              console.log(`Executing tool: ${toolCall.toolName}`);
              const tool = options.tools[toolCall.toolName];
              if (tool && tool.execute) {
                try {
                  const toolResult = await tool.execute(toolCall.args);
                  console.log('Tool executed successfully');
                } catch (error) {
                  console.error(`Tool execution error:`, error);
                }
              }
            }
            
            // Try a different approach - just continue without modifying messages
            console.log('Continuing to next iteration without modifying messages...');
            
            console.log('Added tool results to messages');
            
            // Continue to next iteration
            continue;
          }
          
          // If we get here, we're done
          break;
        }
        
        // Update our internal messages
        if (finalText) {
          messages.push({ role: 'assistant', content: finalText });
        }
        
        return {
          kind: finalText ? 'text' : 'error',
          text: finalText,
          error: !finalText ? 'No text generated after tool execution' : undefined
        };
        
      } catch (error) {
        console.error('Generate error:', error);
        return {
          kind: 'error',
          error: error.message
        };
      }
    }
  };
  
  return instance;
}

// Main test
async function runTest() {
  console.log('\n=== STARTING MANUAL TOOL EXECUTION TEST ===\n');
  
  let client;
  try {
    client = await experimental_createMCPClient({
      transport: {
        type: "sse",
        url: "http://localhost:39300/model_context_protocol/2024-11-05/sse"
      }
    });
    
    const tools = await client.tools();
    console.log(`Connected to MCP with ${Object.keys(tools).length} tools`);
    
    // Test with manual tool execution
    const assist = assistant('Your role is to search the pieces MCP for what I\'ve been working on.', {
      tools,
      autoExecuteTools: true
    });
    
    assist.addUserMessage('Summarize what I\'ve been working on for the past four hours.');
    
    const result = await assist.generate();
    
    console.log('\n=== FINAL RESULT ===');
    console.log('Kind:', result.kind);
    console.log('Text:', result.text || '(none)');
    console.log('Error:', result.error || '(none)');
    
    if (result.text) {
      console.log('\n=== EDITOR OUTPUT ===');
      console.log(result.text);
    }
    
  } finally {
    if (client) {
      await client.close();
      console.log('\n✓ MCP client closed');
    }
  }
}

// Run the test
runTest().catch(console.error);