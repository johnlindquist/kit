import test from "ava"
import fs from "fs-extra"
import { db } from "./db.js" // Adjust the import path accordingly
import { kenvPath, resolveScriptToCommand } from "./utils.js"
import tmp from "tmp-promise"

await tmp.withDir(async (dir) => {
	process.env.KENV = dir.path
	console.log(process.env.KENV)
	test.beforeEach(async (t) => {
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
		fruitDb.data.items.push("grape")
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
})
