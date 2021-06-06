let { default: trash } = (await import("trash")) as any

global.trash = trash
global.rm = trash

export {}
