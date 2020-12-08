#!/usr/bin/env js

let answers = await prompt([
  {
    type: "list",
    name: "theme",
    message: "What do you want to do?",
    choices: ["Order a pizza", "Make a reservation"],
  },
  {
    type: "list",
    name: "size",
    message: "What size do you need?",
    choices: [
      "Jumbo",
      "Large",
      "Standard",
      "Medium",
      "Small",
      "Micro",
    ],
    filter: function (val) {
      return val.toLowerCase()
    },
  },
])

console.log(answers)
