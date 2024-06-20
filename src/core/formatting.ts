// noinspection CssUnresolvedCustomProperty

export const asPrimaryHTML = (val: string, bold = true) =>
  `<${bold ? 'b' : 'span'} style="color: rgba(var(--color-primary), var(--tw-text-opacity))">${val}</${bold ? 'b' : 'span'}>`
