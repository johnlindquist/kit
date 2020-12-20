let { default: randomWord } = await need("random-word")
let {} = await need("wordnet-db")
let { WordNet } = await need("natural")

let wordNet = new WordNet()
let words = []

let quiz = async () => {
  let word = words[0]
  await prompt({
    message: chalk.yellow(word.value),
    type: "list",
    choices: _.shuffle(words),
  })

  echo(chalk.yellow(word.value) + ": " + word.name)
}

let gatherWords = () => {
  wordNet.lookup(randomWord(), results => {
    if (results.length) {
      let [{ lemma, def }] = results
      words.push({ name: def, value: lemma })
      if (words.length == 4) {
        quiz()
        return
      }
    }
    gatherWords()
  })
}

gatherWords()
