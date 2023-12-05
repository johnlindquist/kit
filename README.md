# Script Kit v2

[https://scriptkit.com/](https://scriptkit.com/)

## Join the Discussion

[https://github.com/johnlindquist/kit/discussions](https://github.com/johnlindquist/kit/discussions)

## ⭐️ Unlock Script Kit Pro by Sponsoring Script Kit ⭐️

❤️ [Sponsor me on GitHub](https://github.com/sponsors/johnlindquist/sponsorships?sponsor=johnlindquist&tier_id=235205) ❤️

### Sponsor Only Features

| Shipped | Planned |
| --- | --- |
| Built-in Debugger | Sync Scripts to GitHub Repo |
| Script Log Window | Run Script Remotely as GitHub Actions |
| Support through Discord | Advanced Widgets |
| | Screenshots |
| | Screen Recording |
| | Desktop Color Picker |
| | Measure Tool |
| | Debug from IDE |

## Script Kit Dev Setup

> Note: This ain't pretty 😅

Requirements: yarn 1

### Why both npm and yarn?

The App was created with https://github.com/electron-react-boilerplate/electron-react-boilerplate a long time ago. They require yarn and webpack.

I have been unable to prioritize the time to switch over to another build system or keeping up with the boilerplate, especially with so many moving pieces.

Thus, we use yarn to build the App and npm to build the SDK 🤦‍♂️

> Note: A huge focus of v3 will be to clean up this mess and make it much, much easier to contribute.

### Using node 18.18.2 from ~/.knode

Installing `Kit.app` already installed node 18.18.2 to ~/.knode. You'll want to use this node version for all build/run steps:

`PATH=~/.knode/bin:$PATH`

This will use 18.18.2's node/npm when working with Kit. (Alternatively, you can use nvm/n/whatever, but I don't)

- Use `volta` to manage node versions.
    1. Install [volta](https://volta.sh/)
    2. Volta will automatically switch node version to 18.18.2 when working with kit.

### Clone Kit SDK

Clone:
`git clone https://github.com/johnlindquist/kit.git`

Install:
`npm install`

### Clone Kit App

Clone:
`git clone https://github.com/johnlindquist/kitapp.git`

Install:
`yarn`

### (Skip if you already have a kenv from production) Clone the base kenv

Clone:
`git clone https://github.com/johnlindquist/kenv.git ~/.kenv`

### Building Kit SDK

`npm run build-kit`

The build command builds the SDK to ~/.kit

#### yarn link (First run only)

1. cd to ~/.kit
2. yarn link
3. cd to ~/wherever you cloned kitapp
4. yarn link @johnlindquist/kit

This will force the App to use the SDK so you can work on both simultaneously

### Building the App

```bash
yarn webpack-dev
yarn install-electron-deps
yarn start
```

Assuming everything went well, the app should start up.
