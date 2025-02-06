let notSupported = (name) => async () =>
  await div(
    md(`# ${name} is Not Supported on Linux

Have an idea on how to support it? Please share on our [GitHub Discussions](https://github.com/johnlindquist/kit/discussions/categories/ideas)

`)
  )

global.edit = async (path, dir, line, col) => {
  await global.exec(`${env.KIT_EDITOR || 'code'} ${path} ${dir}`, {
    detached: true,
    windowsHide: true
  })
}

global.applescript = notSupported('applescript')
global.copyPathAsImage = notSupported('copyPathAsImage')

global.focusTab = notSupported('focusTab')
global.focusWindow = notSupported('focusWindow')
global.getActiveTab = notSupported('getActiveTab')

global.getActiveAppInfo = notSupported('getActiveAppInfo')
global.getActiveAppBounds = notSupported('getActiveAppBounds')
global.getActiveTab = notSupported('getActiveTab')

global.getSelectedFile = notSupported('getSelectedFile')
global.setSelectedFile = notSupported('setSelectedFile')
global.getSelectedDir = notSupported('getSelectedDir')

global.getTabs = notSupported('getTabs')
global.getWindows = notSupported('getWindows')
global.getWindowsBounds = notSupported('getWindowsBounds')
global.keystroke = notSupported('keystroke')
global.lock = notSupported('lock')

global.organizeWindows = notSupported('organizeWindows')

global.quitAllApps = notSupported('quitAllApps')

global.scatterWindows = notSupported('scatterWindows')

global.setActiveAppBounds = notSupported('setActiveAppBounds')
global.setActiveAppPosition = notSupported('setActiveAppPosition')
global.setActiveAppSize = notSupported('setActiveAppSize')

global.setWindowBoundsByIndex = notSupported('setWindowBoundsByIndex')
global.setWindowPosition = notSupported('setWindowPosition')
global.setWindowPositionByIndex = notSupported('setWindowPositionByIndex')
global.setWindowSize = notSupported('setWindowSize')
global.setWindowSizeByIndex = notSupported('setWindowSizeByIndex')
global.shutdown = notSupported('shutdown')
global.sleep = notSupported('sleep')
global.tileWindow = notSupported('tileWindow')
global.fileSearch = notSupported('fileSearch')

export {}
