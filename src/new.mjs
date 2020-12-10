#!/usr/bin/env js
/**
 * Description: Creates a new empty script you can invoke from the terminal
 *
 * Usage:
 * new my-first-script
 */
let name = await arg()
createScript(name)
