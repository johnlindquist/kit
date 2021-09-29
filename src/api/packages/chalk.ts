let { default: chalkDefault }: any = await import("chalk")

global.chalk = chalkDefault

export {}
