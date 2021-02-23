let packageNames = await arg(
  "Which npm package/s would you like to install?"
)

let installNames = [...packageNames.split(" "), ...args]

install([...installNames, ...argOpts])
