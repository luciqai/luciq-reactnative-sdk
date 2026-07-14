import { redactUrlForLog } from '../../src/utils/LuciqUtils';

describe('redactUrlForLog', () => {
  describe('empty inputs', () => {
    it('returns empty string for null', () => {
      expect(redactUrlForLog(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(redactUrlForLog(undefined)).toBe('');
    });

    it('returns empty string for empty string', () => {
      expect(redactUrlForLog('')).toBe('');
    });
  });

  describe('URLs without query or fragment', () => {
    it('returns the URL unchanged when no query or fragment present', () => {
      expect(redactUrlForLog('https://api.example.com/users/123')).toBe(
        'https://api.example.com/users/123',
      );
    });

    it('preserves path segments', () => {
      expect(redactUrlForLog('https://api.example.com/v1/users/123/orders/456')).toBe(
        'https://api.example.com/v1/users/123/orders/456',
      );
    });

    it('preserves port numbers', () => {
      expect(redactUrlForLog('http://localhost:8081/symbolicate')).toBe(
        'http://localhost:8081/symbolicate',
      );
    });
  });

  describe('query string redaction', () => {
    it('strips a simple query string and appends a redaction marker', () => {
      expect(redactUrlForLog('https://api.example.com/users?email=u@x.com')).toBe(
        'https://api.example.com/users?<redacted>',
      );
    });

    it('strips multi-parameter query strings', () => {
      expect(redactUrlForLog('https://api.example.com/auth?token=abc&user=12345&hash=xyz')).toBe(
        'https://api.example.com/auth?<redacted>',
      );
    });

    it('strips a trailing question mark with no params', () => {
      expect(redactUrlForLog('https://api.example.com/users?')).toBe(
        'https://api.example.com/users?<redacted>',
      );
    });

    it('never leaks any portion of the query in the returned string', () => {
      const sensitive = 'super-secret-token-value-9876';
      const result = redactUrlForLog(`https://api.example.com/users?token=${sensitive}`);
      expect(result).not.toContain(sensitive);
      expect(result).not.toContain('token=');
    });
  });

  describe('fragment redaction', () => {
    it('strips a fragment without appending the redacted marker (no query present)', () => {
      expect(redactUrlForLog('https://app.example.com/page#section-2')).toBe(
        'https://app.example.com/page',
      );
    });

    it('strips fragment that contains sensitive data', () => {
      const result = redactUrlForLog('https://app.example.com/page#access_token=abc');
      expect(result).toBe('https://app.example.com/page');
      expect(result).not.toContain('abc');
      expect(result).not.toContain('access_token');
    });
  });

  describe('both query and fragment', () => {
    it('cuts at the query when query comes first (the common case)', () => {
      expect(redactUrlForLog('https://api.example.com/users?email=u@x.com#anchor')).toBe(
        'https://api.example.com/users?<redacted>',
      );
    });

    it('cuts at the fragment when fragment comes first', () => {
      // Pathological but technically possible: fragment before query
      expect(redactUrlForLog('https://app.example.com/page#frag?fake')).toBe(
        'https://app.example.com/page',
      );
    });
  });

  describe('userinfo redaction', () => {
    it('strips user:password@ from the authority', () => {
      expect(redactUrlForLog('https://user:pass@api.example.com/users/123')).toBe(
        'https://api.example.com/users/123',
      );
    });

    it('strips a username-only userinfo', () => {
      expect(redactUrlForLog('https://alice@api.example.com/users')).toBe(
        'https://api.example.com/users',
      );
    });

    it('never leaks the password component', () => {
      const secret = 'p@ssw0rd-do-not-leak';
      const result = redactUrlForLog(`https://user:${secret}@api.example.com/x`);
      expect(result).not.toContain(secret);
      expect(result).not.toContain('user:');
    });

    it('strips userinfo and query together', () => {
      expect(redactUrlForLog('https://u:p@api.example.com/users?token=abc')).toBe(
        'https://api.example.com/users?<redacted>',
      );
    });

    it('does not strip an @ that appears in the path', () => {
      // No userinfo present; the `@` is part of the path segment.
      expect(redactUrlForLog('https://api.example.com/users/@me/profile')).toBe(
        'https://api.example.com/users/@me/profile',
      );
    });

    it('does not strip an @ that appears in the query (query is removed anyway)', () => {
      expect(redactUrlForLog('https://api.example.com/users?email=u@x.com')).toBe(
        'https://api.example.com/users?<redacted>',
      );
    });

    it('handles userinfo on URLs without a scheme separator (no-op)', () => {
      // No `://`, so no authority parsing happens; userinfo handling is skipped.
      expect(redactUrlForLog('user@host/path')).toBe('user@host/path');
    });
  });

  describe('regression guard', () => {
    it('never returns a string containing an unredacted query parameter value', () => {
      // Any URL passed through the helper must not retain any character past
      // the first ? or # boundary (other than the explicit redaction marker).
      const inputs = [
        'https://x.com/p?a=1',
        'https://x.com/p?a=1&b=2',
        'https://x.com/p#frag',
        'https://x.com/p?a=1#frag',
        'http://localhost:1234/foo?bar=baz',
      ];
      for (const url of inputs) {
        const out = redactUrlForLog(url);
        // The output must not contain any '=' from a query parameter, nor any
        // raw '#' fragment marker carried over.
        expect(out.indexOf('=')).toBe(-1);
        expect(out.indexOf('#')).toBe(-1);
      }
    });
  });
});
