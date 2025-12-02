import { createClient, Client } from "@1password/sdk";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

let opClient: Client | null = null;
let opInitPromise: Promise<Client | null> | null = null;

/**
 * Global cache for resolved secrets to minimize API calls
 */
const secretCache = new Map<string, { value: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes default

/**
 * Configuration for 1Password SDK
 */
interface OnePasswordConfig {
  serviceAccountToken?: string;
  vault?: string;
  cacheTTL?: number;
  integrationName?: string;
  integrationVersion?: string;
}

let config: OnePasswordConfig = {
  integrationName: "Script Kit",
  integrationVersion: "1.0.0",
  cacheTTL: CACHE_TTL,
};

/**
 * Initialize the 1Password client
 */
const initOnePassword = async (): Promise<Client | null> => {
  // Return existing client if already initialized
  if (opClient) return opClient;

  // If initialization is in progress, wait for it
  if (opInitPromise) return opInitPromise;

  // Start initialization
  opInitPromise = (async () => {
    try {
      // Try to get service account token from various sources
      let token = config.serviceAccountToken;

      if (!token) {
        token = await getServiceAccountToken();
      }

      if (!token) {
        log(`No 1Password service account token found. Please set OP_SERVICE_ACCOUNT_TOKEN or run: await onepassword.configure()`);
        return null;
      }

      opClient = await createClient({
        auth: token,
        integrationName: config.integrationName || "Script Kit",
        integrationVersion: config.integrationVersion || "1.0.0",
      });

      log(`✓ 1Password SDK initialized`);
      return opClient;
    } catch (error) {
      log(`Failed to initialize 1Password SDK: ${error}`);
      return null;
    } finally {
      opInitPromise = null;
    }
  })();

  return opInitPromise;
};

/**
 * Get service account token from various sources
 */
const getServiceAccountToken = async (): Promise<string | null> => {
  // 1. Check environment variable
  if (process.env.OP_SERVICE_ACCOUNT_TOKEN) {
    return process.env.OP_SERVICE_ACCOUNT_TOKEN;
  }

  // 2. Check .env file in kenv
  const kenvEnvPath = kenvPath(".env");
  if (existsSync(kenvEnvPath)) {
    try {
      const envContent = await readFile(kenvEnvPath, "utf-8");
      const match = envContent.match(/OP_SERVICE_ACCOUNT_TOKEN=(.+)/);
      if (match?.[1]) {
        return match[1].trim();
      }
    } catch (error) {
      // Ignore read errors
    }
  }

  // 3. Check user's home directory config
  const configPath = join(homedir(), ".config", "op", "service-account.json");
  if (existsSync(configPath)) {
    try {
      const configContent = await readFile(configPath, "utf-8");
      const configData = JSON.parse(configContent);
      if (configData.token) {
        return configData.token;
      }
    } catch (error) {
      // Ignore parse errors
    }
  }

  // 4. Check Script Kit's app data
  const appDataPath = kenvPath("..", "..", "app-data", "1password.json");
  if (existsSync(appDataPath)) {
    try {
      const appData = await readFile(appDataPath, "utf-8");
      const data = JSON.parse(appData);
      if (data.serviceAccountToken) {
        return data.serviceAccountToken;
      }
    } catch (error) {
      // Ignore parse errors
    }
  }

  return null;
};

/**
 * Resolve a 1Password secret reference
 */
const resolveSecret = async (
  reference: string,
  defaultValue?: string
): Promise<string> => {
  // Check cache first
  const cached = secretCache.get(reference);
  if (cached && Date.now() - cached.timestamp < (config.cacheTTL || CACHE_TTL)) {
    return cached.value;
  }

  // Initialize client if needed
  const client = await initOnePassword();
  if (!client) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    // Fall back to prompting user if no default provided
    return await mini({
      placeholder: `Enter value for ${reference}:`,
      secret: true,
    });
  }

  try {
    // Resolve the secret using the SDK
    const value = await client.secrets.resolve(reference);

    // Cache the result
    secretCache.set(reference, { value, timestamp: Date.now() });

    return value;
  } catch (error) {
    log(`Failed to resolve secret ${reference}: ${error}`);

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    // Fall back to prompting user
    return await mini({
      placeholder: `Enter value for ${reference}:`,
      secret: true,
    });
  }
};

/**
 * Get an item from 1Password
 */
const getItem = async (
  vault: string,
  item: string
): Promise<any | null> => {
  const client = await initOnePassword();
  if (!client) {
    log(`1Password SDK not initialized`);
    return null;
  }

  try {
    // Note: The SDK v0.3.1 has limited item operations
    // This is a placeholder for when more operations are available
    const reference = `op://${vault}/${item}`;
    const value = await client.secrets.resolve(reference);
    return value;
  } catch (error) {
    log(`Failed to get item ${item} from vault ${vault}: ${error}`);
    return null;
  }
};

/**
 * Configure 1Password integration
 */
const configure = async (options?: OnePasswordConfig): Promise<void> => {
  if (options) {
    config = { ...config, ...options };
  }

  // Interactive configuration if no token provided
  if (!config.serviceAccountToken) {
    const token = await mini({
      placeholder: "Enter your 1Password Service Account Token:",
      secret: true,
      hint: "Get a token from: https://my.1password.com/integrations/directory/scriptkit",
    });

    if (token) {
      config.serviceAccountToken = token;

      // Offer to save the token
      const saveLocation = await select("Where would you like to save the token?", [
        { name: "Script Kit .env (recommended)", value: "kenv" },
        { name: "System environment", value: "system" },
        { name: "Don't save", value: "none" },
      ]);

      if (saveLocation === "kenv") {
        const envPath = kenvPath(".env");
        let envContent = "";

        if (existsSync(envPath)) {
          envContent = await readFile(envPath, "utf-8");
        }

        // Add or update the token
        if (envContent.includes("OP_SERVICE_ACCOUNT_TOKEN=")) {
          envContent = envContent.replace(
            /OP_SERVICE_ACCOUNT_TOKEN=.*/,
            `OP_SERVICE_ACCOUNT_TOKEN=${token}`
          );
        } else {
          envContent += `\n# 1Password Service Account Token\nOP_SERVICE_ACCOUNT_TOKEN=${token}\n`;
        }

        await writeFile(envPath, envContent);
        log(`✓ Token saved to ${envPath}`);
      }
    }
  }

  // Test the configuration
  const client = await initOnePassword();
  if (client) {
    notify("✓ 1Password SDK configured successfully");
  } else {
    notify("❌ Failed to configure 1Password SDK");
  }
};

/**
 * Clear the secret cache
 */
const clearCache = (): void => {
  secretCache.clear();
  log("1Password secret cache cleared");
};

/**
 * List available vaults (requires CLI for now)
 */
const listVaults = async (): Promise<string[]> => {
  try {
    const { stdout } = await exec("op vault list --format=json");
    const vaults = JSON.parse(stdout);
    return vaults.map((v: any) => v.name);
  } catch (error) {
    log(`Failed to list vaults: ${error}`);
    log(`Note: This operation requires 1Password CLI to be installed`);
    return [];
  }
};

/**
 * Create a 1Password reference from components
 */
const createReference = (
  vault: string,
  item: string,
  field?: string,
  section?: string
): string => {
  let ref = `op://${vault}/${item}`;

  if (section) {
    ref += `/${section}`;
  }

  if (field) {
    ref += `/${field}`;
  }

  return ref;
};

/**
 * Main onepassword helper with sub-methods
 */
export const onepassword = async (
  reference: string,
  defaultValue?: string
): Promise<string> => {
  return resolveSecret(reference, defaultValue);
};

// Add utility methods to the function
onepassword.resolve = resolveSecret;
onepassword.configure = configure;
onepassword.getItem = getItem;
onepassword.clearCache = clearCache;
onepassword.listVaults = listVaults;
onepassword.createReference = createReference;

// Export configuration interface
onepassword.config = config;

// Add initialization method
onepassword.init = initOnePassword;

// Export for use in other modules
export default onepassword;

// Also make it available globally
global.onepassword = onepassword;
