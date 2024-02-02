import express from "express"
import bodyParser from "body-parser"
import { JSXLoad } from "./loader.js" // Assuming loader.js exports JSXLoad

const app = express()
const port = 3000

// Middleware to parse JSON bodies
app.use(bodyParser.json())

// POST endpoint to handle the module loading
app.get("/import", async (req, res) => {
  const { path } = req.query

  if (!path) {
    return res.status(400).send("URL is required")
  }

  try {
    const transform = await JSXLoad(path)
    res.json(transform)
  } catch (error) {
    res.status(500).send("Error processing the request")
  }
})

app.listen(port, () => {
  console.log(
    `Server listening at http://localhost:${port}`
  )
})
