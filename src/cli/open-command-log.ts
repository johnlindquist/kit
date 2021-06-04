let command = await arg("Which script")

edit(kenvPath("logs", `${command}.log`))

export {}
