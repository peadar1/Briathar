import { describe, expect, it } from 'vitest';
import { PRESETS, quizConfigSchema } from '../src/index.js';

describe('presets', () => {
  it.each(PRESETS.map((p) => [p.id, p] as const))('%s is a valid quiz config', (_, preset) => {
    expect(quizConfigSchema.safeParse(preset.config).success).toBe(true);
  });

  it('have unique ids', () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
  });
});
