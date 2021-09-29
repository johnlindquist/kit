let { default: handlebars }: any = await import(
  "handlebars"
)

global.compile = handlebars.compile

export {}
