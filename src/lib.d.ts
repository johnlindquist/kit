export interface Lib {
  audio: Promise<typeof import("./lib/audio")>
  chrome: Promise<typeof import("./lib/browser")>
  desktop: Promise<typeof import("./lib/desktop")>
  file: Promise<typeof import("./lib/file")>
  keyboard: Promise<typeof import("./lib/keyboard")>
  playwright: Promise<typeof import("./lib/browser")>
  speech: Promise<typeof import("./lib/speech")>
  system: Promise<typeof import("./lib/system")>
  text: Promise<typeof import("./lib/text")>
}
