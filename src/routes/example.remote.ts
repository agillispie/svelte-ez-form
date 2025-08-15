import { form } from "$app/server"
import { ezValidate } from "$lib/index.js"
import z from "zod"

const schema = z.object({
  name: z.string().min(1, "Name must be present"),
  file: z.file(),
  user: z.array(z.object({
    username: z.string(),
    password: z.string(),
    tags: z.array(z.string())
  }))
})

export const exampleForm = form(async (data) => {
  return await ezValidate(schema, data, {
    onSuccess: (result) => {
      console.log(result)

      console.log(result.user[0].tags)
      return { someValue: "this is my value" }
    }
  })
})