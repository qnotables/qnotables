import { defineTool } from "eve/tools"
import { z } from "zod"
import { executeSearch } from "../lib/research"

export default defineTool({
  description: "Search public QNotables Wire/news records and distinguish reports from primary sources.",
  inputSchema: z.object({ query: z.string().min(1).max(160), from: z.string().optional(), to: z.string().optional(), source: z.string().optional() }),
  async execute({ query, from, to, source }) {
    const result = await executeSearch(query, "news")
    return { ...result, filters: { from, to, source } }
  },
})
