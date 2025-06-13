import { lookup } from "node:dns/promises"
import https from "node:https"

/**
 * Checks if the system has internet connectivity by attempting to resolve DNS
 * and make a simple HTTPS request to a reliable endpoint.
 * 
 * @returns Promise<boolean> - true if online, false if offline
 */
export async function checkOnline(): Promise<boolean> {
  try {
    // First try DNS resolution
    await lookup("www.google.com", { family: 4 })
    
    // Then try a simple HTTPS request with a short timeout
    return new Promise((resolve) => {
      const req = https.get(
        "https://www.google.com/generate_204",
        { 
          timeout: 3000,
          headers: { "User-Agent": "Node.js" }
        },
        (res) => {
          resolve(res.statusCode === 204)
        }
      )
      
      req.on("error", () => resolve(false))
      req.on("timeout", () => {
        req.destroy()
        resolve(false)
      })
    })
  } catch {
    return false
  }
}