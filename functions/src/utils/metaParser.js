function extractOgTags($) {
  const og = {}

  $('meta[property^="og:"]').each((_, el) => {
    const property = $(el).attr('property')
    const content = $(el).attr('content')
    if (property && content) {
      const key = property.replace('og:', '')
      og[key] = content
    }
  })

  // Fallback to twitter cards if no OG tags
  if (!og.title) {
    og.title = $('meta[name="twitter:title"]').attr('content') || $('title').text() || ''
  }
  if (!og.image) {
    og.image = $('meta[name="twitter:image"]').attr('content') || ''
  }
  if (!og.description) {
    og.description = $('meta[name="twitter:description"]').attr('content')
      || $('meta[name="description"]').attr('content')
      || ''
  }

  return {
    ogTitle: og.title || '',
    ogImage: og.image || '',
    ogDescription: og.description || '',
    ogSiteName: og.site_name || '',
  }
}

function extractCityFromTitle(title) {
  if (!title) return ''

  // Common patterns in French real estate listings:
  // "Maison 4 pieces 95m2 Lyon"
  // "Appartement a Lyon 3eme"
  // "Vente maison Lyon (69003)"

  // Try to find city after " a " or " à "
  const matchA = title.match(/\s[aà]\s+([A-Z][a-zA-Zéèêëàâäùûü-]+)/i)
  if (matchA) return matchA[1]

  // Try to find city before postal code
  const matchPostal = title.match(/([A-Z][a-zA-Zéèêëàâäùûü-]+)\s*\(\d{5}\)/)
  if (matchPostal) return matchPostal[1]

  // Try last capitalized word (often the city)
  const words = title.split(/\s+/)
  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i].replace(/[(),-]/g, '')
    // Skip numbers, measurements, common words
    if (/^\d+/.test(word)) continue
    if (/^(m2|m²|pieces?|pièces?|chambres?|euros?|EUR|€)$/i.test(word)) continue
    if (word.length < 3) continue
    // If it starts with uppercase, likely a city
    if (/^[A-ZÉÈÊËÀÂÄÙÛÜ]/.test(word)) {
      return word
    }
  }

  return ''
}

module.exports = { extractOgTags, extractCityFromTitle }
