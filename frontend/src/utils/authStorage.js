let accessTokenCache = null
let refreshTokenCache = null
let cachedUserCache = null

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

export function getCachedUser() {
  if (cachedUserCache) return cachedUserCache
  const raw = localStorage.getItem('cached_user')
  if (!raw) return null
  try {
    cachedUserCache = JSON.parse(raw)
    return cachedUserCache
  } catch {
    localStorage.removeItem('cached_user')
    cachedUserCache = null
    return null
  }
}

export function setCachedUser(user) {
  cachedUserCache = user || null
  if (user) {
    localStorage.setItem('cached_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('cached_user')
  }
}
