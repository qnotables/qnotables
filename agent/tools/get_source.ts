import { defineTool } from "eve/tools"
import { z } from "zod"
import { executeGetSource } from "../lib/research"

export default defineTool({
  description: "Retrieve public source metadata and original-source links for a QNotables record.",
  inputSchema: z.object({ id: z.string().min(3).max(180) }),
  async execute({ id }) {
    return executeGetSource(id)
  },
})
