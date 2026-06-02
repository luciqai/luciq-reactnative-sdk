import RouteMatcher from '../../src/utils/RouteMatcher';

describe('RouteMatcher', () => {
  const matcher = RouteMatcher.instance;

  it('returns the same singleton instance', () => {
    expect(RouteMatcher.instance).toBe(matcher);
  });

  it('allows replacing the instance via setInstance', () => {
    const original = RouteMatcher.instance;
    const replacement = new (RouteMatcher as any)();
    RouteMatcher.setInstance(replacement);
    expect(RouteMatcher.instance).toBe(replacement);
    RouteMatcher.setInstance(original);
  });

  it('treats two null paths as a match', () => {
    expect(matcher.match(null, null)).toBe(true);
  });

  it('treats one null path as a non-match', () => {
    expect(matcher.match(null, '/users')).toBe(false);
    expect(matcher.match('/users', null)).toBe(false);
  });

  it('matches identical literal paths', () => {
    expect(matcher.match('/api/v1/users', '/api/v1/users')).toBe(true);
  });

  it('rejects paths with different segments', () => {
    expect(matcher.match('/users', '/posts')).toBe(false);
  });

  it('rejects paths with different segment counts when no wildcard', () => {
    expect(matcher.match('/users', '/users/123')).toBe(false);
  });

  it('matches named parameter segments', () => {
    expect(matcher.match('/user/:id/profile', '/user/42/profile')).toBe(true);
  });

  it('rejects when actualPath is shorter than a parameterized routePath', () => {
    expect(matcher.match('/user/:id/profile', '/user/42')).toBe(false);
  });

  it('matches wildcard against multiple trailing segments', () => {
    expect(matcher.match('/user/**', '/user/42/posts/9')).toBe(true);
  });

  it('matches wildcard when no trailing segments remain', () => {
    expect(matcher.match('/user/**', '/user')).toBe(true);
  });

  it('strips query strings before matching', () => {
    expect(matcher.match('/users', '/users?foo=bar')).toBe(true);
  });
});
