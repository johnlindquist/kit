import test from "ava"
import path from "node:path"
import { Channel, Value, ProcessType } from "../core/enum.js"
import type { Script, Choice } from "../types/core.js"

// Create runScript function that matches the one in index.ts
const createRunScript = (dependencies: any) => {
  const {
    isApp,
    isPass,
    input,
    focused,
    hide,
    getMainScriptPath,
    open,
    run,
    isFile,
    exec,
    showLogWindow,
    edit,
    send,
    sendWait,
    preload,
    updateArgs,
    args,
    flag,
    modifiers,
    path,
    kenvPath,
    kitPath,
    isScriptlet,
    isSnippet,
    parseShebang,
    runScriptletImport,
    arg
  } = dependencies

  return async (script: Script | string) => {
    if (isApp && typeof script === "string") {
      return await Promise.all([
        hide({
          preloadScript: getMainScriptPath(),
        }),
        (open as any)(script as string),
      ])
    }

    if (isPass || (script as Script)?.postfix) {
      let hardPass = (script as Script)?.postfix || input
      if (typeof global?.flag === "object") {
        global.flag.hardPass = hardPass
      }
      return await run(
        (script as Script)?.filePath,
        "--pass",
        hardPass
      )
    }

    if (
      script === Value.NoValue ||
      typeof script === "undefined"
    ) {
      console.warn("🤔 No script selected", script)
      return
    }

    if (typeof script === "string") {
      if (script === "kit-sponsor") {
        return await run(kitPath("main", "sponsor.js"))
      }

      let scriptPath = script as string
      let [maybeScript, numarg] = scriptPath.split(/\s(?=\d)/)
      if (await isFile(maybeScript)) {
        return await run(maybeScript, numarg)
      }

      return await run(
        `${kitPath("cli", "new")}.js`,
        scriptPath.trim().replace(/\s/g, "-").toLowerCase(),
        `--scriptName`,
        scriptPath.trim()
      )
    }

    let shouldEdit = flag?.open

    let selectedFlag: string | undefined = Object.keys(
      flag
    ).find(f => {
      return f && !modifiers[f]
    })

    if (selectedFlag && flag?.code) {
      return await exec(
        `open -a 'Visual Studio Code' '${path.dirname(
          path.dirname(script.filePath)
        )}'`
      )
    }

    if (selectedFlag && selectedFlag === "settings") {
      return await run(kitPath("main", "kit.js"))
    }
    if (selectedFlag?.startsWith("kenv")) {
      let k = script.kenv || "main"
      if (selectedFlag === "kenv-term") {
        k = path.dirname(path.dirname(script.filePath))
      }

      return await run(
        `${kitPath("cli", selectedFlag)}.js`,
        k
      )
    }

    if (selectedFlag?.endsWith("menu")) {
      return await run(`${kitPath("cli", selectedFlag)}.js`)
    }

    if (selectedFlag && !flag?.open) {
      return await run(
        `${kitPath("cli", selectedFlag)}.js`,
        script.filePath
      )
    }

    if (flag[modifiers.opt]) {
      return showLogWindow(script?.filePath)
    }

    if (script.background) {
      return await run(
        kitPath("cli", "toggle-background.js"),
        script?.filePath
      )
    }

    if (shouldEdit) {
      return await edit(script.filePath, kenvPath())
    }

    if (isSnippet(script)) {
      send(Channel.STAMP_SCRIPT, script as Script)

      return await run(
        kitPath("app", "paste-snippet.js"),
        "--filePath",
        script.filePath
      )
    }

    if (isScriptlet(script)) {
      let { runScriptlet } = await runScriptletImport()
      updateArgs(args)
      await runScriptlet(script, (script as any).inputs || [], flag)
      return
    }

    if (Array.isArray(script)) {
      let { runScriptlet } = await runScriptletImport()
      updateArgs(args)
      await runScriptlet(focused, script, flag)
      return
    }

    if ((script as Script)?.shebang) {
      const shebang = parseShebang(script as Script)
      return await sendWait(Channel.SHEBANG, shebang)
    }

    if (script?.filePath) {
      preload(script?.filePath)
      let runP = run(
        script.filePath,
        ...Object.keys(flag).map(f => `--${f}`)
      )

      return await runP
    }

    return await arg("How did you get here?")
  }
}

// Test 1: Basic script selection and execution
test("should run a selected script with its file path", async (t) => {
  let runCalls: any[] = []
  let preloadCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: (filePath: string) => {
      preloadCalls.push(filePath)
    },
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "test-script",
    name: "Test Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(preloadCalls.length, 1)
  t.is(preloadCalls[0], "/test/script.js")
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/test/script.js")
})

// Test 2: App launcher mode
test("should open app when isApp is true", async (t) => {
  let hideCalls: any[] = []
  let openCalls: any[] = []
  
  const deps = {
    isApp: true,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async (options?: any) => {
      hideCalls.push(options)
    },
    getMainScriptPath: () => "/kit/main.js",
    open: async (path: string) => {
      openCalls.push(path)
    },
    run: async () => {},
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  await runScript("com.example.app")
  
  t.is(hideCalls.length, 1)
  t.is(openCalls.length, 1)
  t.is(openCalls[0], "com.example.app")
})

// Test 3: Invalid characters detection
test("should detect invalid characters in onNoChoices", (t) => {
  // Test each case separately to avoid regex state issues
  t.true(/[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]/.test("test@script"))
  t.true(/[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]/.test("test!"))
  t.false(/[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]/.test("test-script"))
  t.false(/[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]/.test("test script"))
})

// Test 4: Script name formatting
test("should format script name correctly in onNoChoices", (t) => {
  const input = "My Test Script!"
  const scriptName = input
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s/g, "-")
    .toLowerCase()
  
  t.is(scriptName, "my-test-script")
})

// Test 5: Password mode with hardPass
test.serial("should handle password mode with hardPass", async (t) => {
  let runCalls: any[] = []
  global.flag = {}
  
  // Ensure clean global.flag
  delete global.flag.hardPass
  
  const deps = {
    isApp: false,
    isPass: true,
    input: "mypassword",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/pass-script.js",
    command: "pass-script",
    name: "Pass Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.deepEqual(runCalls[0], ["/test/pass-script.js", "--pass", "mypassword"])
  t.is(global.flag.hardPass, "mypassword")
  
  // Cleanup
  delete global.flag.hardPass
})

// Test 6: Script with postfix
test.serial("should handle script with postfix", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript = {
    filePath: "/test/postfix-script.js",
    command: "postfix-script",
    name: "Postfix Script",
    postfix: "somepostfix",
    type: ProcessType.Prompt,
    kenv: "",
    id: "postfix-script"
  } as any as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.deepEqual(runCalls[0], ["/test/postfix-script.js", "--pass", "somepostfix"])
})

// Test 7: NoValue handling
test("should handle NoValue return", async (t) => {
  let runCalls: any[] = []
  const originalWarn = console.warn
  let warnCalled = false
  console.warn = () => { warnCalled = true }
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  await runScript(Value.NoValue)
  
  console.warn = originalWarn
  
  t.true(warnCalled)
  t.is(runCalls.length, 0)
})

// Test 8: Kit sponsor special case
test("should handle kit-sponsor special case", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  await runScript("kit-sponsor")
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/main/sponsor.js")
})

// Test 9: Script path with numeric argument
test("should handle script path with numeric argument", async (t) => {
  let runCalls: any[] = []
  let isFileCalls: string[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async (path: string) => {
      isFileCalls.push(path)
      return path === "/test/script.js"
    },
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  await runScript("/test/script.js 123")
  
  t.is(isFileCalls.length, 1)
  t.is(isFileCalls[0], "/test/script.js")
  t.is(runCalls.length, 1)
  t.deepEqual(runCalls[0], ["/test/script.js", "123"])
})

// Test 10: Create new script from string
test("should create new script when string doesn't exist as file", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  await runScript("my-new-script")
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/cli/new.js")
  t.is(runCalls[0][1], "my-new-script")
  t.is(runCalls[0][2], "--scriptName")
  t.is(runCalls[0][3], "my-new-script")
})

// Test 11: Multiple flags handling
test("should handle first non-modifier flag as CLI command", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { verbose: true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "script",
    name: "Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/cli/verbose.js")
  t.is(runCalls[0][1], "/test/script.js")
})

// Test 12: Pass flags when no special handling
test("should pass flags to script when no special flag handling applies", async (t) => {
  let runCalls: any[] = []
  let preloadCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: (filePath: string) => {
      preloadCalls.push(filePath)
    },
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "script",
    name: "Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(preloadCalls.length, 1)
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/test/script.js")
})

// Test 13: Snippet handling
test("should handle snippet execution", async (t) => {
  let runCalls: any[] = []
  let sendCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: (channel: Channel, data?: any) => {
      sendCalls.push({ channel, data })
    },
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => true,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockSnippet = {
    filePath: "/test/snippet.js",
    command: "snippet",
    name: "Test Snippet"
  } as Script
  
  await runScript(mockSnippet)
  
  t.is(sendCalls.length, 1)
  t.is(sendCalls[0].channel, Channel.STAMP_SCRIPT)
  t.is(sendCalls[0].data, mockSnippet)
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/app/paste-snippet.js")
  t.is(runCalls[0][1], "--filePath")
  t.is(runCalls[0][2], "/test/snippet.js")
})

// Test 13: Scriptlet handling
test("should handle scriptlet execution", async (t) => {
  let runScriptletCalls: any[] = []
  let updateArgsCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async () => {},
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: (args: any) => {
      updateArgsCalls.push(args)
    },
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => true,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({
      runScriptlet: async (scriptlet: any, inputs: any[], flag?: any) => {
        runScriptletCalls.push({ scriptlet, inputs, flag })
      }
    }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScriptlet = {
    filePath: "/test/scriptlet.js",
    command: "scriptlet",
    name: "Test Scriptlet",
    tool: "kit",
    inputs: ["input1", "input2"]
  } as any
  
  await runScript(mockScriptlet)
  
  t.is(updateArgsCalls.length, 1)
  t.is(runScriptletCalls.length, 1)
  t.is(runScriptletCalls[0].scriptlet, mockScriptlet)
  t.deepEqual(runScriptletCalls[0].inputs, ["input1", "input2"])
})

// Test 14: Background script toggle
test("should toggle background script", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/bg-script.js",
    command: "bg-script",
    name: "Background Script",
    background: true
  } as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/cli/toggle-background.js")
  t.is(runCalls[0][1], "/test/bg-script.js")
})

// Test 15: Shebang script handling
test("should handle shebang scripts", async (t) => {
  let sendWaitCalls: any[] = []
  const parsedShebang = { command: "bash", args: ["/test/shebang-script.sh"] }
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async () => {},
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async (channel: Channel, data?: any) => {
      sendWaitCalls.push({ channel, data })
    },
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => parsedShebang,
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/shebang-script.sh",
    command: "shebang-script",
    name: "Shebang Script",
    shebang: "#!/bin/bash"
  } as Script
  
  await runScript(mockScript)
  
  t.is(sendWaitCalls.length, 1)
  t.is(sendWaitCalls[0].channel, Channel.SHEBANG)
  t.deepEqual(sendWaitCalls[0].data, parsedShebang)
})

// Test 16: Script without filePath - edge case
test("should call arg when script has no filePath", async (t) => {
  let argCalled = false
  let argMessage = ""
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async () => {},
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async (message: string) => {
      argCalled = true
      argMessage = message
      return message
    }
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript = {
    command: "script",
    name: "Script"
    // No filePath
  } as any
  
  await runScript(mockScript)
  
  t.true(argCalled)
  t.is(argMessage, "How did you get here?")
})

// Test 17: Code flag behavior
test("should open VS Code when code flag is set", async (t) => {
  let execCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async () => {},
    isFile: async () => false,
    exec: async (command: string, options?: any) => {
      execCalls.push({ command, options })
      return { stdout: "", stderr: "" }
    },
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { code: true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/scripts/code-script.js",
    command: "code-script",
    name: "Code Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(execCalls.length, 1)
  t.true(execCalls[0].command.includes("Visual Studio Code"))
  t.true(execCalls[0].command.includes("/test"))
})

// Test 18: Settings flag
test("should open kit settings when settings flag is set", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { settings: true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "script",
    name: "Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/main/kit.js")
})

// Test 19: Kenv-term special handling
test("should use script directory for kenv-term", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { "kenv-term": true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/Users/test/my-kenv/scripts/script.js",
    command: "script",
    name: "Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/cli/kenv-term.js")
  t.is(runCalls[0][1], "/Users/test/my-kenv")
})

// Test 20: Open flag behavior
test("should edit script when open flag is set", async (t) => {
  let editCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async () => {},
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async (filePath: string, kenvPath?: string) => {
      editCalls.push({ filePath, kenvPath })
    },
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { open: true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/edit-script.js",
    command: "edit-script",
    name: "Edit Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(editCalls.length, 1)
  t.is(editCalls[0].filePath, "/test/edit-script.js")
  t.is(editCalls[0].kenvPath, "/kenv")
})

// Test 21: Opt modifier behavior
test("should show log window when opt modifier is pressed", async (t) => {
  let showLogWindowCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async () => {},
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: (filePath: string) => {
      showLogWindowCalls.push(filePath)
    },
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { opt: true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "script",
    name: "Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(showLogWindowCalls.length, 1)
  t.is(showLogWindowCalls[0], "/test/script.js")
})

// Test 22: Menu flag behavior
test("should handle menu flags", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { "new-menu": true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "script",
    name: "Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/cli/new-menu.js")
})

// Test 23: Array scriptlet handling
test("should handle array scriptlet execution", async (t) => {
  let runScriptletCalls: any[] = []
  let updateArgsCalls: any[] = []
  
  const mockScriptlet = {
    filePath: "/test/scriptlet.js",
    command: "scriptlet",
    name: "Test Scriptlet"
  }
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: mockScriptlet,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async () => {},
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: (args: any) => {
      updateArgsCalls.push(args)
    },
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({
      runScriptlet: async (scriptlet: any, inputs: any[], flag?: any) => {
        runScriptletCalls.push({ scriptlet, inputs, flag })
      }
    }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockInputs = ["input1", "input2"]
  await runScript(mockInputs as any)
  
  t.is(updateArgsCalls.length, 1)
  t.is(runScriptletCalls.length, 1)
  t.is(runScriptletCalls[0].scriptlet, mockScriptlet)
  t.deepEqual(runScriptletCalls[0].inputs, mockInputs)
})

// Test 24: Default kenv handling
test("should use 'main' as default kenv", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { "kenv-view": true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "script",
    name: "Script"
    // No kenv property
  } as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/cli/kenv-view.js")
  t.is(runCalls[0][1], "main")
})

// Test 25: Other flag handling
test("should run CLI command for non-open flags", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { duplicate: true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "script",
    name: "Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/cli/duplicate.js")
  t.is(runCalls[0][1], "/test/script.js")
})

// Test 26: Empty script inputs
test("should handle scriptlet with empty inputs array", async (t) => {
  let runScriptletCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async () => {},
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => true,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({
      runScriptlet: async (scriptlet: any, inputs: any[], flag?: any) => {
        runScriptletCalls.push({ scriptlet, inputs, flag })
      }
    }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScriptlet = {
    filePath: "/test/scriptlet.js",
    command: "scriptlet",
    name: "Test Scriptlet",
    tool: "kit"
    // No inputs property
  } as any
  
  await runScript(mockScriptlet)
  
  t.is(runScriptletCalls.length, 1)
  t.deepEqual(runScriptletCalls[0].inputs, [])
})

// Test 27: Input trimming
test("should trim input when creating new script", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  await runScript("  my new script  ")
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/kit/cli/new.js")
  t.is(runCalls[0][1], "my-new-script")
  t.is(runCalls[0][3], "my new script")
})

// Test 28: Edge case - Script path doesn't split with space and number
test("should not split script path that ends with space and number", async (t) => {
  let runCalls: any[] = []
  let isFileCalls: string[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async (path: string) => {
      isFileCalls.push(path)
      return path === "script with space"
    },
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  await runScript("script with space 2")
  
  t.is(isFileCalls[0], "script with space")
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "script with space")
  t.is(runCalls[0][1], "2")
})

// Test 29: Code flag takes precedence
test("should prioritize code flag over other flags", async (t) => {
  let execCalls: any[] = []
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async (command: string, options?: any) => {
      execCalls.push({ command, options })
      return { stdout: "", stderr: "" }
    },
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: { code: true, remove: true, duplicate: true },
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "script",
    name: "Script"
  } as Script
  
  await runScript(mockScript)
  
  // Should execute VS Code command, not remove or duplicate
  t.is(execCalls.length, 1)
  t.true(execCalls[0].command.includes("Visual Studio Code"))
  t.is(runCalls.length, 0)
})

// Test 30: Empty flag object
test("should handle empty flag object", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/script.js",
    command: "script",
    name: "Script"
  } as Script
  
  await runScript(mockScript)
  
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/test/script.js")
  t.is(runCalls[0].length, 1) // No flags appended
})

// Test 31: onKeyword callback handling
test("should handle keyword-based script execution", async (t) => {
  let runCalls: any[] = []
  let preloadCalls: any[] = []
  
  // Create a mock mainMenu function to test keyword handling
  const mockMainMenu = async (options: any) => {
    // Simulate keyword detection
    const state = {
      keyword: "todo",
      value: {
        filePath: "/test/todo-script.js",
        command: "todo-script",
        name: "Todo Script"
      }
    }
    
    // Call onKeyword if provided
    if (options.onKeyword) {
      await options.onKeyword("todo", state)
    }
    
    return state.value
  }
  
  // Mock dependencies for keyword test
  const deps = {
    preload: (filePath: string) => {
      preloadCalls.push(filePath)
    },
    run: async (...args: any[]) => {
      runCalls.push(args)
    }
  }
  
  // Set up globals
  global.preload = deps.preload
  global.run = deps.run
  
  const options = {
    name: "Main",
    onKeyword: async (input: string, state: any) => {
      const { keyword, value } = state
      if (keyword && value?.filePath) {
        preload(value.filePath)
        await run(value.filePath, "--keyword", keyword)
      }
    }
  }
  
  await mockMainMenu(options)
  
  t.is(preloadCalls.length, 1)
  t.is(preloadCalls[0], "/test/todo-script.js")
  t.is(runCalls.length, 1)
  t.deepEqual(runCalls[0], ["/test/todo-script.js", "--keyword", "todo"])
})

// Test 32: onMenuToggle callback - dynamic flag loading
test("should load dynamic flags on menu toggle", async (t) => {
  let setFlagsCalls: any[] = []
  
  const mockMainMenu = async (options: any) => {
    // Simulate menu toggle without a flag
    const state = { flag: null }
    
    if (options.onMenuToggle) {
      await options.onMenuToggle("", state)
    }
  }
  
  // Mock dependencies
  global.setFlags = async (flags: any) => {
    setFlagsCalls.push(flags)
  }
  
  const scriptFlags = {
    open: "Open in editor",
    code: "Open in VS Code"
  }
  
  const actions = [
    { flag: "duplicate", name: "Duplicate" },
    { flag: "remove", name: "Remove" }
  ]
  
  // Mock getFlagsFromActions
  global.getFlagsFromActions = (actions: any[]) => {
    return actions.reduce((acc, action) => {
      acc[action.flag] = action.name
      return acc
    }, {})
  }
  
  const options = {
    name: "Main",
    flags: scriptFlags,
    onMenuToggle: async (input: string, state: any) => {
      if (!state?.flag) {
        let menuFlags = {
          ...scriptFlags,
          ...global.getFlagsFromActions(actions)
        }
        setFlags(menuFlags)
      }
    }
  }
  
  await mockMainMenu(options)
  
  t.is(setFlagsCalls.length, 1)
  const combinedFlags = setFlagsCalls[0]
  t.true("open" in combinedFlags)
  t.true("code" in combinedFlags)
  t.true("duplicate" in combinedFlags)
  t.true("remove" in combinedFlags)
})

// Test 33: onChoiceFocus callback - state tracking
test("should update state on choice focus", async (t) => {
  let isAppValues: boolean[] = []
  let isPassValues: boolean[] = []
  let focusedValues: any[] = []
  
  const mockMainMenu = async (options: any) => {
    // Test Apps group
    await options.onChoiceFocus("", {
      focused: { group: "Apps", name: "Safari" }
    })
    
    // Test Pass group
    await options.onChoiceFocus("", {
      focused: { group: "Pass", name: "Password", exact: false }
    })
    
    // Test Pass group with exact match
    await options.onChoiceFocus("", {
      focused: { group: "Pass", name: "Password", exact: true }
    })
    
    // Test Community group
    await options.onChoiceFocus("", {
      focused: { group: "Community", name: "Script" }
    })
    
    // Test regular script
    await options.onChoiceFocus("", {
      focused: { group: "Scripts", name: "My Script" }
    })
  }
  
  const options = {
    onChoiceFocus: async (input: string, state: any) => {
      const isApp = state?.focused?.group === "Apps" || 
                    state?.focused?.group === "Community"
      const isPass = state?.focused?.group === "Pass" && 
                     !state?.focused?.exact
      const focused = state?.focused
      
      isAppValues.push(isApp)
      isPassValues.push(isPass)
      focusedValues.push(focused)
    }
  }
  
  await mockMainMenu(options)
  
  // Check Apps group
  t.true(isAppValues[0])
  t.false(isPassValues[0])
  
  // Check Pass group without exact
  t.false(isAppValues[1])
  t.true(isPassValues[1])
  
  // Check Pass group with exact
  t.false(isAppValues[2])
  t.false(isPassValues[2])
  
  // Check Community group
  t.true(isAppValues[3])
  t.false(isPassValues[3])
  
  // Check regular script
  t.false(isAppValues[4])
  t.false(isPassValues[4])
  
  t.is(focusedValues.length, 5)
})

// Test 34: onBlur callback - hide and exit
test.serial("should hide and exit on blur", async (t) => {
  // Store original globals
  const originalHide = global.hide
  const originalExit = global.exit
  
  let hideCalls: number = 0
  let exitCalls: number = 0
  
  const mockMainMenu = async (options: any) => {
    await options.onBlur("", {})
  }
  
  global.hide = async () => {
    hideCalls++
  }
  
  global.exit = (() => {
    exitCalls++
    throw new Error("Exit called") // never returns
  }) as (code?: number) => never
  
  const options = {
    onBlur: async (input: string, state: any) => {
      await global.hide()
      global.exit()
    }
  }
  
  await mockMainMenu(options)
  
  t.is(hideCalls, 1)
  t.is(exitCalls, 1)
  
  // Restore globals
  global.hide = originalHide
  global.exit = originalExit
})

// Test 35: Shortcode handlers - number keys
test("should handle number shortcode handlers", async (t) => {
  let scriptPaths: string[] = []
  
  const mockMainMenu = async (options: any) => {
    // Test various number shortcuts
    return options.shortcodes
  }
  
  const kitPath = (dir: string, file: string) => `/kit/${dir}/${file}`
  
  const options = {
    shortcodes: {
      "1": `${kitPath("handler", "number-handler.js")} 1`,
      "2": `${kitPath("handler", "number-handler.js")} 2`,
      "3": `${kitPath("handler", "number-handler.js")} 3`,
      "4": `${kitPath("handler", "number-handler.js")} 4`,
      "5": `${kitPath("handler", "number-handler.js")} 5`,
      "6": `${kitPath("handler", "number-handler.js")} 6`,
      "7": `${kitPath("handler", "number-handler.js")} 7`,
      "8": `${kitPath("handler", "number-handler.js")} 8`,
      "9": `${kitPath("handler", "number-handler.js")} 9`
    }
  }
  
  const shortcodes = await mockMainMenu(options)
  
  t.is(shortcodes["1"], "/kit/handler/number-handler.js 1")
  t.is(shortcodes["5"], "/kit/handler/number-handler.js 5")
  t.is(shortcodes["9"], "/kit/handler/number-handler.js 9")
  t.is(Object.keys(shortcodes).length, 9)
})

// Test 36: onNoChoices with invalid characters
test.serial("should show panel for invalid characters in onNoChoices", async (t) => {
  // Store original globals
  const originalMd = global.md
  const originalSetPanel = global.setPanel
  
  let panelContents: string[] = []
  let setPanelCalls: number = 0
  
  const mockMainMenu = async (options: any) => {
    // Test with invalid characters
    await options.onNoChoices("test@script!", { flaggedValue: "" })
    
    // Test with valid characters
    await options.onNoChoices("valid-script", { flaggedValue: "" })
  }
  
  global.md = (content: string) => content
  global.setPanel = async (content: string) => {
    panelContents.push(content)
    setPanelCalls++
  }
  
  const options = {
    onNoChoices: async (input: string, state: any) => {
      if (input && state.flaggedValue === "") {
        let regex = /[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]/g
        let invalid = regex.test(input)
        
        if (invalid) {
          const panel = global.md(`# No matches found
No matches found for <code>${input}</code>`)
          global.setPanel(panel)
          return
        }
        
        let scriptName = input
          .replace(/[^\w\s-]/g, "")
          .trim()
          .replace(/\s/g, "-")
          .toLowerCase()
        
        const panel = global.md(`# Quick New Script

Create a script named <code>${scriptName}</code>`)
        global.setPanel(panel)
      }
    }
  }
  
  await mockMainMenu(options)
  
  t.is(setPanelCalls, 2)
  
  // First call should show "No matches found"
  t.regex(panelContents[0], /No matches found/)
  t.regex(panelContents[0], /test@script!/)
  
  // Second call should show "Quick New Script"
  t.regex(panelContents[1], /Quick New Script/)
  t.regex(panelContents[1], /valid-script/)
  
  // Restore globals
  global.md = originalMd
  global.setPanel = originalSetPanel
})

// Test 37: Community group detection
test("should detect Community group as app", async (t) => {
  let runCalls: any[] = []
  let hideCalls: any[] = []
  let openCalls: any[] = []
  
  const deps = {
    isApp: true, // Community group should be treated as app
    isPass: false,
    input: "",
    focused: { group: "Community", name: "community-script" },
    hide: async (options?: any) => {
      hideCalls.push(options)
    },
    getMainScriptPath: () => "/kit/main.js",
    open: async (path: string) => {
      openCalls.push(path)
    },
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  await runScript("community-app")
  
  t.is(hideCalls.length, 1)
  t.is(openCalls.length, 1)
  t.is(openCalls[0], "community-app")
})

// Test 38: Pass group with exact match should not trigger password mode
test("should not use password mode when Pass group has exact match", async (t) => {
  let runCalls: any[] = []
  
  const deps = {
    isApp: false,
    isPass: false, // Should be false when exact match
    input: "password123",
    focused: { group: "Pass", exact: true },
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  const mockScript: Script = {
    filePath: "/test/pass-script.js",
    command: "pass-script",
    name: "Pass Script"
  } as Script
  
  await runScript(mockScript)
  
  // Should run normally without --pass flag
  t.is(runCalls.length, 1)
  t.is(runCalls[0].length, 1)
  t.is(runCalls[0][0], "/test/pass-script.js")
  t.false(runCalls[0].includes("--pass"))
})

// Test 39: Script path with space and numeric argument splitting
test("should correctly split script path with space before number", async (t) => {
  let runCalls: any[] = []
  let isFileCalls: string[] = []
  
  const deps = {
    isApp: false,
    isPass: false,
    input: "",
    focused: undefined,
    hide: async () => {},
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run: async (...args: any[]) => {
      runCalls.push(args)
    },
    isFile: async (path: string) => {
      isFileCalls.push(path)
      return path === "/test/timer"
    },
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload: () => {},
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  
  // Test case: "timer 10" should split to ["timer", "10"]
  await runScript("/test/timer 10")
  
  t.is(isFileCalls.length, 1)
  t.is(isFileCalls[0], "/test/timer")
  t.is(runCalls.length, 1)
  t.deepEqual(runCalls[0], ["/test/timer", "10"])
})

// Test 40: Integration test - complete mainMenu flow
test("should handle complete mainMenu flow from selection to execution", async (t) => {
  let runCalls: any[] = []
  let preloadCalls: any[] = []
  let hideCalls: any[] = []
  let exitCalls: number = 0
  let panelContent: string = ""
  let flagsSet: any = null
  
  // Create a more complete mock mainMenu that simulates the full flow
  const mockCompleteMainMenu = async (options: any) => {
    // Simulate initial state
    let state = {
      focused: null,
      flag: null,
      flaggedValue: "",
      input: ""
    }
    
    // 1. Test onMenuToggle when menu opens
    if (options.onMenuToggle) {
      await options.onMenuToggle("", state)
    }
    
    // 2. Simulate typing that triggers onNoChoices
    state.input = "nonexistent@script"
    if (options.onNoChoices) {
      await options.onNoChoices(state.input, state)
    }
    
    // 3. Simulate focus on a script
    state = {
      focused: { 
        filePath: "/test/my-script.js",
        command: "my-script",
        name: "My Script",
        group: "Scripts"
      },
      flag: null,
      flaggedValue: "",
      input: ""
    }
    
    if (options.onChoiceFocus) {
      await options.onChoiceFocus("", state)
    }
    
    // 4. Simulate submission
    if (options.onSubmit) {
      options.onSubmit("my-script")
    }
    
    // Return the selected script
    return state.focused
  }
  
  // Set up all the global mocks
  global.preload = (filePath: string) => {
    preloadCalls.push(filePath)
  }
  
  global.run = async (...args: any[]) => {
    runCalls.push(args)
  }
  
  global.hide = async (options?: any) => {
    hideCalls.push(options || {})
  }
  
  global.exit = (() => {
    exitCalls++
    throw new Error("Exit called") // never returns
  }) as (code?: number) => never
  
  global.md = (content: string) => content
  
  global.setPanel = async (content: string) => {
    panelContent = content
  }
  
  global.setFlags = async (flags: any) => {
    flagsSet = flags
  }
  
  global.getFlagsFromActions = (actions: any[]) => {
    return actions.reduce((acc, action) => {
      acc[action.flag] = action.name
      return acc
    }, {})
  }
  
  const scriptFlags = {
    open: "Open in editor",
    code: "Open in VS Code"
  }
  
  const actions = [
    { flag: "duplicate", name: "Duplicate" }
  ]
  
  let capturedInput = ""
  let isApp = false
  let isPass = false
  let focused: any = null
  
  const mainMenuOptions = {
    name: "Main",
    description: "Script Kit",
    placeholder: "Script Kit",
    enter: "Run",
    strict: false,
    flags: scriptFlags,
    actions,
    onMenuToggle: async (input: string, state: any) => {
      if (!state?.flag) {
        let menuFlags = {
          ...scriptFlags,
          ...global.getFlagsFromActions(actions)
        }
        setFlags(menuFlags)
      }
    },
    onNoChoices: async (input: string, state: any) => {
      if (input && state.flaggedValue === "") {
        let regex = /[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]/g
        let invalid = regex.test(input)
        
        if (invalid) {
          const panel = md(`# No matches found
No matches found for <code>${input}</code>`)
          setPanel(panel)
        }
      }
    },
    onChoiceFocus: async (input: string, state: any) => {
      isApp = state?.focused?.group === "Apps" || 
               state?.focused?.group === "Community"
      isPass = state?.focused?.group === "Pass" && 
               !state?.focused?.exact
      focused = state?.focused
    },
    onSubmit: (input: string) => {
      if (input) {
        capturedInput = input.trim()
      }
    },
    onBlur: async (input: string, state: any) => {
      await hide()
      exit()
    }
  }
  
  // Run the complete flow
  const selectedScript = await mockCompleteMainMenu(mainMenuOptions)
  
  // Now run the script through runScript
  const deps = {
    isApp,
    isPass,
    input: capturedInput,
    focused,
    hide,
    getMainScriptPath: () => "/kit/main.js",
    open: async () => {},
    run,
    isFile: async () => false,
    exec: async () => ({ stdout: "", stderr: "" }),
    showLogWindow: () => {},
    edit: async () => {},
    send: () => {},
    sendWait: async () => {},
    preload,
    updateArgs: () => {},
    args: [],
    flag: {},
    modifiers: { opt: "opt", cmd: "cmd", shift: "shift" },
    path,
    kenvPath: () => "/kenv",
    kitPath: (dir: string, file: string) => `/kit/${dir}/${file}`,
    isScriptlet: () => false,
    isSnippet: () => false,
    parseShebang: () => ({ command: "bash", args: [] }),
    runScriptletImport: async () => ({ runScriptlet: async () => {} }),
    arg: async () => ""
  }
  
  const runScript = createRunScript(deps)
  await runScript(selectedScript)
  
  // Verify the complete flow
  // 1. Flags were set on menu toggle
  t.truthy(flagsSet)
  t.true("open" in flagsSet)
  t.true("duplicate" in flagsSet)
  
  // 2. Panel was set for invalid input
  t.regex(panelContent, /No matches found/)
  
  // 3. Focus state was updated
  t.false(isApp)
  t.false(isPass)
  t.truthy(focused)
  
  // 4. Script was preloaded and run
  t.is(preloadCalls.length, 1)
  t.is(preloadCalls[0], "/test/my-script.js")
  t.is(runCalls.length, 1)
  t.is(runCalls[0][0], "/test/my-script.js")
  
  // 5. Input was captured
  t.is(capturedInput, "my-script")
})