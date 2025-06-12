# git API Orientation

## Overview

The `git` API provides a JavaScript interface to Git operations without requiring the Git CLI. It's powered by isomorphic-git and includes both low-level Git operations and high-level utilities like `degit` for cloning repositories.

## Core Concepts

### Git Object
```javascript
// The git object provides these methods:
git.clone()     // Clone a repository
git.pull()      // Pull changes
git.push()      // Push changes
git.add()       // Stage files
git.commit()    // Create commits
git.init()      // Initialize repo
git.addRemote() // Add remote repository
```

### Basic Operations
```javascript
// Clone a repository
await git.clone({
  fs,
  http,
  dir: './my-project',
  url: 'https://github.com/user/repo.git',
  singleBranch: true,
  depth: 1
})

// Initialize new repo
await git.init({
  fs,
  dir: './new-project'
})
```

## Git Methods

### 1. **git.clone()**
```javascript
// Simple clone
await git.clone('https://github.com/user/repo.git', './local-dir')

// With options
await git.clone('https://github.com/user/repo.git', './local-dir', {
  ref: 'develop',           // Branch/tag to clone
  singleBranch: true,       // Only clone one branch
  depth: 1,                 // Shallow clone
  corsProxy: 'https://cors.isomorphic-git.org'
})
```

### 2. **git.pull()**
```javascript
// Pull latest changes
await git.pull('./repo-dir')

// With options
await git.pull('./repo-dir', {
  ref: 'main',
  author: {
    name: 'Script Kit',
    email: 'bot@scriptkit.com'
  }
})
```

### 3. **git.add() & git.commit()**
```javascript
// Add single file
await git.add('./repo-dir', 'file.txt')

// Add all files in directory
await git.add('./repo-dir', '.')

// Commit changes
await git.commit('./repo-dir', 'Update files', {
  author: {
    name: 'Your Name',
    email: 'you@example.com'
  }
})
```

### 4. **git.push()**
```javascript
// Push to remote
await git.push('./repo-dir')

// With authentication
await git.push('./repo-dir', {
  onAuth: () => ({
    username: process.env.GITHUB_USERNAME,
    password: process.env.GITHUB_TOKEN
  })
})
```

## degit - Simplified Repository Cloning

### Basic Usage
```javascript
// Clone repository without .git folder
await degit('user/repo').clone('./destination')

// Clone from GitHub (automatic)
await degit('sveltejs/template').clone('./my-app')

// Clone from full URL
await degit('https://github.com/user/repo').clone('./dest')
```

### Advanced degit Features
```javascript
// Clone subdirectory
await degit('user/repo/subdirectory').clone('./dest')

// Clone specific branch/tag
await degit('user/repo#dev').clone('./dest')
await degit('user/repo#v2.0.0').clone('./dest')

// Force overwrite existing directory
await degit('user/repo', { force: true }).clone('./dest')
```

## Common Patterns

### 1. **Project Scaffolding**
```javascript
// Create new project from template
async function createProject(projectName, template) {
  console.log(`Creating ${projectName} from ${template}...`)
  
  try {
    await degit(template).clone(`./${projectName}`)
    
    // Update package.json
    let pkgPath = path.join(projectName, 'package.json')
    let pkg = await readJson(pkgPath)
    pkg.name = projectName
    await writeJson(pkgPath, pkg)
    
    // Install dependencies
    await exec(`cd ${projectName} && npm install`)
    
    console.log(`✅ Project ${projectName} created!`)
  } catch (error) {
    console.error('Failed to create project:', error)
  }
}
```

### 2. **Backup to Git**
```javascript
// Backup directory to Git
async function backupToGit(sourceDir, repoUrl) {
  let backupDir = tmpPath('backup-repo')
  
  // Clone or pull existing backup
  if (await pathExists(path.join(backupDir, '.git'))) {
    await git.pull(backupDir)
  } else {
    await git.clone(repoUrl, backupDir)
  }
  
  // Copy files
  await copy(sourceDir, backupDir, {
    filter: (src) => !src.includes('.git')
  })
  
  // Commit and push
  await git.add(backupDir, '.')
  await git.commit(backupDir, `Backup ${new Date().toISOString()}`)
  await git.push(backupDir)
}
```

### 3. **Clone Multiple Repos**
```javascript
// Clone team repositories
async function cloneTeamRepos() {
  let repos = [
    'team/frontend',
    'team/backend',
    'team/shared-components',
    'team/documentation'
  ]
  
  let baseDir = await arg('Where to clone repos?', home('projects'))
  
  for (let repo of repos) {
    let repoName = repo.split('/')[1]
    let destPath = path.join(baseDir, repoName)
    
    if (await pathExists(destPath)) {
      console.log(`Updating ${repoName}...`)
      await git.pull(destPath)
    } else {
      console.log(`Cloning ${repoName}...`)
      await degit(`github:${repo}`).clone(destPath)
    }
  }
}
```

### 4. **Git Workflow Automation**
```javascript
// Automated commit and push
async function autoCommit(dir, message) {
  // Check for changes
  let status = await exec(`git status --porcelain`, { cwd: dir })
  
  if (status.stdout.trim()) {
    // Stage all changes
    await git.add(dir, '.')
    
    // Commit with timestamp
    let commitMsg = `${message} - ${new Date().toLocaleString()}`
    await git.commit(dir, commitMsg, {
      author: {
        name: 'Auto Commit Bot',
        email: 'bot@example.com'
      }
    })
    
    // Push changes
    try {
      await git.push(dir)
      console.log('✅ Changes pushed successfully')
    } catch (error) {
      console.error('❌ Push failed:', error)
    }
  } else {
    console.log('No changes to commit')
  }
}
```

## Real-World Examples

### 1. **Template Manager**
```javascript
// Manage project templates
class TemplateManager {
  constructor() {
    this.templatesDir = kenvPath('templates')
    this.registry = kenvPath('templates', 'registry.json')
  }
  
  async add(name, repo) {
    let templatePath = path.join(this.templatesDir, name)
    await degit(repo).clone(templatePath)
    
    // Update registry
    let registry = await this.getRegistry()
    registry[name] = {
      repo,
      added: new Date().toISOString()
    }
    await writeJson(this.registry, registry)
  }
  
  async use(name, destination) {
    let templatePath = path.join(this.templatesDir, name)
    if (!await pathExists(templatePath)) {
      throw new Error(`Template ${name} not found`)
    }
    
    await copy(templatePath, destination)
    console.log(`Created project from ${name} template`)
  }
  
  async update(name) {
    let registry = await this.getRegistry()
    let template = registry[name]
    if (!template) throw new Error(`Template ${name} not found`)
    
    let templatePath = path.join(this.templatesDir, name)
    await trash(templatePath)
    await degit(template.repo).clone(templatePath)
  }
  
  async getRegistry() {
    if (!await pathExists(this.registry)) {
      return {}
    }
    return await readJson(this.registry)
  }
}
```

### 2. **Dependency Updater**
```javascript
// Update dependencies from Git
async function updateGitDependencies() {
  let pkg = await readJson('package.json')
  let gitDeps = Object.entries(pkg.dependencies || {})
    .filter(([_, value]) => value.includes('git'))
  
  for (let [name, url] of gitDeps) {
    let depPath = path.join('node_modules', name)
    
    if (await pathExists(path.join(depPath, '.git'))) {
      console.log(`Updating ${name}...`)
      await git.pull(depPath)
    }
  }
}
```

### 3. **Config Sync**
```javascript
// Sync configuration files via Git
async function syncConfigs() {
  let configRepo = 'https://github.com/user/configs.git'
  let localConfig = path.join(home(), '.config', 'synced')
  
  // Initial clone or update
  if (!await pathExists(path.join(localConfig, '.git'))) {
    await git.clone(configRepo, localConfig)
  } else {
    await git.pull(localConfig)
  }
  
  // Link config files
  let configs = await readdir(localConfig)
  for (let config of configs) {
    if (config.startsWith('.git')) continue
    
    let source = path.join(localConfig, config)
    let target = path.join(home(), `.${config}`)
    
    if (!await pathExists(target)) {
      await symlink(source, target)
      console.log(`Linked ${config}`)
    }
  }
}
```

## Error Handling

```javascript
// Handle common Git errors
try {
  await git.clone(url, dir)
} catch (error) {
  if (error.code === 'ENOTFOUND') {
    console.error('Repository not found')
  } else if (error.code === 'AUTH') {
    console.error('Authentication failed')
  } else if (error.message.includes('already exists')) {
    console.error('Directory already exists')
  } else {
    console.error('Git operation failed:', error)
  }
}
```

## Authentication

```javascript
// Use environment variables
await git.push(dir, {
  onAuth: () => ({
    username: process.env.GIT_USERNAME,
    password: process.env.GIT_TOKEN
  })
})

// Interactive authentication
await git.clone(privateRepo, dir, {
  onAuth: async () => {
    let username = await arg('Git username:')
    let password = await arg({
      placeholder: 'Git password:',
      secret: true
    })
    return { username, password }
  }
})
```

## Best Practices

1. **Use degit for templates** - Faster and cleaner than full clone
2. **Shallow clone when possible** - Use `depth: 1` for better performance
3. **Handle authentication securely** - Use tokens, not passwords
4. **Check for existing directories** - Avoid overwriting unintentionally

## Related APIs

- **exec()** - Run git CLI commands when needed
- **download()** - Alternative for simple file downloads
- **copy()** - Copy files after cloning
- **trash()** - Clean up cloned directories

## Repomix Command

To generate documentation for the git API implementation:

```bash
cd ~/scriptkit && npx @repomix/cli --include "sdk/src/api/global.ts"
```