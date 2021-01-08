let pattern = new RegExp(args[0] || "")

let scripts = ls(env.SIMPLE_SCRIPTS_PATH)
  .toString()
  .split(",")
  .filter(name => name.match(pattern))
  .map(name => name.replace(".js", ""))

scripts.forEach(name => echo(name))
