export {}

copy(`~/.kit/bin/kit sync-path`)

await div(
  md(`
Run the following command in your terminal:
(already copied to clipboard)

~~~bash
~/.kit/bin/kit sync-path
~~~
`),
  `p-4`
)
