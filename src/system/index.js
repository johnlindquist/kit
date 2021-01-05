export let notify = async (title, subtitle) => {
  let os = await import("os")
  if (os.platform() == "darwin") {
    let { applescript } = await import(
      "../osx/applescript.js"
    )
    applescript(
      `display notification with title "${title}" subtitle "${subtitle}"`
    )
  } else {
    console.log(
      `notify is currently supported on your system`
    )
  }
}

export let preview = async file => {
  let os = await import("os")
  if (os.platform() == "darwin") {
    exec(`qlmanage -p "${file}"`, { silent: true })
  } else {
    exec(`open ` + file)
  }
}

export let say = async string => {
  let os = await import("os")
  if (os.platform() == "darwin") {
    let { applescript } = await import(
      "../osx/applescript.js"
    )
    return applescript(`say "${string}" speaking rate 250`)
  } else {
    console.log(
      `"say" is currently unsupported on your platform`
    )
  }
}

export let getSelectedText = async () => {
  let { default: robotjs } = await need("robotjs")
  let { default: clipboardy } = await need("clipboardy")
  robotjs.keyTap("c", "command")
  return clipboardy.readSync()
}

export let setSelectedText = async text => {
  let { default: robotjs } = await need("robotjs")
  let { default: clipboardy } = await need("clipboardy")
  clipboardy.writeSync(text)
  robotjs.keyTap("v", "command")
}
