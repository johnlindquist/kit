#!/usr/bin/env tsx
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const path_1 = require("path");
const ORIENTATION_DIR = (0, path_1.join)(__dirname, '../orientation');
const FILE_PATH_REGEX = /(?:(?:Located in|found in|defined in|at|from|in)\s+[`"]?)(\/workspace\/[^\s`"'\)]+\.(?:ts|js|tsx|jsx))/gi;
const CODE_BLOCK_FILE_PATH_REGEX = /(?:\/\/\s*(?:In|Located at|File:|From)\s+)(\/workspace\/[^\s\n]+\.(?:ts|js|tsx|jsx))/gi;
const INLINE_PATH_REGEX = /([^\s]+\.(?:ts|js|tsx|jsx):\d+)/g;
async function extractFilePaths(content) {
    const paths = new Set();
    // Extract paths from regular text
    let match;
    while ((match = FILE_PATH_REGEX.exec(content)) !== null) {
        paths.add(match[1]);
    }
    // Extract paths from code block comments
    while ((match = CODE_BLOCK_FILE_PATH_REGEX.exec(content)) !== null) {
        paths.add(match[1]);
    }
    // Extract inline paths with line numbers (e.g., file.ts:123)
    while ((match = INLINE_PATH_REGEX.exec(content)) !== null) {
        const pathWithLineNumber = match[1];
        const path = pathWithLineNumber.split(':')[0];
        // Convert relative paths to absolute if they look like SDK/app paths
        if (path.includes('/')) {
            if (path.startsWith('sdk/') || path.startsWith('app/')) {
                paths.add(`/workspace/${path}`);
            }
            else if (!path.startsWith('/')) {
                // Try to infer the full path
                if (content.includes('sdk/src') && !path.startsWith('/')) {
                    paths.add(`/workspace/sdk/src/${path}`);
                }
                else if (content.includes('app/src') && !path.startsWith('/')) {
                    paths.add(`/workspace/app/src/${path}`);
                }
            }
        }
    }
    // Filter out non-existent or test files
    const validPaths = new Set();
    for (const path of paths) {
        if (!path.includes('.test.') &&
            !path.includes('.spec.') &&
            !path.includes('/test/') &&
            !path.includes('/tests/') &&
            path.startsWith('/workspace/')) {
            validPaths.add(path);
        }
    }
    return validPaths;
}
function createRepomixSection(paths) {
    if (paths.size === 0) {
        return '';
    }
    const sortedPaths = Array.from(paths).sort();
    const pathsString = sortedPaths.join(',');
    return `

## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

\`\`\`bash
repomix --include "${pathsString}"
\`\`\`

This will generate a comprehensive report of all the implementation files for this API.`;
}
async function processOrientationFile(filePath) {
    const content = await (0, promises_1.readFile)(filePath, 'utf-8');
    // Check if already has Repomix section
    if (content.includes('## Repomix Command')) {
        return { file: filePath, paths: 0, updated: false };
    }
    const paths = await extractFilePaths(content);
    if (paths.size > 0) {
        const repomixSection = createRepomixSection(paths);
        const updatedContent = content.trimEnd() + '\n' + repomixSection;
        await (0, promises_1.writeFile)(filePath, updatedContent);
        return { file: filePath, paths: paths.size, updated: true };
    }
    return { file: filePath, paths: 0, updated: false };
}
async function main() {
    console.log('Scanning orientation documents for file paths...\n');
    try {
        const files = await (0, promises_1.readdir)(ORIENTATION_DIR);
        const mdFiles = files.filter(file => file.endsWith('.md') && file !== 'README.md');
        const results = await Promise.all(mdFiles.map(file => processOrientationFile((0, path_1.join)(ORIENTATION_DIR, file))));
        // Summary
        const updated = results.filter(r => r.updated);
        const totalPaths = results.reduce((sum, r) => sum + r.paths, 0);
        console.log('Results:');
        console.log('--------');
        updated.forEach(result => {
            console.log(`✅ ${result.file.split('/').pop()}: Added ${result.paths} file paths`);
        });
        if (updated.length === 0) {
            console.log('All files already have Repomix sections or no file paths were found.');
        }
        console.log(`\nSummary:`);
        console.log(`- Total files processed: ${mdFiles.length}`);
        console.log(`- Files updated: ${updated.length}`);
        console.log(`- Total file paths found: ${totalPaths}`);
    }
    catch (error) {
        console.error('Error processing files:', error);
        process.exit(1);
    }
}
main();
