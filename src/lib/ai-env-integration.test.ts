import ava from 'ava'
import { resolveModel } from './ai'
import '../api/global.js'

// This is a simple integration test to verify the basic functionality
// For full unit testing, we would need to refactor the ai.ts module
// to allow dependency injection of the apiKeyCache

ava('resolveModel should create OpenAI model when API key exists', async t => {
    // Set API key
    process.env.OPENAI_API_KEY = 'test-openai-key'
    
    try {
        const model = await resolveModel('gpt-4')
        
        // Verify model was created
        t.truthy(model)
        t.is(model.provider, 'openai.chat')
        t.is(model.modelId, 'gpt-4')
    } finally {
        delete process.env.OPENAI_API_KEY
    }
})

ava('resolveModel should create Anthropic model with prefix', async t => {
    // Set API key
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
    
    try {
        const model = await resolveModel('anthropic:claude-3-opus-20240229')
        
        // Verify model was created
        t.truthy(model)
        t.is(model.provider, 'anthropic.messages')
        t.is(model.modelId, 'claude-3-opus-20240229')
    } finally {
        delete process.env.ANTHROPIC_API_KEY
    }
})

ava('resolveModel should use default provider when no prefix', async t => {
    // Set API key for default provider (openai)
    process.env.OPENAI_API_KEY = 'test-openai-key'
    process.env.KIT_AI_DEFAULT_PROVIDER = 'openai'
    
    try {
        const model = await resolveModel('some-model')
        
        // Verify model was created with default provider
        t.truthy(model)
        t.is(model.provider, 'openai.chat')
        t.is(model.modelId, 'some-model')
    } finally {
        delete process.env.OPENAI_API_KEY
        delete process.env.KIT_AI_DEFAULT_PROVIDER
    }
})

ava('resolveModel should handle explicit provider parameter', async t => {
    // Set API key
    process.env.GOOGLE_API_KEY = 'test-google-key'
    
    try {
        const model = await resolveModel('gemini-pro', 'google')
        
        // Verify model was created with explicit provider
        t.truthy(model)
        t.is(model.provider, 'google.generative-ai')
        t.is(model.modelId, 'gemini-pro')
    } finally {
        delete process.env.GOOGLE_API_KEY
    }
})

// Note: Testing the actual prompting behavior would require:
// 1. Mocking the global.env function properly
// 2. Clearing the internal apiKeyCache between tests
// 3. Potentially refactoring the ai.ts module to support dependency injection
//
// For now, these integration tests verify the basic functionality
// when API keys are already set.