#!/usr/bin/env js
/**
 * Description: Generate an alliteraive, dashed project name, copies it to the clipboard, and shows a notification
 *
 * Usage:
 * project-name
 */
import generate from "project-name-generator"

const name = generate({ word: 2, alliterative: true })
  .dashed

console.log(name)

copy(name)
notify(name, "copied to clipboard")
