/**
 * Generates a Kit script that displays a menu for selecting scriptlets from a specific group.
 *
 * This script is used when a markdown file with scriptlets has an H1 header with metadata.
 * It creates a menu showing all scriptlets in that group.
 *
 * @param groupName - The name of the scriptlet group to filter by
 * @returns A Kit script string that can be executed
 */
export function generateScriptletMenuScript(groupName: string): string {
  // Escape the group name for use in string interpolation
  const escapedGroupName = groupName.replace(/"/g, '\\"')

  return `
const scripts = await getScripts(true);
let focused;
const script = await arg(
  {
    placeholder: "Select a Scriptlet",
    onChoiceFocus: (input, state) => {
      focused = state.focused;
    },
  },
  scripts.filter((s) => s.group === "${escapedGroupName}")
);

const { runScriptlet } = await import(kitPath("main", "scriptlet.js"));

export let isScriptlet = (
  script: Script | Scriptlet
): script is Scriptlet => {
  return "scriptlet" in script
}

export let isSnippet = (
  script: Script
): script is Snippet => {
  return "text" in script
}

const determineScriptletRun = async () => {
  if (isSnippet(script)) {
    send("STAMP_SCRIPT", script as Script)

    return await run(
      kitPath("app", "paste-snippet.js"),
      "--filePath",
      script.filePath
    )
  }
  if (isScriptlet(script)) {
    await runScriptlet(script, script.inputs || [], flag)
    return
  }

  if (Array.isArray(script)) {
    await runScriptlet(focused as Scriptlet, script, flag)
    return
  }

  if ((script as Script)?.shebang) {
    const shebang = parseShebang(script as Script)
    return await sendWait(Channel.SHEBANG, shebang)
  }
}

await determineScriptletRun();
`.trim()
}

/**
 * Generates a preview description for a scriptlet group menu.
 *
 * @param groupName - The name of the scriptlet group
 * @returns A preview description string
 */
export function generateScriptletMenuPreview(groupName: string): string {
  return `List all the scriptlets in the ${groupName} group`
}
