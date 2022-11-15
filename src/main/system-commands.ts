// Name: System Commands
// Description: Run system commands

setName(``)

let command = await arg("Select System Command", [
  {
    name: "Mute",
    description: "Mute the system volume",
    value: "mute",
  },
  {
    name: "Unmute",
    description: "Unmute the system volume",
    value: "unmute",
  },
  {
    name: "Adjust Volume",
    description: "Set the system volume",
    value: "adjustVolume",
  },
  {
    name: "Lock",
    description: "Lock screen",
    value: "lock",
  },
  {
    name: "Sleep Screens",
    description: "Sleep the screens",
    value: "sleepScreens",
  },
  {
    name: "Sleep",
    description: "Put system to sleep",
    value: "sleep",
  },
  {
    name: "Caffeinate",
    description: "Keep system awake",
    value: "caffeinate",
  },
  {
    name: "Shutdown",
    description: "Shutdown system",
    value: "shutdown",
  },
  {
    name: "Quit All Apps",
    description: "Quit all apps",
    value: "quitAllApps",
  },
])

global[command]()
export {}
