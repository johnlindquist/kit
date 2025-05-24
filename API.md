# API

## arg

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

The most common prompt for accepting user input.

### Details

1. The first argument is a string or a prompt configuration object.
2. The second argument is a list of choices, a string to render, or a function that returns choices or a string to render.

### arg Hello World

```js
let value = await arg()
```

### A Basic String Input

```js
let name = await arg("Enter your name")
```

### arg with Choices Array

```js
let name = await arg("Select a name", [
  "John",
  "Mindy",
  "Joy",
])
```

### arg with Async Choices

```js
let name = await arg("Select a name", async () => {
    let response = await get("https://swapi.dev/api/people/");
    return response?.data?.results.map((p) => p.name);
})
```

### arg with Async Choices Object

```js
let person = await arg("Select a person", async () => {
    let response = await get("https://swapi.dev/api/people/");
    // return an array of objects with "name", "value", and "description" properties
    return response?.data?.results.map((person) => { 
        return {
            name: person.name,
            description: person.url,
            value: person
        }
    });
})
```

### arg with Generated Choices

```js
let char = await arg("Type then pick a char", (input) => { 
    // return an array of strings
    return input.split("")
})
```

### arg with Shortcuts

```js
let url = "https://swapi.dev/api/people"
let name = await arg({
    placeholder: "Select a name",
    shortcuts: [
        {
            name: "Explore API",
            key: "cmd+e",
            onPress: async () => { 
                open(url)
            },
            bar: "right"
        }
    ]
}, async () => { 
    let response = await get(url);
    return response?.data?.results.map((p) => p.name);
})
```

## div

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

`div` displays HTML. Pass a string of HTML to `div` to render it. `div` is commonly used in conjunction with `md` to render markdown.

### Details

1. Just like arg, the first argument is a string or a prompt configuration object.
2. Optional:The second argument is a string of tailwind class to apply to the container, e.g., `bg-white p-4`.


### div Hello World

```js
await div(`Hello world!`)
```

### div with Markdown

```js
await div(md(`
# Hello world!

## Thanks for coming to my demo
* This is a list
* This is another item
* This is the last item

`))
```

### div with Tailwind Classes

```js
await div(`Hello world!`, `bg-white text-black text-4xl p-4`)
```

### div with Submit Links

```js
let name = await div(md(`# Pick a Name
* [John](submit:John)
* [Mindy](submit:Mindy)
* [Joy](submit:Joy)
`))

await div(md(`# You selected ${name}`))
```

## dev

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

`dev` Opens a standalone instance of Chrome Dev Tools so you can play with JavaScript in the console. Passing in an object will set the variable `x` to your object in the console making it easy to inspect.

### Details

1. Optional: the first argument is an object to set to the variable `x` to in the console.

### dev Hello World

```js
dev()
```

### dev with Object

```js
dev({
    name: "John",
    age: 40
})
```

## editor

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

The `editor` function opens a text editor with the given text. The editor is a full-featured "Monaco" editor with syntax highlighting, find/replace, and more. The editor is a great way to edit or update text to write a file. The default language is markdown.


### editor Hello World

```js
let content = await editor()
```

### editor with Initial Content

```js
let content = await editor("Hello world!")
```

### Load Remote Text Content into Editor

```js
let response = await get(`https://raw.githubusercontent.com/johnlindquist/kit/main/API.md`)

let content = await editor(response.data)
```

## term

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

The `term` function opens a terminal window. The terminal is a full-featured terminal, but only intended for running commands and CLI tools that require user input. `term` is not suitable for long-running processes (try `exec` instead).

### Details

1. Optional: the first argument is a command to run with the terminal

### term Hello World

```js
await term()
```

### term with Command

```js
await term(`cd ~/.kenv/scripts && ls`)
```

## template

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

The `template` prompt will present the editor populated by your template. You can then tab through each variable in your template and edit it. 

### Details

1. The first argument is a string template. Add variables using $1, $2, etc. You can also use \${1:default value} to set a default value.

### Template Hello World

```js
let text = await template(`Hello $1!`)
```

### Standard Usage

```js
let text = await template(`
Dear \${1:name},

Please meet me at \${2:address}

    Sincerely, John`)
```

## hotkey

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

The `hotkey` prompt allows you to press modifier keys, then submits once you've pressed a non-monodifier key. For example, press `command` then `e` to submit key info about the `command` and `e` keys:

```json
{
  "key": "e",
  "command": true,
  "shift": false,
  "option": false,
  "control": false,
  "fn": false,
  "hyper": false,
  "os": false,
  "super": false,
  "win": false,
  "shortcut": "command e",
  "keyCode": "KeyE"
}
```

This can be useful when you want to use a palette of commands and trigger each of them by switching on a hotkey.

### Details

1. Optional: The first argument is a string to display in the prompt.


### hotkey Hello World

```js
let keyInfo = await hotkey()
await editor(JSON.stringify(keyInfo, null, 2))
```

## drop

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

Use `await drop()` to prompt the user to drop a file or folder.

### drop Hello World

```js
// Note: Dropping one or more files returns an array of file information
// Dropping text or an image from the browser returns a string
let fileInfos = await drop()

let filePaths = fileInfos.map(f => f.path).join(",")

await div(md(filePaths))
```

## fields

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

The `fields` prompt allows you to rapidly create a form with fields. 

### Details

1. An array of labels or objects with label and field properties.

### fields Hello World

```js
let [first, last] = await fields(["First name", "Last name"])
```


### fields with Field Properties

```js
let [name, age] = await fields([
    {
        name: "name",
        label: "Name",
        type: "text",
        placeholder: "John"
    },
    {
        name: "age",
        label: "Age",
        type: "number",
        placeholder: "40"
    }
])
```

## selectFile

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

Prompt the user to select a file using the Finder dialog:

```js
let filePath = await selectFile()
```

## selectFolder

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

Prompt the user to select a folder using the Finder dialog:

```js
let folderPath = await selectFolder()
```

## widget

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

A `widget` creates a new window using HTML. The HTML can be styled via [Tailwind CSS](https://tailwindcss.com/docs/utility-first) class names.
Templating and interactivity can be added via [petite-vue](https://github.com/vuejs/petite-vue).

### Details

1. The first argument is a string of HTML to render in the window.
2. Optional: the second argument is ["Browser Window Options"](https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions)

### widget Hello World

```js
await widget(`<h1 class="p-4 text-4xl">Hello World!</h1>`)
```

### widget Clock

```js
let clock = await widget(`<h1 class="text-7xl p-5 whitespace-nowrap">{{date}}</h1>`, {
    transparent: true,
    draggable: true,
    hasShadow: false,
    alwaysOnTop: true,
})

setInterval(()=> {
    clock.setState({
        date: new Date().toLocaleTimeString()
    })
}, 1000)
```

### widget Events

```js

let text = ""
let count = 0

let w = await widget(`
<div class="p-5">
    <h1>Widget Events</h1>
    <input autofocus type="text" class="border dark:bg-black"/>
    <button id="myButton" class="border px-2 py-1">+</button>
    <span>{{count}}</span>    
</div>
`)

w.onClick((event) => {
    if (event.targetId === "myButton") {
        w.setState({count: count++})
    }
})

w.onClose(async () => {
    await widget(`
<div class="p-5">
    <h1>You closed the other widget</h1>
    <p>${text}</p>
</div>
`)
})

w.onInput((event) => {
    text = event.value
})

w.onMoved(({ x, y}) => {
    // e.g., save position
})

w.onResized(({ width, height }) => {
    // e.g., save size
})
```


## path

The `path` prompt allows you to select a file or folder from the file system. You navigate with tab/shift+tab (or right/left arrows) and enter to select.

### Details

1. Optional: The first argument is the initial directory to open with. Defaults to the home directory.


### path Hello World

```js
let selectedFile = await path()
```

## ai

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

Simple wrapper around AI SDK for text generation with system prompts. Returns a function that takes user input and resolves to the AI's text response.

### Details

1. The first argument is a string system prompt that defines the AI's behavior and context.
2. Optional: The second argument is a configuration object with model, temperature, and maxTokens options.

### ai Hello World

```js
const translate = ai("Translate to French")
const result = await translate("Hello world!")
// Returns: "Bonjour le monde!"
```

### ai with Custom Model

```js
const coder = ai("You are a helpful coding assistant", {
  model: "gpt-4o-mini",
  temperature: 0.3,
  maxTokens: 500
})
const explanation = await coder("Explain how async/await works in JavaScript")
```

### ai with Provider Swapping

```js
import { anthropic } from '@ai-sdk/anthropic'

const creative = ai("You are a creative writer", {
  model: anthropic('claude-3-5-sonnet-20241022'),
  temperature: 0.9
})
const story = await creative("Write a short story about robots")
```

**Example Script:** [`ai-basic-text-generation.js`](scripts/ai-basic-text-generation.js) | [`ai-provider-swapping.js`](scripts/ai-provider-swapping.js)

## ai.object

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

Generates a structured JavaScript object based on a Zod schema and a prompt. Perfect for extracting structured data from unstructured text.

### Details

1. The first argument is a string prompt or array of messages.
2. The second argument is a Zod schema that defines the expected output structure.
3. Optional: The third argument is a configuration object with model and generation options.

### ai.object Hello World

```js
import { z } from 'zod'

const personSchema = z.object({
  name: z.string(),
  age: z.number(),
  occupation: z.string()
})

const person = await ai.object(
  "Extract person info: John is a 30-year-old software engineer",
  personSchema
)
// Returns: { name: "John", age: 30, occupation: "software engineer" }
```

### ai.object with Complex Schema

```js
import { z } from 'zod'

const sentimentSchema = z.object({
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  confidence: z.number().min(0).max(1),
  reasons: z.array(z.string()).describe("Specific words or phrases that indicate the sentiment")
})

const analysis = await ai.object(
  "Analyze sentiment: I absolutely love this new product!",
  sentimentSchema
)
// Returns: { sentiment: 'positive', confidence: 0.95, reasons: ['absolutely love'] }
```

**Example Script:** [`ai-object-generation.js`](scripts/ai-object-generation.js)

## assistant

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

Create an AI assistant that maintains conversation context and history, supports tool calling, and provides detailed interaction results.

### Details

1. The first argument is a string system prompt that defines the assistant's behavior.
2. Optional: The second argument is a configuration object with model, tools, and behavior options.

### assistant Hello World

```js
const chatbot = assistant("You are a helpful assistant")

chatbot.addUserMessage("Hello!")
const response = await chatbot.generate()
console.log(response.text) // AI's response
```

### assistant with Tools

```js
import { z } from 'zod'

const helper = assistant("You are a helpful assistant", {
  tools: {
    getCurrentWeather: {
      description: "Get the current weather for a location",
      parameters: z.object({ 
        location: z.string().describe("The city to get weather for") 
      }),
      execute: async ({ location }) => {
        return `The weather in ${location} is sunny, 22°C`
      }
    }
  },
  autoExecuteTools: true
})

helper.addUserMessage("What's the weather in Paris?")
const response = await helper.generate()
// Tools are automatically executed and results included in response
```

### assistant with Streaming

```js
const writer = assistant("You are a creative writer")
writer.addUserMessage("Write a short story about space exploration")

// Stream text in real-time
for await (const chunk of writer.textStream) {
  process.stdout.write(chunk)
}

// Check for tool calls after streaming
if (writer.lastInteraction?.toolCalls) {
  console.log("Tools were called:", writer.lastInteraction.toolCalls)
}
```

### assistant Conversation Management

```js
const chat = assistant("You are a helpful assistant")

// Add different types of messages
chat.addUserMessage("What is 2 + 2?")
chat.addSystemMessage("Please be very concise")
chat.addAssistantMessage("2 + 2 = 4")
chat.addUserMessage("What about 3 + 3?")

// Access full conversation history
console.log(chat.messages) // Array of all messages

// Generate response
const response = await chat.generate()
```

**Example Scripts:** [`ai-assistant-with-tools.js`](scripts/ai-assistant-with-tools.js) | [`ai-streaming-example.js`](scripts/ai-streaming-example.js) | [`ai-advanced-multi-step.js`](scripts/ai-advanced-multi-step.js)

## AI Practical Examples

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

Real-world applications combining multiple AI features for practical automation and analysis tasks.

### AI Code Reviewer

A comprehensive code review system that combines `assistant`, `ai.object`, and custom tools to analyze code quality, security, and performance.

```js
import { z } from 'zod'

// Define structured output for code review
const codeReviewSchema = z.object({
  overallRating: z.number().min(1).max(10),
  issues: z.array(z.object({
    type: z.enum(['bug', 'performance', 'style', 'security']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string(),
    suggestion: z.string()
  })),
  recommendations: z.array(z.string())
})

// Create AI reviewer with specialized tools
const reviewer = assistant("Expert code reviewer", {
  tools: {
    checkSecurity: {
      description: "Scan for security vulnerabilities",
      parameters: z.object({ code: z.string() }),
      execute: async ({ code }) => {
        // Custom security analysis logic
        return "Security analysis results..."
      }
    }
  },
  autoExecuteTools: true
})

// Analyze code with AI tools and structured output
reviewer.addUserMessage(`Review this code: ${codeToReview}`)
const analysis = await reviewer.generate()

const structured = await ai.object(
  "Create structured review based on analysis",
  codeReviewSchema
)
```

### Key Features Demonstrated

- **Multi-Modal AI**: Combines conversational AI with structured data extraction
- **Tool Integration**: Custom tools for specialized analysis (security, performance, complexity)
- **Structured Output**: Zod schemas ensure consistent, typed results
- **Real-Time Processing**: Streaming for immediate feedback
- **Provider Flexibility**: Works with any AI provider (OpenAI, Anthropic, Google, etc.)

**Example Script:** [`ai-code-reviewer.js`](scripts/ai-code-reviewer.js)

## Advanced AI Examples

<!-- value: https://github.com/johnlindquist/kit/blob/main/API.md -->

Advanced patterns and real-world applications demonstrating sophisticated AI capabilities.

### Conversation Memory and Context

Maintain persistent memory across conversations and adapt responses based on learned user preferences.

```js
import { z } from 'zod'

const memorySchema = z.object({
  user_preferences: z.object({
    communication_style: z.enum(['formal', 'casual', 'technical']),
    topics_of_interest: z.array(z.string()),
    preferred_response_length: z.enum(['brief', 'detailed', 'comprehensive'])
  }),
  user_profile: z.object({
    name: z.string().optional(),
    profession: z.string().optional(),
    expertise_areas: z.array(z.string())
  })
})

const memoryBot = assistant("You remember user preferences and adapt responses", {
  tools: {
    updateMemory: {
      description: "Update what you remember about the user",
      parameters: z.object({
        memory_type: z.enum(['preference', 'fact', 'context']),
        key: z.string(),
        value: z.string()
      }),
      execute: async ({ memory_type, key, value }) => {
        return `Memory updated: ${memory_type}:${key} = ${value}`
      }
    },
    recallMemory: {
      description: "Recall specific information about the user",
      parameters: z.object({ query: z.string() }),
      execute: async ({ query }) => {
        // Implement memory retrieval logic
        return "Retrieved relevant user information"
      }
    }
  },
  autoExecuteTools: true
})

// Extract conversation insights
let memoryData = await ai.object(conversationText, memorySchema.partial())
```

### Error Handling and Recovery

Implement robust error handling with graceful degradation and recovery strategies.

```js
const resilientBot = assistant("Handle errors gracefully", {
  tools: {
    unstableNetworkCall: {
      description: "Network request that might fail",
      parameters: z.object({ url: z.string() }),
      execute: async ({ url }) => {
        if (Math.random() < 0.5) {
          throw new Error("Network timeout")
        }
        return { data: "Success", status: 200 }
      }
    },
    fallbackStrategy: {
      description: "Provide alternative when tools fail",
      parameters: z.object({
        failed_operation: z.string(),
        error_details: z.string()
      }),
      execute: async ({ failed_operation, error_details }) => {
        return {
          strategy: "Use cached data or offline mode",
          recommendation: "Alternative approach for the failed operation"
        }
      }
    }
  },
  autoExecuteTools: true
})

// The assistant will automatically handle tool failures and provide alternatives
resilientBot.addUserMessage("Fetch data and handle any network issues")
const result = await resilientBot.generate()
```

### Performance Monitoring and Optimization

Track performance metrics, costs, and optimize AI application efficiency.

```js
class PerformanceMonitor {
  constructor() {
    this.metrics = []
  }
  
  recordMetrics(result) {
    return {
      tokens: result.usage?.totalTokens || 0,
      cost: this.calculateCost(result.usage),
      duration: Date.now() - this.startTime
    }
  }
  
  calculateCost(usage) {
    const inputCost = (usage.promptTokens / 1000) * 0.0025
    const outputCost = (usage.completionTokens / 1000) * 0.010
    return inputCost + outputCost
  }
}

const monitor = new PerformanceMonitor()
const optimizedBot = assistant("Performance-aware assistant", {
  tools: {
    analyzePerformance: {
      description: "Analyze metrics and suggest optimizations",
      parameters: z.object({ metrics_data: z.string() }),
      execute: async ({ metrics_data }) => {
        const metrics = JSON.parse(metrics_data)
        return {
          suggestions: ["Optimize prompts", "Use faster model for simple tasks"],
          efficiency: metrics.tokens_per_second > 50 ? "Good" : "Needs improvement"
        }
      }
    }
  }
})

// Monitor performance across requests
monitor.startTracking()
const result = await optimizedBot.generate()
const metrics = monitor.recordMetrics(result)
```

**Example Scripts:** [`ai-conversation-memory.js`](scripts/ai-conversation-memory.js) | [`ai-error-recovery.js`](scripts/ai-error-recovery.js) | [`ai-performance-monitoring.js`](scripts/ai-performance-monitoring.js)

## Missing Something?

<!-- enter: Update Docs -->
<!-- value: download-md.js -->

These API docs are definitely incomplete and constantly evolving. If you're missing something, [suggest an edit](https://github.com/johnlindquist/kit/blob/main/API.md) to the docs or open an issue on GitHub. 

Press <kbd>Enter</kbd> to download the latest docs.