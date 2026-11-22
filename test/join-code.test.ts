import {
  buildJoinUrl,
  isJoinCode,
  parseJoinUrl,
  sanitizeCodeInput,
} from '@/features/join/join-code';

describe('parseJoinUrl', () => {
  it('reads the code from a Joinly invite link', () => {
    expect(parseJoinUrl('joinly://join?code=482913')).toBe('482913');
    expect(parseJoinUrl('joinly://join/?code=000123')).toBe('000123');
    expect(parseJoinUrl('JOINLY://join?code=482913')).toBe('482913');
    expect(parseJoinUrl('  joinly://join?code=482913\n')).toBe('482913');
    expect(parseJoinUrl('joinly://join?utm=x&code=482913')).toBe('482913');
  });

  it('round-trips with buildJoinUrl', () => {
    expect(parseJoinUrl(buildJoinUrl('246810'))).toBe('246810');
  });

  it.each([
    ['empty', ''],
    ['plain code', '482913'],
    ['web link', 'https://joinly.app/join?code=482913'],
    ['other scheme', 'otherapp://join?code=482913'],
    ['scheme prefix trick', 'evil-joinly://join?code=482913'],
    ['other host', 'joinly://classes?code=482913'],
    ['host lookalike', 'joinly://join.evil.com?code=482913'],
    ['no code', 'joinly://join'],
    ['empty code', 'joinly://join?code='],
    ['five digits', 'joinly://join?code=48291'],
    ['seven digits', 'joinly://join?code=4829130'],
    ['letters', 'joinly://join?code=48a913'],
    ['encoded', 'joinly://join?code=%34%38%32%39%31%33'],
    ['two codes', 'joinly://join?code=111111&code=222222'],
    ['fragment', 'joinly://join?code=482913#x'],
    ['too long', `joinly://join?code=482913&pad=${'x'.repeat(300)}`],
    ['script', 'javascript:alert(1)//joinly://join?code=482913'],
  ])('rejects %s', (_label, data) => {
    expect(parseJoinUrl(data)).toBeNull();
  });

  it('rejects non-string input', () => {
    expect(parseJoinUrl(undefined as unknown as string)).toBeNull();
  });
});

describe('sanitizeCodeInput', () => {
  it('keeps up to six digits from typed or pasted text', () => {
    expect(sanitizeCodeInput('482 913')).toBe('482913');
    expect(sanitizeCodeInput('482-913')).toBe('482913');
    expect(sanitizeCodeInput('Code: 4829137')).toBe('482913');
    expect(sanitizeCodeInput('abc')).toBe('');
  });
});

describe('isJoinCode', () => {
  it('accepts exactly six digits, leading zeros included', () => {
    expect(isJoinCode('000001')).toBe(true);
    expect(isJoinCode('12345')).toBe(false);
    expect(isJoinCode(123456)).toBe(false);
    expect(isJoinCode(undefined)).toBe(false);
  });
});
