global.playAudioFile = async (
  path,
  playInBackground = true
) => {
  return global.exec(
    `afplay ${path} ${
      playInBackground ? "&>/dev/null &" : ""
    }`
  )
}

export {}
