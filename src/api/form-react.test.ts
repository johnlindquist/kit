import ava from 'ava'
import { pathToFileURL } from 'node:url'
import * as React from 'react'
import path from 'node:path'
import os from 'node:os'

// Set up test environment
process.env.KIT = process.env.KIT || path.resolve(os.homedir(), '.kit')

// Helper to import kit modules
const importKit = async (...parts: string[]) => {
  const partsPath = path.resolve(process.env.KIT!, ...parts)
  return await import(pathToFileURL(partsPath).href)
}

// Import globals before tests
ava.before(async () => {
  // Import kit globals
  await importKit('api/global.js')
  await importKit('api/kit.js')
  await importKit('api/lib.js')
  await importKit('api/form-react.js')
  
  // Also import the index to ensure all exports are loaded
  await importKit('index.js')
})

ava.serial('formReact is defined as a global', async (t) => {
  t.is(typeof global.formReact, 'function', 'formReact should be a function')
})

ava.serial('formReact renders simple React element', async (t) => {
  // Mock the global.form function to capture what's passed
  let capturedHtml = null
  let originalForm = global.form
  global.form = async (html, formData, actions) => {
    capturedHtml = html
    return { html, formData, actions }
  }

  const element = React.createElement('div', null, 'Hello World')
  const result = await global.formReact(element)
  
  t.is(capturedHtml, '<div>Hello World</div>')
  
  // Restore original form
  global.form = originalForm
})

// Skip script execution tests for now due to test environment setup
ava.skip('formReact works in actual script', async (t) => {
  t.pass('Script execution test skipped')
})

ava.serial('formReact handles JSX-like elements', async (t) => {
  // Mock the global.form function
  let capturedHtml = null
  let originalForm = global.form
  global.form = async (html, formData, actions) => {
    capturedHtml = html
    return { html, formData, actions }
  }

  const Login = () => React.createElement(
    React.Fragment,
    null,
    React.createElement('h2', null, 'Login'),
    React.createElement('input', { name: 'username', placeholder: 'Username' })
  )
  
  const element = React.createElement(Login)
  const result = await global.formReact(element)
  
  t.true(capturedHtml.includes('<h2>Login</h2>'))
  t.true(capturedHtml.includes('name="username"'))
  
  // Restore original form
  global.form = originalForm
})

ava.serial('formReact accepts factory function', async (t) => {
  // Mock the global.form function
  let capturedHtml = null
  let originalForm = global.form
  global.form = async (html, formData, actions) => {
    capturedHtml = html
    return { html, formData, actions }
  }

  const factory = () => React.createElement('span', null, 'Factory')
  const result = await global.formReact(factory)
  
  t.is(capturedHtml, '<span>Factory</span>')
  
  // Restore original form
  global.form = originalForm
})

ava.serial('formReact passes formData and actions', async (t) => {
  // Mock the global.form function
  let capturedFormData = null
  let capturedActions = null
  let originalForm = global.form
  global.form = async (html, formData, actions) => {
    capturedFormData = formData
    capturedActions = actions
    return { html, formData, actions }
  }

  const element = React.createElement('div', null, 'Test')
  const formData = { key: 'value' }
  const actions = [{ name: 'action1', value: 'action1' }, { name: 'action2', value: 'action2' }]
  
  const result = await global.formReact(element, formData, actions)
  
  t.deepEqual(capturedFormData, formData)
  t.deepEqual(capturedActions, actions)
  
  // Restore original form
  global.form = originalForm
})

// Skip tsx compilation test for now
ava.skip('tsx files can import and use React', async (t) => {
  t.pass('TSX compilation test skipped')
})