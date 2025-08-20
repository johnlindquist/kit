export default {
  workerThreads: false,
  extensions: {
    ts: "module",
  },
  nodeArguments: ["--import=tsx", "--import=./test/setup.js"],
  environmentVariables: {
    KIT_TEST: "true",
  },
  verbose: true,
  files: ["src/**/*.test.ts", "test/**/*.test.ts"],
}
