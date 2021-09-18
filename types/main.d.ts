export interface Main {
  edit: Promise<typeof import("../src/main/edit")>
  help: Promise<typeof import("../src/main/help")>
  hot: Promise<typeof import("../src/main/hot")>
  index: Promise<typeof import("../src/main/index")>
  kenv: Promise<typeof import("../src/main/kenv")>
  kit: Promise<typeof import("../src/main/kit")>
  new: Promise<typeof import("../src/main/new")>
  showandtell: Promise<
    typeof import("../src/main/showandtell")
  >
}

interface MainModuleLoader {
  (
    packageName: keyof Main,
    ...moduleArgs: string[]
  ): Promise<any>
}

interface MainApi {
  main: MainModuleLoader
}

declare global {
  namespace NodeJS {
    interface Global extends MainApi {}
  }

  var main: MainModuleLoader
}
