type ReadFileOptions = Parameters<typeof import('node:fs/promises').readFile>[1]

export type EnsureReadFile = (path: string, defaultContent?: string, options?: ReadFileOptions) => Promise<string>

export type EnsureReadJson =
  <T>(path: string, defaultContent: T, options?: Parameters<typeof import('fs-extra').readJson>[1]) => Promise<T>

// Tool type is already imported from @modelcontextprotocol/sdk/types in kit.d.ts
// and exposed via global.tool declaration


declare global {
  //React
  var React: typeof import('react')
  //process
  var cwd: typeof process.cwd
  var pid: typeof process.pid
  var stderr: typeof process.stderr
  var stdin: typeof process.stdin
  var stdout: typeof process.stdout
  var uptime: typeof process.uptime
  //axios
  /**
   * An alias for axios.get
   * #### get example
   * ```ts
   * const result = await get("https://jsonplaceholder.typicode.com/todos/1");
   * await editor(JSON.stringify(result.data));
   * ```
   * #### get active app on mac
   * ```ts
   * // MAC ONLY!
   * // Always hide immmediately if you're not going to show a prompt
   * await hide()
   * // but you can import that package directly (or another similar package) if you prefer
   * let info = await getActiveAppInfo()
   * if (info.bundleIdentifier === "com.google.Chrome") {
   *   await keyboard.pressKey(Key.LeftSuper, Key.T)
   *   await keyboard.releaseKey(Key.LeftSuper, Key.T)
   * }
   * ```
   * [Examples](https://scriptkit.com?query=get) | [Docs](https://johnlindquist.github.io/kit-docs/#get) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=get)
   */
  var get: import('axios').AxiosInstance['get']
  /**
   * An alias for axios.put
   * #### put example
   * ```ts
   * const result = await put("https://jsonplaceholder.typicode.com/posts/1", {
   *   title: "foo",
   * });
   * await editor(JSON.stringify(result.data));
   * ```
   * [Examples](https://scriptkit.com?query=put) | [Docs](https://johnlindquist.github.io/kit-docs/#put) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=put)
   */
  var put: import('axios').AxiosInstance['put']
  /**
   * An alias for axios.post
   * #### post example
   * ```ts
   * const result = await post("https://jsonplaceholder.typicode.com/posts", {
   *   title: "foo",
   *   body: "bar",
   *   userId: 1,
   * });
   * await editor(JSON.stringify(result.data));
   * ```
   * [Examples](https://scriptkit.com?query=post) | [Docs](https://johnlindquist.github.io/kit-docs/#post) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=post)
   */
  var post: import('axios').AxiosInstance['post']
  /**
   * An alias for axios.patch
   * #### patch example
   * ```ts
   * const result = await patch("https://jsonplaceholder.typicode.com/posts/1", {
   *   title: "foo",
   * });
   * await editor(JSON.stringify(result.data));
   * ```
   * [Examples](https://scriptkit.com?query=patch) | [Docs](https://johnlindquist.github.io/kit-docs/#patch) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=patch)
   */
  var patch: import('axios').AxiosInstance['patch']
  /**
   * An alias for axios.delete
   * #### del example
   * ```ts
   * const result = await del("https://jsonplaceholder.typicode.com/posts/1");
   * await editor(JSON.stringify(result.data));
   * ```
   * [Examples](https://scriptkit.com?query=del) | [Docs](https://johnlindquist.github.io/kit-docs/#del) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=del)
   */
  var del: import('axios').AxiosInstance['delete']
  //chalk
  var chalk: typeof import('chalk').default
  //child_process
  var spawn: typeof import('child_process').spawn
  var spawnSync: typeof import('child_process').spawnSync
  var fork: typeof import('child_process').fork

  // custom
  var ensureReadFile: EnsureReadFile
  var ensureReadJson: EnsureReadJson
  // execa
  /**
   * `exec` uses allows you to run shell commands within your script:
   * > Note: Execa is an alias for `execaCommand` from the `execa` npm package with "shell" and "all" true by default.
   * #### exec example
   * ```ts
   * let result = await exec(`ls -la`, {
   *   cwd: home(), // where to run the command
   *   shell: "/bin/zsh", // if you're expecting to use specific shell features/configs
   *   all: true, // pipe both stdout and stderr to "all"
   * })
   * inspect(result.all)
   * ```
   * #### exec with prompt info
   * ```ts
   * // It's extremely common to show the user what's happening while your command is running. This is often done by using `div` with `onInit` + `sumbit`:
   * let result = await div({
   *   html: md(`# Loading your home directory`),
   *   onInit: async () => {
   *     let result = await exec(`sleep 2 && ls -la`, {
   *       cwd: home(), // where to run the command
   *       shell: "/bin/zsh", // use if you're expecting the command to load in your .zshrc
   *       all: true, // pipe both stdout and stderr to "all"
   *     })
   * submit(result.all)
   *   },
   * })
   * ```
   * [Examples](https://scriptkit.com?query=exec) | [Docs](https://johnlindquist.github.io/kit-docs/#exec) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=exec)
   */
  var exec: typeof import('execa').execaCommand
  var execa: typeof import('execa').execa
  var execaSync: typeof import('execa').execaSync
  var execaCommand: typeof import('execa').execaCommand
  var execaCommandSync: typeof import('execa').execaCommandSync
  var execaNode: typeof import('execa').execaNode
  var $: typeof import('execa').$
  /**
   * Download a file from a URL
   * #### download example
   * ```ts
   * const url = "https://github.com/johnlindquist/kit/archive/refs/heads/main.zip";
   * const destination = home("Downloads");
   * await download(url, destination);
   * ```
   * [Examples](https://scriptkit.com?query=download) | [Docs](https://johnlindquist.github.io/kit-docs/#download) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=download)
   */
  var download: typeof import('download')
  var emptyDir: typeof import('fs-extra').emptyDir
  var emptyDirSync: typeof import('fs-extra').emptyDirSync
  var ensureFile: typeof import('fs-extra').ensureFile
  var ensureFileSync: typeof import('fs-extra').ensureFileSync
  var ensureDir: typeof import('fs-extra').ensureDir
  var ensureDirSync: typeof import('fs-extra').ensureDirSync
  var ensureLink: typeof import('fs-extra').ensureLink
  var ensureLinkSync: typeof import('fs-extra').ensureLinkSync
  var ensureSymlink: typeof import('fs-extra').ensureSymlink
  var ensureSymlinkSync: typeof import('fs-extra').ensureSymlinkSync
  var mkdirp: typeof import('fs-extra').mkdirp
  var mkdirpSync: typeof import('fs-extra').mkdirpSync
  var mkdirs: typeof import('fs-extra').mkdirs
  var outputFile: typeof import('fs-extra').outputFile
  var outputFileSync: typeof import('fs-extra').outputFileSync
  var outputJson: typeof import('fs-extra').outputJson
  var outputJsonSync: typeof import('fs-extra').outputJsonSync
  var pathExists: typeof import('fs-extra').pathExists
  var pathExistsSync: typeof import('fs-extra').pathExistsSync
  var readJson: typeof import('fs-extra').readJson
  var readJsonSync: typeof import('fs-extra').readJsonSync
  var remove: typeof import('fs-extra').remove
  var removeSync: typeof import('fs-extra').removeSync
  var writeJson: typeof import('fs-extra').writeJson
  var writeJsonSync: typeof import('fs-extra').writeJsonSync
  var move: typeof import('fs-extra').move
  var moveSync: typeof import('fs-extra').moveSync
  //fs/promises
  var readFile: typeof import('node:fs/promises').readFile
  var readFileSync: typeof import('node:fs').readFileSync
  var writeFile: typeof import('node:fs/promises').writeFile
  var writeFileSync: typeof import('node:fs').writeFileSync
  var appendFile: typeof import('node:fs/promises').appendFile
  var appendFileSync: typeof import('node:fs').appendFileSync
  var readdir: typeof import('node:fs/promises').readdir
  var readdirSync: typeof import('node:fs').readdirSync
  var copyFile: typeof import('node:fs/promises').copyFile
  var copyFileSync: typeof import('node:fs').copyFileSync

  var stat: typeof import('node:fs/promises').stat
  var lstat: typeof import('node:fs/promises').lstat

  var rmdir: typeof import('node:fs/promises').rmdir
  var unlink: typeof import('node:fs/promises').unlink
  var symlink: typeof import('node:fs/promises').symlink
  var readlink: typeof import('node:fs/promises').readlink
  var realpath: typeof import('node:fs/promises').realpath
  var access: typeof import('node:fs/promises').access

  var chown: typeof import('fs/promises').chown
  var lchown: typeof import('node:fs/promises').lchown
  var utimes: typeof import('node:fs/promises').utimes
  var lutimes: typeof import('node:fs/promises').lutimes

  var rename: typeof import('node:fs/promises').rename

  //fs
  var createReadStream: typeof import('fs').createReadStream
  var createWriteStream: typeof import('fs').createWriteStream

  /**
   * Create a handlebars template compiler
   * #### compile example
   * ```ts
   * const compiler = compile(`
   * Hello {{name}}
   * Have a {{mood}} day!
   * {{#if from}}
   * From {{author}}
   * {{/if}}
   * `);
   * const result = compiler({
   *   name: "John",
   *   mood: "great",
   *   author: "Script Kit",
   *   from: true,
   * });
   * await div(result);
   * ```
   * [Examples](https://scriptkit.com?query=compile) | [Docs](https://johnlindquist.github.io/kit-docs/#compile) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=compile)
   */
  var compile: typeof import('handlebars').compile

  /**
   * Convert markdown to HTML for rendering in prompts
   * #### md example
   * ```ts
   * const html = md(`# You're the Best
   * * Thanks for using Script Kit!
   * `);
   * await div(html);
   * ```
   * [Examples](https://scriptkit.com?query=md) | [Docs](https://johnlindquist.github.io/kit-docs/#md) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=md)
   */
  var md: typeof import('../globals/marked').md
  var marked: typeof import('marked').marked

  /**
   * Generate a UUID
   * #### uuid example
   * ```ts
   * const id = uuid();
   * await editor(id);
   * ```
   * [Examples](https://scriptkit.com?query=uuid) | [Docs](https://johnlindquist.github.io/kit-docs/#uuid) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=uuid)
   */
  var uuid: typeof import('node:crypto').randomUUID

  //replace-in-file
  /**
   * Replace a string or regex in one or more files
   * #### replace example
   * ```ts
   * const mdPath = kenvPath("sticky.md");
   * await replace({
   *   files: [mdPath],
   *   from: /nice/g, // replace all instances of "nice"
   *   to: "great",
   * });
   * ```
   * [Examples](https://scriptkit.com?query=replace) | [Docs](https://johnlindquist.github.io/kit-docs/#replace) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=replace)
   */
  var replace: typeof import('replace-in-file').replaceInFile

  // 1Password CLI integration
  /**
   * Retrieve secrets from 1Password using the CLI
   * #### op example
   * ```ts
   * // Get GitHub token from default vault
   * const token = await op("GitHub Token")
   * 
   * // Get API key from specific vault
   * const apiKey = await op("OpenAI API Key", "dev-vault")
   * 
   * // Get specific field from specific vault
   * const username = await op("Database Config", "prod-vault", "username")
   * 
   * // With caching options (default: 'session')
   * const apiKey = await op("API Key", "vault", "password", { 
   *   cacheDuration: 'until-quit' // 'session' | 'until-quit' | 'until-sleep'
   * })
   * ```
   * Note: Cached values are stored as environment variables with the pattern:
   * OP_<VAULT>_<ITEM>_<FIELD> (e.g., OP_GITHUB_TOKEN_PASSWORD)
   * 
   * [Docs](https://developer.1password.com/docs/cli/)
   */
  var op: (
    itemName: string,
    vaultName?: string,
    fieldName?: string,
    options?: {
      cacheDuration?: 'session' | 'until-quit' | 'until-sleep'
      useSDK?: boolean
      cache?: boolean
      fallbackToEnv?: boolean
    }
  ) => Promise<string>

  // stream
  var Writable: typeof import('node:stream').Writable
  var Readable: typeof import('node:stream').Readable
  var Duplex: typeof import('node:stream').Duplex
  var Transform: typeof import('node:stream').Transform

  /**
   * Glob a list of files
   * #### globby example
   * ```ts
   * const kenvScripts = kenvPath("scripts", "*.ts");
   * const kenvScriptlets = kenvPath("scriptlets", "*.md");
   * const pathsForScriptsAndScriptlets = await globby([
   *   kenvScripts,
   *   kenvScriptlets,
   * ]);
   * await editor(JSON.stringify(pathsForScriptsAndScriptlets, null, 2));
   * ```
   * [Examples](https://scriptkit.com?query=globby) | [Docs](https://johnlindquist.github.io/kit-docs/#globby) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=globby)
   */
  var globby: typeof import('globby').globby

  // Measure - Screen area measurement tool
  /**
   * Opens a transparent overlay for measuring screen areas
   * @param options - Configuration options for the measurement tool
   * @returns Promise that resolves with measurement result or null if cancelled
   *
   * @example
   * ```typescript
   * const area = await measure({
   *   hint: "Drag to select an area to measure",
   *   color: "#00ff00",
   *   gridSnap: 8
   * });
   *
   * if (area) {
   *   console.log(`Selected: ${area.width}×${area.height} at (${area.x}, ${area.y})`);
   * }
   * ```
   */
  var measure: (options?: {
    /** Stroke color for the selection rectangle (default: #00ff00) */
    color?: string
    /** Width of the selection border in pixels (default: 2) */
    strokeWidth?: number
    /** Opacity of the selection fill (0-1, default: 0.1) */
    fillOpacity?: number
    /** Whether to show dimension labels (default: true) */
    showDimensions?: boolean
    /** Whether to show crosshair guides (default: true) */
    showCrosshair?: boolean
    /** Font size for dimension labels (default: 14) */
    fontSize?: number
    /** Grid size for snapping, 1 = no snap (default: 1) */
    gridSnap?: number
    /** Whether to constrain selection to current display (default: false) */
    constrainToDisplay?: boolean
    /** Whether to allow keyboard adjustments after initial drag (default: true) */
    allowKeyboardAdjust?: boolean
    /** Instructions shown to the user */
    hint?: string
    /** Starting position for the overlay (follows cursor if not specified) */
    startPosition?: { x: number; y: number }
    /** Initial rectangle to display (for editing existing measurement) */
    initialRect?: { x: number; y: number; width: number; height: number }
    /** Clipboard format when user presses Cmd+C during measurement */
    clipboardFormat?: 'dimensions' | 'css' | 'json'
  }) => Promise<{
    x: number
    y: number
    width: number
    height: number
    right: number
    bottom: number
    centerX: number
    centerY: number
    area: number
    displayId?: string
    scaleFactor?: number
    cancelled: boolean
  } | null>

  // Screen Recording
  /**
   * Screen source available for recording
   */
  interface ScreenSource {
    id: string
    name: string
    thumbnail: string
    displayId: string
  }

  /**
   * Area definition for recording a portion of the screen
   */
  interface RecordingArea {
    x: number
    y: number
    width: number
    height: number
    displayId?: number
  }

  /**
   * Result returned from a screen recording operation
   */
  interface ScreenRecordingResult {
    filePath: string
    duration: number
    width: number
    height: number
    cancelled: boolean
  }

  /**
   * Get available screen sources for recording
   * @returns Promise that resolves with array of available screen sources
   *
   * @example
   * ```typescript
   * const sources = await getScreenSources();
   * const selected = await arg("Select screen", sources.map(s => ({
   *   name: s.name,
   *   value: s.id,
   *   preview: s.thumbnail
   * })));
   * ```
   */
  var getScreenSources: () => Promise<ScreenSource[]>

  /**
   * Start a screen recording session
   * @param options - Configuration options for the recording
   * @returns Promise that resolves with the recording result or null if cancelled
   *
   * @example
   * ```typescript
   * // Record full screen
   * const result = await screenRecord();
   * if (result) {
   *   console.log(`Recording saved to: ${result.filePath}`);
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Record with area selection
   * const result = await screenRecord({
   *   selectArea: true,
   *   hint: "Select the area you want to record",
   *   format: 'webm',
   *   maxDuration: 60
   * });
   * ```
   */
  var screenRecord: (options?: {
    /** Video format: 'webm' or 'mp4' (default: 'webm') */
    format?: 'webm' | 'mp4'
    /** Video quality 0.0-1.0 (default: 0.9) */
    quality?: number
    /** Frame rate in FPS (default: 30) */
    frameRate?: number
    /** Include system audio (default: false) */
    includeAudio?: boolean
    /** Whether to prompt for area selection (default: false for full screen) */
    selectArea?: boolean
    /** Pre-defined area to record (skips area selection) */
    area?: RecordingArea
    /** Specific source ID to record (skips source selection) */
    sourceId?: string
    /** Custom file path for the recording (default: temp directory) */
    filePath?: string
    /** Maximum recording duration in seconds (0 = unlimited) */
    maxDuration?: number
    /** Instructions shown to the user during area selection */
    hint?: string
    /** Whether to show recording controls overlay (default: true) */
    showControls?: boolean
    /** Whether to show countdown before recording starts (default: true) */
    countdown?: boolean
    /** Countdown duration in seconds (default: 3) */
    countdownSeconds?: number
  }) => Promise<ScreenRecordingResult | null>

  /**
   * Stop an active screen recording
   * @returns Promise that resolves with the recording result
   */
  var stopScreenRecording: () => Promise<ScreenRecordingResult | null>

  /**
   * Pause an active screen recording
   * @returns Promise that resolves when paused
   */
  var pauseScreenRecording: () => Promise<boolean>

  /**
   * Resume a paused screen recording
   * @returns Promise that resolves when resumed
   */
  var resumeScreenRecording: () => Promise<boolean>

  /**
   * Get the current screen recording status
   * @returns Promise that resolves with recording status
   */
  var getScreenRecordingStatus: () => Promise<{
    isRecording: boolean
    isPaused: boolean
    duration: number
    status: 'idle' | 'recording' | 'paused' | 'selecting'
  }>
}
