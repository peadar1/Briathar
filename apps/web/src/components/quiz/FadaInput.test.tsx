import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { FadaInput, insertAt } from './FadaInput';

function Harness({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <FadaInput aria-label="answer" value={value} onValueChange={setValue} />;
}

describe('insertAt', () => {
  it('inserts at the caret and replaces any selection', () => {
    expect(insertAt('cuaigh', 0, 0, 'h')).toEqual({ value: 'hcuaigh', caret: 1 });
    expect(insertAt('dun', 1, 2, 'ú')).toEqual({ value: 'dún', caret: 2 });
  });
});

describe('FadaInput', () => {
  it('inserts a fada vowel at the cursor from the on-screen keys', async () => {
    const user = userEvent.setup();
    render(<Harness initial="ol" />);
    const input = screen.getByLabelText('answer') as HTMLInputElement;
    await user.click(input);
    input.setSelectionRange(0, 1);
    await user.click(screen.getByRole('button', { name: 'Insert ó' }));
    expect(input.value).toBe('ól');
  });

  it('types a fada with Alt + vowel', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('answer') as HTMLInputElement;
    await user.click(input);
    await user.keyboard('t{Alt>}a{/Alt}');
    expect(input.value).toBe('tá');
  });

  it('leaves Ctrl + Alt (AltGr) combinations to the keyboard layout', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('answer') as HTMLInputElement;
    await user.click(input);
    await user.keyboard('{Control>}{Alt>}a{/Alt}{/Control}');
    expect(input.value).not.toContain('á');
  });
});
