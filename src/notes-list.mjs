#!js

let filename = $1.replace(/ /g, "-") + ".md"

let notes = await readdir(process.env.NOTES_PATH)

let out = {
  variables: {
    filename,
  },
  //...(cond ? ['a'] : [])
  items: [
    ...(notes.includes($1 + ".md")
      ? []
      : [
          {
            title: filename,
            arg: $1 + ",create", //
          },
        ]),
    ...notes
      .filter(filename => {
        return $1.length ? filename.includes($1) : true
      })
      .map(filename => ({
        title: filename,
        arg: filename + ",open", //
      })),
  ],
}
console.log(JSON.stringify(out))
