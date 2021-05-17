let { default: download } = await import("download")

global.download = download

export {}
