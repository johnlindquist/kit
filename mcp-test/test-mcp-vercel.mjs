#!/usr/bin/env node

// Plain Node.js script following Vercel AI SDK docs exactly
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

console.log('OPENAI_API_KEY loaded:', process.env.OPENAI_API_KEY.slice(0, 10) + '...');

let client;

async function main() {
  try {
    // Following the docs exactly for SSE transport
    console.log('\n=== Creating MCP client ===');
    client = await experimental_createMCPClient({
      transport: {
        type: 'sse',
        url: 'http://localhost:39300/model_context_protocol/2024-11-05/sse',
      },
    });

    console.log('✓ Connected to MCP server');

    const tools = await client.tools();
    console.log('✓ Tools retrieved:', Object.keys(tools));

    // Log detailed tool info
    console.log('\n=== Tool Details ===');
    for (const [name, tool] of Object.entries(tools)) {
      console.log(`\nTool: ${name}`);
      console.log('- Has execute:', 'execute' in tool);
      console.log('- Has description:', 'description' in tool);
      console.log('- Has inputSchema:', 'inputSchema' in tool);
      console.log('- Tool keys:', Object.keys(tool));
    }

    // First test with simple example from docs
    console.log('\n\n=== TEST 1: Simple Query ===');
    const response1 = await generateText({
      model: openai('gpt-4o'),
      tools,
      messages: [
        {
          role: 'user',
          content: 'Find products under $100', // Using exact example from docs
        },
      ],
    });

    console.log('\nResponse 1:');
    console.log('- Text:', response1.text || '(none)');
    console.log('- Finish reason:', response1.finishReason);
    console.log('- Steps:', response1.steps?.length || 0);

    // Now try with our actual query
    console.log('\n\n=== TEST 2: Pieces Query ===');
    const response2 = await generateText({
      model: openai('gpt-4o'),
      tools,
      messages: [
        {
          role: 'user',
          content: 'What have I been working on for the past 4 hours?',
        },
      ],
    });

    console.log('\nResponse 2:');
    console.log('- Text:', response2.text || '(none)');
    console.log('- Finish reason:', response2.finishReason);
    console.log('- Steps:', response2.steps?.length || 0);
    
    // Detailed step analysis
    if (response2.steps && response2.steps.length > 0) {
      console.log('\n=== Detailed Steps for Response 2 ===');
      response2.steps.forEach((step, i) => {
        console.log(`\nStep ${i + 1}:`);
        console.log('- Text:', step.text || '(none)');
        console.log('- Tool calls:', step.toolCalls?.length || 0);
        console.log('- Finish reason:', step.finishReason);
        
        if (step.toolCalls) {
          step.toolCalls.forEach((call, j) => {
            console.log(`\n  Tool call ${j + 1}:`);
            console.log(`  - Name: ${call.toolName}`);
            console.log(`  - Call ID: ${call.toolCallId}`);
            console.log(`  - Input:`, JSON.stringify(call.input, null, 2));
          });
        }
        
        if (step.toolResults) {
          step.toolResults.forEach((result, j) => {
            console.log(`\n  Tool result ${j + 1}:`);
            console.log(`  - Call ID: ${result.toolCallId}`);
            const resultStr = result.result ? JSON.stringify(result.result, null, 2) : '(undefined)';
            console.log(`  - Result:`, resultStr.slice(0, 200) + (resultStr.length > 200 ? '...' : ''));
          });
        }
      });
    }

    // Try with system message
    console.log('\n\n=== TEST 3: With System Message ===');
    const response3 = await generateText({
      model: openai('gpt-4o'),
      tools,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. When using tools, always provide a final summary of what you found.',
        },
        {
          role: 'user',
          content: 'What have I been working on for the past 4 hours?',
        },
      ],
    });

    console.log('\nResponse 3:');
    console.log('- Text:', response3.text || '(none)');
    console.log('- Finish reason:', response3.finishReason);

    // Test with explicit maxSteps
    console.log('\n\n=== TEST 4: With maxSteps ===');
    const response4 = await generateText({
      model: openai('gpt-4o'),
      tools,
      maxSteps: 3, // Allow multiple tool calls
      messages: [
        {
          role: 'user',
          content: 'Search for what I have been working on and give me a summary.',
        },
      ],
    });

    console.log('\nResponse 4:');
    console.log('- Text:', response4.text || '(none)');
    console.log('- Finish reason:', response4.finishReason);
    console.log('- Steps:', response4.steps?.length || 0);

    // Test direct tool execution
    console.log('\n\n=== TEST 5: Direct Tool Execution ===');
    try {
      const directResult = await tools.ask_pieces_ltm.execute({
        question: "What have I been working on for the past 4 hours?",
        topics: ["work", "past 4 hours"],
        chat_llm: "gpt-4o-mini",
        connected_client: "Script Kit"
      });
      console.log('Direct tool result:', JSON.stringify(directResult, null, 2));
    } catch (error) {
      console.log('Direct tool error:', error.message);
    }

  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.response) {
      console.error('\nResponse details:');
      console.error('- Status:', error.response.status);
      console.error('- Status text:', error.response.statusText);
      console.error('- Headers:', error.response.headers);
    }
  } finally {
    if (client) {
      await client.close();
      console.log('\n✓ Closed MCP client');
    }
  }
}

// Run the script
main();