import ava from 'ava'
import React from 'react'
import { formReact } from './form-react.js'

// Mock the global.form function
global.form = async (html, formData, actions) => {
  return { html, formData, actions }
}

ava('formReact renders simple React element', async (t) => {
  const element = React.createElement('div', null, 'Hello World')
  const result = await formReact(element)
  
  t.is(result.html, '<div>Hello World</div>')
})

ava('formReact renders JSX-like element', async (t) => {
  const Login = () => React.createElement(
    React.Fragment,
    null,
    React.createElement('h2', null, 'Login'),
    React.createElement('input', { name: 'username', placeholder: 'Username' })
  )
  
  const element = React.createElement(Login)
  const result = await formReact(element)
  
  t.true(result.html.includes('<h2>Login</h2>'))
  t.true(result.html.includes('name="username"'))
})

ava('formReact accepts factory function', async (t) => {
  const factory = () => React.createElement('span', null, 'Factory')
  const result = await formReact(factory)
  
  t.is(result.html, '<span>Factory</span>')
})

ava('formReact passes formData and actions', async (t) => {
  const element = React.createElement('div', null, 'Test')
  const formData = { key: 'value' }
  const actions = ['action1', 'action2']
  
  const result = await formReact(element, formData, actions)
  
  t.deepEqual(result.formData, formData)
  t.deepEqual(result.actions, actions)
})