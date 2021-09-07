export interface Main {
  edit: Promise<typeof import("../src/main/edit")>
  kenv: Promise<typeof import("../src/main/kenv")>
  kit: Promise<typeof import("../src/main/kit")>
  hot: Promise<typeof import("../src/main/hot")>
  index: Promise<typeof import("../src/main/index")>
  new: Promise<typeof import("../src/main/new")>
  showandtell: Promise<
    typeof import("../src/main/showandtell")
  >
}
