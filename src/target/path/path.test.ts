import ava from "ava"
import fs from "node:fs"
import { createPathChoices, path } from "./path"

// TOOD: Account for all the windows paths
if (process.platform !== "win32") {
	ava.before(() => {
		global.kitPath = (...args) => path.join("/mock", "kit", "path", ...args)
		global.readdir = fs.promises.readdir
		global.path = path // Add this line to ensure path is available globally
	})

	// Helper function to create mock Dirent objects
	function createMockDirent(
		name: string,
		isDirectory: boolean,
		isSymbolicLink = false
	) {
		return {
			name,
			isDirectory: () => isDirectory,
			isSymbolicLink: () => isSymbolicLink,
			path: "/mock/path"
		}
	}

	// Create a file stats object that will be used in our tests
	const createMockStats = (options = {}) => {
		const defaults = {
			size: 1024,
			mtime: new Date()
		};

		const stats = {
			...defaults,
			...options,
			isFile: () => true,
			isDirectory: () => false,
			isBlockDevice: () => false,
			isCharacterDevice: () => false,
			isFIFO: () => false,
			isSocket: () => false,
			isSymbolicLink: () => false,
		};

		return stats;
	};

	ava("createPathChoices - basic functionality", async (t) => {
		const mockDirents = [
			createMockDirent("file1.txt", false),
			createMockDirent("folder1", true),
			createMockDirent("file2.txt", false)
		];

		global.readdir = async () => mockDirents as any;

		// Create a mock stat function to inject
		const mockStatFn = async () => createMockStats() as any;

		const result = await createPathChoices("/mock/path", { statFn: mockStatFn });

		t.is(result.length, 3);
		t.is(result[0].name, "folder1");
		t.is(result[1].name, "file1.txt");
		t.is(result[2].name, "file2.txt");
	});

	ava("createPathChoices - only directories", async (t) => {
		const mockDirents = [
			createMockDirent("file1.txt", false),
			createMockDirent("folder1", true),
			createMockDirent("file2.txt", false),
			createMockDirent("folder2", true)
		];

		global.readdir = async () => mockDirents as any;

		// Create a mock stat function to inject
		const mockStatFn = async () => createMockStats() as any;

		const result = await createPathChoices("/mock/path", {
			onlyDirs: true,
			statFn: mockStatFn
		});

		t.is(result.length, 2);
		t.is(result[0].name, "folder1");
		t.is(result[1].name, "folder2");
	});

	ava("createPathChoices - custom dirFilter", async (t) => {
		const mockDirents = [
			createMockDirent("file1.txt", false),
			createMockDirent("folder1", true),
			createMockDirent("file2.txt", false),
			createMockDirent("folder2", true)
		];

		global.readdir = async () => mockDirents as any;

		// Create a mock stat function to inject
		const mockStatFn = async () => createMockStats() as any;

		const customFilter = (dirent) => dirent.name.includes("2");
		const result = await createPathChoices("/mock/path", {
			dirFilter: customFilter,
			statFn: mockStatFn
		});

		t.is(result.length, 2);
		t.is(result[0].name, "folder2");
		t.is(result[1].name, "file2.txt");
	});

	ava("createPathChoices - custom dirSort", async (t) => {
		const mockDirents = [
			createMockDirent("b.txt", false),
			createMockDirent("a", true),
			createMockDirent("c.txt", false)
		];

		global.readdir = async () => mockDirents as any;

		// Create a mock stat function to inject
		const mockStatFn = async () => createMockStats() as any;

		const customSort = (a, b) => b.name.localeCompare(a.name);
		const result = await createPathChoices("/mock/path", {
			dirSort: customSort,
			statFn: mockStatFn
		});

		t.is(result.length, 3);
		t.is(result[0].name, "c.txt");
		t.is(result[1].name, "b.txt");
		t.is(result[2].name, "a");
	});

	ava("createPathChoices - correct Choice object structure", async (t) => {
		const mockDirents = [
			createMockDirent("file1.txt", false),
			createMockDirent("folder1", true)
		];

		global.readdir = async () => mockDirents as any;

		// Create a mock stat function with specific date
		const mockStatFn = async () => createMockStats({ mtime: new Date("2023-01-01") }) as any;

		const result = await createPathChoices("/mock/path", { statFn: mockStatFn });

		t.is(result.length, 2);

		const folderChoice = result[0];
		t.is(folderChoice.name, "folder1");
		t.is(folderChoice.value, "/mock/path/folder1");
		t.is(folderChoice.description, "");
		t.is(folderChoice.drag, "/mock/path/folder1");
		t.truthy(folderChoice.img && folderChoice.img.startsWith("file:"));
		t.truthy(folderChoice.img && folderChoice.img.endsWith("folder.svg"));

		const fileChoice = result[1];
		t.is(fileChoice.name, "file1.txt");
		t.is(fileChoice.value, "/mock/path/file1.txt");
		t.is(fileChoice.drag, "/mock/path/file1.txt");
		t.truthy(fileChoice.img && fileChoice.img.startsWith("file:"));
		t.truthy(fileChoice.img && fileChoice.img.endsWith("file.svg"));
	});
}
