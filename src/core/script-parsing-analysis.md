# Script Kit SDK Script Parsing Analysis

## Overview

The Script Kit SDK implements a multi-layered script parsing and caching system that discovers, parses, and manages scripts across multiple environments (kenvs). This analysis identifies key components, performance bottlenecks, and optimization opportunities.

## Architecture

### 1. Script Discovery Pipeline

The script discovery process follows this flow:

```
getScripts() → getScriptsDb() → parseScripts() → getScriptFiles() → parseScript()
                              ↘ parseScriptlets()
                              ↘ parseSnippets()
```

### 2. Key Components

#### File Discovery (`getScriptFiles` in utils.ts)
- **Location**: `/Users/johnlindquist/dev/kit-container/sdk/src/core/utils.ts`
- **Function**: Recursively scans script directories
- **Performance Impact**: File system I/O bound, no caching at directory level

#### Script Parsing (`parseScript` in parser.ts)
- **Location**: `/Users/johnlindquist/dev/kit-container/sdk/src/core/parser.ts`
- **Function**: Extracts metadata and analyzes individual script files
- **Caching**: Implements file-level caching based on mtime
- **Performance**: ~1000 ops/second for simple scripts (from benchmark)

#### Metadata Extraction (`getMetadata` in utils.ts)
- **Function**: Parses comment-based metadata and TypeScript exports
- **Performance Issues**: 
  - Uses regex for comment parsing (line-by-line)
  - AST parsing with acorn for TypeScript files
  - No caching of parsed metadata

#### Database Management (`db.ts`)
- **Function**: Manages persistent storage of script metadata
- **Caching**: Implements db-level caching with invalidation
- **Performance**: Uses lowdb for JSON file storage

### 3. Caching Mechanisms

#### Script Cache (parser.ts)
```typescript
const scriptCache = new Map<string, ScriptCacheEntry>()

interface ScriptCacheEntry {
  script: Script
  mtimeMs: number
}
```
- Cache key: file path
- Invalidation: mtime change
- Scope: In-memory, per-process

#### Database Cache (db.ts)
- Uses `checkDbAndInvalidateCache` to monitor db file changes
- Invalidates when scripts.db or stats.json change
- Global cache map: `global.__kitDbMap`

#### Worker-based Caching (cache-grouped-scripts-worker.ts)
- Runs in separate worker thread
- Processes scripts in batches
- Maintains separate cache for formatted scripts

## Performance Bottlenecks

### 1. File System Operations
- **Issue**: Synchronous file operations in hot paths
- **Location**: `getScriptFiles` performs individual `lstat` calls
- **Impact**: O(n) file system calls where n = number of scripts

### 2. Metadata Parsing
- **Issue**: Full file read + regex parsing for every script
- **Location**: `getMetadata` reads entire file content
- **Impact**: Memory usage scales with file size × number of scripts

### 3. AST Parsing
- **Issue**: TypeScript AST parsing for every file with exports
- **Location**: `getMetadataFromExport` uses acorn parser
- **Impact**: CPU intensive for large TypeScript files

### 4. Batch Processing
- **Current**: `processInBatches` with batch size 5 for scripts
- **Issue**: Small batch size limits parallelization
- **Location**: `parseScripts` in db.ts

### 5. Worker Communication
- **Issue**: Serialization overhead for script objects
- **Location**: Worker postMessage in cache-grouped-scripts-worker.ts
- **Impact**: Scripts with preview functions must be sanitized

## Memory Usage Patterns

### 1. File Content Retention
- Full file contents loaded into memory during parsing
- No streaming for large files
- Contents retained until GC

### 2. Cache Growth
- Script cache grows unbounded
- No LRU or size-based eviction
- Cache persists for process lifetime

### 3. Database Loading
- Entire scripts.db loaded into memory
- No pagination or lazy loading
- Can grow large with many scripts

## Error Handling

### 1. Parse Errors
- Caught and logged but script still included
- No retry mechanism
- Errors not surfaced to user

### 2. File System Errors
- Basic try-catch blocks
- No distinction between temporary/permanent failures
- Silent failures in some cases

## Optimization Recommendations

### 1. Implement Directory-level Caching
```typescript
// Add directory mtime cache
const dirCache = new Map<string, { files: string[], mtimeMs: number }>()

export async function getCachedScriptFiles(kenv: string) {
  const dir = path.join(kenv, 'scripts')
  const stat = await fs.stat(dir)
  
  const cached = dirCache.get(dir)
  if (cached && cached.mtimeMs === stat.mtimeMs) {
    return cached.files
  }
  
  // Scan directory...
}
```

### 2. Stream-based Metadata Parsing
```typescript
// Parse metadata without loading full file
export async function streamMetadata(filePath: string) {
  const stream = fs.createReadStream(filePath, { 
    encoding: 'utf8',
    highWaterMark: 1024 // Read in small chunks
  })
  
  const metadata = {}
  for await (const chunk of stream) {
    // Parse chunk for metadata
    if (hasAllMetadata(metadata)) {
      stream.destroy()
      break
    }
  }
  return metadata
}
```

### 3. Parallel File Discovery
```typescript
// Use parallel directory scanning
export async function getScriptFilesParallel(kenvs: string[]) {
  const promises = kenvs.map(kenv => 
    fs.readdir(path.join(kenv, 'scripts'), { withFileTypes: true })
  )
  
  const results = await Promise.all(promises)
  // Process results...
}
```

### 4. Implement LRU Cache
```typescript
import { LRUCache } from 'lru-cache'

const scriptCache = new LRUCache<string, ScriptCacheEntry>({
  max: 500, // Maximum number of scripts
  ttl: 1000 * 60 * 5, // 5 minute TTL
  updateAgeOnGet: true
})
```

### 5. Optimize Batch Sizes
```typescript
// Increase batch size based on CPU cores
const batchSize = Math.max(10, os.cpus().length * 2)
const scripts = await processInBatches(scriptPromises, batchSize)
```

### 6. Add Script Fingerprinting
```typescript
// Use content hash instead of mtime
export async function getScriptFingerprint(filePath: string) {
  const hash = crypto.createHash('sha256')
  const stream = fs.createReadStream(filePath)
  
  for await (const chunk of stream) {
    hash.update(chunk)
  }
  
  return hash.digest('hex')
}
```

### 7. Implement Incremental Parsing
```typescript
// Only reparse changed scripts
export async function incrementalParse(lastRunTime: number) {
  const changedFiles = await findChangedFiles(lastRunTime)
  const unchangedScripts = await getCachedScripts()
  const newScripts = await parseScripts(changedFiles)
  
  return [...unchangedScripts, ...newScripts]
}
```

## Benchmark Improvements

Current performance:
- `parseScript`: ~1000 ops/second 
- `formatChoices`: Processes 1000 items in ~10 runs

Target improvements:
- 2-3x improvement in parseScript through streaming
- 5-10x improvement in discovery through caching
- 50% reduction in memory usage through lazy loading

## Implementation Priority

1. **High Priority**
   - Directory-level caching (biggest impact)
   - Increase batch sizes
   - Stream-based metadata parsing

2. **Medium Priority**
   - LRU cache implementation
   - Parallel file discovery
   - Content-based fingerprinting

3. **Low Priority**
   - Incremental parsing
   - Database pagination
   - Advanced error recovery

## Monitoring

Add performance metrics:
```typescript
// Track parsing performance
const metrics = {
  parseTime: new Map<string, number>(),
  cacheHits: 0,
  cacheMisses: 0,
  totalScripts: 0
}

// Log metrics periodically
setInterval(() => {
  const hitRate = metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)
  console.log(`Cache hit rate: ${(hitRate * 100).toFixed(2)}%`)
}, 60000)
```