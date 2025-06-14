import https from "node:https"
import http from "node:http"
import { URL } from "node:url"

interface DownloadOptions {
	/** Whether to reject unauthorized SSL certificates. Defaults to true. */
	rejectUnauthorized?: boolean
	/** Maximum number of redirects to follow. Defaults to 5. */
	maxRedirects?: number
}

/**
 * Downloads a file from a given URI and returns its contents as a Buffer.
 *
 * @param uri - The URI of the file to download.
 * @param opts - Optional configuration for the download.
 * @returns A Promise that resolves with the file contents as a Buffer.
 * @throws Will throw an error if the download fails or if the server responds with a non-200 status code.
 *
 * @example
 * ```typescript
 * const fileBuffer = await download('https://example.com/file.pdf');
 * console.log(`Downloaded file size: ${fileBuffer.length} bytes`);
 * ```
 */
const download = (uri: string, opts: DownloadOptions = {}): Promise<Buffer> => {
	const { maxRedirects = 5 } = opts

	const followRedirect = (url: string, redirectCount = 0): Promise<Buffer> => {
		console.log(`Downloading ${url}`)

		const options: https.RequestOptions = {
			...opts,
			headers: {
				"User-Agent": "Node.js"
			}
		}

		return new Promise((resolve, reject) => {
			const protocol = url.startsWith("https:") ? https : http
			protocol
				.get(url, options, (res) => {
					if (
						res.statusCode &&
						res.statusCode >= 300 &&
						res.statusCode < 400 &&
						res.headers.location
					) {
						if (redirectCount >= maxRedirects) {
							reject(new Error(`Too many redirects (${maxRedirects})`))
							return
						}
						return resolve(
							followRedirect(
								new URL(res.headers.location, url).toString(),
								redirectCount + 1
							)
						)
					}

					if (res.statusCode !== 200) {
						reject(new Error(`HTTP error! status: ${res.statusCode}`))
						return
					}

					const chunks: Buffer[] = []
					res.on("data", (chunk) => chunks.push(chunk))
					res.on("end", () => {
						console.log(`Downloaded ${url}`)
						resolve(Buffer.concat(chunks))
					})
				})
				.on("error", reject)
		})
	}

	return followRedirect(uri)
}

export default download
