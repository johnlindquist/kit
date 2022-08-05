import { Octokit as OctokitCore } from "@octokit/core"
import { paginateRest } from "@octokit/plugin-paginate-rest"
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods"
import { retry } from "@octokit/plugin-retry"
import { throttling } from "@octokit/plugin-throttling"

import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device"
import { kitPath } from "../core/utils.js"

let kitAppDb = await db(kitPath("db", "app.json"))
let VERSION = kitAppDb.version

export type StrategyOptions = {
  /** Client ID for your OAuth app */
  clientId?: string
  /**
   * list of [OAuth scopes](https://docs.github.com/en/developers/apps/scopes-for-oauth-apps#available-scopes).
   * Defaults to no scopes.
   */
  scopes?: string[]
  /**
   * Custom environment variable name.
   * defaults to `GITHUB_TOKEN_SCOPE1_SCOPE2_etc`
   */
  env?: string | false
}

let DEFAULT_CLIENT_ID = "149153b71e602700c2f2"
let ENV_TOKEN_PREFIX = "GITHUB_TOKEN"

let w = null
function createScriptKitAuth({
  clientId = DEFAULT_CLIENT_ID,
  scopes = [],
  env,
}: StrategyOptions) {
  let deviceAuth = createOAuthDeviceAuth({
    clientType: "oauth-app",
    clientId: clientId,
    scopes,
    async onVerification(verification) {
      await open(verification.verification_uri)
      global.copy(verification.user_code)
      w = await global.widget(
        md(
          `### Open <a href="${verification.verification_uri}">${verification.verification_uri}</a>

Verification code <code>${verification.user_code}</code> copied to clipboard`.trim()
        ),
        {
          width: 420,
          height: 120,
        }
      )
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
  envVariableName: string,
  clientId: string,
  scopes: string[],
  deviceAuth: any
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
  envVariableName: string,
  deviceAuth: any,
  request: any,
  route: any,
  parameters?: any
): Promise<any> {
  let endpoint = request.endpoint.merge(
    route as string,
    parameters
  )

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
    .then(async (response: any) => {
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

function scopesToEnvName(scopes: string[]) {
  if (scopes.length === 0)
    return `${ENV_TOKEN_PREFIX}_NO_SCOPES`

  return [ENV_TOKEN_PREFIX, ...scopes.sort()]
    .join("_")
    .toUpperCase()
}

export let Octokit = OctokitCore.plugin(
  restEndpointMethods,
  paginateRest,
  retry,
  throttling
).defaults({
  authStrategy: createScriptKitAuth,
  userAgent: `scriptkit-octokit/${VERSION}`,
  throttle: {
    onRateLimit,
    onAbuseLimit,
  },
})

// istanbul ignore next no need to test internals of the throttle plugin
function onRateLimit(
  retryAfter: number,
  options: any,
  octokit: any
) {
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
function onAbuseLimit(
  retryAfter: number,
  options: any,
  octokit: any
) {
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
