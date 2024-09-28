export let getRecentLimit = () => {
  return Number.parseInt(
    process.env?.KIT_RECENT_LIMIT || "3",
    10
  )
}
