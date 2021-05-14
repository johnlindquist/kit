let { default: fetch } = (await import("node-fetch")) as any
global.fetch = fetch

export {}
