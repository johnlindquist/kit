let { menu } = await cli("fns")

let { parseExpression } = await npm("cron-parser")
let {
  formatDistanceToNowStrict,
  format,
  compareAsc,
} = await npm("date-fns")

let scriptsCache: Script[] = await menu()

let filePath = await arg(
  "Which script do you want to edit?",
  scriptsCache
    .filter(script => script?.cron)
    .map(script => {
      return {
        script,
        next: parseExpression(script.cron).next().toDate(),
      }
    })
    .sort(({ next: a }, { next: b }) => compareAsc(a, b))
    .map(({ script, next }) => {
      return {
        name: script?.menu || script.command,
        description: `Next in ${formatDistanceToNowStrict(
          next
        )} - ${format(next, "MMM eo, h:mm:ssa ")} - ${
          script.cron
        }`,

        value: script.filePath,
      }
    })
)

edit(filePath, kenvPath())

export {}
