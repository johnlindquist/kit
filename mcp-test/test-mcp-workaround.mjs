#!/usr/bin/env node

// Workaround script for MCP tools with AI SDK v5 beta
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
    // Create MCP client
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

    // Workaround: Two-step process
    console.log('\n=== WORKAROUND: Manual Tool Execution + Summary ===');
    
    const userQuery = 'What have I been working on for the past 4 hours?';
    
    // Step 1: Get the AI to decide which tool to use
    console.log('\nStep 1: Planning tool usage...');
    const planningResult = await generateText({
      model: openai('gpt-4o'),
      tools,
      messages: [
        {
          role: 'user',
          content: userQuery,
        },
      ],
    });

    // Step 2: If tool was called, execute it manually and generate summary
    if (planningResult.steps && planningResult.steps[0]?.toolCalls && planningResult.steps[0].toolCalls.length > 0) {
      const toolCall = planningResult.steps[0].toolCalls[0];
      console.log(`\nStep 2: Executing tool ${toolCall.toolName}...`);
      
      // Execute the tool
      const toolResult = await tools[toolCall.toolName].execute(toolCall.input);
      console.log('Tool executed successfully');

      // Step 3: Generate a summary with the tool results
      console.log('\nStep 3: Generating summary...');
      const summaryResult = await generateText({
        model: openai('gpt-4o'),
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes work activity data from Pieces OS. Provide clear, concise summaries of what the user has been working on.',
          },
          {
            role: 'user',
            content: `The user asked: "${userQuery}"
            
The Pieces LTM (Long Term Memory) tool returned the following data:
${JSON.stringify(toolResult, null, 2)}

Please provide a helpful summary of this information. Focus on:
1. Recent activities and applications used
2. Key websites visited
3. Documents or projects worked on
4. Any patterns in the work

If the data shows no recent activity in the requested timeframe, explain that clearly.`,
          },
        ],
      });

      console.log('\n=== FINAL RESULT ===');
      console.log(summaryResult.text);
      
    } else {
      // If no tools were called, just show the direct response
      console.log('\n=== DIRECT RESPONSE (No tools called) ===');
      console.log(planningResult.text);
    }

    // Alternative approach: Using maxSteps with better prompting
    console.log('\n\n=== ALTERNATIVE: Better Prompting with maxSteps ===');
    const result2 = await generateText({
      model: openai('gpt-4o'),
      tools,
      maxSteps: 5,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant with access to tools. IMPORTANT: After using any tool, you MUST provide a text summary of what you found. Never end with just a tool call.',
        },
        {
          role: 'user',
          content: 'Use the ask_pieces_ltm tool to find what I have been working on for the past 4 hours, then summarize the findings.',
        },
      ],
    });

    console.log('\nAlternative Result:');
    console.log('- Text:', result2.text || '(none)');
    console.log('- Steps:', result2.steps?.length || 0);
    console.log('- Finish reason:', result2.finishReason);

  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (client) {
      await client.close();
      console.log('\n✓ Closed MCP client');
    }
  }
}

// Run the script
main();