let open: any = async (target, options) => {
  let { default: _o } = await import("open")
  return _o(target, options)
}

global.open = open

export {}
