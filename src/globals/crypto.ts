import crypto from "node:crypto"

export let uuid = (global.uuid = crypto.randomUUID)
