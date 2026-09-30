import { describe, expect, it } from 'vitest';
import openapiText from '../../../../../backend/openapi.json?raw';
import { NOTE_LIMITS } from '../limits';

interface Property {
  maxLength?: number;
  anyOf?: Property[];
}

const schemas = (
  JSON.parse(openapiText) as {
    components: { schemas: Record<string, { properties: Record<string, Property> }> };
  }
).components.schemas;

function maxLength(schema: string, field: string): number | undefined {
  const property = schemas[schema]?.properties[field];
  return property?.maxLength ?? property?.anyOf?.find((option) => option.maxLength)?.maxLength;
}

describe('notes contract', () => {
  it('uses the same length limits as the backend', () => {
    expect(maxLength('NoteCreate', 'title')).toBe(NOTE_LIMITS.title);
    expect(maxLength('NoteCreate', 'body')).toBe(NOTE_LIMITS.body);
  });
});
