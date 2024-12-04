import _path from "node:path"
export let path = ((global as any).path = _path);
export let resolve = (global.resolve = _path.resolve)
export let join = (global.join = _path.join)
export let dirname = (global.dirname = _path.dirname)
export let basename = (global.basename = _path.basename)
export let extname = (global.extname = _path.extname)
export let relative = (global.relative = _path.relative)
export let normalize = (global.normalize = _path.normalize)
export let isAbsolute = (global.isAbsolute = _path.isAbsolute)
export let sep = (global.sep = _path.sep)
export let delimiter = (global.delimiter = _path.delimiter)
export let parse = (global.parse = _path.parse)
