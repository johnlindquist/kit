let { default: _ } = (await import("lodash")) as any
global._ = _

export {}
