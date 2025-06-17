# Script Kit v3

[https://scriptkit.com/](https://scriptkit.com/)

<a href="https://vercel.com/oss">
  <img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge.svg" />
</a>

## Join the Discussion

[https://github.com/johnlindquist/kit/discussions](https://github.com/johnlindquist/kit/discussions)

## Docs

[https://github.com/johnlindquist/kit-docs](https://github.com/johnlindquist/kit-docs)


## ⭐️ Unlock Script Kit Pro by Sponsoring Script Kit ⭐️

❤️ [Sponsor me on GitHub](https://github.com/sponsors/johnlindquist/sponsorships?sponsor=johnlindquist&tier_id=235205) ❤️

### Sponsor Only Features

| Shipped | Planned |
| --- | --- |
| Unlimited Active Prompts | Sync Scripts to GitHub Repo |
| Built-in Debugger | Run Script Remotely as GitHub Actions |
| Script Log Window | Advanced Screenshots |
| Vite Widgets | Screen Recording |
| Webcam Capture | Measure Tool |
| Desktop Color Picker | Debug from IDE |
| Basic Screenshots |

---

## Development

Install pnpm:

[https://pnpm.io/installation](https://pnpm.io/installation)

### Clone Kit SDK

Clone and install:
```
git clone https://github.com/johnlindquist/kit.git
cd kit
pnpm install
```

### Building Kit SDK

`pnpm build`

The build command builds the SDK to ~/.kit

#### Linking kit to app for local development

**Option 1: Workspace approach (Recommended)**

1. cd to wherever you cloned kitapp
2. Create a `pnpm-workspace.yaml` file with:
   ```yaml
   packages:
     - '~/.kit'
     - '.'
   ```
3. Run `pnpm install` - this will automatically link your local kit build
4. The workspace file is gitignored, so it won't affect CI builds

**Option 2: Manual linking (Alternative)**

1. cd to ~/.kit
2. pnpm link
3. cd to wherever you cloned kitapp  
4. pnpm link @johnlindquist/kit

**Note:** The workspace approach is preferred as it automatically links your local kit development build and doesn't require manual link/unlink commands.

