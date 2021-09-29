import { write, read } from "clipboardy"
global.paste = read
global.copy = write
