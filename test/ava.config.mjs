export default {
  extensions: {
    ts: "module",
  },
  nodeArguments: ["--import=tsimp"],
  environmentVariables: {
    KIT_TEST: "true",
  },
  verbose: true,
  files: ["src/**/*.test.ts", "test/**/*.test.ts"],
}
