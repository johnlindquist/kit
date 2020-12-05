#!js

import generate from "project-name-generator"

const name = generate({ word: 2, alliterative: true })
  .dashed

console.log(name)

copy(name)
notify(name, "copied to clipboard")
