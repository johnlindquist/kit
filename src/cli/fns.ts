export let exists = async input => {
  let check = (await cli("exists", input)).exists
  return check
}

export let info = async input => await cli("info", input)

export let findScript = async input => {
  return (await cli("find-script", input)).found
}

export let scripts = async () =>
  (await cli("scripts")).scripts

export let menu = async (fromCache = true) => {
  let menuCachePath = kenvPath("cache", "menu-cache.json")
  if (fromCache && (await isFile(menuCachePath))) {
    return getScripts()
  }
  return await (await cli("menu")).menu
}
