import { defineTool } from "eve/tools"
import { z } from "zod"
import { executeGetRecord } from "../lib/research"

export default defineTool({
  description: "Retrieve one public QNotables record by its tool result id, such as archives:uuid or town-hall:uuid.",
  inputSchema: z.object({ id: z.string().min(3).max(180) }),
  async execute({ id }) {
    return executeGetRecord(id)
  },
})
