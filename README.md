# Script Kit App

[https://scriptkit.app/](https://scriptkit.app/)


## Quick Start

    cmd + shift + ;, type new, hit enter.
    Name your script hello-world
    Write the following. Or click this to install it.

let { say } = await kit("speech")
let name = await arg("Enter name:")
say(`Hello, ${name}`)

    cmd+ ; opens the script runner
    select "hello-world", hit enter
    Type your name and hit enter

The browse examples here: https://scriptkit.app/scripts/johnlindquist

## Goals of Script Kit

### Make scripts:

    Easier to write
    Easier to run
    Easier to share

### Easy to write

    Script Kit scripts are written in JavaScript
    Create a new script by cmd+shift+; , type "new", hit enter
    Script Kit launches your editor/enviornment of choices
    Script Kit leverages the npm ecosystem, so you have a world of utilities at your fingertips
    Script Kit ships with many utilities for common tasks with windows, files, text, etc

### Easy to run

    Scripts run from keyboard shortcuts
    Add a shortcut to a script with a comment, e.g., //Shortcut: opt + j
    Scripts also run from the terminal ~/.kenv/bin/hello-world
    Scripts prompt for missing arguments (in both the App and the terminal)
    Provide arguments in the terminal ~/.kenv/bin/hello-world John
    Provide arguments for the app await run("hello-world", "John")
    You can run scripts from any of your favorite tools: Karabiner, Better Touch Tool, Keyboard Maestro, or even Siri shortcuts from your phone

### Easy to share

    cmd+shift+; has a "share as link" option which creates a gist of your script and generates a link like this to "install" your script
    A common language in JavaScript makes it simple to tweak someone else's script
    It's encouraged to cmd+shift+; and duplicate scripts for variations of tasks
    There's no "config", only conventions. So everyone is using the same system.
    npm packages make sharing super complex tasks very simple

There's a lot, lot more that I didn't mention here and this is still a work in progress. But I'm happy to answer any other questions and help your figure out any scripts you may want to write!

## Join the Discussion

[https://github.com/johnlindquist/kit/discussions](https://github.com/johnlindquist/kit/discussions)
