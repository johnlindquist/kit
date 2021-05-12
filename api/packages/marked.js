let { default: marked } = await import("marked");
global.md = string => marked.parse(string);
export {};
