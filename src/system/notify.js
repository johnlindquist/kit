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
