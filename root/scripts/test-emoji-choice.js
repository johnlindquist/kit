// Name: Test Emoji Choices
// Description: Test script demonstrating emoji property in choices
// Emoji: 🧪

const choices = [
  { name: "Happy", value: "happy", emoji: "😊", description: "Feeling good!" },
  { name: "Rocket", value: "rocket", emoji: "🚀", description: "Ready to launch" },
  { name: "Heart", value: "heart", emoji: "❤️", description: "Show some love" },
  { name: "Star", value: "star", emoji: "⭐", description: "You're a star!" },
  { name: "Fire", value: "fire", emoji: "🔥", description: "On fire!" },
  // Mix of emoji and img
  { name: "GitHub", value: "github", emoji: "🐙", img: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png", description: "Code hosting" },
  // Only img
  { name: "Script Kit", value: "scriptkit", img: "https://www.scriptkit.com/logo.png", description: "Automation toolkit" },
  // Neither emoji nor img
  { name: "Plain", value: "plain", description: "No visual indicator" }
]

const selected = await arg("Choose an option with emoji:", choices)

await div(`
# You selected: ${selected}

${choices.find(c => c.value === selected)?.emoji || ""} ${choices.find(c => c.value === selected)?.name}
`)