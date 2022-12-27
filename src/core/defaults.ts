import { ProcessType } from "./enum.js"
import type { Choice, Script } from "../types"

export const DEFAULT_LIST_WIDTH = 300 // 256;
export const DEFAULT_WIDTH = 300 // 256;
export const DEFAULT_EXPANDED_WIDTH = 768
export const DEFAULT_HEIGHT =
  process.env.KIT_TIKTOK === "development" ? 1040 : 480 // Math.round((DEFAULT_EXPANDED_WIDTH * 10) / 16); // 480;
export const INPUT_HEIGHT = 32
export const TOP_HEIGHT = 80
export const MIN_HEIGHT = TOP_HEIGHT
export const MIN_TEXTAREA_HEIGHT = MIN_HEIGHT * 3
export const MIN_WIDTH = 256
export const DROP_HEIGHT = 232
export const BUTTON_HEIGHT = 56
export const EMOJI_WIDTH = 278
export const EMOJI_HEIGHT = 380
export const ZOOM_LEVEL =
  process.env.KIT_TIKTOK === "development" ? 2 : 0

export const SPLASH_PATH = `__app__/splash-screen`

export const noScript: Script = {
  id: "",
  filePath: "__app__/no-script",
  command: "",
  name: "",
  type: ProcessType.App,
  kenv: "",
}

export const noChoice: Choice = {
  id: "",
  name: "__app__/no-choice",
}
