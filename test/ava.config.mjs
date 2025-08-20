export default {
  workerThreads: false,
  extensions: {
    ts: "module",
  },
  nodeArguments: ["--import=tsx", "--import=./test/_ava-global-diagnostics.mjs"],
  environmentVariables: {
    KIT_TEST: "true",
  },
  verbose: true,
  timeout: '45s',
  files: ["src/**/*.test.ts", "test/**/*.test.ts"],
}
