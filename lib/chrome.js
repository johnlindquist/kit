export let getActiveTab = async () => {
    let result = await applescript(String.raw `tell application "Google Chrome" to return URL of active tab of front window`);
    return result;
};
export let getTabs = async () => {
    let result = await applescript(String.raw `
    on findAndReplaceInText(theText, theSearchString, theReplacementString)
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
		set escapedValue to findAndReplaceInText(value, "\"", "\\\"")
		set Object to Object & ("\"" & key & "\":\"" & escapedValue) & "\","
	end addPair
	
	to finalizeObject()
		set Object to "{" & text 1 thru -2 of Object & "},"
		set JSON to JSON & Object
		set Object to ""
	end finalizeObject
end script

set tabData to ""

tell application "Google Chrome"
	set window_list to every window # get the windows
	
	repeat with the_window in window_list # for every window
		set tab_list to every tab in the_window # get the tabs
		
		repeat with the_tab in tab_list # for every tab
			
			-- set the_url to the URL of the_tab # grab the URL
			V's addPair("url", the URL of the_tab)
			-- set the_title to the title of the_tab # grab the title
			V's addPair("title", the title of the_tab)
			V's finalizeObject()
			
		end repeat
	end repeat
	V's finalizeJSON()
end tell

get V's JSON

    `);
    return JSON.parse(result);
};
export let focusTab = async (url) => {
    return await applescript(String.raw `
set address to "${url}"

tell application "Google Chrome"
    activate
        if not (exists window 1) then reopen
        repeat with w in windows
                set i to 1
                repeat with t in tabs of w
                if URL of t contains address then
                        set active tab index of w to i
                        set index of w to 1
                        return address
                end if
                set i to i + 1
                end repeat
        end repeat
        open location address
        return address
end tell
`);
};
export let openIncognitoTab = async (url) => {
    return await applescript(String.raw`
activate application "Google Chrome"
tell application "System Events" to
    click menu item "New Incognito Window" of
        menu "File" of menu bar 1 of
        application process "Google Chrome"
tell application "Google Chrome" to
    set URL of active tab of
        front window to "${url}"
`)
};
