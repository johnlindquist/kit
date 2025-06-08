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
		// Mock getScripts to return test data
		const { getScriptFromString, getScripts } = await import("./db.js")
		const originalGetScripts = getScripts
		
		// Create mock scripts with Windows paths
		const mockScripts = [
			{
				name: "test-script",
				command: "test-script",
				filePath: "C:\\Users\\josch\\.kenv\\scripts\\test-script.js",
				kenv: "main",
				type: "script"
			},
			{
				name: "Home-Assistant",
				command: "home-assistant",
				filePath: "C:\\Users\\josch\\.kenv\\scriptlets\\websites.md#Home-Assistant",
				kenv: "scriptlets",
				type: "scriptlet"
			}
		]
		
		// Temporarily override getScripts
		const dbModule = require("./db.js")
		dbModule.getScripts = async () => mockScripts
		
		// Test with Windows path using forward slashes (the error case)
		const windowsPathForward = "C:/Users/josch/.kenv/scriptlets/websites.md#Home-Assistant"
		
		try {
			const result = await getScriptFromString(windowsPathForward)
			t.is(result.name, "Home-Assistant")
		} catch (error) {
			t.fail(`Should find script with forward slash Windows path: ${error.message}`)
		}
		
		// Test with Windows path using backslashes
		const windowsPathBack = "C:\\Users\\josch\\.kenv\\scripts\\test-script.js"
		
		try {
			const result = await getScriptFromString(windowsPathBack)
			t.is(result.name, "test-script")
		} catch (error) {
			t.fail(`Should find script with backslash Windows path: ${error.message}`)
		}
		
		// Test finding by name (no path separators)
		try {
			const result = await getScriptFromString("test-script")
			t.is(result.name, "test-script")
		} catch (error) {
			t.fail(`Should find script by name: ${error.message}`)
		}
		
		// Restore original getScripts
		dbModule.getScripts = originalGetScripts
	})
	
	test.serial("getScriptFromString handles Unix paths correctly", async (t) => {
		const { getScriptFromString } = await import("./db.js")
		const dbModule = require("./db.js")
		const originalGetScripts = dbModule.getScripts
		
		// Create mock scripts with Unix paths
		const mockScripts = [
			{
				name: "unix-script",
				command: "unix-script",
				filePath: "/home/user/.kenv/scripts/unix-script.js",
				kenv: "main",
				type: "script"
			}
		]
		
		dbModule.getScripts = async () => mockScripts
		
		// Test with Unix path
		const unixPath = "/home/user/.kenv/scripts/unix-script.js"
		
		try {
			const result = await getScriptFromString(unixPath)
			t.is(result.name, "unix-script")
		} catch (error) {
			t.fail(`Should find script with Unix path: ${error.message}`)
		}
		
		// Restore original getScripts
		dbModule.getScripts = originalGetScripts
	})
})
