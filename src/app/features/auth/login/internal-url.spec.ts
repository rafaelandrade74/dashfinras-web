import { isInternalRedirectUrl } from './internal-url';

describe('isInternalRedirectUrl', () => {
  it.each([null, undefined, ''])('retorna false para %s', (valor) => {
    expect(isInternalRedirectUrl(valor)).toBe(false);
  });

  it.each(['/paineis', '/paineis/123?x=1'])('retorna true para caminho interno %s', (valor) => {
    expect(isInternalRedirectUrl(valor)).toBe(true);
  });

  it.each(['//evil.com', 'https://evil.com', 'javascript:alert(1)', '/\\evil.com'])(
    'retorna false para %s',
    (valor) => {
      expect(isInternalRedirectUrl(valor)).toBe(false);
    }
  );
});
