global.mute = async () => {
  return await applescript(
    String.raw`set volume with output muted`
  )
}

global.unmute = async () => {
  return await applescript(
    String.raw`set volume without output muted`
  )
}

global.lock = async () => {
  return await applescript(
    String.raw`tell application "System Events" to keystroke "q" using {command down, control down}`
  )
}

global.sleep = async () => {
  return await applescript(
    String.raw`tell application "Finder" to sleep`
  )
}

global.shutdown = async () => {
  return await applescript(
    String.raw`tell application "Finder" to shut down`
  )
}

// Example: "AppleScript Editor", "Automator", "Finder", "LaunchBar"
// the quotes, comma and spacing are important
global.quitAllApps = async (appsToExclude = "") => {
  // Credit to clozach on StackOverflow: https://stackoverflow.com/a/44268337/3015595
  const excludeApps = appsToExclude
    ? `set exclusions to ${appsToExclude}`
    : ""

  return await applescript(
    String.raw`
      -- get list of open apps
      tell application "System Events"
        set allApps to displayed name of (every process whose background only is false) as list
      end tell

      -- leave some apps open
      ${excludeApps}

      -- quit each app
      repeat with thisApp in allApps
        set thisApp to thisApp as text
        if thisApp is not in exclusions then
          tell application thisApp to quit
        end if
      end repeat
    `
  )
}

global.adjustVolume = async () => {
  let volume = await arg({
    name: "Adjust Volume",
    description: "Enter a number between 0 and 100",
  })
  return await applescript(
    String.raw`set volume output volume ${volume}`
  )
}

global.sleepScreens = async () => {
  await exec(`pmset displaysleepnow`)
}

global.caffeinate = async () => {
  run(kitPath("cli", "caffeinate.js"))
}
export {}
