import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { globby } from "globby";
import type { Metadata, Snippet } from '../types/index.js'
import { kenvPath } from './resolvers.js'
import { escapeHTML, getKenvFromPath, getMetadata, postprocessMetadata, checkDbAndInvalidateCache } from './utils.js'

interface SnippetFileCacheEntry {
  snippetObject: Partial<Snippet>;
  mtimeMs: number;
}

const snippetCache = new Map<string, SnippetFileCacheEntry>();

export let parseSnippets = async (): Promise<Snippet[]> => {
  // await checkDbAndInvalidateCache(snippetCache, "snippet");

  let snippetPaths = await globby([
    kenvPath('snippets', '**', '*.txt').replaceAll('\\', '/'),
    kenvPath('kenvs', '*', 'snippets', '**', '*.txt').replaceAll('\\', '/')
  ])

  let snippetChoices: Partial<Snippet>[] = []
  for await (let s of snippetPaths) {
    try {
      const fileStat = await stat(s);
      const currentMtimeMs = fileStat.mtimeMs;

      const cachedEntry = snippetCache.get(s);
      if (cachedEntry && cachedEntry.mtimeMs === currentMtimeMs) {
        snippetChoices.push(cachedEntry.snippetObject);
        continue;
      }

      let contents = await readFile(s, 'utf8')
      let { metadata, snippet } = getSnippet(contents)
      let formattedSnippet = escapeHTML(snippet)

      let expand = (metadata?.expand || metadata?.snippet || '').trim()
      let postfix = false
      if (expand.startsWith('*')) {
        postfix = true
        expand = expand.slice(1)
      }

      const newSnippetChoice: Partial<Snippet> = {
        ...metadata,
        filePath: s,
        name: metadata?.name || path.basename(s),
        tag: metadata?.snippet || '',
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
        group: 'Snippets',
        kenv: getKenvFromPath(s),
        value: snippet.trim(),
        expand,
        postfix: postfix ? true : false,
        snippetKey: expand,
      }

      snippetCache.set(s, { snippetObject: newSnippetChoice, mtimeMs: currentMtimeMs });
      snippetChoices.push(newSnippetChoice);

    } catch (error) {
      console.error(`Error processing snippet ${s}:`, error);
      // Skip this snippet and continue with others
    }
  }

  return snippetChoices as Snippet[]
}

const snippetRegex = /(?<=^(?:(?:\/\/)|#)\s{0,2})([\w-]+)(?::)(.*)/
export let getSnippet = (
  contents: string
): {
  metadata: Metadata
  snippet: string
} => {
  let lines = contents.split('\n')
  let metadata = postprocessMetadata(getMetadata(contents), contents) as Metadata
  delete (metadata as any).type
  let contentStartIndex = lines.length

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    let match = line.match(snippetRegex)

    if (!match) {
      contentStartIndex = i
      break
    }
  }
  let snippet = lines.slice(contentStartIndex).join('\n')
  return { metadata, snippet }
}
