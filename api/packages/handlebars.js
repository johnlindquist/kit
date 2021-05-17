let { default: handlebars } = await import("handlebars");
global.compile = handlebars.compile;
export {};
