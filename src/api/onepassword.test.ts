import test from "ava"
import sinon from "sinon"
import { pathToFileURL } from "url"
import { createRequire } from "module"
import { Channel } from "../core/enum.js"

// Store original globals
const originalExec = global.exec
const originalMini = global.mini
const originalLog = global.log
const originalEnv = global.env
const originalSend = global.send

// Create stubs
let execStub: sinon.SinonStub
let miniStub: sinon.SinonStub
let logStub: sinon.SinonStub
let envStub: sinon.SinonStub
let sendStub: sinon.SinonStub

// Helper to clear module cache
const clearModuleCache = () => {
    const require = createRequire(import.meta.url)
    const onepasswordPath = require.resolve("../api/onepassword.js")
    const globalsPath = require.resolve("../globals/index.js")

    // Convert to file URLs for ESM
    const onepasswordUrl = pathToFileURL(onepasswordPath).href
    const globalsUrl = pathToFileURL(globalsPath).href

    // Clear from both require cache and import cache
    delete require.cache[onepasswordPath]
    delete require.cache[globalsPath]

    // For ESM modules, we need to append a timestamp to force re-import
    return {
        onepasswordUrl: `${onepasswordUrl}?t=${Date.now()}`,
        globalsUrl: `${globalsUrl}?t=${Date.now()}`
    }
}

test.beforeEach((t) => {
    // Create fresh stubs
    execStub = sinon.stub()
    miniStub = sinon.stub()
    logStub = sinon.stub()
    envStub = sinon.stub()
    sendStub = sinon.stub()

    // Create a basic env function if it doesn't exist
    if (!global.env) {
        global.env = async (key: string) => process.env[key]
    }

    // Apply stubs to global
    global.exec = execStub as any
    global.mini = miniStub as any
    global.log = logStub as any
    global.send = sendStub as any

    // Store in context for tests
    t.context = { execStub, miniStub, logStub, envStub, sendStub }
    
    // Clear any existing env vars from previous tests
    Object.keys(process.env).forEach(key => {
        if (key.startsWith('OP_')) {
            delete process.env[key]
        }
    })
})

test.afterEach.always(() => {
    // Restore all originals
    global.exec = originalExec
    global.mini = originalMini
    global.log = originalLog
    global.send = originalSend

    // Clear sinon stubs
    sinon.restore()

    // Reset any modified globals
    if (global.op) delete (global as any).op
    if (global.env !== originalEnv) global.env = originalEnv
    
    // Clear any test env vars
    Object.keys(process.env).forEach(key => {
        if (key.startsWith('OP_') || key.startsWith('TEST_')) {
            delete process.env[key]
        }
    })
})


test.serial("op() should retrieve secret from default vault", async (t) => {
    const { execStub } = t.context as any

    // Setup mocks for successful flow
    execStub.withArgs('op --version', sinon.match.any).resolves({ stdout: "2.30.0" })
    execStub.withArgs('op account list', sinon.match.any).resolves({ stdout: "account info" })
    execStub.withArgs('op read "op://GitHub Token/password"', sinon.match.any).resolves({
        stdout: "ghp_abc123def456\n"
    })

    // Import with cache busting
    const { onepasswordUrl } = clearModuleCache()
    await import(onepasswordUrl)

    const token = await global.op("GitHub Token")
    t.is(token, "ghp_abc123def456")

    // Verify exec was called with correct arguments
    t.true(execStub.calledWith('op read "op://GitHub Token/password"'))
})

test.serial("op() should handle vault and field specification", async (t) => {
    const { execStub } = t.context as any

    execStub.withArgs('op --version', sinon.match.any).resolves({ stdout: "2.30.0" })
    execStub.withArgs('op account list', sinon.match.any).resolves({ stdout: "account info" })
    execStub.withArgs('op read "op://dev-vault/API Key/credential"', sinon.match.any).resolves({
        stdout: "sk-1234567890abcdef\n"
    })

    const { onepasswordUrl } = clearModuleCache()
    await import(onepasswordUrl)

    const apiKey = await global.op("API Key", "dev-vault", "credential")
    t.is(apiKey, "sk-1234567890abcdef")
})

test.serial("op() should handle authentication errors and fall back to manual input", async (t) => {
    const { execStub, miniStub, logStub } = t.context as any

    // CLI is available but not authenticated
    execStub.withArgs('op --version', sinon.match.any).resolves({ stdout: "2.30.0" })
    execStub.withArgs('op account list', sinon.match.any).rejects(new Error("not authenticated"))
    execStub.withArgs('op signin', sinon.match.any).rejects(new Error("signin failed"))

    // Setup mini to return fallback value
    miniStub.resolves("manual-fallback-value")

    const { onepasswordUrl } = clearModuleCache()
    await import(onepasswordUrl)

    const result = await global.op("GitHub Token")
    t.is(result, "manual-fallback-value")

    // Verify error was logged
    t.true(logStub.called)

    // Verify mini was called with correct prompt
    t.true(miniStub.calledOnce)
    const miniCall = miniStub.firstCall.args[0]
    t.truthy(miniCall.secret) // Should be a secret input
    t.regex(miniCall.placeholder, /GitHub Token/) // Should mention the item name
})

test.serial("op() should cache results for subsequent calls", async (t) => {
    const { execStub } = t.context as any

    execStub.withArgs('op --version', sinon.match.any).resolves({ stdout: "2.30.0" })
    execStub.withArgs('op account list', sinon.match.any).resolves({ stdout: "account info" })
    execStub.withArgs('op read "op://API Token/password"', sinon.match.any).resolves({
        stdout: "cached-secret-123\n"
    })

    const { onepasswordUrl } = clearModuleCache()
    await import(onepasswordUrl)

    // First call
    const result1 = await global.op("API Token")
    t.is(result1, "cached-secret-123")

    // Second call - should use cache
    const result2 = await global.op("API Token")
    t.is(result2, "cached-secret-123")

    // Verify op read was only called once
    const readCalls = execStub.getCalls().filter((call: any) =>
        call.args[0].includes('op read')
    )
    t.is(readCalls.length, 1)
})

test.serial("env() should detect and handle 1Password references", async (t) => {
    const { execStub } = t.context as any

    execStub.withArgs('op --version', sinon.match.any).resolves({ stdout: "2.30.0" })
    execStub.withArgs('op account list', sinon.match.any).resolves({ stdout: "account info" })
    execStub.withArgs('op read "op://dev-vault/API Key/password"', sinon.match.any).resolves({
        stdout: "secret-value\n"
    })

    const { onepasswordUrl } = clearModuleCache()
    await import(onepasswordUrl)

    const secret = await global.env("op://dev-vault/API Key/password")
    t.is(secret, "secret-value")
})

test.serial("env() should handle shorthand 1Password references", async (t) => {
    const { execStub } = t.context as any

    execStub.withArgs('op --version', sinon.match.any).resolves({ stdout: "2.30.0" })
    execStub.withArgs('op account list', sinon.match.any).resolves({ stdout: "account info" })
    execStub.withArgs('op read "op://GitHub Token/password"', sinon.match.any).resolves({
        stdout: "shorthand-secret\n"
    })

    const { onepasswordUrl } = clearModuleCache()
    await import(onepasswordUrl)

    const secret = await global.env("1p:GitHub Token")
    t.is(secret, "shorthand-secret")
})

test.serial("env() should preserve normal environment variable behavior", async (t) => {
    const { execStub } = t.context as any

    // Set a test env variable
    process.env.TEST_VAR = "test-value"

    // Setup a mock env function that returns the env variable
    const originalEnvImpl = async (key: string) => process.env[key] || ""
    global.env = originalEnvImpl

    // Import with cache busting
    const { onepasswordUrl } = clearModuleCache()
    await import(onepasswordUrl)

    // Should not call 1Password for regular env vars
    const value = await global.env("TEST_VAR")
    t.is(value, "test-value")

    // Verify no 1Password commands were called
    t.false(execStub.called)

    // Cleanup
    delete process.env.TEST_VAR
})

test.serial("op() should handle missing 1Password CLI", async (t) => {
    const { execStub, miniStub } = t.context as any

    // CLI not installed
    execStub.withArgs('op --version', sinon.match.any).rejects(new Error("command not found"))

    // Setup mini to return fallback
    miniStub.resolves("fallback-without-cli")

    const { onepasswordUrl } = clearModuleCache()
    await import(onepasswordUrl)

    const result = await global.op("Some Secret")
    t.is(result, "fallback-without-cli")

    // Verify appropriate error handling
    const miniCall = miniStub.firstCall.args[0]
    t.regex(miniCall.placeholder, /1Password failed/)
})

test.serial("op() should handle custom field names beyond 'password'", async (t) => {
    const { execStub } = t.context as any

    execStub.withArgs('op --version', sinon.match.any).resolves({ stdout: "2.30.0" })
    execStub.withArgs('op account list', sinon.match.any).resolves({ stdout: "account info" })
    execStub.withArgs('op read "op://infrastructure/Database/username"', sinon.match.any).resolves({
        stdout: "db_admin\n"
    })

    const { onepasswordUrl } = clearModuleCache()
    await import(onepasswordUrl)

    const username = await global.op("Database", "infrastructure", "username")
    t.is(username, "db_admin")
})

// New tests for caching functionality

test.serial("op() should check process.env first before calling 1Password", async (t) => {
    const { execStub } = t.context as any
    
    // Pre-set an environment variable
    process.env.OP_GITHUB_TOKEN_PASSWORD = "cached-from-env"
    
    const { onepasswordUrl } = clearModuleCache()
    await import(onepasswordUrl)
    
    const token = await global.op("GitHub Token")
    t.is(token, "cached-from-env")
    
    // Verify no 1Password commands were called
    t.false(execStub.called)
})

test.serial("op() should set process.env after retrieving from 1Password", async (t) => {
    const { execStub } = t.context as any
    
    execStub.withArgs('op --version', sinon.match.any).resolves({ stdout: "2.30.0" })
    execStub.withArgs('op account list', sinon.match.any).resolves({ stdout: "account info" })
    execStub.withArgs('op read "op://API Token/password"', sinon.match.any).resolves({
        stdout: "new-secret-value\n"
    })
    
    const { onepasswordUrl } = clearModuleCache()
    await import(onepasswordUrl)
    
    // First call retrieves from 1Password
    const result = await global.op("API Token")
    t.is(result, "new-secret-value")
    
    // Check that process.env was set
    t.is(process.env.OP_API_TOKEN_PASSWORD, "new-secret-value")
})

test.serial("op() should send cache request to app with until-quit duration", async (t) => {
    const { execStub, sendStub } = t.context as any
    
    execStub.withArgs('op --version', sinon.match.any).resolves({ stdout: "2.30.0" })
    execStub.withArgs('op account list', sinon.match.any).resolves({ stdout: "account info" })
    execStub.withArgs('op read "op://dev-vault/API Key/credential"', sinon.match.any).resolves({
        stdout: "api-key-123\n"
    })
    
    const { onepasswordUrl } = clearModuleCache()
    await import(onepasswordUrl)
    
    const apiKey = await global.op("API Key", "dev-vault", "credential", { 
        cacheDuration: 'until-quit' 
    })
    
    t.is(apiKey, "api-key-123")
    
    // Verify send was called with correct channel and data
    t.true(sendStub.calledOnce)
    const [channelUsed, data] = sendStub.firstCall.args
    t.is(channelUsed, Channel.CACHE_ENV_VAR)
    t.deepEqual(data, {
        key: "OP_DEV_VAULT_API_KEY_CREDENTIAL",
        value: "api-key-123",
        duration: "until-quit"
    })
})

test.serial("op() should not send cache request for session duration", async (t) => {
    const { execStub, sendStub } = t.context as any
    
    execStub.withArgs('op --version', sinon.match.any).resolves({ stdout: "2.30.0" })
    execStub.withArgs('op account list', sinon.match.any).resolves({ stdout: "account info" })
    execStub.withArgs('op read "op://Session Token/password"', sinon.match.any).resolves({
        stdout: "session-only\n"
    })
    
    const { onepasswordUrl } = clearModuleCache()
    await import(onepasswordUrl)
    
    // Default is 'session' duration
    await global.op("Session Token")
    
    // Verify send was NOT called for session duration
    t.false(sendStub.called)
})

test.serial("env() should support cache duration options for 1Password references", async (t) => {
    const { execStub, sendStub } = t.context as any
    
    execStub.withArgs('op --version', sinon.match.any).resolves({ stdout: "2.30.0" })
    execStub.withArgs('op account list', sinon.match.any).resolves({ stdout: "account info" })
    execStub.withArgs('op read "op://prod/Database/password"', sinon.match.any).resolves({
        stdout: "db-password\n"
    })
    
    const { onepasswordUrl } = clearModuleCache()
    await import(onepasswordUrl)
    
    const password = await global.env("op://prod/Database/password", { 
        cacheDuration: 'until-sleep' 
    })
    
    t.is(password, "db-password")
    
    // Verify cache request was sent
    t.true(sendStub.calledOnce)
    const [channelUsed, data] = sendStub.firstCall.args
    t.is(channelUsed, Channel.CACHE_ENV_VAR)
    t.deepEqual(data, {
        key: "OP_PROD_DATABASE_PASSWORD",
        value: "db-password",
        duration: "until-sleep"
    })
})

test.serial("createEnvVarName should handle special characters correctly", async (t) => {
    const { execStub } = t.context as any
    
    execStub.withArgs('op --version', sinon.match.any).resolves({ stdout: "2.30.0" })
    execStub.withArgs('op account list', sinon.match.any).resolves({ stdout: "account info" })
    execStub.withArgs('op read "op://my-vault/API-Key.2023/secret_field"', sinon.match.any).resolves({
        stdout: "special-secret\n"
    })
    
    const { onepasswordUrl } = clearModuleCache()
    await import(onepasswordUrl)
    
    await global.op("API-Key.2023", "my-vault", "secret_field")
    
    // Check that the env var name was properly sanitized
    t.is(process.env.OP_MY_VAULT_API_KEY_2023_SECRET_FIELD, "special-secret")
})