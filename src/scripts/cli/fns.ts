export let exists = async input => {
  let check = (await cli("exists", input)).exists
  return check
}

export let info = async input => await cli("info", input)

export let findScript = async input =>
  (await cli("find-script", input)).found

export let scripts = async () =>
  (await cli("scripts")).scripts

export let menu = async () => (await cli("menu")).menu
