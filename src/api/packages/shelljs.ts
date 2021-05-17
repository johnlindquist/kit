let { default: shelljs }: any = await import("shelljs")
const {
  cd,
  cp,
  chmod,
  echo,
  exec,
  exit,
  grep,
  ln,
  ls,
  mkdir,
  mv,
  sed,
  tempdir,
  test,
  which,
} = shelljs

global.cd = cd
global.cp = cp
global.chmod = chmod
global.echo = echo
global.exec = exec
global.exit = exit
global.grep = grep
global.ln = ln
global.ls = ls
global.mkdir = mkdir
global.mv = mv
global.sed = sed
global.tempdir = tempdir
global.test = test
global.which = which

export {}
