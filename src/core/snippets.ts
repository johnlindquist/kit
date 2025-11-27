import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { globby } from "globby";
import type { Metadata, Snippet } from '../types/index.js'
import { kenvPath } from './resolvers.js'
import { escapeHTML, getKenvFromPath } from './utils.js'
import { parseSnippetMetadata } from './metadata-parser.js'

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
      // Use unified metadata parser for consistency with App
      const { metadata, snippetBody, snippetKey, postfix } = parseSnippetMetadata(contents)

      // Get raw expand value for tag (preserves * prefix for postfix snippets)
      const rawExpand = (metadata?.snippet || metadata?.expand || '') as string

      const newSnippetChoice: Partial<Snippet> = {
        ...metadata,
        filePath: s,
        name: metadata?.name || path.basename(s),
        tag: rawExpand,
        description: s,
        text: snippetBody.trim(),
        preview: `<div class="p-4">
  <style>
  p{
    margin-bottom: 1rem;
  }
  li{
    margin-bottom: .25rem;
  }

  </style>
  ${escapeHTML(snippetBody.trim())}
</div>`,
        group: 'Snippets',
        kenv: getKenvFromPath(s),
        value: snippetBody.trim(),
        expand: snippetKey,
        postfix,
        snippetKey,
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

/**
 * Parse snippet contents and extract metadata and body.
 * Uses unified parseSnippetMetadata for consistency with App.
 * @deprecated Use parseSnippetMetadata directly for full result including warnings
 */
export let getSnippet = (
  contents: string
): {
  metadata: Metadata
  snippet: string
} => {
  const { metadata, snippetBody } = parseSnippetMetadata(contents)
  return { metadata: metadata as Metadata, snippet: snippetBody }
}
