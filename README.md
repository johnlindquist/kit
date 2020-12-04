# JavaScript Scripts

## Install

### ⚠️ Requirements

- zsh
- nvm

```shell
curl -o- https://raw.githubusercontent.com/johnlindquist/.js/main/config/install.sh | JS_PATH=~/.js zsh
```

## Create a New Script

1. Create a new script

```shell
new hello-world
```

2. Add some code to `hello-world.mjs`

3. You can now run `hello-world` from your terminal

⚠️ This step relies on VS Code being installed
This will create a new `.mjs` file in your `src` dir, [symlink](https://en.wikipedia.org/wiki/Symbolic_link) it, and launch the file to edited in [VS Code](https://code.visualstudio.com/).

## Other Flags

The examples use `joke`, but these flags work on any JavaScript Script:

## Edit a Script

```shell
joke --edit
```

### Duplicate a Script

```shell
joke --cp dadjoke
```

### Rename a Script

```shell
joke --mv dadjoke
```

## Delete a Script

```shell
joke --rm
```
