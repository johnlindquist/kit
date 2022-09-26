import { Channel } from "../core/enum.js"

global.playAudioFile = async (
  filePath,
  options = {
    rate: 1.2,
  }
) => {
  await sendWait(Channel.PLAY_AUDIO, {
    filePath,
    ...options,
  })

  return filePath
}

global.say = async (
  text,
  options = {
    rate: 1.2,
    name: "Daniel",
  }
) => {
  // let url =
  //   "https://translate.google.com/translate_tts?tl=" +
  //   options?.lang +
  //   "&q=" +
  //   encodeURIComponent(text) +
  //   "&client=tw-ob"

  // let filePath = tmpPath(
  //   Date.now().toString() + "-speech.mp3"
  // )
  // await writeFile(filePath, await download(url))
  await sendWait(Channel.SPEAK_TEXT, {
    text,
    ...options,
  })

  return text
}

global.beep = async () => {
  await sendWait(Channel.BEEP)
}

export {}
