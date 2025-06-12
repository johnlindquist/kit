# Grid API Orientation

## Overview
The `grid` API displays choices in a grid layout for visual selection interfaces.

## Main Function Definition
Located in `/workspace/sdk/src/target/app.ts`:

```typescript
global.grid = async (
  placeholderOrConfig = "Type something...",
  choices = [],
  actions = []
) => {
  // Displays choices in a grid layout
  // Returns selected choice
}
```

## Channel/UI Type
- **UI Type**: `UI.arg` (with grid mode enabled)
- **Channel**: Standard arg channels with `grid: true` flag

## How It Differs from Similar APIs
- **vs `arg`**: Grid displays choices in columns vs vertical list
- **vs `select`**: Grid is single selection vs multi-selection
- **vs `div`**: Grid is interactive selection vs static display

## Key Features

### 1. Basic Grid Selection
```javascript
// Simple grid of choices
let color = await grid("Choose a color", [
  "Red", "Green", "Blue",
  "Yellow", "Purple", "Orange"
])
```

### 2. Grid with Objects
```javascript
// Rich choice objects
let app = await grid("Select an app", [
  { name: "Chrome", icon: "🌐", value: "chrome" },
  { name: "VS Code", icon: "💻", value: "code" },
  { name: "Terminal", icon: "⬛", value: "terminal" },
  { name: "Finder", icon: "📁", value: "finder" }
])
```

### 3. Configuration Object
```javascript
// Advanced configuration
let result = await grid({
  placeholder: "Select an item",
  columns: 4,  // Number of columns
  height: 400, // Grid height
  itemHeight: 100, // Height of each item
  enter: "Select",
  shortcuts: [/* custom shortcuts */]
}, choices)
```

### 4. With Preview
```javascript
// Grid with preview panel
let file = await grid({
  placeholder: "Choose a file",
  preview: true,
  previewWidthPercent: 40
}, files.map(f => ({
  name: f.name,
  preview: async () => `Size: ${f.size} bytes`
})))
```

## Grid-Specific Features

### Visual Layout
- Items arranged in columns
- Automatic responsive layout
- Consistent item sizing
- Keyboard navigation (arrow keys)

### Navigation
- Arrow keys for grid navigation
- Tab/Shift+Tab for linear navigation
- Enter to select
- Escape to cancel

## Common Choice Properties
- `name` - Display text
- `value` - Return value
- `icon` - Emoji or icon
- `image` - Image URL
- `preview` - Preview content
- `className` - Custom styling

## Best Practices
1. Use for visual/icon-based selection
2. Keep item counts reasonable for performance
3. Use consistent icon/image sizes
4. Provide clear visual distinctions
5. Consider mobile/small screen layouts

## Common Use Cases
- App launchers
- Emoji pickers
- Color palettes
- Icon selection
- File/folder browsers
- Image galleries
- Category selection


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/target/app.ts"
```

This will generate a comprehensive report of all the implementation files for this API.