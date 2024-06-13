import { platform } from "os"

export const isWin = platform().startsWith("win")
export const isMac = platform().startsWith("darwin")
export const isLinux = platform().startsWith("linux")