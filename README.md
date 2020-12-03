# JavaScript Shell Scripts

## Install

### 1. Clone This Project to `~/.js`

```shell
git clone https://github.com/johnlindquist/.js.git ~/.js
```

### 2. Install the Latest Version of Node

⚠️ The default project configuration currently requires:

- [nvm](https://github.com/nvm-sh/nvm)
- zsh with a [.zshrc](https://superuser.com/questions/886132/where-is-the-zshrc-file-on-mac)

Install the latest version of Node.js with nvm

```shell
nvm install node
```

### 3. Configure Paths and Environment Variables

Copy/paste the following command in your terminal to configure JavaScript Shell Scripts:

```shell
echo '\nexport JS_NODE='$(nvm which node) >> ~/.js/.jsrc; echo '\nsource ~/.js/.jsrc' >> ~/.zshrc; source ~/.zshrc
```

### 4. `npm install` the Packages

```shell
cd ~/.js
```

```shell
npm i
```

## Confirm Scripts Are Working

Type `joke` into your terminal and hit enter. You should see a random joke printed.

## Create a New Script

```shell
js-new my-script
```

⚠️ This step relies on VS Code being installed
This will create a new `.mjs` file in your `src` dir, [symlink](https://en.wikipedia.org/wiki/Symbolic_link) it, and launch the file to edited in [VS Code](https://code.visualstudio.com/).

Write some JavaScript in your `my-script.js` file, then you can run it in the terminal with `my-script`.

## VSCode Configuration for Autocomplete

**TODO** would love to support autocomplete from the globals...

## Concepts
