let { default: _ } = (await import("lodash")) as any
;(global as any)._ = _

export {}
