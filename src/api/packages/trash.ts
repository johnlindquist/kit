let trash: typeof import("trash").default = async (
  input,
  options
) => {
  let { default: trash } = await import("trash")
  return trash(input, options)
}

global.trash = trash
global.rm = trash

export {}
