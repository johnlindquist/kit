export let preview = async file => {
  let os = await import("os")
  if (os.platform() == "darwin") {
    exec(`qlmanage -p "${file}"`, { silent: true })
  } else {
    exec(`open ` + file)
  }
}
