export interface Lib {
  audio: Promise<typeof import("../src/lib/audio")>
  chrome: Promise<typeof import("../src/lib/browser")>
  desktop: Promise<typeof import("../src/lib/desktop")>
  file: Promise<typeof import("../src/lib/file")>
  keyboard: Promise<typeof import("../src/lib/keyboard")>
  playwright: Promise<typeof import("../src/lib/browser")>
  speech: Promise<typeof import("../src/lib/speech")>
  system: Promise<typeof import("../src/lib/system")>
  text: Promise<typeof import("../src/lib/text")>
}
