global.edit = async (path, dir, line, col) => {
  global.exec(`code ${path} ${dir} ${line} ${col}`)
}

global.browse = async (url: string) => {
  global.exec(`start ${url}`)
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
