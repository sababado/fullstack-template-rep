/**
 * Bridge between the auth provider (React) and the API client (not React).
 * The provider registers how to read the current access token.
 */

type TokenGetter = () => string | undefined;

let getToken: TokenGetter = () => undefined;

export function setAccessTokenGetter(getter: TokenGetter): void {
  getToken = getter;
}

export function getAccessToken(): string | undefined {
  return getToken();
}
