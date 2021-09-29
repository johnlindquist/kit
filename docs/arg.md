# The `await arg` prompt

## `await arg()` - Receive user input

When running a script from Kit.app, `await arg()` will open a prompt. Anything you type in will come out as a `value`.

```js
// my-script.js
let value = await arg()
console.log(value)
```

## Lazy args

Running a script from the terminal will either prompt for an arg or read in arguments you pass in:

>

```bash
my-script # prompts from an arg
```

```bash
my-script orange # "value" is set to "orange"
```

## arg Placeholder or Config

```js

```
