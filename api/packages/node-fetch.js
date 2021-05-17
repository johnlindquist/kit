let { default: fetch } = (await import("node-fetch"));
global.fetch = fetch;
export {};
