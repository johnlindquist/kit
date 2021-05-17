export interface Main {
  edit: Promise<typeof import("./main/edit")>
  help: Promise<typeof import("./main/help")>
  hot: Promise<typeof import("./main/hot")>
  index: Promise<typeof import("./main/index")>
  new: Promise<typeof import("./main/new")>
  showandtell: Promise<typeof import("./main/showandtell")>
}
