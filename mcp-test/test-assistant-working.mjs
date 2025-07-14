#!/usr/bin/env node

// Test script based on our working workaround approach
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

// Assistant function that mimics SDK but uses the working approach
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
        console.log('\n=== GENERATE CALLED (Working Approach) ===');
        
        // Step 1: Get AI to decide which tool to use
        console.log('Step 1: Initial generation to discover tool calls...');
        const toolDiscoveryResult = await generateText({
          model: openai('gpt-4o'),
          messages: [...messages],
          tools: options.tools,
          // NO maxSteps - just get the tool calls
        });
        
        console.log('Tool discovery result:');
        console.log('- Finish reason:', toolDiscoveryResult.finishReason);
        console.log('- Tool calls:', toolDiscoveryResult.toolCalls?.length || 0);
        
        // If no tools were called, return the text
        if (toolDiscoveryResult.finishReason === 'stop' && toolDiscoveryResult.text) {
          messages.push({ role: 'assistant', content: toolDiscoveryResult.text });
          return {
            kind: 'text',
            text: toolDiscoveryResult.text
          };
        }
        
        // Step 2: If tools were called, execute them manually
        if (toolDiscoveryResult.toolCalls && toolDiscoveryResult.toolCalls.length > 0 && options.autoExecuteTools) {
          console.log('\nStep 2: Executing tools manually...');
          
          const toolCall = toolDiscoveryResult.toolCalls[0]; // For simplicity, handle first tool
          console.log(`Executing tool: ${toolCall.toolName}`);
          
          const tool = options.tools[toolCall.toolName];
          let toolResult;
          
          if (tool && tool.execute) {
            try {
              toolResult = await tool.execute(toolCall.args);
              console.log('Tool executed successfully');
              
              // Parse JSON if needed
              if (typeof toolResult === 'string') {
                try {
                  toolResult = JSON.parse(toolResult);
                } catch (e) {
                  // Keep as string if parsing fails
                }
              }
            } catch (error) {
              console.error('Tool execution error:', error);
              toolResult = { error: error.message };
            }
          }
          
          // Step 3: Generate summary with tool results
          console.log('\nStep 3: Generating summary with tool results...');
          const summaryMessages = [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes work activity data. Provide clear, concise summaries.'
            },
            {
              role: 'user',
              content: `The user asked: "${messages[messages.length - 1].content}"
              
The tool "${toolCall.toolName}" returned:
${JSON.stringify(toolResult, null, 2)}

Please provide a helpful summary of this information. If the data shows no recent activity, explain that clearly.`
            }
          ];
          
          const summaryResult = await generateText({
            model: openai('gpt-4o'),
            messages: summaryMessages,
          });
          
          console.log('Summary generation result:');
          console.log('- Finish reason:', summaryResult.finishReason);
          console.log('- Has text:', !!summaryResult.text);
          
          if (summaryResult.text) {
            messages.push({ role: 'assistant', content: summaryResult.text });
          }
          
          return {
            kind: summaryResult.text ? 'text' : 'error',
            text: summaryResult.text || '',
            error: !summaryResult.text ? 'No summary generated' : undefined
          };
        }
        
        // Fallback
        return {
          kind: 'error',
          error: 'No text generated and no tools executed'
        };
        
      } catch (error) {
        console.error('Generate error:', error);
        return {
          kind: 'error',
          error: error.message
        };
      }
    },
    
    // Simplified text stream for testing
    get textStream() {
      return (async function* () {
        const result = await instance.generate();
        if (result.kind === 'text' && result.text) {
          yield result.text;
        }
      })();
    }
  };
  
  return instance;
}

// Main test
async function runTest() {
  console.log('\n=== STARTING WORKING APPROACH TEST ===\n');
  
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
    
    // Test with working approach
    const assist = assistant('Your role is to search the pieces MCP for what I\'ve been working on.', {
      tools,
      autoExecuteTools: true
    });
    
    assist.addUserMessage('Summarize what I\'ve been working on for the past four hours.');
    
    const result = await assist.generate();
    
    console.log('\n=== FINAL RESULT ===');
    console.log('Kind:', result.kind);
    if (result.text) {
      console.log('\nGenerated text:');
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