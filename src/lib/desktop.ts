import { Channel } from "../core/enum.js"
import { Bounds } from "../types/platform"

let utils = String.raw`on findAndReplaceInText(theText, theSearchString, theReplacementString)
set AppleScript's text item delimiters to theSearchString
set theTextItems to every text item of theText
set AppleScript's text item delimiters to theReplacementString
set theText to theTextItems as string
set AppleScript's text item delimiters to ""
return theText
end findAndReplaceInText

script V
property Ps : missing value
property Ws : missing value
property JSON : ""
property Object : ""

to finalizeJSON()
	set JSON to "[" & text 1 thru -2 of JSON & "]"
end finalizeJSON

to addPair(key, value)
	set escapedValue to paragraphs of findAndReplaceInText(value, "\"", "\\\"")
	set Object to Object & ("\"" & key & "\":\"" & escapedValue) & "\","
end addPair

to finalizeObject()
	set Object to "{" & text 1 thru -2 of Object & "},"
	set JSON to JSON & Object
	set Object to ""
end finalizeObject
end script`

global.getWindows = async () => {
  let result = await applescript(String.raw`
${utils}

tell application "System Events"
  set V's Ps to processes whose visible is true
  
  repeat with theProcess in V's Ps
	  set V's Ws to window of theProcess
	  set counter to 0
	  repeat with theWindow in V's Ws
		  tell V to addPair("process", short name of theProcess as string)
		  tell V to addPair("title", name of theWindow as string)
		  tell V to addPair("index", counter as string)
		  set counter to counter + 1
		  tell V to finalizeObject()
	  end repeat
  end repeat
  
  tell V to finalizeJSON()
end tell

get V's JSON
`)

  return JSON.parse(result)
}

global.focusWindow = async (process, title) => {
  return await applescript(String.raw`
tell application "${process}"
	activate	
end tell

tell application "System Events"
	set theProcessWindow to window of process "${process}" 
	repeat with theWindow in theProcessWindow
		if name of theWindow contains "${title}" then
			perform action "AXRaise" of theWindow
		else
		perform action "AXRaise" of item 1 of theProcessWindow
		end if
	end repeat
end tell
`)
}

global.getWindowsBounds = async () => {
  let result =
    await applescript(String.raw`set listOfWindows to ""
	tell application "System Events"
		
		set listOfProcesses to name of every process whose visible is true
		
		repeat with processName in listOfProcesses
			repeat with currentWindow in window of process processName
	
				set {x, y} to position of currentWindow
				set {width, height} to size of currentWindow
				set n to name of currentWindow
				set fullscreen to value of attribute "AXFullScreen" of currentWindow
	
				set processKV to "\"process\":\"" & processName as string & "\""
				set nameKV to "\"name\":\"" & n as string & "\""
				set positionKV to "\"position\":" & "{\"x\":" & x & "," & "\"y\":" & y & "}"
				set sizeKV to "\"size\":" & "{\"width\":" & width & "," & "\"height\":" & height & "}"
				set fullscreenKV to "\"fullscreen\":" & fullscreen
	
				set listOfWindows to listOfWindows & "{" & processKV & "," & nameKV & "," & positionKV & "," & sizeKV & "," & fullscreenKV & "},"
				
			end repeat
			
		end repeat
	end tell
	
	get "[" & text 1 thru -2 of listOfWindows & "]"`)

  return JSON.parse(result)
}

global.setWindowPosition = async (process, title, x, y) => {
  return await applescript(String.raw`
	tell application "System Events"
	set theProcessWindow to window of process "${process}"
	repeat with theWindow in theProcessWindow
		if name of theWindow contains "${title}" then
			set position of theWindow to {${x}, ${y}}
		else
			set position of item 1 of theProcessWindow to {${x}, ${y}}
		end if
	end repeat
end tell`)
}

global.setWindowSizeByIndex = async (
  process,
  index,
  x,
  y
) => {
  return await applescript(String.raw`
		tell application "System Events"
		set theProcessWindow to window of process "${process}"
		set counter to 0
		repeat with theWindow in theProcessWindow
			if counter as string is "${index}"
				set size of theWindow to {${x}, ${y}}
			end if
			set counter to counter + 1
		end repeat
	end tell`)
}

global.setWindowBoundsByIndex = async (
  process,
  index,
  x,
  y,
  width,
  height
) => {
  return await applescript(String.raw`
		  tell application "System Events"
		  set theProcessWindow to window of process "${process}"
		  set counter to 0
		  repeat with theWindow in theProcessWindow
			  if counter as string is "${index}"
				  set size of theWindow to {${width}, ${height}}
				  set position of theWindow to {${x}, ${y}}
			  end if
			  set counter to counter + 1
		  end repeat
	  end tell`)
}

global.scatterWindows = async () => {
  let { workArea } = await getActiveScreen()
  let { x, y, width, height } = workArea

  return await applescript(String.raw`
  ${utils}

tell application "System Events"
  set V's Ps to processes whose visible is true
  
  repeat with theProcess in V's Ps
	  set V's Ws to window of theProcess
	  repeat with theWindow in V's Ws
	  		set width to random number from 400 to ${width}
	  		set height to random number from 400 to ${height}	  
	  
	  		set x to random number from ${x} to ${x} + ${width} - width
		  	set y to random number from ${y} to ${y} + ${height} - height
		  
		  try
			set size of theWindow to {width, height}
			set position of theWindow to {x, y}
		  end try
	  end repeat
  end repeat
end tell
  `)
}

global.organizeWindows = async () => {
  let { workArea } = await getActiveScreen()
  let { x, y, width, height } = workArea

  let windows = await getWindows()
  let rows = Math.floor(Math.sqrt(windows.length))
  let columns = Math.floor(Math.sqrt(windows.length))

  windows.forEach(async (window, i) => {
    let sqrt = Math.ceil(Math.sqrt(windows.length))
    let col = Math.floor(i % sqrt)
    let row = Math.floor(i / sqrt)
    let { process, title, index } = window

    let windowX = Math.floor((col * width) / sqrt) + x
    let windowY = Math.floor((row * height) / sqrt) + y
    let windowWidth = Math.floor(width / sqrt)
    let windowHeight = Math.floor(height / sqrt)

    // console.log({
    //   process,
    //   title,
    //   index,
    //   sqrt,
    //   col,
    //   row,
    //   windowX,
    //   windowY,
    //   windowWidth,
    //   windowHeight,
    // })
    await setWindowSizeByIndex(
      process,
      index,
      windowWidth,
      windowHeight
    )

    await setWindowPositionByIndex(
      process,
      index,
      windowX,
      windowY
    )
  })
}

global.setWindowPositionByIndex = async (
  process,
  index,
  x,
  y
) => {
  return await applescript(String.raw`
		tell application "System Events"
		set theProcessWindow to window of process "${process}"
		set counter to 0
		repeat with theWindow in theProcessWindow
			if counter as string is "${index}"
				set position of theWindow to {${x}, ${y}}
			end if
			set counter to counter + 1
		end repeat
	end tell`)
}

global.setWindowSize = async (process, title, x, y) => {
  return await applescript(String.raw`
	  tell application "System Events"
	  set theProcessWindow to window of process "${process}"
	  repeat with theWindow in theProcessWindow
		  if name of theWindow contains "${title}" then
			  set size of theWindow to {${x}, ${y}}
			  else
			  set size of item 1 of theProcessWindow to {${x}, ${y}}
		  end if
	  end repeat
  end tell`)
}

global.getScreens = async () =>
  (await global.getDataFromApp(Channel.GET_SCREENS_INFO))
    .displays

global.tileWindow = async (app, leftOrRight) => {
  return await applescript(String.raw`
	tell application "System Events"
	tell process "${app}"
		set frontmost to true
		click menu item "Tile Window to ${leftOrRight} of Screen" of menu "Window" of menu bar 1
	end tell
end tell
	`)
}

global.getActiveScreen = async () =>
  (await global.getDataFromApp(Channel.GET_SCREEN_INFO))
    .activeScreen

global.getMousePosition = async () =>
  (await global.getDataFromApp(Channel.GET_MOUSE))
    .mouseCursor

global.getProcesses = async () =>
  (await global.getDataFromApp(Channel.GET_PROCESSES))
    .processes

global.getPrompts = async () =>
  (await global.getDataFromApp(Channel.GET_PROMPTS)).prompts

global.getKitWindows = async () => {
  let message = await global.getDataFromApp(
    Channel.GET_KIT_WINDOWS
  )

  return message.windows
}

global.focusKitWindow = async (id: string) => {
  return sendWait(Channel.FOCUS_KIT_WINDOW, { id })
}

global.setActiveAppBounds = async ({
  left,
  top,
  right,
  bottom,
}) => {
  await applescript(
    `tell application "System Events"
      set processName to name of first application process whose frontmost is true as text
      tell process processName to set the position of front window to {${left}, ${top}}
      tell process processName to set the size of front window to {${
        right - left
      }, ${bottom - top}}
    end tell`
  )
}
global.setActiveAppPosition = async ({ x, y }) => {
  await applescript(
    `tell application "System Events"
      set processName to name of first application process whose frontmost is true as text
      tell process processName to set the position of front window to {${x}, ${y}}      
    end tell`
  )
}

global.setActiveAppSize = async ({ width, height }) => {
  await applescript(
    `tell application "System Events"
      set processName to name of first application process whose frontmost is true as text
      tell process processName to set the size of front window to {${width}, ${height}}
    end tell`
  )
}

global.getActiveAppInfo = async () =>
  (await global.getDataFromApp(Channel.GET_ACTIVE_APP)).app

global.getActiveAppBounds = async () => {
  let stringBounds = await applescript(String.raw`
  ${utils}

  tell application "System Events"
	set processName to name of first application process whose frontmost is true as text
	tell process processName
		set [x, y] to position of front window
		set [width, height] to size of front window
		
		tell V to addPair("left", x as string)
		tell V to addPair("top", y as string)
		tell V to addPair("right", x + width as string)
		tell V to addPair("bottom", y + height as string)
		tell V to finalizeObject()
		
	end tell
	tell V to finalizeJSON()
end tell

get V's JSON
  `)

  let jsonBounds = JSON.parse(stringBounds)[0]

  return Object.entries(jsonBounds).reduce(
    (acc, [key, value]: [string, string]) => {
      acc[key] = parseInt(value, 10)
      return acc
    },
    {}
  ) as Bounds
}
