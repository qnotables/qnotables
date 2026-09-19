import { defineTool } from "eve/tools"
import { z } from "zod"
import { executeSearch } from "../lib/research"

export default defineTool({
  description: "Search public QNotables Town Hall threads and indexed replies. Community discussion is not automatically verified.",
  inputSchema: z.object({ query: z.string().min(1).max(160), from: z.string().optional(), to: z.string().optional(), category: z.string().optional() }),
  async execute({ query, from, to, category }) {
    const result = await executeSearch(query, "town-hall")
    return { ...result, filters: { from, to, category } }
  },
})
