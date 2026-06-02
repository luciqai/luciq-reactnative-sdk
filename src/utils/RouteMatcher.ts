// TODO: This class is currently unused but will be used later for route matching.
/**
 * Matches route path definitions (potentially containing parameters and wildcards)
 * against actual navigation paths.
 *
 * Supports `:param` segments for named parameters and `**` for wildcard matching.
 */
class RouteMatcher {
  private static _instance: RouteMatcher = new RouteMatcher();

  static get instance(): RouteMatcher {
    return RouteMatcher._instance;
  }

  /** @internal visible for testing */
  static setInstance(instance: RouteMatcher): void {
    RouteMatcher._instance = instance;
  }

  /**
   * Checks whether the given `routePath` definition matches the given `actualPath`.
   *
   * The `routePath` definition can contain parameters in the form of `:param`,
   * or `**` for a wildcard parameter.
   *
   * Returns `true` if the `actualPath` matches the `routePath`, otherwise `false`.
   *
   * @example
   * ```ts
   * RouteMatcher.instance.match('/users', '/users'); // true
   * RouteMatcher.instance.match('/user/:id', '/user/123'); // true
   * RouteMatcher.instance.match('/user/**', '/user/123/profile'); // true
   * ```
   */
  match(routePath: string | null, actualPath: string | null): boolean {
    if (routePath == null || actualPath == null) {
      return routePath === actualPath;
    }

    const routePathSegments = this.segmentPath(routePath);
    const actualPathSegments = this.segmentPath(actualPath);

    const hasWildcard = routePathSegments.includes('**');

    if (routePathSegments.length !== actualPathSegments.length && !hasWildcard) {
      return false;
    }

    for (let i = 0; i < routePathSegments.length; i++) {
      const routeSegment = routePathSegments[i];

      const isWildcard = routeSegment === '**';
      const isParameter = routeSegment.startsWith(':');

      const noMoreActualSegments = i >= actualPathSegments.length;

      if (noMoreActualSegments) {
        return isWildcard;
      }

      if (isParameter) {
        continue;
      }

      if (isWildcard) {
        return true;
      }

      if (routeSegment !== actualPathSegments[i]) {
        return false;
      }
    }

    return true;
  }

  private segmentPath(path: string): string[] {
    const pathWithoutQuery = path.split('?')[0];
    return pathWithoutQuery.split('/').filter((segment) => segment.length > 0);
  }
}

export default RouteMatcher;
