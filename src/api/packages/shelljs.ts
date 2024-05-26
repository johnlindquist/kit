let { default: shelljs }: any = await import("shelljs")
const {
  cp,
  chmod,
  echo,
  exit,
  grep,
  ln,
  ls,
  mkdir,
  mv,
  sed,
  pwd,
  tempdir,
  test,
  which,
} = shelljs

global.cp = cp
global.chmod = chmod
global.echo = echo
global.exit = (code?: number) => {
  if (process?.env?.KIT_TARGET === "app-prompt") {
    global?.send("BEFORE_EXIT" as any)
  }
  process.exit(code)
}
global.grep = grep
global.ln = ln
global.ls = ls
global.mkdir = mkdir
global.mv = mv
global.sed = sed
global.tempdir = tempdir
global.test = test
global.which = which
global.pwd = pwd

export {}
