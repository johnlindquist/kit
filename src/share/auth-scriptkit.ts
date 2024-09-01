import { Octokit as OctokitCore } from "@octokit/core"
import { paginateRest } from "@octokit/plugin-paginate-rest"
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods"
import { retry } from "@octokit/plugin-retry"
import { throttling } from "@octokit/plugin-throttling"

import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device"
import { kitPath } from "../core/utils.js"
import type { WidgetAPI } from "../types/pro.js"

let kitAppDb = await db<{ version: string }>(kitPath("db", "app.json"))
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

let authWidget: WidgetAPI = null
function createScriptKitAuth({
	clientId = DEFAULT_CLIENT_ID,
	scopes = [],
	env
}: StrategyOptions) {
	let deviceAuth = createOAuthDeviceAuth({
		clientType: "oauth-app",
		clientId: clientId,
		scopes,
		async onVerification(verification) {
			await open(verification.verification_uri)
			global.copy(verification.user_code)
			let content = `## 🔐 Authenticating with GitHub 

## <a class="text-primary ring-0 ring-opacity-0 focus:ring-0 focus:ring-opacity-0 focus:outline-none outline-none"  href="${verification.verification_uri}">${verification.verification_uri}</a>
            
<p class="pt-2"/>
Code copied to clipboard: <code class="text-primary font-mono font-bold no-drag">${verification.user_code}</code>

<ol class="text-sm pt-3 ml-4 mb-4">
    <li>Paste the code on https://github.com/login/device</li>
    <li>Click "Continue"</li>
    <li>Click "Authorize"</li>
    <li>Script Kit should automatically re-open</li>
</ol>

`
			let containerClass =
				"px-8 bg-bg-base text-text-base h-screen w-screen flex flex-col justify-center bg-opacity"

			authWidget = await global.widget(md(content, containerClass), {
				width: 420,
				height: 250,
				alwaysOnTop: true
			})

			authWidget.onClose(() => {
				global.log("Auth widget closed")
			})

			authWidget.call("setVisibleOnAllWorkspaces", true)
		}
	})

	let envVariableName = env || scopesToEnvName(scopes)

	return Object.assign(
		auth.bind(null, envVariableName, clientId, scopes, deviceAuth),
		{
			hook: hook.bind(null, envVariableName, deviceAuth)
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
			scopes
		}
	}

	let result = await deviceAuth({ type: "oauth" })
	if (authWidget) authWidget?.close()

	await global.cli("set-env-var", envVariableName, result.token)

	return result
}

function hook(
	envVariableName: string,
	deviceAuth: any,
	request: any,
	route: any,
	parameters?: any
): Promise<any> {
	let endpoint = request.endpoint.merge(route as string, parameters)

	// Do not intercept request to retrieve codes or token
	if (/\/login\/(oauth\/access_token|device\/code)$/.test(endpoint.url)) {
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
			if (authWidget) authWidget?.close()
			await global.cli("set-env-var", envVariableName, result.token)

			return response
		})
}

function scopesToEnvName(scopes: string[]) {
	if (scopes.length === 0) return `${ENV_TOKEN_PREFIX}_NO_SCOPES`

	return [ENV_TOKEN_PREFIX, ...scopes.sort()].join("_").toUpperCase()
}

// @ts-ignore
export let Octokit: any = OctokitCore.plugin(
	restEndpointMethods,
	paginateRest,
	retry,
	throttling
).defaults({
	authStrategy: createScriptKitAuth,
	userAgent: `scriptkit-octokit/${VERSION}`,
	throttle: {
		enabled: true,
		onRateLimit,
		onSecondaryRateLimit: onAbuseLimit
	}
})

// istanbul ignore next no need to test internals of the throttle plugin
function onRateLimit(retryAfter: number, options: any, octokit: any) {
	octokit.log.warn(
		`Request quota exhausted for request ${options.method} ${options.url}`
	)

	if (options.request.retryCount === 0) {
		// only retries once
		octokit.log.info(`Retrying after ${retryAfter} seconds!`)
		return true
	}
}

// istanbul ignore next no need to test internals of the throttle plugin
function onAbuseLimit(retryAfter: number, options: any, octokit: any) {
	octokit.log.warn(
		`Abuse detected for request ${options.method} ${options.url}`
	)

	if (options.request.retryCount === 0) {
		// only retries once
		octokit.log.info(`Retrying after ${retryAfter} seconds!`)
		return true
	}
}
