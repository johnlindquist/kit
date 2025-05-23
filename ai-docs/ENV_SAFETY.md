# .env File Safety Mechanisms

This document describes the comprehensive safety mechanisms implemented to prevent accidental overwrites of `.env` files in Script Kit.

## Problem Statement

Previously, `.env` files could be accidentally overwritten in several scenarios:
- During Script Kit version updates when `kenv.zip` is extracted
- Race conditions when multiple `set-env-var` processes run simultaneously  
- File system errors during read/write operations
- Installation process overwriting existing configuration

## Solution Overview

We've implemented a multi-layered approach to protect `.env` files:

1. **File Locking** - Prevents concurrent access
2. **Atomic Operations** - Ensures file consistency
3. **Backup & Restore** - Automatic backups before risky operations
4. **Merge Logic** - Intelligently combines user settings with new templates
5. **Recovery Tools** - User-friendly recovery options

## Components

### 1. File Locking (`env-file-lock.ts`)

**Purpose**: Prevents race conditions and concurrent file access.

**Key Features**:
- Exclusive file locking with timeout handling
- Stale lock detection and cleanup
- Atomic write operations using temporary files
- Process-safe lock files with PID tracking

**Usage**:
```typescript
import { EnvFileLock, safeReadEnvFile, safeWriteEnvFile } from '../core/env-file-lock.js'

// Safe file operations
const lines = await safeReadEnvFile()
await safeWriteEnvFile(['VAR=value'], '/path/to/.env')

// Manual locking
const lock = new EnvFileLock()
await lock.withLock(async () => {
  // Exclusive access to .env file
})
```

### 2. Backup & Restore (`env-backup.ts`)

**Purpose**: Creates automatic backups and enables recovery.

**Key Features**:
- Timestamped backups before risky operations
- Intelligent merging of user settings with new templates
- Automatic cleanup of old backups (keeps last 5)
- User preference preservation during updates

**Usage**:
```typescript
import { backupEnvFile, restoreEnvFile, mergeEnvFiles } from '../core/env-backup.js'

// Create backup
const backup = await backupEnvFile()

// Restore from backup with merging
await restoreEnvFile(backup.backupPath)

// Manual merge
const merged = await mergeEnvFiles('user.env', 'template.env')
```

### 3. Updated Installation Process

**Changes Made**:
- `extractKenv()` now backs up `.env` before extraction
- Restores user settings after extraction, merging with new template variables
- `create-env.ts` merges instead of overwriting existing files
- Comprehensive error handling with rollback on failure

### 4. Enhanced `set-env-var`

**Improvements**:
- Uses file locking to prevent race conditions
- Atomic write operations prevent corruption
- Better error handling and recovery
- Preserves file integrity during concurrent operations

### 5. Recovery Tool (`recover-env.ts`)

**Purpose**: User-friendly recovery interface for lost settings.

**Features**:
- Lists available backups with timestamps
- Preview backup contents before restore
- Safe restoration with confirmation
- Current `.env` content viewing

**Usage**:
```bash
kit recover-env
```

## Safety Guarantees

### During Installation/Updates
1. **Automatic Backup**: `.env` is backed up before any extraction
2. **Merge on Restore**: User settings preserved, new template variables added
3. **Rollback on Failure**: If extraction fails, original `.env` is restored
4. **No Data Loss**: User configuration never completely lost

### During Normal Operations  
1. **File Locking**: Prevents concurrent modifications
2. **Atomic Writes**: Files never left in corrupted state
3. **Lock Cleanup**: Stale locks automatically removed
4. **Error Recovery**: Operations fail safely without data loss

### Backup System
1. **Automatic Creation**: Backups created before risky operations
2. **Timestamp Tracking**: Each backup includes creation timestamp
3. **Automatic Cleanup**: Old backups removed (keeps 5 most recent)
4. **Easy Recovery**: User-friendly interface for restoration

## Error Scenarios Handled

### Race Conditions
- **Problem**: Multiple `set-env-var` processes writing simultaneously
- **Solution**: File locking ensures exclusive access
- **Result**: Operations are serialized, no data corruption

### Installation Overwrites
- **Problem**: `kenv.zip` extraction overwrites existing `.env`
- **Solution**: Backup before extraction, merge after
- **Result**: User settings preserved, new template variables added

### File System Errors
- **Problem**: Disk full, permissions issues during write
- **Solution**: Atomic writes using temporary files
- **Result**: Original file remains intact on failure

### Process Crashes
- **Problem**: Script crashes while holding lock
- **Solution**: Stale lock detection with timeout
- **Result**: Locks automatically released, system recovers

### Corrupted Files
- **Problem**: Invalid lock files or partial writes
- **Solution**: Lock validation and atomic operations
- **Result**: Invalid locks removed, writes are atomic

## Migration from Old System

The new safety mechanisms are designed to be backward compatible:

1. **Existing `.env` files**: Automatically protected by new mechanisms
2. **Old `set-env-var` calls**: Work seamlessly with new locking
3. **Installation process**: Transparently backs up and restores
4. **No user action required**: Safety is automatic

## Testing

Comprehensive test suite (`env-safety.test.ts`) covers:
- Backup and restore operations
- File locking under contention
- Concurrent read/write operations
- Stale lock cleanup
- Error handling and recovery
- Merge logic preservation

Run tests:
```bash
npm test env-safety
```

## Recovery Procedures

### If `.env` is Lost/Corrupted

1. **Use Recovery Script**:
   ```bash
   kit recover-env
   ```

2. **Manual Recovery**:
   ```bash
   # List backups
   ls ~/.kenv/.env.backup.*
   
   # Restore specific backup
   cp ~/.kenv/.env.backup.2024-01-15T10-30-00 ~/.kenv/.env
   ```

3. **Emergency Recovery**:
   ```bash
   # If no backups exist, recreate from template
   kit create-env
   ```

### If Lock Files are Stuck

```bash
# Clean up stale locks
kit cleanup-locks

# Or manually
rm ~/.kenv/.env.lock
```

## Monitoring and Logs

Safety operations are logged to help with debugging:

- **Backup Operations**: `✅ Backed up .env to /path/to/backup`
- **Lock Operations**: `🔒 Acquired lock: /path/to/lock`
- **Merge Operations**: `✅ Merged .env file with N variables`
- **Recovery Operations**: `🔄 Restoring .env file from backup`

Monitor logs during installation to ensure safety mechanisms are working.

## Configuration

### Lock Timeouts
```typescript
const lock = new EnvFileLock()
await lock.acquire({
  timeout: 10000,      // 10 second timeout
  retryInterval: 100,  // Check every 100ms
  maxRetries: 100      // Maximum attempts
})
```

### Backup Retention
```typescript
// Keeps 5 most recent backups by default
await cleanupOldBackups()
```

## Best Practices

1. **Always use safe operations**: Use `safeReadEnvFile`/`safeWriteEnvFile` instead of direct file operations
2. **Handle errors gracefully**: Check return values and handle backup/restore failures
3. **Clean up regularly**: Old backups and stale locks are cleaned automatically
4. **Test recovery procedures**: Periodically verify backup and restore functionality
5. **Monitor logs**: Watch for safety mechanism activations during updates

## Future Enhancements

Potential improvements for the safety system:
- **Cloud backup integration**: Sync backups to cloud storage
- **Git integration**: Version control for `.env` changes
- **Encryption**: Encrypt sensitive environment variables
- **Validation**: Schema validation for environment variables
- **Notifications**: Alert users when backups are created/restored 