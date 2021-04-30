#!/usr/bin/swift

import Cocoa

let options = CGWindowListOption(arrayLiteral: .excludeDesktopElements, .optionOnScreenOnly)
let windowsListInfo = CGWindowListCopyWindowInfo(options, CGWindowID(0))
let infoList = windowsListInfo as! [[String:Any]]
let visibleWindows = infoList.filter{ $0["kCGWindowLayer"] as! Int == 0 }

let firstWindow = visibleWindows.first
let bounds = firstWindow?["kCGWindowBounds"]

if
    let bounds = bounds as? [String:Int],
    let jsonData = try? JSONEncoder().encode(bounds),
    let json = String(data: jsonData, encoding: String.Encoding.utf8){
    print(json)

}

