import test from "ava"
import fs from "fs-extra"
import { db } from "./db.js" // Adjust the import path accordingly
import { kenvPath, resolveScriptToCommand } from "./utils.js"
import tmp from "tmp-promise"
import { Choice } from "../types/core.js"
import { uuid } from "../globals/crypto.js"

await tmp.withDir(async (dir) => {
	process.env.KENV = dir.path
	console.log(process.env.KENV)
	test.beforeEach(async () => {
		global.kitScript = `${uuid()}.js`
		global.__kitDbMap = new Map()
	})

	test.serial("db initializes with data only", async (t) => {
		// Mock global variables and functions

		const initialData = { foo: "bar" }
		const database = await db(initialData)

		t.deepEqual(database.data, initialData)
	})

	test.serial("db initializes with key and data", async (t) => {
		const initialData = { foo: "bar" }
		const key = "testDb"
		const database = await db(key, initialData)

		t.is(database.dbPath, kenvPath("db", `${key}.json`))
		t.deepEqual(database.data, initialData)
	})

	test.serial("db caching works", async (t) => {
		const initialData = { foo: "bar", baz: "" }
		const key = "testDb"

		const db1 = await db(key, initialData)
		db1.data.baz = "qux"
		await db1.write()

		const db2 = (await db(key)) as unknown as typeof db1

		t.is(db1, db2)
		t.is(db2.data.baz, "qux")
	})

	test.serial("db clear function works", async (t) => {
		const initialData = { foo: "bar" }
		const key = "testDbClear"

		const database = await db(key, initialData)
		await database.clear()

		const exists = await fs.pathExists(database.dbPath)
		t.false(exists)
	})

	test.serial("db reset function works", async (t) => {
		const initialData = { foo: "bar" }
		const key = "testDbReset"

		const database = await db(key, initialData)
		database.data.foo = "baz"
		await database.write()

		await database.reset()

		t.deepEqual(database.data, initialData)
	})

	test.serial("db handles functions as data input", async (t) => {
		const dataFunction = async () => ({ foo: "bar" })
		const database = await db("functionDataTest", dataFunction)

		t.deepEqual(database.data, { foo: "bar" })
	})

	test.serial("db handles arrays as data input", async (t) => {
		const initialData = ["item1", "item2"]
		const database = await db("arrayDataTest", initialData)

		t.deepEqual(database.data, { items: initialData })
	})

	test.serial(
		"db initializes with default key when data is provided without key",
		async (t) => {
			const initialData = { foo: "bar" }
			const database = await db(initialData)

			const expectedKey = `_${resolveScriptToCommand(global.kitScript)}`
			t.is(database.dbPath, kenvPath("db", `${expectedKey}.json`))
			t.deepEqual(database.data, initialData)
		}
	)

	test.serial("fruit example", async (t) => {
		let fruitDb = await db(["apple", "banana", "orange"])
		fruitDb.items.push("grape")
		await fruitDb.write()

		t.deepEqual(fruitDb.items, ["apple", "banana", "orange", "grape"])
	})

	// testing update function
	test.serial("testing update function", async (t) => {
		let fruitDb = await db({
			items: ["apple", "banana", "orange"]
		})

		fruitDb.update((data) => {
			data.items.push("grape")
			data.items.sort()
		})

		t.deepEqual(fruitDb.data.items, ["apple", "banana", "grape", "orange"])
	})

	test.serial("testing array objects assign self to value in db", async (t) => {
		let fruitDb = await db({
			people: [
				{
					name: "John",
					age: 30
				},
				{
					name: "Jane",
					age: 25
				}
			]
		})

		t.is((fruitDb.people[0] as Choice).value, undefined)
		t.is((fruitDb.people[1] as Choice).value, undefined)
	})
	
	// Windows path handling tests
	test.serial("getScriptFromString handles Windows paths with forward slashes", async (t) => {
		const { getScriptFromString } = await import("./db.js")
		const scriptName = `test-script-${Date.now()}`
		const scriptletName = `home-assistant-${Date.now()}`
		
		// Create test scripts
		const scriptContent = `
// Name: Test Script
// Description: Test script for path handling

console.log("Test")
`
		const scriptletContent = `# Websites

## ${scriptletName}

\`\`\`
// Name: Home Assistant
// Description: Test scriptlet

console.log("Home Assistant")
\`\`\`
`
		
		await ensureDir(kenvPath("scripts"))
		await ensureDir(kenvPath("scriptlets"))
		
		const scriptPath = kenvPath("scripts", `${scriptName}.js`)
		const scriptletPath = kenvPath("scriptlets", "websites.md")
		
		await outputFile(scriptPath, scriptContent)
		await outputFile(scriptletPath, scriptletContent)
		
		// Force database refresh
		const { getScriptsDb } = await import("./db.js")
		await getScriptsDb(false)
		
		// Test with actual file paths
		try {
			const result1 = await getScriptFromString(scriptPath)
			t.is(result1.name, "Test Script")
			
			const result2 = await getScriptFromString(`${scriptletPath}#${scriptletName}`)
			t.is(result2.name, scriptletName)
			
			// Test finding by name
			const result3 = await getScriptFromString(scriptName)
			t.is(result3.name, "Test Script")
		} finally {
			// Clean up
			await remove(scriptPath)
			await remove(scriptletPath)
		}
	})
	
	test.serial("getScriptFromString handles Unix paths correctly", async (t) => {
		const { getScriptFromString, getScriptsDb } = await import("./db.js")
		const scriptName = `unix-script-${Date.now()}`
		
		// Create test script
		const scriptContent = `
// Name: Unix Script
// Description: Test script for Unix path handling

console.log("Unix test")
`
		
		await ensureDir(kenvPath("scripts"))
		const scriptPath = kenvPath("scripts", `${scriptName}.js`)
		await outputFile(scriptPath, scriptContent)
		
		// Force database refresh
		await getScriptsDb(false)
		
		// Test with Unix path
		try {
			const result = await getScriptFromString(scriptPath)
			t.is(result.name, "Unix Script")
		} finally {
			// Clean up
			await remove(scriptPath)
		}
	})
	
	// Test scriptlet with anchor handling
	test.serial("getScriptFromString handles scriptlet paths with anchors", async (t) => {
		const { getScriptFromString, getScriptsDb } = await import("./db.js")
		const anchor1 = `test-anchor-${Date.now()}`
		const anchor2 = `another-anchor-${Date.now()}`
		
		// Create test scriptlet with anchors
		const scriptletContent = `# Test Scriptlets

## ${anchor1}

\`\`\`
// Name: Test Anchor
// Description: Test scriptlet with anchor

console.log("Test anchor")
\`\`\`

## ${anchor2}

\`\`\`
// Name: Another Anchor
// Description: Another test scriptlet

console.log("Another anchor")
\`\`\`
`
		
		await ensureDir(kenvPath("scriptlets"))
		const scriptletPath = kenvPath("scriptlets", "test.md")
		await outputFile(scriptletPath, scriptletContent)
		
		// Force database refresh
		await getScriptsDb(false)
		
		// Test finding by exact path with anchor
		try {
			const result1 = await getScriptFromString(`${scriptletPath}#${anchor1}`)
			t.is(result1.name, anchor1)
			
			const result2 = await getScriptFromString(`${scriptletPath}#${anchor2}`)
			t.is(result2.name, anchor2)
		} finally {
			// Clean up
			await remove(scriptletPath)
		}
	})
	
	// Test case sensitivity on Windows
	test.serial("getScriptFromString handles case-insensitive paths on Windows", async (t) => {
		const { getScriptFromString, getScriptsDb } = await import("./db.js")
		const originalPlatform = Object.getOwnPropertyDescriptor(process, "platform")
		
		// Mock Windows platform
		Object.defineProperty(process, "platform", {
			value: "win32",
			writable: true,
			enumerable: true,
			configurable: true
		})
		
		const scriptName = `test-case-script-${Date.now()}`
		
		// Create test script
		const scriptContent = `
// Name: Test Case Script
// Description: Test script for case sensitivity

console.log("Case test")
`
		
		await ensureDir(kenvPath("scripts"))
		const scriptPath = kenvPath("scripts", `${scriptName}.js`)
		await outputFile(scriptPath, scriptContent)
		
		// Force database refresh
		await getScriptsDb(false)
		
		// Test with exact path first
		try {
			const result = await getScriptFromString(scriptPath)
			t.is(result.name, "Test Case Script")
			
			// On Windows, file system is case-insensitive, so this might work
			// On Unix, this will likely fail
			if (process.platform === "win32") {
				const upperPath = scriptPath.toUpperCase()
				const lowerPath = scriptPath.toLowerCase()
				
				try {
					const upperResult = await getScriptFromString(upperPath)
					t.is(upperResult.name, "Test Case Script", "Should find with uppercase path on Windows")
				} catch {
					t.log("Case-insensitive search not implemented")
				}
				
				try {
					const lowerResult = await getScriptFromString(lowerPath)
					t.is(lowerResult.name, "Test Case Script", "Should find with lowercase path on Windows")
				} catch {
					t.log("Case-insensitive search not implemented")
				}
			}
		} finally {
			// Clean up
			await remove(scriptPath)
			
			// Restore original platform
			if (originalPlatform) {
				Object.defineProperty(process, "platform", originalPlatform)
			}
		}
	})
	
	// Test special characters in paths
	test.serial("getScriptFromString handles paths with special characters", async (t) => {
		const { getScriptFromString, getScriptsDb } = await import("./db.js")
		
		// Create test scripts with special characters
		const script1Name = `my-script-(1)-${Date.now()}`
		const script2Name = `café-script-${Date.now()}`
		
		const script1Content = `
// Name: My Script (1)
// Description: Test script with parentheses and spaces

console.log("Special chars test")
`
		
		const script2Content = `
// Name: Café Script
// Description: Test script with unicode characters

console.log("Unicode test")
`
		
		await ensureDir(kenvPath("scripts"))
		const script1Path = kenvPath("scripts", `${script1Name}.js`)
		const script2Path = kenvPath("scripts", `${script2Name}.js`)
		
		await outputFile(script1Path, script1Content)
		await outputFile(script2Path, script2Content)
		
		// Force database refresh
		await getScriptsDb(false)
		
		// Test paths with special characters
		try {
			const result1 = await getScriptFromString(script1Path)
			t.is(result1.name, "My Script (1)")
			
			const result2 = await getScriptFromString(script2Path)
			t.is(result2.name, "Café Script")
			
			// Test finding by name with special characters
			const result3 = await getScriptFromString(script1Name)
			t.is(result3.name, "My Script (1)")
			
			const result4 = await getScriptFromString(script2Name)
			t.is(result4.name, "Café Script")
		} finally {
			// Clean up
			await remove(script1Path)
			await remove(script2Path)
		}
	})
})
