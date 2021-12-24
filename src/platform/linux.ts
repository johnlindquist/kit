global.edit = async (path, dir, line, col) => {
  global.exec(`${env.KIT_EDITOR || "code"} ${path} ${dir}`)
}

global.browse = async (url: string) => {
  global.exec(`xdg-open ${url}`)
}

global.say = async (text: string) => {
  return (
    await global.exec(
      `mshta vbscript:Execute("CreateObject(""SAPI.SpVoice"").Speak(""${JSON.stringify(
        text
      )}"")(window.close)")`
    )
  ).stdout
}
