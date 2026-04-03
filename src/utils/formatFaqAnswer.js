function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function linkify(text) {
  const escapedText = escapeHtml(text)

  return escapedText.replace(
    /((?:https?:\/\/|www\.)[^\s<]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi,
    (match) => {
      const href = match.includes('@')
        ? `mailto:${match}`
        : match.startsWith('www.')
          ? `https://${match}`
          : match

      return `<a href="${href}" target="_blank" rel="noreferrer">${match}</a>`
    },
  )
}

export function formatFaqAnswer(answer) {
  const lines = answer.split('\n')
  const chunks = []
  let paragraphLines = []
  let listItems = []

  const flushParagraph = () => {
    if (!paragraphLines.length) {
      return
    }

    chunks.push(`<p>${paragraphLines.map((line) => linkify(line)).join('<br>')}</p>`)
    paragraphLines = []
  }

  const flushList = () => {
    if (!listItems.length) {
      return
    }

    chunks.push(`<ul>${listItems.map((item) => `<li>${linkify(item)}</li>`).join('')}</ul>`)
    listItems = []
  }

  lines.forEach((line) => {
    const trimmedLine = line.trim()

    if (!trimmedLine) {
      flushParagraph()
      flushList()
      return
    }

    if (trimmedLine.startsWith('- ')) {
      flushParagraph()
      listItems.push(trimmedLine.slice(2).trim())
      return
    }

    flushList()
    paragraphLines.push(trimmedLine)
  })

  flushParagraph()
  flushList()

  return chunks.join('')
}
