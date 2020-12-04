# JavaScript Scripts

## Install

### ⚠️ Requirements

- zsh
- nvm

```shell
JS_PATH=~/.js curl -o- https://raw.githubusercontent.com/johnlindquist/.js/main/config/install.sh | zsh
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

Write some JavaScript in your `my-script.js` file, then you can run it in the terminal with `my-script`.
