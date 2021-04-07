export let lock = async () => {
    return await applescript(String.raw `tell application "System Events" to keystroke "q" using {command down, control down}`);
};
export let sleep = async () => {
    return await applescript(String.raw `tell application "Finder" to sleep`);
};
export let shutdown = async () => {
    return await applescript(String.raw `tell application "Finder" to shut down`);
};
// Example: "AppleScript Editor", "Automator", "Finder", "LaunchBar"
// the quotes, comma and spacing are important
export let quitAllApps = async (appsToExclude = "") => {
    // Credit to clozach on StackOverflow: https://stackoverflow.com/a/44268337/3015595
    const excludeApps = appsToExclude ? `set exclusions to ${appsToExclude}` : "";
    return await applescript(String.raw `
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
    `);
};
