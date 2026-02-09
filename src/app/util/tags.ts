export const normalizeEditorTags = (tags: string[][]) =>
  tags.map(tag => {
    if (tag[0] === "t" && tag[1]) {
      return [tag[0], tag[1].replace(/-/g, "_"), ...tag.slice(2)]
    }

    return tag
  })
