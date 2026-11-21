import assert from "node:assert/strict"
import { test } from "node:test"
import { externalEmbedUrl } from "./publishing-embed"
import { fetchEmbedMetadata, frameHeadersAllow, isPublicEmbedAddress, UnsafeEmbedDestination } from "./embed-network"
import { checkPublishingDocument, decodeEmbed, encodeEmbed, signEmbed, verifyEmbed } from "./embed-trust"
import { countEmbeds, stripMediaFromBody } from "./forum-spam-guard"

process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-embed-signing-secret"

test("only external HTTP or HTTPS URLs without credentials can be embedded", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,hello", "https://user@example.com", "https://example.com:9000", "https://127.0.0.1", "https://0x7f000001", "https://[::1]", "https://service.internal", "https://foo.home.arpa", "https://example.com\\@evil.com"]) {
    assert.equal(externalEmbedUrl(url), null, url)
  }
  assert.equal(externalEmbedUrl("Example.com/path", true)?.href, "https://example.com/path")
})

test("metadata connections pin a vetted IP and do not follow private redirects", async () => {
  const connected: string[] = []
  const dns: string[] = []
  await assert.rejects(fetchEmbedMetadata(new URL("https://example.com/"), {
    resolve4: async (host) => {
      dns.push(host)
      return host === "example.com" ? ["93.184.215.14"] : ["8.8.8.8", "169.254.169.254"]
    },
    getPinned: async (url, address) => {
      connected.push(`${url.hostname}:${address}`)
      return { status: 302, headers: { location: "https://next.example.org/" }, body: "" }
    },
  }), UnsafeEmbedDestination)
  assert.deepEqual(dns, ["example.com", "next.example.org"])
  assert.deepEqual(connected, ["example.com:93.184.215.14"])
  assert.equal(isPublicEmbedAddress("100.64.0.1"), false)
  assert.equal(isPublicEmbedAddress("192.0.2.7"), false)
  assert.equal(isPublicEmbedAddress("::ffff:127.0.0.1"), false)
})

test("framing restrictions fall back conservatively", () => {
  assert.equal(frameHeadersAllow({ "x-frame-options": "SAMEORIGIN" }), false)
  assert.equal(frameHeadersAllow({ "content-security-policy": "default-src 'self'; frame-ancestors 'none'" }), false)
  assert.equal(frameHeadersAllow({ "content-security-policy-report-only": "frame-ancestors 'none'" }), true)
  assert.equal(frameHeadersAllow({}), true)
})

test("trusted blocks round-trip and cannot be forged or replayed as non-admin HTML", () => {
  const block = signEmbed({ url: null, target: null, kind: "html", title: "Static", description: "", mode: "auto", width: 720, height: 405, html: "<p>Static note</p>" })
  assert.deepEqual(decodeEmbed(encodeEmbed(block)), block)
  assert.equal(verifyEmbed({ ...block, payload: { ...block.payload, html: "<script>unsafe</script>" } }), null)
  assert.equal(decodeEmbed("not-an-embed"), null)
  const body = JSON.stringify({ type: "doc", content: [
    { type: "paragraph", content: [{ type: "text", text: "Editorial text" }] },
    { type: "publishingEmbed", attrs: block },
    { type: "publishingEmbed", attrs: block },
  ] })
  assert.equal(checkPublishingDocument(body, true).text, "Editorial text")
  assert.equal(checkPublishingDocument(body, true).error, null)
  assert.ok(checkPublishingDocument(body, false).error)
  assert.equal(countEmbeds(body), 2)
  assert.equal(countEmbeds(stripMediaFromBody(body)), 0)
})
