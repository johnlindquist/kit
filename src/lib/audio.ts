global.playAudioFile = async (
  path,
  playInBackground = true
) => {
  return exec(
    `afplay ${path} ${
      playInBackground ? "&>/dev/null &" : ""
    }`
  )
}

export {}
