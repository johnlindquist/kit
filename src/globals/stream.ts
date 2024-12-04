import Stream from "node:stream"

export let Writable = (global.Writable = Stream.Writable)
export let Readable = (global.Readable = Stream.Readable)
export let Duplex = (global.Duplex = Stream.Duplex)
export let Transform = (global.Transform = Stream.Transform)
