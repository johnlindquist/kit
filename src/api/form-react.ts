import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import "../target/app.js"; // Ensures global.form is available

/**
 * Accept either a ready React element or a factory fn returning one.
 * Usage in user scripts: await formReact(<MyForm .../>)
 */
export async function formReact(
  element: React.ReactElement | (() => React.ReactElement),
  formData: Record<string, any> = {},
  actions?: any[]
) {
  try {
    // Allow lazy factory
    const el = typeof element === "function" ? element() : element;

    // Render *right here* in the Node child process
    const html = renderToStaticMarkup(el);

    // Delegate to regular HTML form()
    return await global.form(html, formData, actions);
  } catch (error) {
    if (error.message?.includes('useState') || error.message?.includes('useEffect') || error.message?.includes('use')) {
      throw new Error(
        `React hooks (useState, useEffect, etc.) are not supported in formReact because it uses server-side rendering.\n\n` +
        `formReact renders your component to static HTML on the server, where hooks don't work.\n\n` +
        `For interactive components, consider:\n` +
        `1. Using form() with vanilla JavaScript for interactivity\n` +
        `2. Pre-computing state values and passing them as props\n` +
        `3. Using the component() API instead (when available)\n\n` +
        `Original error: ${error.message}`
      );
    }
    throw error;
  }
}

// Make formReact available globally
global.formReact = formReact;