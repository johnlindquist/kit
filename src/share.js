import LZUTF8 from "lzutf8"

let script = await arg()

let file = await readFile(
  path.join(env.SIMPLE_PATH, "src", script + ".js"),
  "utf8"
)
let options = {
  inputEncoding: "Base64",
  outputEncoding: "Base64",
}
let compressed = LZUTF8.compress(file, {
  outputEncoding: "StorageBinaryString",
})
copy(compressed)

// let decompressed = LZUTF8.decompress(compressed, {
//   inputEncoding: "Base64",
// })
// echo(decompressed)
