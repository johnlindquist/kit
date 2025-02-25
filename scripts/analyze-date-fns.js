// Script to analyze the size impact of date-fns imports
import fs from 'node:fs'
import path from 'node:path'
import { filesize } from 'filesize'

// Path to node_modules
const nodeModulesPath = path.resolve(process.cwd(), 'node_modules')
const dateFnsPath = path.resolve(nodeModulesPath, 'date-fns')

// Functions we're using
const usedFunctions = ['formatDistanceToNow', 'formatDistanceToNowStrict', 'compareAsc', 'format', 'parseISO']

// Calculate size of the entire date-fns package
function getDirectorySize(dirPath) {
  let size = 0
  const files = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const file of files) {
    const filePath = path.join(dirPath, file.name)

    if (file.isDirectory()) {
      size += getDirectorySize(filePath)
    } else {
      size += fs.statSync(filePath).size
    }
  }

  return size
}

// Calculate size of individual functions
function getFunctionSize(funcName) {
  try {
    const funcPath = path.resolve(dateFnsPath, funcName, 'index.js')
    if (fs.existsSync(funcPath)) {
      return fs.statSync(funcPath).size
    }
    return 0
  } catch (err) {
    return 0
  }
}

// Main analysis
try {
  console.log('='.repeat(80))
  console.log('DATE-FNS SIZE ANALYSIS')
  console.log('='.repeat(80))

  const totalSize = getDirectorySize(dateFnsPath)
  console.log(`Total date-fns package size: ${filesize(totalSize)}`)

  console.log('\nSize of individual functions we use:')
  console.log('-'.repeat(60))

  let usedSize = 0
  for (const func of usedFunctions) {
    const size = getFunctionSize(func)
    usedSize += size
    console.log(`${func}: ${filesize(size)}`)
  }

  console.log('-'.repeat(60))
  console.log(`Total size of used functions: ${filesize(usedSize)}`)
  console.log(`Percentage of total package: ${((usedSize / totalSize) * 100).toFixed(2)}%`)
  console.log(`Potential savings: ${filesize(totalSize - usedSize)}`)

  console.log('\nRecommendation:')
  if (usedSize / totalSize < 0.2) {
    console.log('✅ Using individual imports from date-fns will significantly reduce bundle size.')
  } else {
    console.log('⚠️ The functions you use make up a significant portion of date-fns.')
    console.log('   Consider using native JavaScript Date methods where possible.')
  }
} catch (err) {
  console.error('Error analyzing date-fns:', err)
}
