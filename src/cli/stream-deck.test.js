import ava from "ava"
import "../../test/config.js"

global.exec = () => {}

ava.serial("stream-deck home", async t => {
  let command = "script-with-arg"
  await $`k ${kitPath(
    "cli",
    "stream-deck.js"
  )} ${command} true --no-log`

  let deckBinPath = kenvPath("deck", `${command}.sh`)

  let deckBinCreated = test("-f", deckBinPath)

  t.true(deckBinCreated)
})

ava.serial("stream-deck kenv", async t => {
  let command = "test-kenv-script"
  await $`k ${kitPath(
    "cli",
    "stream-deck.js"
  )} ${command} true --no-log`

  let deckBinPath = kenvPath("deck", `${command}.sh`)

  let deckBinCreated = test("-f", deckBinPath)

  t.true(deckBinCreated)
})

ava.after("clean cli", async () => {
  await trash(path.resolve("test", "deck"))
})
