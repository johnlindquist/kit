export interface Size {
  // Docs: https://electronjs.org/docs/api/structures/size

  height: number
  width: number
}

export interface Point {
  // Docs: https://electronjs.org/docs/api/structures/point

  x: number
  y: number
}

export interface Rectangle {
  // Docs: https://electronjs.org/docs/api/structures/rectangle

  /**
   * The height of the rectangle (must be an integer).
   */
  height: number
  /**
   * The width of the rectangle (must be an integer).
   */
  width: number
  /**
   * The x coordinate of the origin of the rectangle (must be an integer).
   */
  x: number
  /**
   * The y coordinate of the origin of the rectangle (must be an integer).
   */
  y: number
}

export interface Display {
  // Docs: https://electronjs.org/docs/api/structures/display

  /**
   * Can be `available`, `unavailable`, `unknown`.
   */
  accelerometerSupport:
    | "available"
    | "unavailable"
    | "unknown"
  /**
   * the bounds of the display in DIP points.
   */
  bounds: Rectangle
  /**
   * The number of bits per pixel.
   */
  colorDepth: number
  /**
   *  represent a color space (three-dimensional object which contains all realizable
   * color combinations) for the purpose of color conversions
   */
  colorSpace: string
  /**
   * The number of bits per color component.
   */
  depthPerComponent: number
  /**
   * The display refresh rate.
   */
  displayFrequency: number
  /**
   * Unique identifier associated with the display.
   */
  id: number
  /**
   * `true` for an internal display and `false` for an external display
   */
  internal: boolean
  /**
   * Whether or not the display is a monochrome display.
   */
  monochrome: boolean
  /**
   * Can be 0, 90, 180, 270, represents screen rotation in clock-wise degrees.
   */
  rotation: number
  /**
   * Output device's pixel scale factor.
   */
  scaleFactor: number
  size: Size
  /**
   * Can be `available`, `unavailable`, `unknown`.
   */
  touchSupport: "available" | "unavailable" | "unknown"
  /**
   * the work area of the display in DIP points.
   */
  workArea: Rectangle
  workAreaSize: Size
}
