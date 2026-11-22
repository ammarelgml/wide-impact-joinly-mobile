import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { CodeInput } from '@/features/join/code-input';

function Harness({ onComplete }: { onComplete: (code: string) => void }) {
  const [value, setValue] = useState('');
  return <CodeInput value={value} onChange={setValue} onComplete={onComplete} autoFocus={false} />;
}

describe('CodeInput', () => {
  it('submits automatically on the sixth digit', async () => {
    const onComplete = jest.fn();
    await render(<Harness onComplete={onComplete} />);
    const input = screen.getByTestId('code-input');
    await fireEvent.changeText(input, '48291');
    expect(onComplete).not.toHaveBeenCalled();
    await fireEvent.changeText(input, '482913');
    expect(onComplete).toHaveBeenCalledWith('482913');
  });

  it('accepts a pasted code with a space or dash', async () => {
    const onComplete = jest.fn();
    await render(<Harness onComplete={onComplete} />);
    await fireEvent.changeText(screen.getByTestId('code-input'), '482 913');
    expect(onComplete).toHaveBeenCalledWith('482913');
  });

  it('ignores letters and shows each digit in its box', async () => {
    const onComplete = jest.fn();
    await render(<Harness onComplete={onComplete} />);
    await fireEvent.changeText(screen.getByTestId('code-input'), '4a8b2');
    expect(screen.getByTestId('code-input').props.value).toBe('482');
    expect(screen.getByText('4', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText('2', { includeHiddenElements: true })).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('is labelled for screen readers', async () => {
    await render(<Harness onComplete={jest.fn()} />);
    expect(screen.getByLabelText('Join code, 6 digits')).toBeTruthy();
  });
});
