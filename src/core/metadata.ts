import { Identifier, Parser, Program, Property, SpreadElement, TemplateLiteral } from "acorn"
import { Metadata, ScriptMetadata } from "../types/core"
import tsPlugin from "acorn-typescript"
import { ProcessType } from "./enum.js"
import untildify from "untildify"
import { friendlyShortcut, shortcutNormalizer } from "./shortcuts.js"

const getMetadataFromComments = (
  contents: string
): Record<string, string> => {
  const lines = contents.split("\n")
  const metadata = {}
  let commentStyle = null
  let spaceRegex = null
  let inMultilineComment = false
  let multilineCommentEnd = null

  const setCommentStyle = (style: string) => {
    commentStyle = style
    spaceRegex = new RegExp(`^${commentStyle} ?[^ ]`)
  }

  for (const line of lines) {
    // Check for the start of a multiline comment block
    if (
      !inMultilineComment &&
      (line.trim().startsWith("/*") ||
        line.trim().startsWith("'''") ||
        line.trim().startsWith("\"\"\"") ||
        line.trim().match(/^: '/))
    ) {
      inMultilineComment = true
      multilineCommentEnd = line.trim().startsWith("/*")
        ? "*/"
        : line.trim().startsWith(": '")
          ? "'"
          : line.trim().startsWith("'''")
            ? "'''"
            : "\"\"\""
    }

    // Check for the end of a multiline comment block
    if (
      inMultilineComment &&
      line.trim().endsWith(multilineCommentEnd)
    ) {
      inMultilineComment = false
      multilineCommentEnd = null
      continue // Skip the end line of a multiline comment block
    }

    // Skip lines that are part of a multiline comment block
    if (inMultilineComment) continue

    // Determine the comment style based on the first encountered comment line
    if (commentStyle === null) {
      if (
        line.startsWith("//") &&
        (line[2] === " " || /[a-zA-Z]/.test(line[2]))
      ) {
        setCommentStyle("//")
      } else if (
        line.startsWith("#") &&
        (line[1] === " " || /[a-zA-Z]/.test(line[1]))
      ) {
        setCommentStyle("#")
      }
    }

    // Skip lines that don't start with the determined comment style
    if (
      commentStyle === null ||
      (commentStyle && !line.startsWith(commentStyle))
    )
      continue

    // Check for 0 or 1 space after the comment style
    if (!line.match(spaceRegex)) continue

    // Find the index of the first colon
    const colonIndex = line.indexOf(":")
    if (colonIndex === -1) continue

    // Extract key and value based on the colon index
    let key = line
      .substring(commentStyle.length, colonIndex)
      .trim()

    if (key?.length > 0) {
      key = key[0].toLowerCase() + key.slice(1)
    }
    const value = line.substring(colonIndex + 1).trim()

    // Skip empty keys or values
    if (!key || !value) {
      continue
    }

    let parsedValue: string | boolean | number
    let lowerValue = value.toLowerCase()
    let lowerKey = key.toLowerCase()
    switch (true) {
      case lowerValue === "true":
        parsedValue = true
        break
      case lowerValue === "false":
        parsedValue = false
        break
      case lowerKey === "timeout":
        parsedValue = parseInt(value, 10)
        break
      default:
        parsedValue = value
    }

    // Only assign if the key hasn't been assigned before
    if (!(key in metadata)) {
      metadata[key] = parsedValue
    }
  }

  return metadata
}

export function parseTypeScript(code: string) {
  const parser = Parser.extend(
    // @ts-expect-error Somehow these are not 100% compatible
    tsPlugin({ allowSatisfies: true })
  )
  return parser.parse(code, {
    sourceType: "module",
    ecmaVersion: "latest"
  })
}

function isOfType<
  T extends { type: string },
  TType extends string
>(node: T, type: TType): node is T & { type: TType } {
  return node.type === type
}

const SHORTCUT_ALLOWED_LITERALS = ["cmd", "ctrl", "opt"]
const templateLiteralAsStringOrFail = (key: string, value: TemplateLiteral) => {
  if (key !== "shortcut") {
    throw Error(`Template strings are only allowed for the shortcut metadata with ${SHORTCUT_ALLOWED_LITERALS.join(", ")}`)
  }

  if (!value.expressions.every(x => x.type === "Identifier")) {
    throw Error(`Encountered a template expression that is not an identifier: ` +
      `${JSON.stringify(value.expressions, null, 2)}`)
  }

  const expressions = value.expressions as Identifier[]

  const invalidExpressions = value.expressions.filter(exp =>
    isOfType(exp, "Identifier") &&
    !SHORTCUT_ALLOWED_LITERALS.includes(exp.name)
  )

  if (invalidExpressions.length > 0) {
    throw Error(`Template strings are only allowed for the literals ${SHORTCUT_ALLOWED_LITERALS.join(", ")},` +
      `but encountered ${invalidExpressions.join(", ")}`)
  }

  let parts = []
  value.quasis.forEach((element, index) => {
    parts.push(element.value.cooked);
    if (index < expressions.length) {
      parts.push(expressions[index].name);
    }
  });

  return parts.join("")
}

const extractMetadataFromObjectExpression = (properties: (Property | SpreadElement)[]) =>
  properties.reduce((acc, prop) => {
    if (!isOfType(prop, "Property")) {
      throw Error(`Entry in ObjectExpression is not a property, but a '${prop.type}'.`)
    }

    const key = prop.key
    const value = prop.value

    if (!isOfType(key, "Identifier")) {
      throw Error("Key is not an Identifier")
    }

    switch (value.type) {
      case 'Literal':
        acc[key.name] = value.value ?? value.raw // RegExp requires the raw value
        break
      case 'TemplateLiteral':
        acc[key.name] = templateLiteralAsStringOrFail(key.name, value)
        warn(`Template literal: ${templateLiteralAsStringOrFail(key.name, value)}`)
        break
      default:
        throw Error(
          `Value is not a Literal, but a ${value.type}`
        )
    }

    return acc
  }, {})

function getMetadataFromExport(
  ast: Program
): Partial<Metadata> {

  for (const node of ast.body) {
    if (
      !isOfType(node, "ExportNamedDeclaration") ||
      !node.declaration
    ) {
      continue
    }

    const declaration = node.declaration

    if (
      declaration.type !== "VariableDeclaration" ||
      !declaration.declarations[0]
    ) {
      continue
    }

    const namedExport = declaration.declarations[0]

    if (
      !("name" in namedExport.id) ||
      namedExport.id.name !== "metadata"
    ) {
      continue
    }

    if (namedExport.init?.type !== "ObjectExpression") {
      continue
    }

    return extractMetadataFromObjectExpression(namedExport.init?.properties)
  }

  // Nothing found
  return {}
}

function getMetadataFromGlobalAssignment(
  ast: Program
): Partial<Metadata> {
  for (const node of ast.body) {
    if (
      !isOfType(node, "ExpressionStatement") ||
      !node.expression ||
      !isOfType(node.expression, "AssignmentExpression")
    ) {
      continue
    }

    const { left, right } = node.expression

    if (!isOfType(left, "Identifier") || left.name !== "metadata") {
      continue
    }

    if (!isOfType(right, "ObjectExpression")) {
      continue
    }

    return extractMetadataFromObjectExpression(right.properties)
  }

  // Nothing found
  return {}
}

const METADATA_EXPORT_PATTERN = /^\s*export\s*(const|var|let)\s*metadata/gm
const METADATA_GLOBAL_ASSIGNMENT_PATTERN = /^\s*metadata\s*=\s*\{/gm

//app
export const getMetadata = (
  contents: string,
  filePath: string = undefined
): Metadata => {
  const fromComments = getMetadataFromComments(contents)

  // RegExps are stateful
  METADATA_EXPORT_PATTERN.lastIndex = 0
  METADATA_GLOBAL_ASSIGNMENT_PATTERN.lastIndex = 0

  const hasMetadataExport = METADATA_EXPORT_PATTERN.test(contents)
  const hasMetadataGlobalAssignment = METADATA_GLOBAL_ASSIGNMENT_PATTERN.test(contents)

  if (
    !hasMetadataExport &&
    !hasMetadataGlobalAssignment
  ) {
    // No convention-based metadata in file, return early
    return fromComments
  }

  let ast: Program
  try {
    ast = parseTypeScript(contents)
  } catch (err) {
    filePath && warn(`Unable to generate AST for file at '${filePath}'`, err)
    // TODO: May wanna introduce some error handling here. In my script version, I automatically added an error
    //  message near the top of the user's file, indicating that their input couldn't be parsed...
    //  acorn-typescript unfortunately doesn't support very modern syntax, like `const T` generics.
    //  But it works in most cases.
    return fromComments
  }

  try {
    const fromCode: Partial<Metadata> = hasMetadataExport
      ? getMetadataFromExport(ast)
      : getMetadataFromGlobalAssignment(ast)

    if (filePath && Object.keys(fromCode).length === 0) {
      warn(`Convention-based metadata came back empty for file at '${filePath}'.`)
    }

    return { ...fromComments, ...fromCode }
  } catch (err) {
    filePath && warn(`Unable to parse metadata for file at '${filePath}'.`, err.toString())
    return fromComments
  }
}

//app
export let postprocessMetadata = (
  metadata: Metadata,
  fileContents: string
): ScriptMetadata => {
  const {pass, ...scriptMetadata} = metadata;

  const result: Partial<ScriptMetadata> = {
    ...scriptMetadata,
  }

  if (pass !== undefined) {
    result.pass = pass
    ? typeof pass === "boolean"
      ? pass
      : pass.toString()
    : false
  }


  if (metadata.shortcut) {
    result.shortcut = shortcutNormalizer(metadata.shortcut)

    result.friendlyShortcut = friendlyShortcut(
      metadata.shortcut
    )
  }

  if (metadata.shortcode) {
    result.shortcode = metadata.shortcode
      ?.trim()
      ?.toLowerCase()
  }

  if (metadata.trigger) {
    result.trigger = metadata.trigger?.trim()?.toLowerCase()
  }

  // An alias brings the script to the top of the list
  if (metadata.alias) {
    result.alias = metadata.alias?.trim().toLowerCase()
  }

  if (metadata.image) {
    result.img = untildify(metadata.image)
  }

  result.type = metadata.schedule
    ? ProcessType.Schedule
    : result?.watch
      ? ProcessType.Watch
      : result?.system
        ? ProcessType.System
        : result?.background
          ? ProcessType.Background
          : ProcessType.Prompt

  let tabs =
    fileContents.match(
      new RegExp(`(?<=^onTab[(]['"]).+?(?=['"])`, "gim")
    ) || []

  if (tabs?.length) {
    result.tabs = tabs
  }

  let hasPreview = Boolean(
    fileContents.match(/preview(:|\s{0,1}=)/gi)?.[0]
  )
  if (hasPreview) {
    result.hasPreview = true
  }

  return result as unknown as ScriptMetadata
}

//app
export let parseMetadata = (
  fileContents: string,
  filePath: string = undefined
): ScriptMetadata => {
  let metadata: Metadata = getMetadata(fileContents, filePath)

  return postprocessMetadata(
    metadata,
    fileContents
  )
}

export let setMetadata = (
  contents: string,
  overrides: {
    [key: string]: string
  }
) => {
  Object.entries(overrides).forEach(([key, value]) => {
    let k = key[0].toUpperCase() + key.slice(1)
    // if not exists, then add
    if (
      !contents.match(
        new RegExp(`^\/\/\\s*(${key}|${k}):.*`, "gm")
      )
    ) {
      // uppercase first letter
      contents = `// ${k}: ${value}
${contents}`.trim()
    } else {
      // if exists, then replace
      contents = contents.replace(
        new RegExp(`^\/\/\\s*(${key}|${k}):.*$`, "gm"),
        `// ${k}: ${value}`
      )
    }
  })
  return contents
}

export let stripMetadata = (
  fileContents: string,
  exclude: string[] = []
) => {
  let excludeWithCommon = [
    `http`,
    `https`,
    `TODO`,
    `FIXME`,
    `NOTE`
  ].concat(exclude)

  let negBehind = exclude.length
    ? `(?<!(${excludeWithCommon.join("|")}))`
    : ``

  return fileContents.replace(
    new RegExp(`(^//[^(:|\W|\n)]+${negBehind}:).+`, "gim"),
    "$1"
  )
}