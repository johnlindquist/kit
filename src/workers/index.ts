import { kitPath } from "../core/utils.js"

export const CACHED_GROUPED_SCRIPTS_WORKER = kitPath(
	"workers",
	"cache-grouped-scripts-worker.js"
)

export const CREATE_BIN_WORKER = kitPath("workers", "create-bin-worker.js")

export const KIT_WORKER = kitPath("workers", "kit-worker.js")
