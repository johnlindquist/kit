import ava from "ava"
import { parseMarkdownAsScriptlets, home, kenvPath } from "./utils"
import { outputTmpFile } from "../api/kit"

// Helper function to create a temporary snippet file
process.env.KENV = home(".mock-kenv")
async function createTempSnippet(fileName: string, content: string) {
	const snippetDir = kenvPath("snippets")
	await ensureDir(snippetDir)
	return await outputTmpFile(path.join(snippetDir, fileName), content)
}

ava("parseMarkdownAsScripts projects.md", async (t) => {
	let markdown = `
## Github PR AI Review

\`\`\`
cursor ~/dev/github-action-list-files-on-push
\`\`\`

## Github PR AI Review Playground

\`\`\`
cursor /Users/johnlindquist/dev/github-action-pr
\`\`\`

## Github PR AI Review Playground URL

\`\`\`open
https://github.com/time-loop/pr-ai-action-playground
\`\`\`

`.trim()

	const scripts = await parseMarkdownAsScriptlets(markdown)

	t.is(scripts.length, 3)

	t.is(scripts[0].name, "Github PR AI Review")
	t.is(scripts[0].tool, process.platform === "win32" ? "cmd" : "bash")
	t.is(scripts[0].scriptlet, "cursor ~/dev/github-action-list-files-on-push")

	t.is(scripts[1].name, "Github PR AI Review Playground")
	t.is(scripts[2].name, "Github PR AI Review Playground URL")
})
