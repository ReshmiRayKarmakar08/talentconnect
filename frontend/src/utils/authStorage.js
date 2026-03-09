let accessTokenCache = null
let refreshTokenCache = null

export function getAccessToken() {
  if (accessTokenCache) return accessTokenCache
  accessTokenCache = localStorage.getItem('access_token')
  return accessTokenCache
}

export function getRefreshToken() {
  if (refreshTokenCache) return refreshTokenCache
  refreshTokenCache = localStorage.getItem('refresh_token')
  return refreshTokenCache
}

export function setTokens(accessToken, refreshToken) {
  accessTokenCache = accessToken || null
  refreshTokenCache = refreshToken || null

  if (accessToken) {
    localStorage.setItem('access_token', accessToken)
  } else {
    localStorage.removeItem('access_token')
  }

  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken)
  } else {
    localStorage.removeItem('refresh_token')
  }
}

export function clearTokens() {
  accessTokenCache = null
  refreshTokenCache = null
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}
