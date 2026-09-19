import { defineAgent } from "eve"

export default defineAgent({
  model: "openai/gpt-oss-120b",
  reasoning: "low",
})
