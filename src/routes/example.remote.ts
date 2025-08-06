import { form } from "$app/server"
import { ezForm, ezValidate } from "svelte-ez-form"
import z from "zod"

const schema = z.object({
  name: z.string().min(1, "Name must be present")
})

export const exampleForm = form(async (data) => {
  return ezValidate(schema, data)
})