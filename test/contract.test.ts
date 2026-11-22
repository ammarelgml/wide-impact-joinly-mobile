import openapi from '../openapi/openapi.json';

import {
  DESCRIPTION_MAX,
  NAME_MAX,
  classroomFormSchema,
  toClassroomBody,
} from '@/features/classrooms/classroom-form-schema';

/**
 * The app keeps a copy of the API's OpenAPI document (npm run api:sync). These checks fail if the
 * form's limits drift from the server's, the same way the generated types fail the type check.
 */
describe('classroom form matches the API contract', () => {
  const body = openapi.components.schemas.CreateClassroomBody.properties;

  it('uses the API limits', () => {
    expect(NAME_MAX).toBe(body.name.maxLength);
    expect(DESCRIPTION_MAX).toBe(body.description.anyOf[0]?.maxLength);
  });

  it('validates like the API', () => {
    expect(classroomFormSchema.safeParse({ name: '  ', description: '' }).success).toBe(false);
    expect(classroomFormSchema.safeParse({ name: 'x'.repeat(81), description: '' }).success).toBe(
      false,
    );
    expect(
      classroomFormSchema.safeParse({ name: 'x'.repeat(80), description: 'y'.repeat(500) }).success,
    ).toBe(true);
    expect(
      classroomFormSchema.safeParse({ name: 'Maths', description: 'y'.repeat(501) }).success,
    ).toBe(false);
  });

  it('sends trimmed values and null for an empty description', () => {
    expect(toClassroomBody({ name: ' Grade 6 Science ', description: '  ' })).toEqual({
      name: 'Grade 6 Science',
      description: null,
    });
  });

  it('knows every error code the API can return', () => {
    const codes = openapi.components.schemas.ErrorCode.enum;
    expect(codes).toEqual(
      expect.arrayContaining([
        'JOIN_CODE_INVALID',
        'JOIN_CODE_EXPIRED',
        'JOINING_CLOSED',
        'RATE_LIMITED',
        'ROLE_REQUIRED',
        'TOKEN_EXPIRED',
      ]),
    );
  });
});
