//Description: Launch a url in Chrome. If url is alerady open, switch to that tab.
let { applescript } = await import("./osx/applescript.js")

applescript(`
set address to "${await arg("Enter url:")}"

tell application "Google Chrome"
    activate
        if not (exists window 1) then reopen
        repeat with w in windows
                set i to 1
                repeat with t in tabs of w
                if URL of t contains address then
                        set active tab index of w to i
                        set index of w to 1
                        return
                end if
                set i to i + 1
                end repeat
        end repeat
        open location \"http://\" & address
end tell
`)
