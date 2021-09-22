//List voices: `say -v "?"`. Get more voices: Preferences->Accessibility->System Voices
global.say = async (
  string,
  { rate = 250, voice = "Alex" } = {}
) =>
  await applescript(
    String.raw`say "${string}" using "${voice}" speaking rate ${rate}`
  )

export {}
