const cache = {}

export async function geocodeCity(city, postalCode) {
  if (!city) return null

  const searchQuery = postalCode ? `${city} ${postalCode}` : city
  const key = searchQuery.toLowerCase().trim()
  if (cache[key]) return cache[key]

  try {
    const params = new URLSearchParams({
      q: searchQuery,
      countrycodes: 'fr',
      format: 'json',
      limit: '1',
    })

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'User-Agent': 'MaisonSeeker/1.0',
        },
      }
    )

    const data = await response.json()
    if (data.length === 0) return null

    const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    cache[key] = result
    return result
  } catch (err) {
    console.error('Geocoding error:', err)
    return null
  }
}
