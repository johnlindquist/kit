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
