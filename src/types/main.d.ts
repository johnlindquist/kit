export interface Main {
  edit: Promise<typeof import("../main/edit")>
  help: Promise<typeof import("../main/help")>
  hot: Promise<typeof import("../main/hot")>
  index: Promise<typeof import("../main/index")>
  kenv: Promise<typeof import("../main/kenv")>
  kit: Promise<typeof import("../main/kit")>
  new: Promise<typeof import("../main/new")>
  showandtell: Promise<typeof import("../main/showandtell")>
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
