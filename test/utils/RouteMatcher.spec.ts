import RouteMatcher from '../../src/utils/RouteMatcher';

describe('RouteMatcher', () => {
  const matcher = RouteMatcher.instance;

  describe('singleton', () => {
    it('should return the same instance on every access', () => {
      expect(RouteMatcher.instance).toBe(RouteMatcher.instance);
    });

    it('should allow replacing the instance via setInstance', () => {
      const original = RouteMatcher.instance;
      const replacement = new (RouteMatcher as any)();

      RouteMatcher.setInstance(replacement);
      expect(RouteMatcher.instance).toBe(replacement);

      RouteMatcher.setInstance(original);
      expect(RouteMatcher.instance).toBe(original);
    });
  });

  describe('null handling', () => {
    it('should return true when both routePath and actualPath are null', () => {
      expect(matcher.match(null, null)).toBe(true);
    });

    it('should return false when only routePath is null', () => {
      expect(matcher.match(null, '/users')).toBe(false);
    });

    it('should return false when only actualPath is null', () => {
      expect(matcher.match('/users', null)).toBe(false);
    });
  });

  describe('exact matching', () => {
    it('should match identical single-segment paths', () => {
      expect(matcher.match('/users', '/users')).toBe(true);
    });

    it('should match identical multi-segment paths', () => {
      expect(matcher.match('/api/v1/users', '/api/v1/users')).toBe(true);
    });

    it('should not match different single-segment paths', () => {
      expect(matcher.match('/users', '/posts')).toBe(false);
    });

    it('should not match when one segment differs', () => {
      expect(matcher.match('/api/v1/users', '/api/v2/users')).toBe(false);
    });

    it('should not match paths with different segment counts', () => {
      expect(matcher.match('/users', '/users/123')).toBe(false);
      expect(matcher.match('/users/123', '/users')).toBe(false);
    });

    it('should treat empty paths as matching', () => {
      expect(matcher.match('', '')).toBe(true);
      expect(matcher.match('/', '/')).toBe(true);
    });

    it('should ignore leading and trailing slashes', () => {
      expect(matcher.match('/users/', '/users')).toBe(true);
      expect(matcher.match('users', '/users')).toBe(true);
    });
  });

  describe('parameter matching', () => {
    it('should match a single named parameter', () => {
      expect(matcher.match('/user/:id', '/user/123')).toBe(true);
    });

    it('should match a parameter with any value including non-numeric', () => {
      expect(matcher.match('/user/:id', '/user/abc-def')).toBe(true);
    });

    it('should match multiple named parameters', () => {
      expect(matcher.match('/users/:userId/posts/:postId', '/users/42/posts/99')).toBe(true);
    });

    it('should match parameters mixed with literal segments', () => {
      expect(matcher.match('/api/v1/users/:id/profile', '/api/v1/users/7/profile')).toBe(true);
    });

    it('should not match when literal segment after parameter differs', () => {
      expect(matcher.match('/user/:id/profile', '/user/7/settings')).toBe(false);
    });

    it('should not match when actualPath is shorter than parameterized routePath', () => {
      expect(matcher.match('/user/:id/profile', '/user/7')).toBe(false);
    });
  });

  describe('wildcard matching', () => {
    it('should match wildcard against a single trailing segment', () => {
      expect(matcher.match('/user/**', '/user/123')).toBe(true);
    });

    it('should match wildcard against multiple trailing segments', () => {
      expect(matcher.match('/user/**', '/user/123/profile/details')).toBe(true);
    });

    it('should match wildcard when no trailing segments are present', () => {
      expect(matcher.match('/user/**', '/user')).toBe(true);
    });

    it('should match a top-level wildcard against any path', () => {
      expect(matcher.match('/**', '/anything/goes/here')).toBe(true);
    });

    it('should not match wildcard when prefix does not match', () => {
      expect(matcher.match('/user/**', '/users/123')).toBe(false);
    });

    it('should match wildcard combined with parameter', () => {
      expect(matcher.match('/user/:id/**', '/user/42/posts/9')).toBe(true);
    });
  });

  describe('query string handling', () => {
    it('should ignore query strings on actualPath', () => {
      expect(matcher.match('/users', '/users?foo=bar')).toBe(true);
    });

    it('should ignore query strings on routePath', () => {
      expect(matcher.match('/users?foo=bar', '/users')).toBe(true);
    });

    it('should ignore query strings on both sides with parameters', () => {
      expect(matcher.match('/user/:id?x=1', '/user/123?y=2')).toBe(true);
    });
  });
});
