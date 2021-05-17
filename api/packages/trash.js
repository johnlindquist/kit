let { default: trash } = (await import("trash"));
global.trash = trash;
global.rm = trash;
export {};
