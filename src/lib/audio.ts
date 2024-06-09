import { Channel } from "../core/enum.js"

global.playAudioFile = async (
  filePath,
  options = {
    rate: 1.0,
  }
) => {
  return await sendWait(
    Channel.PLAY_AUDIO,
    {
      filePath,
      ...options,
    },
    0
  )
}

global.stopAudioFile = async () => {
  return await sendWait(Channel.STOP_AUDIO, undefined, 0)
}

global.say = async (
  text,
  options = {
    rate: 1.2,
    name: "Daniel",
  }
) => {
  await sendWait(
    Channel.SPEAK_TEXT,
    {
      text,
      ...options,
    },
    0
  )

  return text
}

global.beep = async () => {
  await sendWait(Channel.BEEP)
}

export {}
