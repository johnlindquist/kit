/*
# New Snippet

Create a new snippet based on the current input
*/

// Name: New Snippet
// Description: Create a new snippet
// Log: false
// Pass: true
// Keyword: ns

let snippet = await template(`// Name: $0`, {
  preview: md(`# Create a New Snippet

## Run a Snippet

Press "s" then space from the main menu to search your snippets.

## Snippet Name

The file name will be inferred from the text following "// Name:". Snippets are saved to _${kenvPath(
    "snippets",
    "your-file-name.txt"
  )}_ 

"//Name: Hello World" will be saved as "hello-world.txt" and appear as "Hello World" in the snippets menu.

> Note: You can create/edit snippets just by adding/editing files in the snippets folder with your favorite editor.

## Tabstops
~~~
$1, $2, $3
~~~

With tabstops, you can make the editor cursor move inside a snippet. Use $1, $2 to specify cursor locations. The number is the order in which tabstops will be visited, whereas $0 denotes the final cursor position. Multiple occurrences of the same tabstop are linked and updated in sync.

## Placeholders
~~~
\${1:one}, \${2:two}, \${3:three}
~~~

Placeholders are tabstops with values, like \${1:foo}. The placeholder text will be inserted and selected such that it can be easily changed. Placeholders can be nested, like \${1:another \${2:placeholder}}.

## Choice
~~~
Script Kit is \${1|awesome,wonderful,amazing|}!
~~~

Placeholders can have choices as values. The syntax is a comma-separated enumeration of values, enclosed with the pipe-character, for example \${1|one,two,three|}. When the snippet is inserted and the placeholder selected, choices will prompt the user to pick one of the values.

## Selected Text and Clipboard

- \$SELECTION will insert the selected text into the snippet.
- \$CLIPBOARD will insert the clipboard contents into the snippet.

## Date, Time, Random, UUID

For inserting the current date and time:

* $CURRENT_YEAR The current year
* $CURRENT_YEAR_SHORT The current year's last two digits
* $CURRENT_MONTH The month as two digits (example '02')
* $CURRENT_MONTH_NAME The full name of the month (example 'July')
* $CURRENT_MONTH_NAME_SHORT The short name of the month (example 'Jul')
* $CURRENT_DATE The day of the month as two digits (example '08')
* $CURRENT_DAY_NAME The name of day (example 'Monday')
* $CURRENT_DAY_NAME_SHORT The short name of the day (example 'Mon')
* $CURRENT_HOUR The current hour in 24-hour clock format
* $CURRENT_MINUTE The current minute as two digits
* $CURRENT_SECOND The current second as two digits
* $CURRENT_SECONDS_UNIX The number of seconds since the Unix epoch
* $CURRENT_TIMEZONE_OFFSET The current UTC time zone offset as +HH:MM or -HH:MM (example -07:00).

For inserting random values:

* $RANDOM 6 random Base-10 digits
* $RANDOM_HEX 6 random Base-16 digits
* $UUID A Version 4 UUID
  `),
})

let name = snippet.match(/\/\/ Name: (.*)/)[1]
name = name.replace(/ /g, "-").toLowerCase() + ".txt"

await writeFile(kenvPath("snippets", name), snippet)

export {}
