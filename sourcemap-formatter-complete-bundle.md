This file is a merged representation of a subset of the codebase, containing specifically included files, combined into a single document by Repomix.

<file_summary>
This section contains a summary of this file.

<purpose>
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.
</purpose>

<file_format>
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  - File path as an attribute
  - Full contents of the file
</file_format>

<usage_guidelines>
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.
</usage_guidelines>

<notes>
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: src/core/sourcemap-formatter.ts, src/core/sourcemap-formatter.test.ts, test/ava.config.mjs, test/ava.config.worker.mjs, package.json, tsconfig.json, tsconfig.verify.json, .github/workflows/release.yml, build/build-ci.js, build/build-kit.ts
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)
</notes>

</file_summary>

<directory_structure>
.github/
  workflows/
    release.yml
src/
  core/
    sourcemap-formatter.test.ts
    sourcemap-formatter.ts
test/
  ava.config.mjs
  ava.config.worker.mjs
package.json
tsconfig.json
tsconfig.verify.json
</directory_structure>

<files>
This section contains the contents of the repository's files.

<file path="test/ava.config.mjs">
export default {
  workerThreads: false,
  extensions: {
    ts: "module",
  },
  nodeArguments: ["--import=tsx"],
  environmentVariables: {
    KIT_TEST: "true",
  },
  verbose: true,
  files: ["src/**/*.test.ts", "test/**/*.test.ts"],
}
</file>

<file path="test/ava.config.worker.mjs">
export default {
  workerThreads: false,
  extensions: {
    ts: "module",
  },
  nodeArguments: ["--import=tsx"],
  environmentVariables: {
    KIT_TEST: "true",
  },
  verbose: true,
  files: ["src/workers/cache-grouped-scripts-worker.test.ts"],
}
</file>

<file path="tsconfig.verify.json">
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "rootDir": "."
  },
  "include": [
    "./src/**/*",
    "./build/**/*",
    "./scripts/**/*",
    "./test/**/*",
    "./test-sdk/**/*"
  ],
  "exclude": [
    "./node_modules/**",
    "./dist/**",
    "./.kit/**",
    "**/*.test.*"
  ]
}
</file>

<file path="src/core/sourcemap-formatter.test.ts">
import ava from 'ava'
import { SourcemapErrorFormatter } from './sourcemap-formatter.js'
import os from 'os'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)

ava('formatError should parse basic error stack', (t) => {
  const error = new Error('Test error')
  error.stack = `Error: Test error
    at testFunction (/path/to/file.js:10:5)
    at Object.<anonymous> (/path/to/file.js:20:1)
    at Module._compile (node:internal/modules/cjs/loader:1000:10)`

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
  error.stack = `Error: Test error
    at file:///Users/test/script.js:5:10
    at file://C:/Users/test/script.js:10:20`

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
  error.stack = `Error: Test error
    at file:///path/to/file.js?uuid=12345:10:5`

  const result = SourcemapErrorFormatter.formatError(error)

  t.is(result.frames[0].file, os.platform() === 'win32' ? '\\path\\to\\file.js' : '/path/to/file.js')
  t.is(result.frames[0].line, 10)
  t.is(result.frames[0].column, 5)
})

ava('formatError should skip node_modules by default', (t) => {
  const error = new Error('Test error')
  error.stack = `Error: Test error
    at userFunction (/app/src/index.js:10:5)
    at moduleFunction (/app/node_modules/lodash/index.js:100:10)
    at internal/process (/internal/process/task_queues.js:95:5)
    at anotherUserFunction (/app/src/utils.js:20:15)`

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
  error.stack = `Error: Test error
    at userFunction (/app/src/index.js:10:5)
    at moduleFunction (/app/node_modules/lodash/index.js:100:10)`

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
  error.stack = `Error: Test error
    at internal/modules (/node:internal/modules/cjs/loader:1000:10)
    at userFunction (${__filename}:10:5)
    at anotherFunction (/nonexistent/file.js:20:15)`

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
  const fileUrl = `file://${__filename}`
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
</file>

<file path="src/core/sourcemap-formatter.ts">
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
  // Windows absolute path: drive letter ("C:\" or "C:/") or UNC ("\\server\share")
  private static readonly WINDOWS_PATH_REGEX = /^([a-zA-Z]:[\\/]|\\\\)/
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
        
        // Drop the leading slash for Windows drive paths like "/C:/..."
        // This handles file://C:/... URLs that become /C:/... after protocol removal
        file = file.replace(/^\/([a-zA-Z]:\/?)/, '$1')
        
        // Ensure absolute paths remain absolute after normalization
        const isAbsolutePath = file.startsWith('/') || this.WINDOWS_PATH_REGEX.test(file)
        file = normalize(file)
        
        // On Unix, normalize may strip leading slash, restore it if needed
        // But don't add a slash to Windows-style paths (C:/, \\server\share)
        if (isAbsolutePath && !file.startsWith('/') && !this.WINDOWS_PATH_REGEX.test(file) && os.platform() !== 'win32') {
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
    const lines = [`${error.name}: ${error.message}`]
    
    for (const frame of frames) {
      // Skip node_modules and internal frames unless in verbose mode
      if (!process.env.KIT_ERROR_VERBOSE && this.shouldSkipFrame(frame)) {
        continue
      }
      
      const location = `${frame.file}:${frame.line}:${frame.column}`
      const functionPart = frame.function !== '<anonymous>' 
        ? `${frame.function} (${location})` 
        : location
        
      lines.push(`    at ${functionPart}`)
    }
    
    return lines.join('\n')
  }

  /**
   * Determines if a frame should be skipped in the output
   */
  private static shouldSkipFrame(frame: StackFrame): boolean {
    // Normalize path separators so regexes behave the same on Win & POSIX
    const f = frame.file.replace(/\\/g, '/')
    const skipPatterns = [
      /(?:^|\/)node_modules(?:\/|$)/,
      /(?:^|\/)internal\/modules(?:\/|$)/,
      /(?:^|\/)internal\/process(?:\/|$)/,
      /(?:^|\/)internal\/timers(?:\/|$)/,
      /^node:internal\//, // e.g., node:internal/modules/...
    ]
    
    return skipPatterns.some(pattern => pattern.test(f))
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
      
      // Drop the leading slash for Windows drive paths like "/C:/..."
      // This handles file://C:/... URLs that become /C:/... after protocol removal
      cleanPath = cleanPath.replace(/^\/([a-zA-Z]:\/?)/, '$1')
      
      // Resolve relative paths
      const isAbsolutePath = cleanPath.startsWith('/') || this.WINDOWS_PATH_REGEX.test(cleanPath)
      let resolvedPath = (isAbsolute(cleanPath) || this.WINDOWS_PATH_REGEX.test(cleanPath))
        ? normalize(cleanPath)
        : resolve(basePath || process.cwd(), cleanPath)
      
      // On Unix, normalize may strip leading slash, restore it if needed
      // But don't add a slash to Windows-style paths (C:/, \\server\share)
      if (isAbsolutePath && !resolvedPath.startsWith('/') && !this.WINDOWS_PATH_REGEX.test(resolvedPath) && os.platform() !== 'win32') {
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
</file>

<file path="tsconfig.json">
{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "outDir": "./dist",
    "rootDir": "./src",
    "moduleResolution": "Node",
    "lib": ["esnext"],
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "sourceMap": true,
  },
  "exclude": ["./root/**", "./build/**", "./node_modules/**", "./src/types/kit-editor.d.ts", "**/*.test.*", "scripts/**"]
}
</file>

<file path=".github/workflows/release.yml">
name: Release kit.zip

on:
  push:
    branches:
      - main
      - beta
      - alpha
      - next
    tags:
      - "*"

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test-windows:
    runs-on: windows-latest
    steps:
      - name: Inject slug/short variables
        uses: rlespinasse/github-slug-action@v4

      - name: Set env vars
        run: |
          echo "wd_path=$PWD" >> $GITHUB_ENV
          echo "kit_path=$PWD/.kit" >> $GITHUB_ENV
          echo "KIT=$PWD/.kit" >> $GITHUB_ENV
          echo "release_channel=${{ env.GITHUB_REF_SLUG_URL }}" >> $GITHUB_ENV

      - name: Checkout kit
        uses: actions/checkout@master

      - uses: pnpm/action-setup@v4
        name: Install pnpm

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22.17.1
          cache: "pnpm"

      - name: Check node $PATH version
        shell: bash
        run: |
          node --version
          pnpm --version

      - name: pnpm i
        shell: bash
        run: |
          cd "${{ env.wd_path }}"
          pnpm i

      - name: pnpm build-kit
        shell: bash
        env:
          KIT: ${{ env.kit_path }}
        run: |
          pnpm build-kit

      - name: pnpm ava
        shell: bash
        env:
          KIT: ${{ env.kit_path }}
        run: |
          pnpm ava:ci

      - name: pnpm test
        uses: nick-invision/retry@v3
        with:
          max_attempts: 3
          timeout_minutes: 30
          command: |
            pnpm test
        env:
          KIT: ${{ env.kit_path }}

  test-mac-and-ubuntu:
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - name: Inject slug/short variables
        uses: rlespinasse/github-slug-action@v4

      - name: Set env vars
        run: |
          echo "wd_path=$PWD" >> $GITHUB_ENV
          echo "kit_path=$PWD/.kit" >> $GITHUB_ENV
          echo "KIT=$PWD/.kit" >> $GITHUB_ENV
          echo "release_channel=${{ env.GITHUB_REF_SLUG_URL }}" >> $GITHUB_ENV

      - name: Get Time
        id: time
        uses: nanzm/get-time-action@v2.0
        with:
          timeZone: 8
          format: "YYYY-MM-DD-HH-mm-ss"

      - name: Checkout kit
        uses: actions/checkout@master

      - uses: pnpm/action-setup@v4
        name: Install pnpm

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22.17.1
          cache: "pnpm"

      - name: Build Kit
        run: |
          pnpm i
          export KIT_NODE_PATH=$(pnpm node -e )
          KIT=./.kit pnpm node ./build/build-ci.js
        env:
          KIT: ${{ env.kit_path }}

      - name: Add node and kit to PATH
        run: |
          echo "${{ env.kit_path }}/bin" >> $GITHUB_PATH
          echo "---"
          echo "$GITHUB_PATH"
          echo "$PATH"

      - name: Check node $PATH version
        run: |
          node --version
          npm --version

      - name: Log ./.kit
        run: |
          ls ./.kit/*/*

      - name: pnpm i
        run: |
          cd "${{ env.wd_path }}"
          pnpm i

      - name: Verify Types
        run: |
          mkdir -p ~/dev
          cd ~/dev
          git clone https://github.com/johnlindquist/kit-examples-ts.git
          cd kit-examples-ts
          pnpm i ${{ env.kit_path }}
          pnpm i typescript
          # Create temporary tsconfig for type checking
          echo '{
            "compilerOptions": {
              "skipLibCheck": true,
              "types": ["@johnlindquist/kit"],
              "typeRoots": ["./node_modules/@johnlindquist"],
              "module": "nodenext",
              "target": "esnext",
              "moduleResolution": "nodenext",
              "esModuleInterop": true
            }
          }' > tsconfig.temp.json

          echo "Running type check on all .ts files..."
          # Run tsc and store output
          TYPECHECK_OUTPUT=$(find ./scripts -name '*.ts' -exec pnpm exec tsc --project tsconfig.temp.json {} \; 2>&1)
          if [ $? -ne 0 ]; then
            echo "❌ Type checking failed:"
            echo "$TYPECHECK_OUTPUT"
            exit 1
          else
            echo "✅ Type checking passed for all files"
            echo "Files checked:"
            find ./scripts -name '*.ts' | wc -l
          fi

      - name: pnpm ava
        run: |
          pnpm ava:ci

      - name: pnpm test
        uses: nick-invision/retry@v3
        with:
          max_attempts: 3
          timeout_minutes: 30
          command: |
            pnpm test
        env:
          KIT: ${{ env.kit_path }}

  release:
    runs-on: macos-latest
    needs: [test-windows, test-mac-and-ubuntu]
    steps:
      - name: Inject slug/short variables
        uses: rlespinasse/github-slug-action@v4

      - name: Set env vars
        run: |
          echo "wd_path=$PWD" >> $GITHUB_ENV
          echo "kit_path=$PWD/.kit" >> $GITHUB_ENV
          echo "KIT=$PWD/.kit" >> $GITHUB_ENV
          echo "release_channel=${{ env.GITHUB_REF_SLUG_URL }}" >> $GITHUB_ENV

      - name: Get Time
        id: time
        uses: nanzm/get-time-action@v2.0
        with:
          timeZone: 8
          format: "YYYY-MM-DD-HH-mm-ss"

      - name: Checkout kit
        uses: actions/checkout@master

      - uses: pnpm/action-setup@v4
        name: Install pnpm

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22.17.1
          cache: "pnpm"

      - name: Build Kit
        run: |
          pnpm install
          KIT=./.kit pnpm node ./build/build-ci.js

      - name: Add node and kit to PATH
        run: |
          echo "${{ env.kit_path }}/bin" >> $GITHUB_PATH
          echo "---"
          echo "$GITHUB_PATH"
          echo "$PATH"

      - name: Check node $PATH version
        run: |
          node --version
          pnpm --version

      - name: Semantic Release
        run: |
          cd "${{ env.wd_path }}"
          npx semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Archive Release
        uses: thedoctor0/zip-release@master
        with:
          filename: "kit.zip"
          path: ".kit"

      - name: Create Draft Release
        id: create_release
        uses: softprops/action-gh-release@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ steps.time.outputs.time }}
          name: ${{ env.release_channel }}
          draft: true
          prerelease: false

      - name: Create and Upload Release
        uses: softprops/action-gh-release@v2
        with:
          files: ./kit.zip
          tag_name: ${{ steps.time.outputs.time }}
          name: ${{ env.release_channel }}
          draft: true
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - uses: eregon/publish-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          release_id: ${{ steps.create_release.outputs.id }}
</file>

<file path="package.json">
{
  "name": "@johnlindquist/kit",
  "type": "module",
  "bin": {
    "kit": "bin/kit",
    "sk": "bin/sk",
    "kitblitz": "bin/kitblitz.mjs"
  },
  "engines": {
    "node": ">=14.8.0"
  },
  "version": "0.0.0-development",
  "description": "The Script Kit sdk",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/johnlindquist/kit.git"
  },
  "exports": {
    ".": {
      "types": "./types/index.d.ts",
      "import": "./index.js",
      "default": "./index.js"
    },
    "./*": "./*",
    "./api/*": "./api/*.js",
    "./cli/*": "./cli/*.js",
    "./target/*": "./target/*.js",
    "./platform/*": "./platform/*.js",
    "./run/*": "./run/*.js",
    "./core/*": "./core/*.js",
    "./workers": "./workers/index.js",
    "./types/*": "./types/*.js"
  },
  "types": "./types/index.d.ts",
  "scripts": {
    "ava": "ava --config ./test/ava.config.mjs --fail-fast",
    "ava:ci": "ava --config ./test/ava.config.mjs",
    "ava:watch": "ava --watch --no-worker-threads --config ./test/ava.config.mjs",
    "ava:reset": "ava reset-cache --config ./test/ava.config.mjs",
    "ava:debug": "ava debug --config ./test/ava.config.mjs",
    "coverage": "c8 --reporter=text --reporter=html npm run ava",
    "coverage:v8": "c8 --reporter=text --reporter=lcov --reporter=html npm run ava",
    "build-kit": "tsx ./build/build-kit.ts",
    "build": "tsx ./build/build-kit.ts",
    "verify": "tsc --noEmit -p tsconfig.verify.json",
    "commit": "cz",
    "rebuild-kit": "tsx ./build/rebuild-kit.ts",
    "download-md": "node ./build/download-md.js",
    "declaration": "tsc -p ./tsconfig-declaration.json --watch",
    "pretest:core": "node ./scripts/test-pre.js",
    "test:core": "cross-env NODE_NO_WARNINGS=1 ava ./src/core/*.test.js --no-worker-threads",
    "posttest:core": "node ./scripts/test-post.js",
    "pretest:kit": "node ./scripts/test-pre.js",
    "test:kit": "cross-env NODE_NO_WARNINGS=1 ava ./src/api/kit.test.js --no-worker-threads",
    "pretest:sdk": "node ./scripts/test-pre.js",
    "test:sdk": "cross-env NODE_NO_WARNINGS=1 ava ./test-sdk/*.test.js --no-worker-threads",
    "posttest:sdk": "node ./scripts/test-post.js",
    "pretest:api": "node ./scripts/test-pre.js",
    "test:api": "cross-env NODE_NO_WARNINGS=1 ava ./src/api/*.test.js --no-worker-threads",
    "posttest:api": "node ./scripts/test-post.js",
    "pretest:metadata": "node ./scripts/test-pre.js",
    "test:metadata": "cross-env NODE_NO_WARNINGS=1 ava ./src/core/metadata.test.js --no-worker-threads",
    "posttest:metadata": "node ./scripts/test-post.js",
    "pretest": "node ./scripts/test-pre.js",
    "test": "cross-env NODE_NO_WARNINGS=1 ava --no-worker-threads --fail-fast",
    "posttest": "node ./scripts/test-post.js",
    "build-editor-types": "tsx ./build/build-editor-types.ts",
    "rebuild-test": "npm run rebuild-kit && npm run test -- --fail-fast",
    "lazy-install": "npm i esbuild@0.23.1 --save-exact --production --prefer-dedupe --loglevel=verbose",
    "preinstall": "node ./build/preinstall.js"
  },
  "author": "John Lindquist (https://johnlindquist.com)",
  "license": "ISC",
  "pnpm": {
    "overrides": {
      "typescript": "5.8.3",
      "esbuild": "0.25.5"
    }
  },
  "dependencies": {
    "@ai-sdk/anthropic": "2.0.0-beta.5",
    "@ai-sdk/google": "2.0.0-beta.8",
    "@ai-sdk/openai": "2.0.0-beta.7",
    "@ai-sdk/react": "2.0.0-beta.16",
    "@ai-sdk/xai": "2.0.0-beta.4",
    "@johnlindquist/open": "^10.1.1",
    "@modelcontextprotocol/sdk": "1.13.3",
    "@octokit/auth-oauth-device": "8.0.1",
    "@octokit/core": "7.0.2",
    "@octokit/plugin-paginate-rest": "13.0.0",
    "@octokit/plugin-rest-endpoint-methods": "15.0.0",
    "@octokit/plugin-retry": "8.0.1",
    "@octokit/plugin-throttling": "11.0.1",
    "@openrouter/ai-sdk-provider": "1.0.0-beta.1",
    "@types/chalk": "2.2.4",
    "@types/download": "8.0.5",
    "@types/fs-extra": "11.0.4",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@types/shelljs": "0.8.17",
    "@typescript/lib-dom": "npm:@johnlindquist/no-dom@^1.0.2",
    "acorn": "^8.15.0",
    "acorn-typescript": "^1.4.13",
    "advanced-calculator": "1.1.1",
    "ai": "5.0.0-beta.18",
    "axios": "1.10.0",
    "body-parser": "^2.2.0",
    "bottleneck": "^2.19.5",
    "chalk": "5.4.1",
    "chalk-template": "1.1.0",
    "chrome-trace-event": "^1.0.4",
    "color-name": "2.0.0",
    "date-fns": "4.1.0",
    "dotenv": "^17.0.1",
    "dotenv-flow": "4.1.0",
    "download": "8.0.0",
    "enquirer": "2.4.1",
    "esbuild": "0.25.5",
    "execa": "9.6.0",
    "filesize": "10.1.6",
    "fs-extra": "^11.3.0",
    "globby": "^14.1.0",
    "handlebars": "4.7.8",
    "highlight.js": "^11.11.1",
    "isomorphic-git": "1.32.1",
    "jsonfile": "6.1.0",
    "keyv": "^5.3.4",
    "keyv-file": "^5.1.2",
    "lowdb": "7.0.1",
    "marked": "15.0.12",
    "marked-extended-tables": "2.0.1",
    "marked-gfm-heading-id": "4.1.1",
    "marked-highlight": "2.2.1",
    "minimist": "1.2.8",
    "open": "10.1.2",
    "p-retry": "6.2.1",
    "project-name-generator": "2.1.9",
    "quick-score": "^0.2.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "replace-in-file": "8.3.0",
    "rimraf": "6.0.1",
    "safe-stable-stringify": "^2.5.0",
    "shelljs": "0.10.0",
    "slugify": "1.6.6",
    "source-map-support": "^0.5.21",
    "strip-ansi": "7.1.0",
    "suggestion": "2.1.2",
    "tmp-promise": "3.0.3",
    "untildify": "5.0.0",
    "zod": "^4.0.5"
  },
  "devDependencies": {
    "@types/debug": "4.1.12",
    "@types/node": "^22.15.30",
    "@types/node-ipc": "9.2.3",
    "@types/sinon": "17.0.4",
    "acorn-walk": "8.3.4",
    "ava": "^6.4.0",
    "c8": "10.1.3",
    "cross-env": "^7.0.3",
    "cz-conventional-changelog": "^3.3.0",
    "debug": "4.4.1",
    "husky": "^9.1.7",
    "node-stream-zip": "^1.15.0",
    "semantic-release": "24.2.6",
    "semantic-release-plugin-update-version-in-files": "2.0.0",
    "sinon": "20.0.0",
    "tsc-watch": "7.1.1",
    "tsx": "4.20.3",
    "typescript": "5.8.3",
    "unzipper": "0.12.3",
    "vite": "6.3.5"
  },
  "ava": {
    "environmentVariables": {
      "KIT_TEST": "true"
    },
    "verbose": true,
    "files": [
      "src/**/*.test.js",
      "test/**/*.test.js",
      "test-sdk/**/*.test.js"
    ]
  },
  "release": {
    "branches": [
      "+([0-9]).x",
      "main",
      "next",
      {
        "name": "beta",
        "prerelease": true
      },
      {
        "name": "alpha",
        "prerelease": true
      }
    ],
    "plugins": [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      [
        "@semantic-release/npm",
        {
          "pkgRoot": "./.kit"
        }
      ],
      [
        "semantic-release-plugin-update-version-in-files",
        {
          "files": [
            "./.kit/package.json"
          ]
        }
      ]
    ]
  },
  "volta": {
    "node": "22.17.1"
  },
  "config": {
    "commitizen": {
      "path": "./node_modules/cz-conventional-changelog"
    }
  },
  "optionalDependencies": {
    "@johnlindquist/mac-windows": "1.0.2",
    "file-icon": "5.1.1",
    "get-app-icon": "1.0.1"
  },
  "packageManager": "pnpm@10.13.1"
}
</file>

</files>
