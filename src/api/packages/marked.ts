let { default: marked }: any = await import("marked")
global.md = string => marked.parse(string)

export {}
