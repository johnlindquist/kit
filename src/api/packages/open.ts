import open, { openApp } from "open"

;(global as any).open = open
global.openApp = openApp
export {}
