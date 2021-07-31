# Store environment varibles with `await env()`

## Use `env` to read/write values to .env

When running a script from Kit.app, `await arg()` will open a prompt. Anything you type in will come out as a `value`.

```js
// my-script.js

// Will read MY_TOKEN from .env if exists
// Otherwise, will prompt to be set
let token = await env("MY_TOKEN")
console.log(token)
```
