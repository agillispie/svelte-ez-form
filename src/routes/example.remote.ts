import { form } from "$app/server"
import { ezValidate } from "$lib/index.js"
import z from "zod"

const schema = z.object({
  name: z.string().min(1, "Name must be present")
})

export const exampleForm = form(async (data) => {
  return await ezValidate(schema, data, {
    onSuccess: () => console.log("yeet")
  })
})