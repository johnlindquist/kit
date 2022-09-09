import { Channel } from "../../core/enum.js"

global.paste = () => sendWait(Channel.PASTE)
global.copy = text => sendWait(Channel.COPY, text)
