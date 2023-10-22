 # Script Kit 2.0 Release Candidate Notes

## Keywords
Borrowed directly from Alfred, keywords allow you to trigger a script by typing a keyword followed by a space.

A keyword can be a single character or a word. For example, `c` for `clipboard`.

### Built-in Keywords
- `s` - Displays Snippets from your Snippets Directory
- `c` - Displays Clipboard History
- `f` - Find script by searching script contents
- `d` - Define a word
- `kit` - Access t 
- `npm` - Add/remove npm packages
- `spell` - List spelling suggestions for the input
 
 And many others. To see them all, type `keyword` into the Script Kit prompt.

 To create a custom keyword for your own scripts, add:

 ```
 // Keyword: mycustomkeyword
 ```

 If the first prompt is an `await arg()`, it will display the list in the main menu. Otherwise, it will jump to the next prompt.

 Also, if the first prompt is a static list and you shave off the few milliseconds required to load the list from your script, you can cache the list (after the first run) by adding:

 ```
 // Cache: true
 ```

Use caching sparingly, as it's only useful for `// Keyword` and `// Shortcut` where the first prompt is an `arg` with a static list.

## Snippets Directory

In your ~/.kenv/snippets directory, create .txt files you want to use as snippets. For example:
1. Create `~/.kenv/snippets/lorem.txt`
2. Add the following text to the file:
```
// Name: Lorem Ipsum
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
```

The "Lorem Ipsum" snippet will now appear in the Snippets menu using the `s` keyword. Select the snippet will paste it into the current application.

Adding Snippet metadata will allow you to invoke the snippet anywhere on your system. It's a best practice to use a "postfix", such as ",,", to avoid triggering the snippet when you don't want to.
```
// Snippet: lorem,,
```

## Actions
- New modular actions to extend script functionality.

## Previews on All Prompts
- Live previews now available for all input prompts.

## Move kenv
- Ability to relocate the kenv directory as needed.

## onClick and onType Globals
- Global event handlers for click and type events.

## Set Mouse Position
- Control mouse position programmatically.

## Audio Dot
- New audio feedback mechanism.

## Custom TypeScript Loader
- Eliminates the need for file watching when using TypeScript.

## Watch for npm Install
- Auto-detect and reload scripts on `npm install`.

## Custom OSX Window for ignoreBlur
- A specialized OSX window that disregards focus loss events.
