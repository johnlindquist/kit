import ava from 'ava'
import { resolveModel } from './ai'
import '../api/global.js'

// This is a simple integration test to verify the basic functionality
// For full unit testing, we would need to refactor the ai.ts module
// to allow dependency injection of the apiKeyCache

ava('resolveModel should create OpenAI model when API key exists', async t => {
    // Skip in CI or when no real API key is available
    if (!process.env.OPENAI_API_KEY || process.env.CI) {
        t.pass('Skipping test - requires OPENAI_API_KEY')
        return
    }
    
    const originalKey = process.env.OPENAI_API_KEY
    
    try {
        const model = await resolveModel('gpt-4')
        
        // Verify model was created
        t.truthy(model)
        if (typeof model !== 'string') {
            t.is(model.provider, 'openai.chat')
            t.is(model.modelId, 'gpt-4')
        } else {
            t.fail('Expected model object, got string')
        }
    } finally {
        process.env.OPENAI_API_KEY = originalKey
    }
})

ava('resolveModel should create Anthropic model with prefix', async t => {
    // Skip in CI or when no real API key is available
    if (!process.env.ANTHROPIC_API_KEY || process.env.CI) {
        t.pass('Skipping test - requires ANTHROPIC_API_KEY')
        return
    }
    
    const originalKey = process.env.ANTHROPIC_API_KEY
    
    try {
        const model = await resolveModel('anthropic:claude-3-opus-20240229')
        
        // Verify model was created
        t.truthy(model)
        if (typeof model !== 'string') {
            t.is(model.provider, 'anthropic.messages')
            t.is(model.modelId, 'claude-3-opus-20240229')
        } else {
            t.fail('Expected model object, got string')
        }
    } finally {
        process.env.ANTHROPIC_API_KEY = originalKey
    }
})

ava('resolveModel should use default provider when no prefix', async t => {
    // Skip in CI or when no real API key is available
    if (!process.env.OPENAI_API_KEY || process.env.CI) {
        t.pass('Skipping test - requires OPENAI_API_KEY')
        return
    }
    
    const originalKey = process.env.OPENAI_API_KEY
    const originalProvider = process.env.KIT_AI_DEFAULT_PROVIDER
    process.env.KIT_AI_DEFAULT_PROVIDER = 'openai'
    
    try {
        const model = await resolveModel('some-model')
        
        // Verify model was created with default provider
        t.truthy(model)
        if (typeof model !== 'string') {
            t.is(model.provider, 'openai.chat')
            t.is(model.modelId, 'some-model')
        } else {
            t.fail('Expected model object, got string')
        }
    } finally {
        process.env.OPENAI_API_KEY = originalKey
        if (originalProvider !== undefined) {
            process.env.KIT_AI_DEFAULT_PROVIDER = originalProvider
        } else {
            delete process.env.KIT_AI_DEFAULT_PROVIDER
        }
    }
})

ava('resolveModel should handle explicit provider parameter', async t => {
    // Skip in CI or when no real API key is available
    if (!process.env.GOOGLE_API_KEY || process.env.CI) {
        t.pass('Skipping test - requires GOOGLE_API_KEY')
        return
    }
    
    const originalKey = process.env.GOOGLE_API_KEY
    
    try {
        const model = await resolveModel('gemini-pro', 'google')
        
        // Verify model was created with explicit provider
        t.truthy(model)
        if (typeof model !== 'string') {
            t.is(model.provider, 'google.generative-ai')
            t.is(model.modelId, 'gemini-pro')
        } else {
            t.fail('Expected model object, got string')
        }
    } finally {
        process.env.GOOGLE_API_KEY = originalKey
    }
})

// Note: Testing the actual prompting behavior would require:
// 1. Mocking the global.env function properly
// 2. Clearing the internal apiKeyCache between tests
// 3. Potentially refactoring the ai.ts module to support dependency injection
//
// For now, these integration tests verify the basic functionality
// when API keys are already set.