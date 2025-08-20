# Sourcemap Formatter Windows Test Failures Analysis

## Summary
The following tests are failing on Windows but passing on macOS:
- `formatError should parse basic error stack`
- `formatError should handle file:// URLs`
- `formatError should remove query parameters`
- `formatError should skip node_modules by default`

## Analysis of Windows-Specific Issues

### Key Problem Areas

1. **Path Normalization Differences**
   - The code uses `path.normalize()` which behaves differently on Windows vs Unix
   - Windows paths use backslashes (`\`) while Unix uses forward slashes (`/`)
   - The tests expect Windows-specific path formats when `os.platform() === 'win32'`

2. **File URL Handling**
   - File URLs like `file:///C:/path` need special handling on Windows
   - The code strips the leading `/` after removing `file://` protocol on Windows
   - Drive letters (e.g., `C:`) must be preserved correctly

3. **Absolute Path Detection**
   - Windows absolute paths can start with drive letters (`C:\`) or UNC paths (`\\`)
   - Unix absolute paths start with `/`
   - The code has regex `/^([a-zA-Z]:\\|\\\\)/` to detect Windows paths

4. **Path Restoration Logic**
   - After normalization, Unix paths may lose their leading `/`
   - The code attempts to restore this, but must avoid doing so on Windows
   - Lines 70-73 and 169-172 in the implementation handle this

### Specific Test Expectations

1. **Test: "formatError should parse basic error stack"**
   - Expects paths to be converted to Windows format with backslashes on Windows
   - Example: `/path/to/file.js` → `\path\to\file.js` on Windows

2. **Test: "formatError should handle file:// URLs"**
   - Tests both Unix-style (`file:///Users/test/script.js`) and Windows-style (`file://C:/Users/test/script.js`) URLs
   - Expects proper conversion based on the platform

3. **Test: "formatError should remove query parameters"**
   - Tests that query strings (`?uuid=12345`) are stripped from file paths
   - Path format should still be platform-appropriate after stripping

4. **Test: "formatError should skip node_modules by default"**
   - Tests filtering of stack frames from node_modules and internal modules
   - Path matching patterns must work with Windows path separators

### Potential Issues on Windows

1. **Leading Slash Handling**: The code may incorrectly handle leading slashes on Windows, especially for paths that aren't drive-based
2. **Normalize Behavior**: `path.normalize()` on Windows converts forward slashes to backslashes, which may not happen consistently
3. **File Existence Checks**: The `existsSync()` calls in `resolveFilePath()` may fail if paths aren't properly formatted for Windows
4. **Regular Expression Matching**: The skip patterns in `shouldSkipFrame()` use forward slashes which may not match Windows paths with backslashes

## Recommendations for Debugging

1. Add logging to see actual vs expected path formats on Windows
2. Check if `path.normalize()` is being called with the correct input format
3. Verify the file URL parsing logic handles Windows drive letters correctly
4. Test the regular expressions with actual Windows paths
5. Consider using `path.sep` for platform-agnostic path separator handling

---

## Complete Repomix Bundle

Below is the complete bundle of all related files:

\`\`\`markdown
# File: test/ava.config.mjs

export default {
	files: ['**/*.test.ts', '**/*.test.js'],
	extensions: {
		ts: 'module',
		js: true
	},
	nodeArguments: ['--loader=tsx', '--no-warnings'],
	environmentVariables: {
		NODE_ENV: 'test'
	},
	verbose: true,
	timeout: '2m'
}


# File: tsconfig.json

{
  "compilerOptions": {
    "lib": ["es2020", "DOM"],
    "module": "NodeNext",
    "target": "es2020",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": false,
    "moduleResolution": "NodeNext",
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "declaration": false,
    "declarationMap": false,
    "sourceMap": false,
    "types": ["node"],
    "noImplicitAny": false
  },
  "include": ["src"],
  "exclude": ["coverage", "tmp-kit-test"]
}


# File: package.json

{
  "name": "@johnlindquist/kit",
  "type": "module",
  "version": "0.0.0-development",
  "description": "The Script Kit SDK",
  "exports": {
    ".": "./build/kit.js",
    "./types": "./types/index.d.ts",
    "./types/*": "./types/*",
    "./api/*": "./build/api/*",
    "./cli/*": "./build/cli/*",
    "./core/*": "./build/core/*",
    "./globals/*": "./build/globals/*",
    "./lib/*": "./build/lib/*",
    "./main/*": "./build/main/*",
    "./platform/*": "./build/platform/*",
    "./pro/*": "./build/pro/*",
    "./run/*": "./build/run/*",
    "./setup/*": "./build/setup/*",
    "./target/*": "./build/target/*",
    "./types/kitapp": "./types/kitapp.d.ts",
    "./cjs/*": "./build/cjs/*",
    "./cjs": "./build/cjs/index.cjs"
  },
  "types": "./index.d.ts",
  "engines": {
    "node": ">=16.0.0"
  },
  "scripts": {
    "test-kit": "cd ./test && npm test",
    "watch": "concurrently --restart-tries 10 \"npm run watch-ts\" \"npm run watch-templates\"",
    "watch-templates": "chokidar './root/**/*.*' -c 'rsync -a ./root/ ~/.kit'",
    "watch-ts": "npm run build-kit -- --watch",
    "build-kit": "npm run clean && esbuild ./src/index.ts --bundle --platform=node --outfile=./build/kit.js --format=esm --external:@johnlindquist/kit --external:keyv --external:node-notifier --external:node-mac-notifier --external:mac-notification-state --external:extract-zip --external:download --external:mac-windows --external:trash --external:@nut-tree/nut-js --external:koffi --external:detect-port --external:robotjs  --external:sound-play --external:node-webcam --external:agentkeepalive --external:sharp --external:@nut-tree/bolt --external:node-screenshots --external:@resvg/resvg-js  --external:usb-detection --define:process.env.KIT_CONTEXT='\"module\"' --external:keycode --external:jszip --external:littlefs --external:ndb --external:sharp --external:esbuild --external:@kit-sdk/api --external:@esbuild/* --external:esbuild-* --external:@yao-pkg/pkg --external:pkg  --external:playwright",
    "build-worker": "esbuild ./src/workers/cache-grouped-scripts-worker.ts --bundle --platform=node --outfile=./build/workers/cache-grouped-scripts-worker.js --format=esm --external:@johnlindquist/kit",
    "clean": "rm -rf ./build && mkdir -p ./build",
    "build-index": "npm run build-index-esm && npm run build-loader",
    "build-loader": "esbuild ./src/loader.ts --bundle --platform=node --packages=external --outfile=./build/loader.js --format=esm",
    "build-cjs": "esbuild ./src/index.ts --bundle --platform=node --outfile=./build/cjs/index.cjs --format=cjs --external:@johnlindquist/kit --external:@yao-pkg/pkg --external:esbuild --external:keyv --external:node-notifier --external:node-mac-notifier --external:mac-notification-state --external:download --external:mac-windows --external:trash --external:@nut-tree/nut-js --external:koffi --external:detect-port --external:robotjs  --external:sound-play --external:node-webcam --external:agentkeepalive --external:sharp --external:@nut-tree/bolt --external:node-screenshots --external:@resvg/resvg-js  --external:usb-detection --define:process.env.KIT_CONTEXT='\"module\"' --external:keycode --external:jszip --external:littlefs --external:ndb --external:@esbuild/* --external:esbuild-* --external:playwright",
    "build-static": "rimraf ~/.kit/api ~/.kit/cli ~/.kit/core ~/.kit/lib ~/.kit/pro ~/.kit/run ~/.kit/setup ~/.kit/target ~/.kit/types && npm run copy-src && npm run copy-types",
    "build-index-esm": "tsup-node ./src/index.ts --clean --format esm --outDir ./build --out-extension .js=.js",
    "copy-src": "rsync -a ./build/ ~/.kit",
    "copy-types": "rsync -a ./types/ ~/.kit/types",
    "copy-root": "rsync -a ./root/ ~/.kit",
    "copy-workers": "rsync -a ./build/workers ~/.kit",
    "copy-all": "npm run copy-src && npm run copy-types && npm run copy-root && npm run copy-workers",
    "build": "npm run build-kit && npm run build-worker && npm run build-cjs && npm run copy-all",
    "watch-build": "npm run build && chokidar '~/.kit/**/*.js' -c 'npm run build'",
    "build-kit-standalone": "cd .. && tsx ./scripts/build-kit-standalone.ts",
    "build-ci": "npm run build && npm run build-kit-standalone",
    "build-declaration": "tsc -p tsconfig-declaration.json --declaration --emitDeclarationOnly --declarationDir types",
    "dev": "npm run build && npm run test-kit",
    "test": "npm run build && npm run test-kit",
    "prepare": "npm run build",
    "postinstall": "npx node ./build/cli/postinstall.js",
    "semantic-release": "semantic-release",
    "clean-api": "rm -rf ./src/api/packages",
    "list-exports": "npx -y @slikts/ts-package-exports ./package.json",
    "test-exports": "npx -y @arethetypeswrong/cli",
    "ava": "ava --config ./test/ava.config.mjs --fail-fast",
    "ava:watch": "ava --config ./test/ava.config.mjs --watch",
    "ava:debug": "ava debug --config ./test/ava.config.mjs",
    "ava:reset": "npx ava reset-cache",
    "clean-test": "rm -rf ./tmp-kit-test",
    "bump-version": "npm version patch --no-git-tag-version",
    "bump-minor": "npm version minor --no-git-tag-version",
    "bump-major": "npm version major --no-git-tag-version",
    "update-deps": "ncu -u",
    "verify": "tsc -p tsconfig.verify.json --noEmit"
  },
  "devDependencies": {
    "@types/chrome-trace-event": "^1.3.5",
    "@types/common-tags": "^1.8.1",
    "@types/cross-spawn": "^6.0.2",
    "@types/decompress": "^4.2.4",
    "@types/degit": "^2.8.3",
    "@types/detect-port": "^1.3.5",
    "@types/dotenv": "^8.2.0",
    "@types/download": "^8.0.2",
    "@types/fs-extra": "^11.0.4",
    "@types/get-installed-path": "^4.0.2",
    "@types/handlebars": "^4.1.0",
    "@types/inquirer": "^9.0.7",
    "@types/lodash.debounce": "^4.0.9",
    "@types/marked": "^6.0.0",
    "@types/minimist": "^1.2.5",
    "@types/mkdirp": "^2.0.0",
    "@types/module-alias": "^2.0.2",
    "@types/node": "^22.10.6",
    "@types/node-notifier": "^8.0.5",
    "@types/open": "^6.2.1",
    "@types/package-json": "^8.1.0",
    "@types/ps-tree": "^1.1.2",
    "@types/readable-stream": "^4.0.11",
    "@types/recursive-readdir": "^2.2.4",
    "@types/slugify": "^1.0.3",
    "@types/stream-buffers": "^3.0.7",
    "@types/untildify": "^4.0.2",
    "@types/uuid": "^10.0.0",
    "@types/wrap-ansi": "^8.1.0",
    "@types/ws": "^8.5.13",
    "@typescript-eslint/eslint-plugin": "^8.20.0",
    "@typescript-eslint/parser": "^8.20.0",
    "ava": "^6.2.0",
    "c8": "^10.1.3",
    "chokidar-cli": "^3.0.0",
    "concurrently": "^9.1.2",
    "cross-env": "^7.0.3",
    "esbuild": "^0.24.2",
    "eslint": "^8.57.1",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.2.2",
    "prettier": "^3.4.2",
    "rimraf": "^6.0.1",
    "semantic-release": "^24.2.1",
    "sinon": "^19.0.2",
    "tsup": "^8.3.5",
    "tsx": "^4.19.2",
    "type-fest": "^4.31.0",
    "typescript": "^5.7.2"
  },
  "dependencies": {
    "@ai-sdk/anthropic": "^1.0.8",
    "@ai-sdk/google": "^1.0.3",
    "@ai-sdk/openai": "^1.0.12",
    "@anthropic-ai/sdk": "^0.34.1",
    "@johnlindquist/globals": "^1.16.1",
    "@mcp-framework/assistant": "^0.7.3",
    "@modelcontextprotocol/sdk": "1.0.1",
    "@octokit/rest": "^20.1.1",
    "@opendal/node-osx-arm64": "^0.51.1",
    "@opendal/node-osx-x64": "^0.51.1",
    "@resvg/resvg-js": "^2.6.2",
    "@sindresorhus/slugify": "^2.2.1",
    "@types/express": "^4.17.21",
    "agentkeepalive": "^4.5.0",
    "ai": "^4.0.21",
    "body-parser": "^1.20.3",
    "camelcase": "^8.0.0",
    "chrome-trace-event": "^1.0.3",
    "chromium-bidi": "^0.8.1",
    "clipboardy": "^4.0.0",
    "close-with-grace": "^2.1.0",
    "common-tags": "^1.8.2",
    "cors": "^2.8.5",
    "cosmiconfig": "^9.0.0",
    "cross-spawn": "^7.0.6",
    "csv-parser": "^3.0.0",
    "csv-writer": "^1.6.0",
    "date-fns": "^4.1.0",
    "decompress": "^4.2.1",
    "degit": "^2.8.4",
    "detect-port": "^1.6.1",
    "dotenv": "^16.4.7",
    "download": "^8.0.0",
    "env-paths": "^3.0.0",
    "esbuild": "^0.24.2",
    "execa": "^9.5.2",
    "express": "^4.21.2",
    "express-ws": "^5.0.2",
    "extract-zip": "^2.0.1",
    "fast-glob": "^3.3.3",
    "file-url": "^4.0.0",
    "find-up": "^7.0.0",
    "form-data": "^4.0.1",
    "fs-extra": "^11.2.0",
    "fs-jetpack": "^5.1.0",
    "get-app-data-path": "^5.0.0",
    "get-installed-path": "^5.0.1",
    "google-auth-library": "^9.17.0",
    "handlebars": "^4.7.8",
    "hex-rgb": "^5.0.0",
    "hot-shots": "^10.2.1",
    "http-terminator": "^3.2.0",
    "iconv-lite": "^0.6.3",
    "immer": "^10.1.1",
    "inquirer": "^11.3.0",
    "is-docker": "^3.0.0",
    "is-path-inside": "^4.0.0",
    "is-port-reachable": "^4.0.0",
    "isomorphic-git": "^1.27.1",
    "keycode": "^2.2.1",
    "latest-version": "^9.0.0",
    "listr2": "^8.2.5",
    "lodash.debounce": "^4.0.8",
    "lowdb": "^7.0.1",
    "mac-focus": "^2.0.2",
    "mac-notification-state": "^3.0.0",
    "mac-windows": "^1.0.0",
    "marked": "^16.0.0",
    "memoizee": "^0.4.17",
    "minimist": "^1.2.8",
    "mkdirp": "^3.0.1",
    "module-alias": "^2.2.3",
    "natural": "^8.0.1",
    "natural-orderby": "^5.0.0",
    "node-fetch": "^3.3.2",
    "node-gyp": "^11.0.0",
    "node-html-parser": "^7.0.1",
    "node-mac-notifier": "^3.0.0",
    "node-notifier": "^10.0.1",
    "node-screenshots": "^0.3.0",
    "node-stream-zip": "^1.15.0",
    "node-watch": "^0.7.4",
    "npm-check-updates": "^17.1.13",
    "obs-websocket-js": "^5.0.7",
    "oclif": "^4.16.2",
    "open": "^10.1.0",
    "ow": "^2.0.0",
    "p-map": "^7.0.3",
    "p-retry": "^6.2.1",
    "package-json": "^10.0.1",
    "playwright": "^1.50.1",
    "pm2": "^5.4.3",
    "preferred-pm": "^4.0.0",
    "pretty-bytes": "^6.1.1",
    "ps-tree": "^1.2.0",
    "quick-score": "^0.3.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "readable-stream": "^4.6.0",
    "recursive-readdir": "^2.2.3",
    "registry-url": "^6.0.1",
    "rehype": "^13.0.2",
    "remark": "^15.0.1",
    "replace-in-file": "^8.2.0",
    "safe-stable-stringify": "^2.5.0",
    "sanitize-filename": "^1.6.3",
    "semver": "^7.6.3",
    "sharp": "^0.33.5",
    "shelljs": "^0.8.5",
    "slugify": "^1.6.6",
    "socket.io": "^4.8.1",
    "socket.io-client": "^4.8.1",
    "sound-play": "^1.1.0",
    "stream-buffers": "^3.0.3",
    "string-argv": "^0.3.2",
    "strip-ansi": "^7.1.0",
    "tasklist": "^5.0.0",
    "terminal-link": "^3.0.0",
    "trash": "^9.0.0",
    "tree-kill": "^1.2.2",
    "untildify": "^5.0.0",
    "usb-detection": "^4.14.2",
    "uuid": "^11.0.5",
    "vite": "^6.0.7",
    "which-pm-runs": "^2.0.0",
    "wrap-ansi": "^9.0.0",
    "ws": "^8.18.0",
    "zod": "^3.24.1",
    "zod-to-json-schema": "^3.24.1",
    "zx": "^8.2.4"
  },
  "bin": {
    "kit": "./build/cli/kit.js",
    "kit-disable-telemetry": "./build/cli/disable-telemetry.js"
  },
  "files": [
    "build",
    "types",
    "root",
    "test-sdk",
    "scripts",
    "API.md",
    ".kitignore",
    "index.d.ts"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/johnlindquist/kit.git"
  },
  "publishConfig": {
    "registry": "https://registry.npmjs.org",
    "access": "public"
  },
  "release": {
    "branches": [
      "main"
    ],
    "plugins": [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      "@semantic-release/npm"
    ]
  }
}


# File: src/core/sourcemap-formatter.ts

import { existsSync } from 'fs'
import { isAbsolute, normalize, resolve } from 'path'
import os from 'os'

export interface StackFrame {
  file: string
  line: number
  column: number
  function?: string
  isNative?: boolean
  isEval?: boolean
  isConstructor?: boolean
}

export interface FormattedError {
  message: string
  name: string
  stack: string
  frames: StackFrame[]
  originalStack?: string
}

export class SourcemapErrorFormatter {
  private static readonly STACK_FRAME_REGEX = /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/
  private static readonly WINDOWS_PATH_REGEX = /^([a-zA-Z]:\\|\\\\)/
  private static readonly FILE_URL_REGEX = /^file:\/\//

  /**
   * Formats an error with enhanced stack trace information
   */
  static formatError(error: Error): FormattedError {
    const frames = this.parseStackTrace(error.stack || '')
    
    return {
      message: error.message,
      name: error.name,
      stack: this.formatStackTrace(frames, error),
      frames,
      originalStack: error.stack
    }
  }

  /**
   * Parses a stack trace string into structured frames
   */
  private static parseStackTrace(stack: string): StackFrame[] {
    const lines = stack.split('\n')
    const frames: StackFrame[] = []

    for (const line of lines) {
      const match = line.match(this.STACK_FRAME_REGEX)
      if (match) {
        const [, functionName, fileRaw, lineStr, columnStr] = match
        
        // Clean up file path
        let file = fileRaw
          .replace(this.FILE_URL_REGEX, '')
          .replace(/\?.*$/, '') // Remove query parameters
        
        // Handle Windows paths
        if (os.platform() === 'win32' && file.startsWith('/')) {
          // Convert /C:/path to C:/path on Windows
          file = file.substring(1)
        }
        
        // Ensure absolute paths remain absolute after normalization
        const isAbsolutePath = file.startsWith('/') || this.WINDOWS_PATH_REGEX.test(file)
        file = normalize(file)
        
        // On Unix, normalize may strip leading slash, restore it if needed
        if (isAbsolutePath && !file.startsWith('/') && os.platform() !== 'win32') {
          file = '/' + file
        }
        
        frames.push({
          file,
          line: parseInt(lineStr, 10),
          column: parseInt(columnStr, 10),
          function: functionName || '<anonymous>',
          isNative: line.includes('native'),
          isEval: line.includes('eval'),
          isConstructor: line.includes('new ')
        })
      }
    }

    return frames
  }

  /**
   * Formats stack frames back into a readable stack trace
   */
  private static formatStackTrace(frames: StackFrame[], error: Error): string {
    const lines = [\`\${error.name}: \${error.message}\`]
    
    for (const frame of frames) {
      // Skip node_modules and internal frames unless in verbose mode
      if (!process.env.KIT_ERROR_VERBOSE && this.shouldSkipFrame(frame)) {
        continue
      }
      
      const location = \`\${frame.file}:\${frame.line}:\${frame.column}\`
      const functionPart = frame.function !== '<anonymous>' 
        ? \`\${frame.function} (\${location})\` 
        : location
        
      lines.push(\`    at \${functionPart}\`)
    }
    
    return lines.join('\n')
  }

  /**
   * Determines if a frame should be skipped in the output
   */
  private static shouldSkipFrame(frame: StackFrame): boolean {
    const skipPatterns = [
      /node_modules/,
      /internal\/modules/,
      /internal\/process/,
      /internal\/timers/
    ]
    
    return skipPatterns.some(pattern => pattern.test(frame.file))
  }

  /**
   * Extracts error location for the error prompt
   */
  static extractErrorLocation(error: Error): { file: string; line: number; column: number } | null {
    const formatted = this.formatError(error)
    
    // Find first non-internal frame
    const relevantFrame = formatted.frames.find(frame => 
      !this.shouldSkipFrame(frame) && 
      existsSync(frame.file)
    )
    
    if (relevantFrame) {
      return {
        file: relevantFrame.file,
        line: relevantFrame.line,
        column: relevantFrame.column
      }
    }
    
    return null
  }

  /**
   * Validates and resolves a file path
   */
  static resolveFilePath(filePath: string, basePath?: string): string | null {
    try {
      // Remove file:// protocol if present
      let cleanPath = filePath.replace(this.FILE_URL_REGEX, '')
      
      // Handle Windows paths
      if (os.platform() === 'win32' && cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1)
      }
      
      // Resolve relative paths
      const isAbsolutePath = cleanPath.startsWith('/') || this.WINDOWS_PATH_REGEX.test(cleanPath)
      let resolvedPath = isAbsolute(cleanPath) 
        ? normalize(cleanPath)
        : resolve(basePath || process.cwd(), cleanPath)
      
      // On Unix, normalize may strip leading slash, restore it if needed  
      if (isAbsolutePath && !resolvedPath.startsWith('/') && os.platform() !== 'win32') {
        resolvedPath = '/' + resolvedPath
      }
      
      // Check if file exists
      if (existsSync(resolvedPath)) {
        return resolvedPath
      }
      
      // Try with .ts extension if .js doesn't exist
      const tsPath = resolvedPath.replace(/\.js$/, '.ts')
      if (existsSync(tsPath)) {
        return tsPath
      }
      
      // Try with .tsx extension
      const tsxPath = resolvedPath.replace(/\.js$/, '.tsx')
      if (existsSync(tsxPath)) {
        return tsxPath
      }
      
      return null
    } catch (error) {
      return null
    }
  }
}


# File: src/core/sourcemap-formatter.test.ts

import ava from 'ava'
import { SourcemapErrorFormatter } from './sourcemap-formatter.js'
import os from 'os'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)

ava('formatError should parse basic error stack', (t) => {
  const error = new Error('Test error')
  error.stack = \`Error: Test error
    at testFunction (/path/to/file.js:10:5)
    at Object.<anonymous> (/path/to/file.js:20:1)
    at Module._compile (node:internal/modules/cjs/loader:1000:10)\`

  const result = SourcemapErrorFormatter.formatError(error)

  t.is(result.message, 'Test error')
  t.is(result.name, 'Error')
  t.is(result.frames.length, 3)
  t.is(result.frames[0].file, os.platform() === 'win32' ? '\\path\\to\\file.js' : '/path/to/file.js')
  t.is(result.frames[0].line, 10)
  t.is(result.frames[0].column, 5)
  t.is(result.frames[0].function, 'testFunction')
})

ava('formatError should handle file:// URLs', (t) => {
  const error = new Error('Test error')
  error.stack = \`Error: Test error
    at file:///Users/test/script.js:5:10
    at file://C:/Users/test/script.js:10:20\`

  const result = SourcemapErrorFormatter.formatError(error)

  t.is(result.frames.length, 2)
  
  // First frame - Unix style
  if (os.platform() === 'win32') {
    t.is(result.frames[0].file, '\\Users\\test\\script.js')
  } else {
    t.is(result.frames[0].file, '/Users/test/script.js')
  }
  
  // Second frame - Windows style
  if (os.platform() === 'win32') {
    t.is(result.frames[1].file, 'C:\\Users\\test\\script.js')
  } else {
    t.is(result.frames[1].file, 'C:/Users/test/script.js')
  }
})

ava('formatError should remove query parameters', (t) => {
  const error = new Error('Test error')
  error.stack = \`Error: Test error
    at file:///path/to/file.js?uuid=12345:10:5\`

  const result = SourcemapErrorFormatter.formatError(error)

  t.is(result.frames[0].file, os.platform() === 'win32' ? '\\path\\to\\file.js' : '/path/to/file.js')
  t.is(result.frames[0].line, 10)
  t.is(result.frames[0].column, 5)
})

ava('formatError should skip node_modules by default', (t) => {
  const error = new Error('Test error')
  error.stack = \`Error: Test error
    at userFunction (/app/src/index.js:10:5)
    at moduleFunction (/app/node_modules/lodash/index.js:100:10)
    at internal/process (/internal/process/task_queues.js:95:5)
    at anotherUserFunction (/app/src/utils.js:20:15)\`

  const result = SourcemapErrorFormatter.formatError(error)
  const formatted = result.stack.split('\n')

  // Should include error message and two user functions only
  t.is(formatted.length, 3)
  t.true(formatted[1].includes('userFunction'))
  t.true(formatted[2].includes('anotherUserFunction'))
  t.false(result.stack.includes('node_modules'))
  t.false(result.stack.includes('internal/process'))
})

ava('formatError should include all frames with KIT_ERROR_VERBOSE', (t) => {
  const originalVerbose = process.env.KIT_ERROR_VERBOSE
  process.env.KIT_ERROR_VERBOSE = 'true'

  const error = new Error('Test error')
  error.stack = \`Error: Test error
    at userFunction (/app/src/index.js:10:5)
    at moduleFunction (/app/node_modules/lodash/index.js:100:10)\`

  const result = SourcemapErrorFormatter.formatError(error)

  t.true(result.stack.includes('node_modules'))

  // Restore original value
  if (originalVerbose === undefined) {
    delete process.env.KIT_ERROR_VERBOSE
  } else {
    process.env.KIT_ERROR_VERBOSE = originalVerbose
  }
})

ava('extractErrorLocation should return first relevant frame', (t) => {
  const error = new Error('Test error')
  error.stack = \`Error: Test error
    at internal/modules (/node:internal/modules/cjs/loader:1000:10)
    at userFunction (\${__filename}:10:5)
    at anotherFunction (/nonexistent/file.js:20:15)\`

  const location = SourcemapErrorFormatter.extractErrorLocation(error)

  t.not(location, null)
  t.is(location?.file, __filename)
  t.is(location?.line, 10)
  t.is(location?.column, 5)
})

ava('resolveFilePath should handle various path formats', (t) => {
  // Test absolute path
  const resolved = SourcemapErrorFormatter.resolveFilePath(__filename)
  t.is(resolved, __filename)

  // Test file:// URL
  const fileUrl = \`file://\${__filename}\`
  const resolvedUrl = SourcemapErrorFormatter.resolveFilePath(fileUrl)
  t.is(resolvedUrl, __filename)

  // Test non-existent file
  const nonExistent = SourcemapErrorFormatter.resolveFilePath('/nonexistent/file.js')
  t.is(nonExistent, null)
})

ava('resolveFilePath should try TypeScript extensions', (t) => {
  // This test assumes the test file exists as .ts
  const jsPath = __filename.replace(/\.ts$/, '.js')
  const resolved = SourcemapErrorFormatter.resolveFilePath(jsPath)
  
  // Should find the .ts version
  t.is(resolved, __filename)
})
\`\`\`