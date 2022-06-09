import { Channel } from "../../core/enum.js"

global.paste = async () => {
  let { value } = await sendWait(Channel.PASTE, {})
  return value
}
global.copy = async text => {
  await sendWait(Channel.COPY, text)
}
