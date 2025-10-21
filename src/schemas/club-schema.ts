
import * as z from "zod"

export const clubEditSchema = z.object({
  name: z.string()
    .min(2, "Club name must be at least 2 characters")
    .max(50, "Club name cannot exceed 50 characters"),
  bio: z.string()
    .min(10, "Bio must be at least 10 characters")
    .max(500, "Bio cannot exceed 500 characters")
})

export type ClubEditFormValues = z.infer<typeof clubEditSchema>
