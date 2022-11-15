// Exclude: true

setPlaceholder(`Loading "show and tell" discussions...`)

let showAndTell = `https://scriptkit.com/api/showandtell`
let getChoices = async () => {
  let choices = memoryMap.get(showAndTell)

  if (choices) return choices

  return memoryMap
    .set(showAndTell, (await get(showAndTell)).data)
    .get(showAndTell)
}

let postChoices = await getChoices()

let url = await arg(`Pick a post to view:`, postChoices)

browse(url)

export {}
