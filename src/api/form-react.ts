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
  // Allow lazy factory
  const el = typeof element === "function" ? element() : element;

  // Render *right here* in the Node child process
  const html = renderToStaticMarkup(el);

  // Delegate to regular HTML form()
  return await global.form(html, formData, actions);
}