let { default: chalkDefault } = await import("chalk");
global.chalk = chalkDefault;
export {};
