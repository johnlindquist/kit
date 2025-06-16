import type { Action, PromptConfig } from "../types/core.js"
import { renderToStaticMarkup } from "react-dom/server"
import React from "react"

// Make React available globally for JSX
global.React = React

/**
 * Display a form using React JSX syntax
 * 
 * @param component - React component or JSX element
 * @param formData - Initial form data
 * @param actions - Optional form actions
 * @returns Promise resolving to form submission data
 * 
 * @example
 * ```tsx
 * const result = await react(
 *   <form>
 *     <h2>Login</h2>
 *     <input name="username" type="text" placeholder="Username" required />
 *     <input name="password" type="password" placeholder="Password" required />
 *   </form>
 * )
 * console.log(result.username, result.password)
 * ```
 */
export async function react(
  component: React.ReactElement,
  formData?: Record<string, any>,
  actions?: Action[]
): Promise<any> {
  try {
    // Convert React element to HTML string using server-side rendering
    const html = renderToStaticMarkup(component)
    
    // Use the existing form() function with the rendered HTML
    return await global.form(html, formData, actions)
  } catch (error) {
    // If renderToStaticMarkup fails, try to convert the component to string
    // and show an error message
    console.error("Error rendering React component:", error)
    
    const errorHtml = `
      <div style="padding: 20px; color: #dc2626;">
        <h3>React Rendering Error</h3>
        <p>${error.message}</p>
        <pre style="font-size: 12px; opacity: 0.7;">${error.stack}</pre>
      </div>
    `
    
    return await global.form(errorHtml, formData, actions)
  }
}

// Add to global scope
global.react = react