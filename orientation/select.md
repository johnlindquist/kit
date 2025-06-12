# Select API Orientation

## Overview
The `select` API creates a multi-selection interface where users can choose multiple items from a list.

## Main Function Definition
Located in `/workspace/sdk/src/target/app.ts`:

```typescript
global.select = async (
  placeholderOrConfig = "Type something...",
  choices = [],
  actions = []
) => {
  // Multi-select interface
  // Returns array of selected values
}
```

## Channel/UI Type
- **UI Type**: `UI.arg` (with `multiple: true`)
- **Channel**: Standard arg channels with multi-select handling

## How It Differs from Similar APIs
- **vs `arg`**: Select allows multiple selections vs single
- **vs `grid`**: Select uses list layout vs grid layout
- **vs `checkbox`**: Select has search/filter capabilities

## Key Features

### 1. Basic Multi-Select
```javascript
// Select multiple items
let selectedFruits = await select("Choose fruits", [
  "Apple", "Banana", "Orange", 
  "Mango", "Grape", "Strawberry"
])
// Returns: ["Apple", "Orange"] (based on selection)
```

### 2. With Choice Objects
```javascript
// Rich choice objects
let selectedFeatures = await select("Enable features", [
  { name: "Dark Mode", value: "dark", description: "Enable dark theme" },
  { name: "Auto Save", value: "autosave", description: "Save automatically" },
  { name: "Spell Check", value: "spell", description: "Check spelling" }
])
```

### 3. Pre-selected Items
```javascript
// Start with some items selected
let selected = await select({
  placeholder: "Toggle features",
  selected: ["feature1", "feature3"]  // Pre-selected values
}, [
  { name: "Feature 1", value: "feature1" },
  { name: "Feature 2", value: "feature2" },
  { name: "Feature 3", value: "feature3" }
])
```

### 4. Configuration Options
```javascript
// Advanced configuration
let items = await select({
  placeholder: "Select items",
  enter: "Confirm Selection",
  height: 500,
  multiple: true,  // Explicitly set
  shortcuts: [
    {
      key: `${cmd}+a`,
      name: "Toggle All",
      onPress: async () => toggleAllSelectedChoices()
    }
  ]
}, choices)
```

## Built-in Shortcuts
Select includes default shortcuts:
- `Cmd/Ctrl + A` - Toggle all items
- `Cmd/Ctrl + Enter` - Submit selection
- `Space` - Toggle current item
- `Enter` - Toggle item (in some modes)

## Selection Indicators
- Checkboxes or selection indicators
- Visual feedback for selected state
- Count of selected items
- Clear selection states

## Helper Functions
- `toggleAllSelectedChoices()` - Toggle all items
- `setSelectedChoices(choices)` - Set specific selections

## Return Value
Returns an array of selected values:
```javascript
let [option1, option2, option3] = await select("Options", choices)
// or
let allSelected = await select("Options", choices)
// allSelected is an array
```

## Best Practices
1. Provide clear item descriptions
2. Group related items together
3. Show selection count/status
4. Allow keyboard-only operation
5. Consider pre-selecting common options

## Common Use Cases
- Feature toggles
- Permission selection
- File/folder selection
- Tag assignment
- Category filtering
- Batch operations
- Settings configuration


## Repomix Command

To analyze the implementation of this API, you can use the following command to gather all relevant files:

```bash
repomix --include "/workspace/sdk/src/target/app.ts"
```

This will generate a comprehensive report of all the implementation files for this API.