let installInfo = JSON.parse(await arg())

await post(
  `https://scriptkit.com/api/installs`,
  installInfo
)

export {}
