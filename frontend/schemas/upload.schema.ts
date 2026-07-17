import { z } from "zod";
import { VALID_DENOMINATIONS } from "@/lib/constants";

export const uploadSchema = z.object({
  denomination: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().optional()
  ),
});

export type UploadInput = z.infer<typeof uploadSchema>;
export default uploadSchema;
