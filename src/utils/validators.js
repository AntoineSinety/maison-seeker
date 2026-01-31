import { SUPPORTED_SITES } from './constants'

export function detectSite(url) {
  if (!url || typeof url !== 'string') return null
  for (const site of SUPPORTED_SITES) {
    if (site.pattern.test(url)) return site.name
  }
  return null
}

export function isValidListingUrl(url) {
  return detectSite(url) !== null
}
