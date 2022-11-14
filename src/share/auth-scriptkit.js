"use strict"
Object.defineProperty(exports, "__esModule", {
  value: true,
})
exports.Octokit = void 0
const core_1 = require("@octokit/core")
const plugin_paginate_rest_1 = require("@octokit/plugin-paginate-rest")
const plugin_rest_endpoint_methods_1 = require("@octokit/plugin-rest-endpoint-methods")
const plugin_retry_1 = require("@octokit/plugin-retry")
const plugin_throttling_1 = require("@octokit/plugin-throttling")
const auth_oauth_device_1 = require("@octokit/auth-oauth-device")
const utils_js_1 = require("../core/utils.js")
let kitAppDb = await db(
  (0, utils_js_1.kitPath)("db", "app.json")
)
let VERSION = kitAppDb.version
let DEFAULT_CLIENT_ID = "149153b71e602700c2f2"
let ENV_TOKEN_PREFIX = "GITHUB_TOKEN"
let w = null
function createScriptKitAuth({
  clientId = DEFAULT_CLIENT_ID,
  scopes = [],
  env,
}) {
  let deviceAuth = (0,
  auth_oauth_device_1.createOAuthDeviceAuth)({
    clientType: "oauth-app",
    clientId: clientId,
    scopes,
    async onVerification(verification) {
      await open(verification.verification_uri)
      global.copy(verification.user_code)
      w = await global.widget(
        md(
          `## Authenticating... <a class="text-primary-dark dark:text-primary-light ring-0 ring-opacity-0 focus:ring-0 focus:ring-opacity-0 focus:outline-none outline-none"  href="${verification.verification_uri}">${verification.verification_uri}</a>
      
Copied verification code to clipboard: <code>${verification.user_code}</code>`.trim(),
          `p-6 bg-bg-light dark:bg-bg-dark h-screen w-screen flex flex-col justify-center items-center bg-opacity-themelight dark:bg-opacity-themedark`
        ),
        {
          width: 420,
          height: 120,
          alwaysOnTop: true,
        }
      )

      w.call("setVisibleOnAllWorkspaces", true)
    },
  })
  let envVariableName = env || scopesToEnvName(scopes)
  return Object.assign(
    auth.bind(
      null,
      envVariableName,
      clientId,
      scopes,
      deviceAuth
    ),
    {
      hook: hook.bind(null, envVariableName, deviceAuth),
    }
  )
}
async function auth(
  envVariableName,
  clientId,
  scopes,
  deviceAuth
) {
  if (env[envVariableName]) {
    return {
      type: "token",
      tokenType: "oauth",
      clientType: "oauth-app",
      clientId,
      token: env[envVariableName],
      scopes,
    }
  }
  let result = await deviceAuth({ type: "oauth" })
  if (w) w?.close()
  await global.cli(
    "set-env-var",
    envVariableName,
    result.token
  )
  return result
}
function hook(
  envVariableName,
  deviceAuth,
  request,
  route,
  parameters
) {
  let endpoint = request.endpoint.merge(route, parameters)
  // Do not intercept request to retrieve codes or token
  if (
    /\/login\/(oauth\/access_token|device\/code)$/.test(
      endpoint.url
    )
  ) {
    return request(endpoint)
  }
  if (global.env[envVariableName]) {
    endpoint.headers.authorization = `token ${global.env[envVariableName]}`
    return request(endpoint)
  }
  return deviceAuth
    .hook(request, route, parameters)
    .then(async response => {
      let result = await deviceAuth({ type: "oauth" })
      if (w) w?.close()
      await global.cli(
        "set-env-var",
        envVariableName,
        result.token
      )
      return response
    })
}
function scopesToEnvName(scopes) {
  if (scopes.length === 0)
    return `${ENV_TOKEN_PREFIX}_NO_SCOPES`
  return [ENV_TOKEN_PREFIX, ...scopes.sort()]
    .join("_")
    .toUpperCase()
}
exports.Octokit = core_1.Octokit.plugin(
  plugin_rest_endpoint_methods_1.restEndpointMethods,
  plugin_paginate_rest_1.paginateRest,
  plugin_retry_1.retry,
  plugin_throttling_1.throttling
).defaults({
  authStrategy: createScriptKitAuth,
  userAgent: `scriptkit-octokit/${VERSION}`,
  throttle: {
    onRateLimit,
    onAbuseLimit,
  },
})
// istanbul ignore next no need to test internals of the throttle plugin
function onRateLimit(retryAfter, options, octokit) {
  octokit.log.warn(
    `Request quota exhausted for request ${options.method} ${options.url}`
  )
  if (options.request.retryCount === 0) {
    // only retries once
    octokit.log.info(
      `Retrying after ${retryAfter} seconds!`
    )
    return true
  }
}
// istanbul ignore next no need to test internals of the throttle plugin
function onAbuseLimit(retryAfter, options, octokit) {
  octokit.log.warn(
    `Abuse detected for request ${options.method} ${options.url}`
  )
  if (options.request.retryCount === 0) {
    // only retries once
    octokit.log.info(
      `Retrying after ${retryAfter} seconds!`
    )
    return true
  }
}
