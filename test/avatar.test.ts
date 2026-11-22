import { initials } from '@/ui/avatar';

describe('initials', () => {
  it('uses the first and last name', () => {
    expect(initials('Omar Khaled')).toBe('OK');
    expect(initials('Layla Ahmed Mostafa')).toBe('LM');
    expect(initials('Cher')).toBe('C');
  });

  it('skips a leading title', () => {
    expect(initials('Ms. Amira Hassan')).toBe('AH');
    expect(initials('Mr. Youssef Nabil')).toBe('YN');
    expect(initials('Dr Nabil')).toBe('DN');
  });
});
