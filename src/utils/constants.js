export const SUPPORTED_SITES = [
  { name: 'leboncoin', pattern: /^https?:\/\/(www\.)?leboncoin\.fr\//i },
  { name: 'seloger', pattern: /^https?:\/\/(www\.)?seloger\.com\//i },
  { name: 'bienici', pattern: /^https?:\/\/(www\.)?bienici\.com\//i },
]

export const VOTE_STATES = {
  LIKE: 'like',
  DISLIKE: 'dislike',
  NEUTRAL: null,
}

export const LISTING_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
}

export const FRANCE_CENTER = { lat: 46.603354, lng: 1.888334 }
export const DEFAULT_ZOOM = 6
