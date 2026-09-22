/**
 * Escape every HTML-significant character. Because the admin's message is fully
 * escaped before any markup is added, arbitrary script execution is impossible
 * in the generated HTML — escaping is the sanitization step here.
 */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Convert an admin's plain-text message into safe HTML, preserving paragraphs
 * (blank-line separated) and single line breaks. All content is escaped first.
 */
export function plainTextToHtml(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((para) => escapeHtml(para).replace(/\n/g, "<br />"))
    .filter((para) => para.length > 0)

  const body = paragraphs.map((p) => `<p style="margin:0 0 16px;">${p}</p>`).join("\n")

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#111111;">${body}</div>`
}

/** Normalize plain text for the text/plain part of the email. */
export function normalizePlainText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
}
