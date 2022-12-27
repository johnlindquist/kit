import colors from "color-name"

export const toHex = (hexOrRgbOrName: string) => {
  if (hexOrRgbOrName.includes(",")) {
    const [r, g, b] = hexOrRgbOrName
      .split(",")
      .map(c => parseInt(c, 10))

    const hex = `#${r.toString(16)}${g.toString(
      16
    )}${b.toString(16)}`
    // fill zeros
    return hex.replace(
      /#([0-9a-f])([0-9a-f])([0-9a-f])$/i,
      "#$1$1$2$2$3$3"
    )
  }

  if (colors[hexOrRgbOrName])
    return colors[hexOrRgbOrName].join(",")

  return hexOrRgbOrName
}
