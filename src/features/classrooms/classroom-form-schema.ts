import { z } from 'zod';

/**
 * Same limits as the API's CreateClassroomBody (name 1-80, description up to 500). A unit test
 * checks these against openapi/openapi.json, so the form cannot drift from the server.
 */
export const NAME_MAX = 80;
export const DESCRIPTION_MAX = 500;

export const classroomFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Add a class name to continue.')
    .max(NAME_MAX, `Use ${NAME_MAX} characters or fewer.`),
  description: z
    .string()
    .trim()
    .max(DESCRIPTION_MAX, `Use ${DESCRIPTION_MAX} characters or fewer.`),
});

export type ClassroomFormValues = z.input<typeof classroomFormSchema>;

/** Form values to the API body: an empty description is sent as null. */
export function toClassroomBody(values: ClassroomFormValues) {
  const parsed = classroomFormSchema.parse(values);
  return { name: parsed.name, description: parsed.description === '' ? null : parsed.description };
}
