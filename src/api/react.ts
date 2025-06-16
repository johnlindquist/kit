import type { Action, PromptConfig } from "../types/core.js"
import { renderToStaticMarkup } from "react-dom/server"
import React from "react"

// Make React available globally for JSX
global.React = React

// Extended config type for React forms
export interface ReactConfig extends PromptConfig {
  jsx?: React.ReactElement
}

/**
 * Display a form using React JSX syntax
 * 
 * @param componentOrConfig - React component/JSX element or PromptConfig with jsx property
 * @param formData - Initial form data
 * @param actions - Optional form actions
 * @returns Promise resolving to form submission data
 * 
 * @example
 * ```tsx
 * // Simple JSX element
 * const result = await react(
 *   <form>
 *     <h2>Login</h2>
 *     <input name="username" type="text" placeholder="Username" required />
 *     <input name="password" type="password" placeholder="Password" required />
 *   </form>
 * )
 * 
 * // With config object
 * const result = await react({
 *   jsx: <LoginForm />,
 *   className: "p-4 bg-gray-100",
 *   placeholder: "Fill out the login form",
 *   formData: { remember: true }
 * })
 * ```
 */
export async function react(
  componentOrConfig: React.ReactElement | ReactConfig,
  formData?: Record<string, any>,
  actions?: Action[]
): Promise<any> {
  let config: ReactConfig = {}
  let component: React.ReactElement | undefined
  
  // Handle both React element and config object
  if (React.isValidElement(componentOrConfig)) {
    // Direct React element
    component = componentOrConfig
    config.formData = formData
    config.actions = actions
  } else {
    // Config object
    config = { ...componentOrConfig }
    component = config.jsx
    
    // Override with explicit parameters if provided
    if (formData !== undefined) config.formData = formData
    if (actions !== undefined) config.actions = actions
    
    // Remove jsx from config before passing to form
    delete config.jsx
  }
  
  if (!component) {
    throw new Error("No React component provided. Pass a React element or use the 'jsx' property in config.")
  }
  
  try {
    // Convert React element to HTML string using server-side rendering
    const html = renderToStaticMarkup(component)
    
    // Pass the config with rendered HTML to form()
    return await global.form({ ...config, html })
  } catch (error) {
    // If renderToStaticMarkup fails, show an error message
    console.error("Error rendering React component:", error)
    
    const errorHtml = `
      <div style="padding: 20px; color: #dc2626;">
        <h3>React Rendering Error</h3>
        <p>${error.message}</p>
        <pre style="font-size: 12px; opacity: 0.7;">${error.stack}</pre>
      </div>
    `
    
    return await global.form({ ...config, html: errorHtml })
  }
}

// Add to global scope
global.react = react