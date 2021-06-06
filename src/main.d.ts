export interface Main {
  edit: Promise<typeof import("./main/edit")>
  kenv: Promise<typeof import("./main/kenv")>
  kit: Promise<typeof import("./main/kit")>
  hot: Promise<typeof import("./main/hot")>
  index: Promise<typeof import("./main/index")>
  new: Promise<typeof import("./main/new")>
  showandtell: Promise<typeof import("./main/showandtell")>
}
