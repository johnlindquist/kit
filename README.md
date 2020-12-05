# JavaScript Scripts

## Install

```shell
curl -o- https://raw.githubusercontent.com/johnlindquist/.js/main/config/install.sh | JS_PATH=~/.js zsh
```

## Create a New Script

1. Create a new script

```shell
new hello-world
```

> The `hello-world.mjs` will automatically open in VS Code.

2. Add some code to `hello-world.mjs`

3. You can now run `hello-world` from your terminal

## Other Flags

The examples use `joke`, but these flags work on any JavaScript Script:

### Edit a Script

```shell
joke --edit
```

### Duplicate a Script

```shell
joke --cp dadjoke
```

> Automatically opens `dadjoke.mjs` in VS Code

### Rename a Script

```shell
joke --mv dadjoke
```

### Delete a Script

```shell
joke --rm
```
