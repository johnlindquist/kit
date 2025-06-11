#!/usr/bin/env node

// src/run/mcp-server.ts
import "@johnlindquist/kit";

// src/core/db.ts
import * as path5 from "node:path";
import { rm } from "node:fs/promises";

// src/globals/axios.ts
import axios from "axios";
var get = global.get = axios.get;
var put = global.put = axios.put;
var post = global.post = axios.post;
var patch = global.patch = axios.patch;
var del = global.del = axios.delete;

// src/globals/chalk.ts
import _chalkTemplate from "chalk-template";
var chalk = global.chalk = _chalkTemplate;

// src/globals/child_process.ts
import child_process from "node:child_process";
var spawn = global.spawn = child_process.spawn;
var spawnSync2 = global.spawnSync = child_process.spawnSync;
var fork = global.fork = child_process.fork;

// src/globals/crypto.ts
import crypto from "node:crypto";
var uuid = global.uuid = crypto.randomUUID;

// src/globals/custom.ts
import { readFile, writeFile } from "node:fs/promises";

// src/globals/fs-extra.ts
import fs from "fs-extra";
var emptyDir = global.emptyDir = fs.emptyDir;
var emptyDirSync = global.emptyDirSync = fs.emptyDirSync;
var ensureFile = global.ensureFile = fs.ensureFile;
var ensureFileSync = global.ensureFileSync = fs.ensureFileSync;
var ensureDir2 = global.ensureDir = fs.ensureDir;
var ensureDirSync = global.ensureDirSync = fs.ensureDirSync;
var ensureLink = global.ensureLink = fs.ensureLink;
var ensureLinkSync = global.ensureLinkSync = fs.ensureLinkSync;
var ensureSymlink = global.ensureSymlink = fs.ensureSymlink;
var ensureSymlinkSync = global.ensureSymlinkSync = fs.ensureSymlinkSync;
var mkdirp = global.mkdirp = fs.mkdirp;
var mkdirpSync = global.mkdirpSync = fs.mkdirpSync;
var mkdirs = global.mkdirs = fs.mkdirs;
var mkdirsSync = global.mkdirsSync = fs.mkdirsSync;
var outputFile = global.outputFile = fs.outputFile;
var outputFileSync = global.outputFileSync = fs.outputFileSync;
var outputJson = global.outputJson = fs.outputJson;
var outputJsonSync = global.outputJsonSync = fs.outputJsonSync;
var pathExists = global.pathExists = fs.pathExists;
var pathExistsSync = global.pathExistsSync = fs.pathExistsSync;
var readJson = global.readJson = fs.readJson;
var readJsonSync = global.readJsonSync = fs.readJsonSync;
var remove = global.remove = fs.remove;
var removeSync = global.removeSync = fs.removeSync;
var writeJson = global.writeJson = fs.writeJson;
var writeJsonSync = global.writeJsonSync = fs.writeJsonSync;
var move = global.move = fs.move;
var moveSync = global.moveSync = fs.moveSync;

// src/globals/custom.ts
var ensureReadFile = async (pathLike, defaultContent = "", options = { encoding: "utf-8" }) => {
  await ensureFile(pathLike);
  if (defaultContent) {
    let readContent = await readFile(pathLike, options);
    if (!readContent) {
      await writeFile(pathLike, defaultContent);
      return defaultContent;
    }
  }
  return await readFile(pathLike, options);
};
var ensureReadJson = async (pathLike, defaultContent, options) => {
  if (await pathExists(pathLike)) {
    return await readJson(pathLike, options);
  }
  await ensureFile(pathLike);
  await writeJson(pathLike, defaultContent);
  return defaultContent;
};
global.ensureReadFile = ensureReadFile;
global.ensureReadJson = ensureReadJson;

// src/globals/download.ts
import _download from "download";
var download = global.download = _download;

// src/globals/execa.ts
import * as all from "execa";
var execa2 = all.execa;
global.execa = execa2;
var execaSync2 = all.execaSync;
global.execaSync = execaSync2;
var execaCommand2 = all.execaCommand;
global.execaCommand = execaCommand2;
global.exec = (command, options = { shell: true, cwd: process.cwd() }) => {
  return execaCommand2(command, options);
};
var exec = global.exec;
var execaCommandSync2 = all.execaCommandSync;
global.execaCommandSync = execaCommandSync2;
var execaNode2 = all.execaNode;
global.execaNode = execaNode2;
global.$ = all.$;
var $2 = global.$;

// src/globals/fs.ts
import fs2 from "node:fs";
import fsPromises from "node:fs/promises";
var readFile2 = global.readFile = fsPromises.readFile;
var writeFile2 = global.writeFile = fsPromises.writeFile;
var appendFile = global.appendFile = fsPromises.appendFile;
var readdir = global.readdir = fsPromises.readdir;
var copyFile = global.copyFile = fsPromises.copyFile;
var stat = global.stat = fsPromises.stat;
var lstat2 = global.lstat = fsPromises.lstat;
var rmdir = global.rmdir = fsPromises.rmdir;
var unlink = global.unlink = fsPromises.unlink;
var symlink = global.symlink = fsPromises.symlink;
var readlink = global.readlink = fsPromises.readlink;
var realpath = global.realpath = fsPromises.realpath;
var access2 = global.access = fsPromises.access;
var chown = global.chown = fsPromises.chown;
var lchown = global.lchown = fsPromises.lchown;
var utimes = global.utimes = fsPromises.utimes;
var lutimes = global.lutimes = fsPromises.lutimes;
var rename = global.rename = fsPromises.rename;
var readFileSync = global.readFileSync = fs2.readFileSync;
var writeFileSync = global.writeFileSync = fs2.writeFileSync;
var appendFileSync = global.appendFileSync = fs2.appendFileSync;
var readdirSync = global.readdirSync = fs2.readdirSync;
var copyFileSync = global.copyFileSync = fs2.copyFileSync;
var renameSync = global.renameSync = fs2.renameSync;
var createReadStream = global.createReadStream = fs2.createReadStream;
var createWriteStream = global.createWriteStream = fs2.createWriteStream;

// src/globals/globby.ts
import { globby as _globby } from "globby";
var globby2 = global.globby = _globby;

// src/globals/handlebars.ts
import handlebars from "handlebars";
var compile = global.compile = handlebars.compile;

// src/globals/marked.ts
import { marked as _marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";
import markedExtendedTables from "marked-extended-tables";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
var tableRegex = /<\/table>$/;
_marked.use(
  gfmHeadingId(),
  markedExtendedTables(),
  markedHighlight({
    langPrefix: "language-",
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return code;
    }
  }),
  {
    gfm: true,
    breaks: false,
    pedantic: false,
    silent: false,
    hooks: {
      postprocess(html) {
        html = html.replace(/<table>.*?<\/table>/gs, (match) => {
          return match.replace(/><(?!\/)/g, ">\n<").replace(/<\/tr><\/thead>/g, "</tr>\n</thead>").replace(/<\/tr><\/tbody>/g, "</tr>\n</tbody>").replace(/<\/tbody><\/table>/g, "</tbody></table>").replace(/<tbody>\n<tr>/g, "<tbody><tr>").replace(tableRegex, "</table>\n");
        });
        return html;
      }
    }
  }
);
var marked = globalThis.marked = _marked;
var _md = (markdown, containerClasses = "p-5 prose dark:prose-dark") => {
  let html = "";
  try {
    html = marked.parse(markdown).toString();
  } catch (e) {
    console.error(`Failed to parse markdown: ${e}`);
  }
  if (containerClasses) {
    return `<div class="${containerClasses}">${html}</div>`;
  }
  return html;
};
var md2 = globalThis.md = _md;

// src/globals/path.ts
import _path from "node:path";
var path = global.path = _path;
var resolve = global.resolve = _path.resolve;
var join = global.join = _path.join;
var dirname = global.dirname = _path.dirname;
var basename = global.basename = _path.basename;
var extname = global.extname = _path.extname;
var relative = global.relative = _path.relative;
var normalize = global.normalize = _path.normalize;
var isAbsolute = global.isAbsolute = _path.isAbsolute;
var sep = global.sep = _path.sep;
var delimiter = global.delimiter = _path.delimiter;
var parse = global.parse = _path.parse;

// src/globals/process.ts
var cwd2 = global.cwd = process.cwd;
var pid = global.pid = process.pid;
var stderr = global.stderr = process.stderr;
var stdin = global.stdin = process.stdin;
var stdout = global.stdout = process.stdout;
var uptime = global.uptime = process.uptime;

// src/globals/replace-in-file.ts
import { replaceInFile } from "replace-in-file";
var replace = global.replace = replaceInFile;

// src/globals/stream.ts
import Stream from "node:stream";
var Writable = global.Writable = Stream.Writable;
var Readable = global.Readable = Stream.Readable;
var Duplex = global.Duplex = Stream.Duplex;
var Transform = global.Transform = Stream.Transform;

// src/globals/zod.ts
import * as _zod from "zod";
var z2 = global.z = _zod.z;

// src/core/utils.ts
import { config } from "dotenv-flow";
import * as path4 from "node:path";
import { lstatSync, realpathSync } from "node:fs";
import { lstat as lstat3, readdir as readdir2 } from "node:fs/promises";
import { Parser } from "acorn";
import tsPlugin from "acorn-typescript";
import { pathToFileURL } from "node:url";

// src/core/parser.ts
import { readFile as readFile3, stat as stat2 } from "node:fs/promises";
import untildify from "untildify";

// src/core/resolvers.ts
import { homedir } from "node:os";
import * as path2 from "node:path";
var windowsSlashRE = /\\/g;
function slash(p) {
  return p.replace(windowsSlashRE, "/");
}
var createPathResolver = (parentDir) => (...parts) => {
  return path2.resolve(parentDir, ...parts);
};
var home = (...pathParts) => {
  return createPathResolver(homedir())(...pathParts);
};
var getEnvOrDefault = (envVar, defaultValue) => {
  return envVar && envVar !== "undefined" ? envVar : defaultValue;
};
var kitPath = (...parts) => createPathResolver(
  getEnvOrDefault(process.env.KIT, home(".kit"))
)(...parts.filter(Boolean));
var kenvPath = (...parts) => {
  if (global.__kenvPathMock && typeof global.__kenvPathMock === "function") {
    return global.__kenvPathMock(...parts);
  }
  return createPathResolver(
    getEnvOrDefault(process.env.KENV, home(".kenv"))
  )(...parts.filter(Boolean));
};

// src/core/parser.ts
import { parentPort } from "node:worker_threads";
var scriptCache = /* @__PURE__ */ new Map();
var shebangRegex = /^#!(.+)/m;
var previewRegex = /\bpreview\b\s*[:=]/i;
var postprocessMetadata = (metadata, fileContents) => {
  const result = { ...metadata };
  if (metadata.postfix !== void 0 && metadata.postfix === "false") {
    delete result.postfix;
  }
  if (metadata.shortcut) {
    result.shortcut = shortcutNormalizer(metadata.shortcut);
    result.friendlyShortcut = friendlyShortcut(result.shortcut);
  }
  if (metadata.background) {
    if (metadata.background !== "auto") {
      result.background = typeof metadata.background === "boolean" ? metadata.background : metadata.background === "true";
    }
  }
  if (metadata.shortcode) {
    result.shortcode = metadata.shortcode.trim().toLowerCase();
  }
  if (metadata.longRunning !== void 0) {
    if (typeof metadata.longRunning === "boolean") {
      result.longRunning = metadata.longRunning;
    } else if (typeof metadata.longRunning === "string") {
      result.longRunning = metadata.longRunning.trim().toLowerCase() === "true";
    }
  }
  if (metadata.trigger) {
    result.trigger = metadata.trigger.trim().toLowerCase();
  }
  if (metadata.alias) {
    result.alias = metadata.alias.trim().toLowerCase();
  }
  if (metadata.image) {
    result.img = slash(untildify(metadata.image));
  }
  if (metadata.emoji) {
    result.emoji = metadata.emoji;
  }
  if (metadata.index !== void 0) {
    result.index = typeof metadata.index === "string" ? Number.parseInt(metadata.index, 10) : metadata.index;
  }
  result.type = metadata.schedule ? "Schedule" /* Schedule */ : metadata.watch ? "Watch" /* Watch */ : metadata.system ? "System" /* System */ : metadata.background ? "Background" /* Background */ : "Prompt" /* Prompt */;
  const onTabRegex = /(?<=^onTab\(['"])(.+?)(?=['"])/gim;
  const tabsMatch = fileContents.match(onTabRegex);
  if (tabsMatch?.length > 0) {
    result.tabs = tabsMatch;
  }
  if (previewRegex.test(fileContents)) {
    result.hasPreview = true;
  }
  if (metadata.mcp) {
    result.response = true;
  }
  return result;
};
var parseMetadata = (fileContents) => {
  let metadata = getMetadata(fileContents);
  return postprocessMetadata(metadata, fileContents);
};
var getShebangFromContents = (contents) => {
  let match = contents.match(shebangRegex);
  return match ? match[1].trim() : void 0;
};
var commandFromFilePath = (filePath) => path.basename(filePath)?.replace(/\.(j|t)s$/, "") || "";
var iconFromKenv = async (kenv) => {
  let iconPath2 = kenv ? kenvPath("kenvs", kenv, "icon.png") : "";
  return kenv && await isFile(iconPath2) ? iconPath2 : "";
};
var parseFilePath = async (filePath) => {
  let command = commandFromFilePath(filePath);
  let kenv = kenvFromFilePath(filePath);
  let icon = await iconFromKenv(kenv);
  return {
    id: filePath,
    command,
    filePath,
    kenv,
    icon
  };
};
var parseScript = async (filePath) => {
  try {
    const fileStat = await stat2(filePath);
    const currentMtimeMs = fileStat.mtimeMs;
    const cachedEntry = scriptCache.get(filePath);
    if (cachedEntry && cachedEntry.mtimeMs === currentMtimeMs) {
      if (parentPort) {
        parentPort.postMessage({
          channel: "LOG_TO_PARENT" /* LOG_TO_PARENT */,
          value: `[parseScript] Cache hit for: ${filePath}`
        });
      }
      return cachedEntry.script;
    } else {
      if (parentPort) {
        if (!cachedEntry) {
          parentPort.postMessage({
            channel: "LOG_TO_PARENT" /* LOG_TO_PARENT */,
            value: `[parseScript] Cache miss (file not in cache): ${filePath}`
          });
        } else {
          parentPort.postMessage({
            channel: "LOG_TO_PARENT" /* LOG_TO_PARENT */,
            value: `[parseScript] Cache miss (mtime mismatch on ${filePath} - Cached: ${cachedEntry.mtimeMs}, Current: ${currentMtimeMs})`
          });
        }
      }
    }
    const contents = await readFile3(filePath, "utf8");
    const metadata = parseMetadata(contents);
    const shebang = getShebangFromContents(contents);
    const needsDebugger = /^\s*debugger/gim.test(contents);
    const parsedFilePath = await parseFilePath(filePath);
    const script = {
      shebang,
      ...metadata,
      ...parsedFilePath,
      needsDebugger,
      name: metadata.name || metadata.menu || parsedFilePath.command,
      description: metadata.description || ""
    };
    scriptCache.set(filePath, { script, mtimeMs: currentMtimeMs });
    return script;
  } catch (error) {
    console.error(`Error parsing script ${filePath}:`, error);
    throw error;
  }
};

// src/core/is.ts
import { constants } from "node:fs";
import { platform } from "node:os";
var isWin = platform().startsWith("win");
var isMac = platform().startsWith("darwin");
var isLinux = platform().startsWith("linux");
var isDir = async (dir) => {
  try {
    try {
      let stats = await lstat(dir).catch(() => {
        return {
          isDirectory: () => false
        };
      });
      return stats?.isDirectory();
    } catch (error) {
      log(error);
    }
    return false;
  } catch {
    return false;
  }
};
var isFile = async (file) => {
  try {
    await access(file, constants.F_OK);
    let stats = await lstat(file).catch(() => {
      return {
        isFile: () => false
      };
    });
    return stats?.isFile();
  } catch {
    return false;
  }
};

// src/core/constants.ts
var cmd = isMac ? "cmd" : "ctrl";
var scriptsDbPath = kitPath("db", "scripts.json");
var timestampsPath = kitPath("db", "timestamps.json");
var statsPath = kitPath("db", "stats.json");
var prefsPath = kitPath("db", "prefs.json");
var promptDbPath = kitPath("db", "prompt.json");
var themeDbPath = kitPath("db", "theme.json");
var userDbPath = kitPath("db", "user.json");
var tmpClipboardDir = kitPath("tmp", "clipboard");
var tmpDownloadsDir = kitPath("tmp", "downloads");
var kitDocsPath = home(".kit-docs");
var KENV_SCRIPTS = kenvPath("scripts");
var KENV_APP = kenvPath("app");
var KENV_BIN = kenvPath("bin");
var KIT_APP = kitPath("run", "app.js");
var KIT_APP_PROMPT = kitPath("run", "app-prompt.js");
var KIT_APP_INDEX = kitPath("run", "app-index.js");
var SHELL_TOOLS = [
  "bash",
  "sh",
  "zsh",
  "fish",
  "powershell",
  "pwsh",
  "cmd"
];

// src/core/scriptlets.ts
import slugify from "slugify";
import { readFile as readFile4 } from "node:fs/promises";
var h1Regex = /^#(?!#)/;
var h2Regex = /^##(?!#)/;
var toolRegex = /^(```|~~~)\s*$/m;
var emptyCodeFenceRegex = /^(```|~~~)\s*$/gm;
var ifElseRegex = /{{(?!#if|else\s?if|else|\/if)([^}]+)}}/g;
var parseMarkdownAsScriptlets = async (markdown, filePath) => {
  let lines = markdown.trim().split("\n");
  let markdownMetadata = {
    exclude: true
  };
  let parsingMarkdownMetadata = false;
  let currentGroup = "Scriptlets";
  let currentScriptlet;
  let currentMetadata;
  let scriptlets = [];
  let parsingMetadata = false;
  let parsingValue = false;
  let insideCodeFence = false;
  let globalPrependScript = "";
  let sawH1 = false;
  let inH1CodeFence = false;
  let h1CodeFenceTool = "";
  let h1CodeFenceLines = [];
  for (const untrimmedLine of lines) {
    let line = untrimmedLine?.length > 0 ? untrimmedLine.trim() : "";
    if (line.startsWith("```") || line.startsWith("~~~")) {
      insideCodeFence = !insideCodeFence;
      if (sawH1 && !currentScriptlet && insideCodeFence) {
        inH1CodeFence = true;
        h1CodeFenceTool = line.replace("```", "").replace("~~~", "").trim();
        if (!h1CodeFenceTool) {
          h1CodeFenceTool = process.platform === "win32" ? "cmd" : "bash";
        }
        continue;
      }
      if (inH1CodeFence && !insideCodeFence) {
        inH1CodeFence = false;
        globalPrependScript = h1CodeFenceLines.join("\n").trim();
        continue;
      }
    }
    if (inH1CodeFence) {
      h1CodeFenceLines.push(line);
      continue;
    }
    if (!insideCodeFence) {
      if (line.match(h1Regex)) {
        currentGroup = line.replace(h1Regex, "").trim();
        parsingMarkdownMetadata = true;
        sawH1 = true;
        continue;
      }
      if (line.match(h2Regex)) {
        parsingMarkdownMetadata = false;
        if (currentScriptlet) {
          let metadata = postprocessMetadata(currentMetadata, "");
          if (globalPrependScript && currentScriptlet.scriptlet) {
            currentScriptlet.scriptlet = `${globalPrependScript}
${currentScriptlet.scriptlet}`;
          }
          scriptlets.push({ ...metadata, ...currentScriptlet });
        }
        let name = line.replace(h2Regex, "").trim();
        currentScriptlet = {
          group: currentGroup,
          scriptlet: "",
          tool: "",
          name,
          command: stripName(name),
          preview: "",
          kenv: ""
        };
        currentMetadata = {};
        continue;
      }
    }
    if (currentScriptlet) {
      currentScriptlet.preview += `
${line}`;
    }
    if (line.startsWith("<!--")) {
      parsingMetadata = true;
      continue;
    }
    if (parsingMetadata && line.includes("-->")) {
      parsingMetadata = false;
      continue;
    }
    if ((line.startsWith("```") || line.startsWith("~~~")) && currentScriptlet) {
      if (currentScriptlet.tool) {
        parsingValue = false;
      } else {
        let tool = line.replace("```", "").replace("~~~", "").trim();
        if (tool === "") {
          tool = process.platform === "win32" ? "cmd" : "bash";
        }
        currentScriptlet.tool = tool;
        const toolHTML = `
<p class="hljs-tool-topper">${tool}</p>
`.trim();
        currentScriptlet.preview = `${toolHTML}
${currentScriptlet.preview}`;
        parsingValue = true;
      }
      continue;
    }
    if (parsingValue && currentScriptlet) {
      currentScriptlet.scriptlet = currentScriptlet.scriptlet ? `${currentScriptlet.scriptlet}
${untrimmedLine}` : untrimmedLine;
    }
    if (parsingMetadata) {
      let indexOfColon = line.indexOf(":");
      if (indexOfColon === -1) {
        continue;
      }
      let key = line.slice(0, indexOfColon).trim();
      let value = line.slice(indexOfColon + 1).trim();
      let lowerCaseKey = key.toLowerCase();
      if (lowerCaseKey === "schedule") {
        const cronRegex = /^(\S+\s+){4,5}\S+$/;
        if (!cronRegex.test(value)) {
          throw new Error(`Invalid cron syntax in schedule metadata: ${value}`);
        }
      }
      if (lowerCaseKey === "background") {
        const validValues = ["true", "false"];
        if (!validValues.includes(value.toLowerCase())) {
          throw new Error(`Invalid background value: ${value}. Must be 'true' or 'false'`);
        }
      }
      if (lowerCaseKey === "watch") {
        if (!value.trim()) {
          throw new Error("Watch metadata must have a value");
        }
      }
      if (parsingMarkdownMetadata) {
        markdownMetadata[lowerCaseKey] = value;
      } else {
        currentMetadata[lowerCaseKey] = value;
      }
    }
  }
  if (currentScriptlet) {
    let metadata = postprocessMetadata(currentMetadata, "");
    currentScriptlet.scriptlet = currentScriptlet.scriptlet.trim();
    if (globalPrependScript && currentScriptlet.scriptlet) {
      currentScriptlet.scriptlet = `${globalPrependScript}
${currentScriptlet.scriptlet}`;
    }
    scriptlets.push({ ...metadata, ...currentScriptlet });
  }
  if (typeof filePath === "string") {
    const kenvFromPath = getKenvFromPath(filePath);
    scriptlets.forEach((scriptlet) => {
      scriptlet.kenv = kenvFromPath;
    });
  }
  for (let scriptlet of scriptlets) {
    let preview = scriptlet.preview.trim();
    const emptyCodeFences = preview.match(emptyCodeFenceRegex);
    if (emptyCodeFences && emptyCodeFences.length === 2) {
      preview = preview.replace(toolRegex, `$1${scriptlet.tool}`);
    }
    let highlightedPreview = md(`# ${scriptlet.name}
${await highlight(preview, "")}`);
    scriptlet.preview = highlightedPreview;
    scriptlet.inputs = Array.from(
      new Set(
        scriptlet.scriptlet.match(ifElseRegex)?.map((x) => x.slice(2, -2).trim()).filter((x) => x !== "" && !x.startsWith("/")) || []
      )
    );
    if (scriptlet.inputs.length === 0 && SHELL_TOOLS.includes(scriptlet.tool)) {
      scriptlet.shebang = scriptlet.tool;
    }
    tagger(scriptlet);
  }
  const metadataKeys = Object.keys(markdownMetadata);
  if (metadataKeys.length > 1) {
    let metadata = postprocessMetadata(markdownMetadata, "");
    const exclude = metadata?.exclude;
    scriptlets.unshift({
      ...metadata,
      name: currentGroup,
      kenv: filePath ? getKenvFromPath(filePath) : "",
      command: stripName(currentGroup),
      group: exclude ? void 0 : currentGroup,
      tool: "kit",
      exclude,
      scriptlet: `
const scripts = await getScripts(true);
let focused;
const script = await arg(
  {
    placeholder: "Select a Scriptlet",
    onChoiceFocus: (input, state) => {
      focused = state.focused;
    },
  },
  scripts.filter((s) => s.group === "${currentGroup}")
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
			`,
      preview: `
List all the scriptlets in the ${currentGroup} group
			`,
      inputs: []
    });
  }
  return scriptlets;
};
var parseScriptlets = async () => {
  let scriptletsPaths = await globby(kenvPath("scriptlets", "*.md").replace(/\\/g, "/"));
  let nestedScriptletPaths = await globby(kenvPath("kenvs", "*", "scriptlets", "*.md").replace(/\\/g, "/"));
  let allScriptletsPaths = scriptletsPaths.concat(nestedScriptletPaths);
  let allScriptlets = [];
  for (let scriptletsPath of allScriptletsPaths) {
    let fileContents = await readFile4(scriptletsPath, "utf8");
    let scriptlets = await parseMarkdownAsScriptlets(fileContents, scriptletsPath);
    for (let scriptlet of scriptlets) {
      scriptlet.filePath = `${scriptletsPath}#${slugify(scriptlet.name)}`;
      scriptlet.value = Object.assign({}, scriptlet);
      allScriptlets.push(scriptlet);
    }
  }
  return allScriptlets;
};

// src/core/snippets.ts
import { readFile as readFile5, stat as stat3 } from "node:fs/promises";
import path3 from "node:path";
import { globby as globby3 } from "globby";
var snippetCache = /* @__PURE__ */ new Map();
var parseSnippets = async () => {
  let snippetPaths = await globby3([
    kenvPath("snippets", "**", "*.txt").replaceAll("\\", "/"),
    kenvPath("kenvs", "*", "snippets", "**", "*.txt").replaceAll("\\", "/")
  ]);
  let snippetChoices = [];
  for await (let s of snippetPaths) {
    try {
      const fileStat = await stat3(s);
      const currentMtimeMs = fileStat.mtimeMs;
      const cachedEntry = snippetCache.get(s);
      if (cachedEntry && cachedEntry.mtimeMs === currentMtimeMs) {
        snippetChoices.push(cachedEntry.snippetObject);
        continue;
      }
      let contents = await readFile5(s, "utf8");
      let { metadata, snippet } = getSnippet(contents);
      let formattedSnippet = escapeHTML(snippet);
      let expand = (metadata?.expand || metadata?.snippet || "").trim();
      let postfix = false;
      if (expand.startsWith("*")) {
        postfix = true;
        expand = expand.slice(1);
      }
      const newSnippetChoice = {
        ...metadata,
        filePath: s,
        name: metadata?.name || path3.basename(s),
        tag: metadata?.snippet || "",
        description: s,
        text: snippet.trim(),
        preview: `<div class="p-4">
  <style>
  p{
    margin-bottom: 1rem;
  }
  li{
    margin-bottom: .25rem;
  }
  
  </style>
  ${snippet.trim()}
</div>`,
        group: "Snippets",
        kenv: getKenvFromPath(s),
        value: snippet.trim(),
        expand,
        postfix: postfix ? true : false,
        snippetKey: expand
      };
      snippetCache.set(s, { snippetObject: newSnippetChoice, mtimeMs: currentMtimeMs });
      snippetChoices.push(newSnippetChoice);
    } catch (error) {
      console.error(`Error processing snippet ${s}:`, error);
    }
  }
  return snippetChoices;
};
var snippetRegex = /(?<=^(?:(?:\/\/)|#)\s{0,2})([\w-]+)(?::)(.*)/;
var getSnippet = (contents) => {
  let lines = contents.split("\n");
  let metadata = postprocessMetadata(getMetadata(contents), contents);
  delete metadata.type;
  let contentStartIndex = lines.length;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let match = line.match(snippetRegex);
    if (!match) {
      contentStartIndex = i;
      break;
    }
  }
  let snippet = lines.slice(contentStartIndex).join("\n");
  return { metadata, snippet };
};

// src/core/utils.ts
var combinePath = (arrayOfPaths) => {
  const pathSet = /* @__PURE__ */ new Set();
  for (const p of arrayOfPaths) {
    if (p) {
      const paths = p.split(path4.delimiter);
      for (const singlePath of paths) {
        if (singlePath) {
          pathSet.add(singlePath);
        }
      }
    }
  }
  return Array.from(pathSet).join(path4.delimiter);
};
var DEFAULT_PATH = process.env.PATH;
var UNIX_DEFAULT_PATH = combinePath(["/usr/local/bin", "/usr/bin", "/bin", "/usr/sbin", "/sbin"]);
var WIN_DEFAULT_PATH = combinePath([]);
var KIT_DEFAULT_PATH = isWin ? WIN_DEFAULT_PATH : UNIX_DEFAULT_PATH;
var KIT_BIN_PATHS = combinePath([
  kitPath("bin"),
  ...isWin ? [] : [kitPath("override", "code")],
  kenvPath("bin")
]);
var KIT_FIRST_PATH = combinePath([KIT_BIN_PATHS, process?.env?.PATH, KIT_DEFAULT_PATH]);
var KIT_LAST_PATH = combinePath([process.env.PATH, KIT_DEFAULT_PATH, KIT_BIN_PATHS]);
var assignPropsTo = (source, target) => {
  Object.entries(source).forEach(([key, value]) => {
    target[key] = value;
  });
};
var fileExists = (path7) => {
  try {
    return lstatSync(path7, {
      throwIfNoEntry: false
    })?.isFile();
  } catch {
    return false;
  }
};
var resolveToScriptPath = (rawScript, cwd3 = process.cwd()) => {
  let extensions = ["", ".js", ".ts", ".md"];
  let resolvedScriptPath = "";
  let script = rawScript.replace(/\#.*$/, "");
  if (fileExists(script)) return script;
  if (global.kitScript) {
    let currentRealScriptPath = realpathSync(global.kitScript);
    let maybeSiblingScriptPath = path4.join(path4.dirname(currentRealScriptPath), script);
    if (fileExists(maybeSiblingScriptPath)) {
      return maybeSiblingScriptPath;
    }
    if (fileExists(maybeSiblingScriptPath + ".js")) {
      return maybeSiblingScriptPath + ".js";
    }
    if (fileExists(maybeSiblingScriptPath + ".ts")) {
      return maybeSiblingScriptPath + ".ts";
    }
  }
  for (let ext of extensions) {
    resolvedScriptPath = kenvPath("scripts", script + ext);
    if (fileExists(resolvedScriptPath)) return resolvedScriptPath;
  }
  let [k, s] = script.split("/");
  if (s) {
    for (let ext of extensions) {
      resolvedScriptPath = kenvPath("kenvs", k, "scripts", s + ext);
      if (fileExists(resolvedScriptPath)) return resolvedScriptPath;
    }
  }
  for (let ext of extensions) {
    resolvedScriptPath = path4.resolve(cwd3, "scripts", script + ext);
    if (fileExists(resolvedScriptPath)) return resolvedScriptPath;
  }
  for (let ext of extensions) {
    resolvedScriptPath = path4.resolve(cwd3, script + ext);
    if (fileExists(resolvedScriptPath)) return resolvedScriptPath;
  }
  throw new Error(`${script} not found`);
};
var resolveScriptToCommand = (script) => {
  return path4.basename(script).replace(new RegExp(`\\${path4.extname(script)}$`), "");
};
var shortcutNormalizer = (shortcut) => shortcut ? shortcut.replace(/(option|opt|alt)/i, isMac ? "Option" : "Alt").replace(/(ctl|cntrl|ctrl|control)/, "Control").replace(/(command|cmd)/i, isMac ? "Command" : "Control").replace(/(shift|shft)/i, "Shift").split(/\s/).filter(Boolean).map((part) => (part[0].toUpperCase() + part.slice(1)).trim()).join("+") : "";
var friendlyShortcut = (shortcut) => {
  let f = "";
  if (shortcut.includes("Command+")) f += "cmd+";
  if (shortcut.match(/(?<!Or)Control\+/)) f += "ctrl+";
  if (shortcut.includes("Alt+")) f += "alt+";
  if (shortcut.includes("Option+")) f += "opt+";
  if (shortcut.includes("Shift+")) f += "shift+";
  if (shortcut.includes("+")) f += shortcut.split("+").pop()?.toLowerCase();
  return f;
};
var VALID_METADATA_KEYS_SET = /* @__PURE__ */ new Set([
  "author",
  "name",
  "description",
  "enter",
  "alias",
  "image",
  "emoji",
  "shortcut",
  "shortcode",
  "trigger",
  "snippet",
  // Keep deprecated for now
  "expand",
  "keyword",
  "pass",
  "group",
  "exclude",
  "watch",
  "log",
  "background",
  "system",
  "schedule",
  "index",
  "access",
  "response",
  "tag",
  "longRunning",
  "mcp"
]);
var getMetadataFromComments = (contents) => {
  const lines = contents.split("\n");
  const metadata = {};
  let commentStyle = null;
  let inMultilineComment = false;
  let multilineCommentEnd = null;
  const validKeyPattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  const ignoreKeyPrefixes = ["TODO", "FIXME", "NOTE", "HACK", "XXX", "BUG"];
  const commentRegex = {
    "//": /^\/\/\s*([^:]+):(.*)$/,
    "#": /^#\s*([^:]+):(.*)$/
  };
  for (const line of lines) {
    if (!inMultilineComment && (line.trim().startsWith("/*") || line.trim().startsWith("'''") || line.trim().startsWith('"""') || line.trim().match(/^: '/))) {
      inMultilineComment = true;
      multilineCommentEnd = line.trim().startsWith("/*") ? "*/" : line.trim().startsWith(": '") ? "'" : line.trim().startsWith("'''") ? "'''" : '"""';
    }
    if (inMultilineComment && line.trim().endsWith(multilineCommentEnd)) {
      inMultilineComment = false;
      multilineCommentEnd = null;
      continue;
    }
    if (inMultilineComment) continue;
    let match = null;
    if (line.startsWith("//")) {
      match = line.match(commentRegex["//"]);
      commentStyle = "//";
    } else if (line.startsWith("#")) {
      match = line.match(commentRegex["#"]);
      commentStyle = "#";
    }
    if (!match) continue;
    const [, rawKey, value] = match;
    const trimmedKey = rawKey.trim();
    const trimmedValue = value.trim();
    if (ignoreKeyPrefixes.some((prefix) => trimmedKey.toUpperCase().startsWith(prefix))) continue;
    if (!validKeyPattern.test(trimmedKey)) continue;
    let key = trimmedKey;
    if (key?.length > 0) {
      key = key[0].toLowerCase() + key.slice(1);
    }
    if (!key || !trimmedValue) {
      continue;
    }
    let parsedValue;
    let lowerValue = trimmedValue.toLowerCase();
    let lowerKey = key.toLowerCase();
    switch (true) {
      case lowerValue === "true":
        parsedValue = true;
        break;
      case lowerValue === "false":
        parsedValue = false;
        break;
      case lowerKey === "timeout":
        parsedValue = Number.parseInt(trimmedValue, 10);
        break;
      default:
        parsedValue = trimmedValue;
    }
    if (!(key in metadata) && VALID_METADATA_KEYS_SET.has(key)) {
      metadata[key] = parsedValue;
    }
  }
  return metadata;
};
function parseTypeScript(code) {
  const parser = Parser.extend(
    // @ts-expect-error Somehow these are not 100% compatible
    tsPlugin({ allowSatisfies: true })
  );
  return parser.parse(code, {
    sourceType: "module",
    ecmaVersion: "latest"
  });
}
function isOfType(node, type) {
  return node.type === type;
}
function parseMetadataProperties(properties) {
  return properties.reduce((acc, prop) => {
    if (!isOfType(prop, "Property")) {
      throw Error("Not a Property");
    }
    const key = prop.key;
    const value = prop.value;
    if (!isOfType(key, "Identifier")) {
      throw Error("Key is not an Identifier");
    }
    if (!isOfType(value, "Literal")) {
      throw Error(`value is not a Literal, but a ${value.type}`);
    }
    acc[key.name] = value.value;
    return acc;
  }, {});
}
function getMetadataFromExport(ast) {
  for (const node of ast.body) {
    const isExpressionStatement = isOfType(node, "ExpressionStatement");
    if (isExpressionStatement) {
      const expression = node.expression;
      const isMetadata = expression.left.name === "metadata";
      const isEquals = expression.operator === "=";
      const properties2 = expression.right.properties;
      const isGlobalMetadata = isMetadata && isEquals;
      if (isGlobalMetadata) {
        return parseMetadataProperties(properties2);
      }
    }
    const isExportNamedDeclaration = isOfType(node, "ExportNamedDeclaration");
    if (!isExportNamedDeclaration || !node.declaration) {
      continue;
    }
    const declaration = node.declaration;
    if (declaration.type !== "VariableDeclaration" || !declaration.declarations[0]) {
      continue;
    }
    const namedExport = declaration.declarations[0];
    if (!("name" in namedExport.id) || namedExport.id.name !== "metadata") {
      continue;
    }
    if (namedExport.init?.type !== "ObjectExpression") {
      continue;
    }
    const properties = namedExport.init?.properties;
    return parseMetadataProperties(properties);
  }
  return {};
}
var getMetadata = (contents) => {
  const fromComments = getMetadataFromComments(contents);
  let ast;
  try {
    ast = parseTypeScript(contents);
  } catch (err) {
    return fromComments;
  }
  try {
    const fromExport = getMetadataFromExport(ast);
    return { ...fromComments, ...fromExport };
  } catch (err) {
    return fromComments;
  }
};
var kenvFromFilePath = (filePath) => {
  let { dir } = path4.parse(filePath);
  let { name: scriptsName, dir: kenvDir } = path4.parse(dir);
  if (scriptsName !== "scripts") return ".kit";
  let { name: kenv } = path4.parse(kenvDir);
  if (path4.relative(kenvDir, kenvPath()) === "") return "";
  return kenv;
};
var stripName = (name) => {
  let strippedName = path4.parse(name).name;
  strippedName = strippedName.trim().replace(/\s+/g, "-");
  if (!name.includes("-")) {
    strippedName = strippedName.toLowerCase();
  }
  strippedName = strippedName.replace(/[^\w-]+/g, "");
  strippedName = strippedName.replace(/-{2,}/g, "-");
  return strippedName;
};
var getKenvs = async (ignorePattern = /^ignore$/) => {
  if (!await isDir(kenvPath("kenvs"))) return [];
  let dirs = await readdir2(kenvPath("kenvs"), {
    withFileTypes: true
  });
  let kenvs = [];
  for (let dir of dirs) {
    if (!dir.name.match(ignorePattern) && (dir.isDirectory() || dir.isSymbolicLink())) {
      kenvs.push(kenvPath("kenvs", dir.name));
    }
  }
  return kenvs;
};
global.__kitRun = false;
var kitGlobalRunCount = 0;
var run = async (command, ...commandArgs) => {
  performance.mark("run");
  kitGlobalRunCount++;
  let kitLocalRunCount = kitGlobalRunCount;
  let scriptArgs = [];
  let script = "";
  let match;
  let splitRegex = /('[^']+?')|("[^"]+?")|\s+/;
  let quoteRegex = /'|"/g;
  let parts = command.split(splitRegex).filter(Boolean);
  for (let item of parts) {
    if (!script) {
      script = item.replace(quoteRegex, "");
    } else if (!item.match(quoteRegex)) {
      scriptArgs.push(...item.trim().split(/\s+/));
    } else {
      scriptArgs.push(item.replace(quoteRegex, ""));
    }
  }
  if (script.includes(path4.sep)) {
    script = command;
    scriptArgs = [];
  }
  let resolvedScript = resolveToScriptPath(script);
  global.projectPath = (...args) => path4.resolve(path4.dirname(path4.dirname(resolvedScript)), ...args);
  global.onTabs = [];
  global.kitScript = resolvedScript;
  global.kitCommand = resolveScriptToCommand(resolvedScript);
  let realProjectPath = projectPath();
  updateEnv(realProjectPath);
  if (process.env.KIT_CONTEXT === "app") {
    let script2 = await parseScript(global.kitScript);
    if (commandArgs.includes(`--${cmd}`)) {
      script2.debug = true;
      global.send("DEBUG_SCRIPT" /* DEBUG_SCRIPT */, script2);
      return await Promise.resolve("Debugging...");
    }
    cd(realProjectPath);
    global.send("SET_SCRIPT" /* SET_SCRIPT */, script2);
  }
  let result = await global.attemptImport(resolvedScript, ...scriptArgs, ...commandArgs);
  global.flag.tab = "";
  return result;
};
var updateEnv = (scriptProjectPath) => {
  let { parsed, error } = config({
    node_env: process.env.NODE_ENV || "development",
    path: scriptProjectPath,
    silent: true
  });
  if (parsed) {
    assignPropsTo(process.env, global.env);
  }
  if (error) {
    let isCwdKenv = path4.normalize(cwd()) === path4.normalize(kenvPath());
    if (isCwdKenv && !error?.message?.includes("files matching pattern") && !process.env.CI) {
      global.log(error.message);
    }
  }
};
var getScriptFiles = async (kenv = kenvPath()) => {
  let scriptsPath = path4.join(kenv, "scripts");
  try {
    let dirEntries = await readdir2(scriptsPath);
    let scriptFiles = [];
    for (let fileName of dirEntries) {
      if (!fileName.startsWith(".")) {
        let fullPath = path4.join(scriptsPath, fileName);
        if (path4.extname(fileName)) {
          scriptFiles.push(fullPath);
        } else {
          try {
            let stats = await lstat3(fullPath);
            if (!stats.isDirectory()) {
              scriptFiles.push(fullPath);
            }
          } catch (error) {
            log(error);
          }
        }
      }
    }
    return scriptFiles;
  } catch {
    return [];
  }
};
var scriptsSort = (timestamps) => (a, b) => {
  let aTimestamp = timestamps.find((t) => t.filePath === a.filePath);
  let bTimestamp = timestamps.find((t) => t.filePath === b.filePath);
  if (aTimestamp && bTimestamp) {
    return bTimestamp.timestamp - aTimestamp.timestamp;
  }
  if (aTimestamp) {
    return -1;
  }
  if (bTimestamp) {
    return 1;
  }
  if (a?.index || b?.index) {
    if ((a?.index || 9999) < (b?.index || 9999)) {
      return -1;
    }
    return 1;
  }
  let aName = (a?.name || "").toLowerCase();
  let bName = (b?.name || "").toLowerCase();
  return aName > bName ? 1 : aName < bName ? -1 : 0;
};
var closeShortcut = {
  name: "Exit",
  key: `${cmd}+w`,
  bar: "right",
  onPress: () => {
    exit();
  }
};
var editScriptShortcut = {
  name: "Edit Script",
  key: `${cmd}+o`,
  onPress: async (input, { script }) => {
    await run(kitPath("cli", "edit-script.js"), script?.filePath);
    exit();
  },
  bar: "right"
};
var submitShortcut = {
  name: "Submit",
  key: `${cmd}+s`,
  bar: "right",
  onPress: async (input) => {
    await submit(input);
  }
};
var viewLogShortcut = {
  name: "View Log",
  key: `${cmd}+l`,
  onPress: async (input, { focused }) => {
    await run(kitPath("cli", "open-script-log.js"), focused?.value?.scriptPath);
  },
  bar: "right",
  visible: true
};
var terminateProcessShortcut = {
  name: "Terminate Process",
  key: `${cmd}+enter`,
  onPress: async (input, { focused }) => {
    await sendWait("TERMINATE_PROCESS" /* TERMINATE_PROCESS */, focused?.value?.pid);
  },
  bar: "right",
  visible: true
};
var terminateAllProcessesShortcut = {
  name: "Terminate All Processes",
  key: `${cmd}+shift+enter`,
  onPress: async () => {
    await sendWait("TERMINATE_ALL_PROCESSES" /* TERMINATE_ALL_PROCESSES */);
  },
  bar: "right",
  visible: true
};
var divShortcuts = [
  // escapeShortcut,
  closeShortcut,
  {
    ...editScriptShortcut,
    bar: ""
  }
];
var formShortcuts = [
  // escapeShortcut,
  {
    ...editScriptShortcut,
    bar: ""
  },
  closeShortcut,
  {
    name: "Reset",
    key: `${cmd}+alt+r`,
    bar: ""
  }
];
var kitFilePath = (...paths) => pathToFileURL(kitPath("images", ...paths)).href;
var iconPath = kitFilePath("icon.svg");
var kentPath = kitFilePath("kent.jpg");
var mattPath = kitFilePath("matt.jpg");
var escapeHTML = (text) => {
  if (!text || typeof text !== "string") return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  text = text.replace(/[&<>"']/g, function(m) {
    return map[m];
  });
  text = text.replace(/\t/g, "    ");
  return text.replace(/\n/g, "<br/>");
};
var processInBatches = async (items, batchSize = 500, maxRetries = 0) => {
  if (!items.length) return [];
  if (items.length <= batchSize) {
    return Promise.all(items);
  }
  let result = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch);
    result = result.concat(batchResults.filter((item) => item !== void 0));
  }
  return result;
};
var highlight = async (markdown, containerClass = "p-5 leading-loose", injectStyles = "") => {
  let { default: highlight2 } = global.__kitHighlight || await import("highlight.js");
  if (!global.__kitHighlight) global.__kitHighlight = { default: highlight2 };
  let renderer = new marked.Renderer();
  renderer.paragraph = (p) => {
    const text = p.text || "";
    if (text.match(/<a href=".*\.(mov|mp4|ogg)">.*<\/a>/)) {
      let url = text.match(/href="(.*)"/)[1];
      return `<video controls src="${url}" style="max-width: 100%;"></video>`;
    }
    return `<p>${p.text}</p>`;
  };
  let highlightedMarkdown = marked(markdown);
  let result = `<div class="${containerClass}">
  <style>
  p{
    margin-bottom: 1rem;
  }
  li{
    margin-bottom: .25rem;
  }
  ${injectStyles}
  </style>
  ${highlightedMarkdown}
</div>`;
  return result;
};
var tagger = (script) => {
  if (!script.tag) {
    let tags = [];
    if (script.friendlyShortcut) {
      tags.push(script.friendlyShortcut);
    } else if (script.shortcut) {
      tags.push(friendlyShortcut(shortcutNormalizer(script.shortcut)));
    }
    if (script.kenv && script.kenv !== ".kit") {
      tags.push(script.kenv);
    }
    if (script.trigger) tags.push(`trigger: ${script.trigger}`);
    if (script.keyword) tags.push(`keyword: ${script.keyword}`);
    if (script.snippet) tags.push(`snippet ${script.snippet}`);
    if (script.expand) {
      tags.push(`expand: ${script.expand}`);
    }
    if (typeof script.pass === "string" && script.pass !== "true") {
      tags.push(script.pass.startsWith("/") ? `pattern: ${script.pass}` : `postfix: ${script.pass}`);
    }
    script.tag = tags.join(" ");
  }
};
var getKenvFromPath = (filePath) => {
  let normalizedPath = path4.normalize(filePath);
  let normalizedKenvPath = path4.normalize(kenvPath());
  if (!normalizedPath.startsWith(normalizedKenvPath)) {
    return "";
  }
  let relativePath = normalizedPath.replace(normalizedKenvPath, "");
  if (!relativePath.includes("kenvs")) {
    return "";
  }
  let parts = relativePath.split(path4.sep);
  let kenvIndex = parts.indexOf("kenvs");
  return kenvIndex !== -1 && parts[kenvIndex + 1] ? parts[kenvIndex + 1] : "";
};

// src/core/db.ts
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
var resolveKenv = (...parts) => {
  if (global.kitScript) {
    return path5.resolve(global.kitScript, "..", "..", ...parts);
  }
  return kenvPath(...parts);
};
var store = async (nameOrPath, initialData = {}) => {
  let isPath = nameOrPath.includes("/") || nameOrPath.includes("\\");
  let { default: Keyv } = await import("keyv");
  let { KeyvFile } = await import("keyv-file");
  let dbPath = isPath ? nameOrPath : kenvPath("db", `${nameOrPath}.json`);
  let fileExists2 = await isFile(dbPath);
  let keyv = new Keyv({
    store: new KeyvFile({
      filename: dbPath
      // Not all options are required...
    })
  });
  if (!fileExists2) {
    let dataToInit = {};
    if (typeof initialData === "function") {
      dataToInit = await initialData();
    } else {
      dataToInit = initialData;
    }
    for await (let [key, value] of Object.entries(dataToInit)) {
      await keyv.set(key, value);
    }
  }
  return keyv;
};
async function db(dataOrKeyOrPath, data, fromCache = true) {
  let dbPath = "";
  if (typeof data === "undefined" && typeof dataOrKeyOrPath !== "string") {
    data = dataOrKeyOrPath;
    dataOrKeyOrPath = "_" + resolveScriptToCommand(global.kitScript);
  }
  if (typeof dataOrKeyOrPath === "string") {
    global.__kitDbMap = fromCache ? global.__kitDbMap || /* @__PURE__ */ new Map() : /* @__PURE__ */ new Map();
    if (global.__kitDbMap.has(dataOrKeyOrPath)) {
      return global.__kitDbMap.get(dataOrKeyOrPath);
    }
    dbPath = dataOrKeyOrPath;
    if (!dbPath.endsWith(".json")) {
      dbPath = resolveKenv("db", `${dbPath}.json`);
    }
  }
  const parentExists = await isDir(path5.dirname(dbPath));
  if (!parentExists) {
    dbPath = kenvPath("db", `${path5.basename(dbPath)}`);
    await ensureDir(path5.dirname(dbPath));
  }
  let _db;
  const init = async () => {
    const jsonFile = new JSONFile(dbPath);
    const result = await jsonFile.read();
    _db = new Low(jsonFile, result);
    try {
      await _db.read();
    } catch (error) {
      global.warn?.(error);
      if (path5.dirname(dbPath) === kitPath("db")) {
        _db = new Low(jsonFile, result);
        await _db.read();
      }
    }
    if (!_db.data || !fromCache) {
      const getData = async () => {
        if (typeof data === "function") {
          const result2 = await data();
          return Array.isArray(result2) ? { items: result2 } : result2;
        }
        return Array.isArray(data) ? { items: data } : data;
      };
      _db.data = await getData();
      try {
        await _db.write();
      } catch (error) {
        global.log?.(error);
      }
    }
  };
  await init();
  const dbAPI = {
    dbPath,
    clear: async () => {
      await rm(dbPath);
    },
    reset: async () => {
      await rm(dbPath);
      await init();
    }
  };
  const dbProxy = new Proxy(dbAPI, {
    get: (_target, key) => {
      if (key === "then") return _db;
      if (key in dbAPI) {
        return typeof dbAPI[key] === "function" ? dbAPI[key].bind(dbAPI) : dbAPI[key];
      }
      const dbInstance = _db;
      if (dbInstance[key]) {
        return typeof dbInstance[key] === "function" ? dbInstance[key].bind(dbInstance) : dbInstance[key];
      }
      return _db.data?.[key];
    },
    set: (_target, key, value) => {
      try {
        ;
        _db.data[key] = value;
        return true;
      } catch (error) {
        return false;
      }
    }
  });
  if (typeof dataOrKeyOrPath === "string") {
    global.__kitDbMap.set(dataOrKeyOrPath, dbProxy);
  }
  return dbProxy;
}
global.db = db;
global.store = store;
var parseScripts = async (ignoreKenvPattern = /^ignore$/) => {
  let scriptFiles = await getScriptFiles();
  let kenvDirs = await getKenvs(ignoreKenvPattern);
  for await (let kenvDir of kenvDirs) {
    let scripts = await getScriptFiles(kenvDir);
    scriptFiles = [...scriptFiles, ...scripts];
  }
  let scriptInfoPromises = [];
  for (const file of scriptFiles) {
    let asyncScriptInfoFunction = parseScript(file);
    scriptInfoPromises.push(asyncScriptInfoFunction);
  }
  let scriptInfo = await processInBatches(scriptInfoPromises, 5);
  let timestamps = [];
  try {
    let timestampsDb = await getTimestamps();
    timestamps = timestampsDb.stamps;
  } catch {
  }
  scriptInfo.sort(scriptsSort(timestamps));
  return scriptInfo;
};
var getScriptsDb = async (fromCache = true, ignoreKenvPattern = /^ignore$/) => {
  let dbResult = await db(
    scriptsDbPath,
    async () => {
      const [scripts, scriptlets, snippets] = await Promise.all([
        parseScripts(ignoreKenvPattern),
        parseScriptlets(),
        parseSnippets()
      ]);
      return {
        scripts: scripts.concat(scriptlets, snippets)
      };
    },
    fromCache
  );
  return dbResult;
};
global.__kitScriptsFromCache = true;
var getTimestamps = async (fromCache = true) => {
  return await db(
    statsPath,
    {
      stamps: []
    },
    fromCache
  );
};
var getScripts = async (fromCache = true, ignoreKenvPattern = /^ignore$/) => {
  global.__kitScriptsFromCache = fromCache;
  return (await getScriptsDb(fromCache, ignoreKenvPattern)).scripts;
};

// src/run/mcp-server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z as z3 } from "zod";
import { readFile as readFile6 } from "fs/promises";
import { spawn as spawn2 } from "child_process";
import path6 from "path";
import { fileURLToPath } from "url";
import { promises as fs3 } from "fs";

// src/core/arg-parser.ts
import * as acorn from "acorn";
import tsPlugin2 from "acorn-typescript";
async function extractArgPlaceholders(code) {
  const placeholders = [];
  let argIndex = 0;
  try {
    let walkNode = function(node) {
      if (!node || typeof node !== "object") return;
      if (node.type === "CallExpression") {
        if (node.callee && node.callee.name === "arg") {
          argIndex++;
          const argName = `arg${argIndex}`;
          if (node.arguments && node.arguments.length >= 2 && node.arguments[1].type === "ObjectExpression") {
            const optionsObj = node.arguments[1];
            const placeholderProp = optionsObj.properties.find(
              (prop) => prop.key && (prop.key.name === "placeholder" || prop.key.value === "placeholder")
            );
            if (placeholderProp && placeholderProp.value && placeholderProp.value.type === "Literal") {
              placeholders.push({
                name: argName,
                placeholder: placeholderProp.value.value
              });
            } else {
              placeholders.push({ name: argName, placeholder: null });
            }
          } else if (node.arguments && node.arguments.length >= 2 && node.arguments[1].type === "ArrayExpression") {
            placeholders.push({ name: argName, placeholder: null });
          } else {
            placeholders.push({ name: argName, placeholder: null });
          }
        }
      }
      for (const key in node) {
        if (key === "type" || key === "start" || key === "end" || key === "loc" || key === "range") continue;
        const value = node[key];
        if (Array.isArray(value)) {
          value.forEach(walkNode);
        } else if (value && typeof value === "object") {
          walkNode(value);
        }
      }
    };
    const Parser3 = acorn.Parser.extend(tsPlugin2());
    const ast = Parser3.parse(code, {
      ecmaVersion: "latest",
      sourceType: "module",
      allowAwaitOutsideFunction: true,
      locations: true
      // Required for acorn-typescript
    });
    walkNode(ast);
  } catch (error) {
    console.error("Error parsing script:", error);
    throw error;
  }
  return placeholders;
}

// src/run/mcp-server.ts
import os from "os";
import http from "http";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path6.dirname(__filename);
function isWindows() {
  return os.platform() === "win32";
}
async function isKitRunning() {
  if (isWindows()) {
    return false;
  }
  try {
    const kitPath2 = process.env.KIT || path6.join(process.env.HOME || "", ".kit");
    await fs3.access(path6.join(kitPath2, "kit.sock"));
    return true;
  } catch {
    return false;
  }
}
async function runScriptWithResult(scriptPath, args) {
  const kitRunning = await isKitRunning();
  try {
    const result = await runScriptDirect(scriptPath, args);
    if (result !== null) return result;
  } catch (e) {
  }
  if (isWindows()) {
    return runScriptViaHttp(scriptPath, args).catch(() => runScriptViaRunTxt(scriptPath, args));
  } else if (kitRunning) {
    return runScriptViaKar(scriptPath, args);
  } else {
    return runScriptViaRunTxt(scriptPath, args);
  }
}
async function runScriptDirect(scriptPath, args) {
  return new Promise((resolve5, reject) => {
    const kitPath2 = process.env.KIT || path6.join(process.env.HOME || "", ".kit");
    const nodePath = process.execPath;
    const runnerPath = path6.join(__dirname, "simple-runner.mjs");
    const child = spawn2(nodePath, [
      runnerPath,
      scriptPath,
      ...args
    ], {
      env: {
        ...process.env,
        KIT_CONTEXT: "workflow",
        KIT_SCRIPT_PATH: scriptPath,
        KENV: process.env.KENV || path6.dirname(scriptPath),
        KIT: kitPath2,
        NODE_NO_WARNINGS: "1"
      }
    });
    let stdout2 = "";
    let stderr2 = "";
    child.stdout?.on("data", (data) => {
      stdout2 += data.toString();
    });
    child.stderr?.on("data", (data) => {
      stderr2 += data.toString();
    });
    child.on("exit", (code) => {
      if (code !== 0) {
        const trimmed = stdout2.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          try {
            resolve5(JSON.parse(trimmed));
          } catch {
            reject(new Error(`Script exited with code ${code}: ${stderr2 || stdout2}`));
          }
        } else {
          reject(new Error(`Script exited with code ${code}: ${stderr2 || stdout2}`));
        }
      } else {
        const trimmed = stdout2.trim();
        if (trimmed) {
          try {
            resolve5(JSON.parse(trimmed));
          } catch {
            resolve5({ output: trimmed });
          }
        } else {
          resolve5({ success: true });
        }
      }
    });
    child.on("error", (err) => {
      reject(err);
    });
  });
}
async function runScriptViaKar(scriptPath, args) {
  return new Promise((resolve5, reject) => {
    const kitPath2 = process.env.KIT || path6.join(process.env.HOME || "", ".kit");
    const karPath = path6.join(kitPath2, "kar");
    const scriptName = path6.basename(scriptPath, path6.extname(scriptPath));
    const child = spawn2(karPath, [scriptName, ...args], {
      env: {
        ...process.env,
        KIT_MCP_RESPONSE: "true"
        // Signal that we want the response
      }
    });
    let output = "";
    let error = "";
    child.stdout?.on("data", (data) => {
      output += data.toString();
    });
    child.stderr?.on("data", (data) => {
      error += data.toString();
    });
    child.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Script exited with code ${code}: ${error}`));
      } else {
        try {
          const trimmed = output.trim();
          if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            resolve5(JSON.parse(trimmed));
          } else {
            resolve5({ output: trimmed });
          }
        } catch (e) {
          resolve5({ output: output.trim() });
        }
      }
    });
    child.on("error", (err) => {
      reject(err);
    });
  });
}
async function runScriptViaHttp(scriptPath, args) {
  return new Promise((resolve5, reject) => {
    const scriptName = path6.basename(scriptPath, path6.extname(scriptPath));
    const port = process.env.KIT_PORT || 5173;
    const postData = JSON.stringify({
      args
    });
    const options = {
      hostname: "localhost",
      port,
      path: `/${scriptName}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve5(JSON.parse(data));
        } catch (e) {
          resolve5({ output: data });
        }
      });
    });
    req.on("error", (e) => {
      reject(new Error(`HTTP request failed: ${e.message}`));
    });
    req.write(postData);
    req.end();
  });
}
async function runScriptViaRunTxt(scriptPath, args) {
  return new Promise(async (resolve5, reject) => {
    const kitPath2 = process.env.KIT || path6.join(process.env.HOME || "", ".kit");
    const runTxtPath = path6.join(kitPath2, "run.txt");
    const responsePath = path6.join(kitPath2, "run-response.json");
    try {
      await fs3.unlink(responsePath).catch(() => {
      });
      const runCommand = [scriptPath, ...args].join(" ");
      await fs3.writeFile(runTxtPath, runCommand);
      const timeout = 3e4;
      const pollInterval = 100;
      const startTime = Date.now();
      const checkResponse = async () => {
        try {
          const response = await fs3.readFile(responsePath, "utf-8");
          await fs3.unlink(responsePath).catch(() => {
          });
          try {
            resolve5(JSON.parse(response));
          } catch {
            resolve5({ output: response });
          }
        } catch (err) {
          if (Date.now() - startTime > timeout) {
            reject(new Error("Script execution timed out"));
          } else {
            setTimeout(checkResponse, pollInterval);
          }
        }
      };
      checkResponse();
    } catch (err) {
      reject(err);
    }
  });
}
function createToolSchema(placeholders) {
  const items = placeholders.map(
    (placeholder) => z3.string().optional().describe(
      placeholder.placeholder || `Enter value for ${placeholder.name}`
    )
  );
  return z3.object({
    args: z3.tuple(items).optional().default([])
  });
}
async function main() {
  try {
    const server = new McpServer({
      name: "script-kit-mcp",
      version: "1.0.0"
    });
    console.error("Script Kit MCP Server starting...");
    const allScripts = await getScripts(false);
    console.error(`Found ${allScripts.length} total scripts`);
    const mcpScripts = allScripts.filter((script) => script.mcp);
    console.error(`Found ${mcpScripts.length} MCP-enabled scripts`);
    for (const script of mcpScripts) {
      try {
        const content = await readFile6(script.filePath, "utf-8");
        const placeholders = await extractArgPlaceholders(content);
        const toolName = typeof script.mcp === "string" ? script.mcp : script.command;
        const schema = createToolSchema(placeholders);
        server.tool(
          toolName,
          script.description || `Run the ${script.name} script`,
          schema.shape,
          async (params) => {
            console.error(`Running tool: ${toolName} with params:`, params);
            const argsArray = params.args || [];
            const args = placeholders.map((_, index) => argsArray[index] || "");
            try {
              const result = await runScriptWithResult(script.filePath, args);
              console.error(`Result:`, result);
              let responseText;
              if (typeof result === "string") {
                responseText = result;
              } else if (result && typeof result === "object") {
                if (result.body) {
                  responseText = typeof result.body === "string" ? result.body : JSON.stringify(result.body, null, 2);
                } else {
                  responseText = JSON.stringify(result, null, 2);
                }
              } else {
                responseText = String(result);
              }
              return {
                content: [{
                  type: "text",
                  text: responseText
                }]
              };
            } catch (error) {
              console.error(`Error:`, error);
              return {
                content: [{
                  type: "text",
                  text: `Error running script: ${error.message}`
                }]
              };
            }
          }
        );
        console.error(`Registered tool: ${toolName} (${script.name})`);
      } catch (error) {
        console.error(`Failed to process script ${script.filePath}:`, error);
      }
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Script Kit MCP Server is running");
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  }
}
main();
