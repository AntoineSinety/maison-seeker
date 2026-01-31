const { onCall, HttpsError } = require('firebase-functions/v2/https')
const axios = require('axios')
const cheerio = require('cheerio')

const SUPPORTED_SITES = [
  { name: 'leboncoin', pattern: /^https?:\/\/(www\.)?leboncoin\.fr\//i },
  { name: 'seloger', pattern: /^https?:\/\/(www\.)?seloger\.com\//i },
  { name: 'bienici', pattern: /^https?:\/\/(www\.)?bienici\.com\//i },
]

function detectSite(url) {
  for (const site of SUPPORTED_SITES) {
    if (site.pattern.test(url)) return site.name
  }
  return null
}

function toInt(val) {
  const n = parseInt(val, 10)
  return isNaN(n) ? null : n
}

// ===========================================================
// STRATEGIE 1 : APPELS API INTERNES (JSON direct, pas de HTML)
// ===========================================================

// ---- LEBONCOIN API ----
function extractLeboncoinId(url) {
  // URLs: /ad/immobilier/2940744971 ou /ad/ventes_immobilieres/2940744971
  const match = url.match(/\/ad\/[^/]+\/(\d+)/)
    || url.match(/\/(\d{8,})/)
  return match ? match[1] : null
}

async function fetchLeboncoinApi(url) {
  const adId = extractLeboncoinId(url)
  if (!adId) return null

  try {
    const response = await axios.get(`https://api.leboncoin.fr/finder/classified/${adId}`, {
      headers: {
        'User-Agent': 'LBC;Android;12;sdk_gphone64_arm64;phone;f2.27.0',
        'Accept': 'application/json',
        'api_key': 'ba0c2dad52b3ec',
        'Accept-Language': 'fr-FR',
        'Accept-Encoding': 'gzip',
      },
      timeout: 10000,
    })

    const ad = response.data
    if (!ad || !ad.list_id) return null

    const attrs = {}
    ;(ad.attributes || []).forEach((a) => { attrs[a.key] = a.value })

    const photos = (ad.images?.urls || ad.images?.urls_large || [])

    return {
      title: ad.subject || '',
      price: ad.price?.[0] || null,
      surface: toInt(attrs.square),
      rooms: toInt(attrs.rooms),
      bedrooms: toInt(attrs.bedrooms),
      city: ad.location?.city || '',
      postalCode: ad.location?.zipcode || '',
      description: ad.body || '',
      photos,
      thumbnail: photos[0] || '',
      propertyType: attrs.real_estate_type || '',
      energyClass: attrs.energy_rate || '',
      ghgClass: attrs.ges || '',
    }
  } catch (e) {
    console.warn('Leboncoin API failed:', e.message)
    return null
  }
}

// ---- BIENICI API ----
function extractBieniciId(url) {
  // URL: /annonce/vente/paris/.../ag670592-490834688
  // Le dernier segment du path est l'ID
  const path = new URL(url).pathname
  const segments = path.split('/').filter(Boolean)
  return segments[segments.length - 1] || null
}

async function fetchBieniciApi(url) {
  const adId = extractBieniciId(url)
  if (!adId) return null

  try {
    const response = await axios.get('https://www.bienici.com/realEstateAd.json', {
      params: { id: adId },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
      timeout: 10000,
    })

    const ad = response.data
    if (!ad || (!ad.price && !ad.surfaceArea)) return null

    return {
      title: ad.title || `${ad.propertyType || ''} ${ad.roomsQuantity || ''}p ${ad.surfaceArea || ''}m2`.trim(),
      price: ad.price || null,
      surface: ad.surfaceArea || null,
      rooms: ad.roomsQuantity || null,
      bedrooms: ad.bedroomsQuantity || null,
      city: ad.city || '',
      postalCode: ad.postalCode || '',
      description: ad.description || '',
      photos: (ad.photos || []).map((p) => p.url || p),
      thumbnail: ad.photos?.[0]?.url || ad.photos?.[0] || '',
      propertyType: ad.propertyType || '',
      energyClass: ad.energyClassification || '',
      ghgClass: ad.ghgClassification || '',
    }
  } catch (e) {
    console.warn('Bienici API failed:', e.message)
    return null
  }
}

// ---- SELOGER API ----
function extractSelogerId(url) {
  // URL: .../123456789.htm
  const match = url.match(/\/(\d+)\.htm/)
  return match ? match[1] : null
}

async function fetchSelogerApi(url) {
  const adId = extractSelogerId(url)
  if (!adId) return null

  try {
    const response = await axios.get(`https://www.seloger.com/detail,json,caracteristique_bien.json`, {
      params: { idannonce: adId },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
      timeout: 10000,
    })

    const ad = response.data
    if (!ad) return null

    return {
      title: ad.titre || ad.title || '',
      price: ad.prix || ad.price || null,
      surface: ad.surface || ad.surfaceArea || null,
      rooms: ad.nbPieces || ad.roomCount || null,
      bedrooms: ad.nbChambres || ad.bedroomCount || null,
      city: ad.ville || ad.city || '',
      postalCode: ad.cp || ad.zipCode || '',
      description: ad.descriptif || ad.description || '',
      photos: (ad.photos || []).map((p) => p.url || p.fullUrl || p),
      thumbnail: ad.photos?.[0]?.url || ad.photos?.[0]?.fullUrl || '',
      propertyType: ad.typeBien || ad.propertyType || '',
      energyClass: ad.classEnergie || '',
      ghgClass: ad.classeGes || '',
    }
  } catch (e) {
    console.warn('Seloger API failed:', e.message)
    return null
  }
}

const API_FETCHERS = {
  leboncoin: fetchLeboncoinApi,
  bienici: fetchBieniciApi,
  seloger: fetchSelogerApi,
}

// ===========================================================
// STRATEGIE 2 : SCRAPING HTML (fallback)
// ===========================================================

function parseLeboncoin($) {
  const script = $('#__NEXT_DATA__')
  if (!script.length) return null

  const json = JSON.parse(script.html())
  const ad = json?.props?.pageProps?.ad
  if (!ad) return null

  const attrs = {}
  ;(ad.attributes || []).forEach((a) => { attrs[a.key] = a.value })

  const photos = (ad.images?.urls || ad.images?.urls_large || [])

  return {
    title: ad.subject || '',
    price: ad.price?.[0] || null,
    surface: toInt(attrs.square),
    rooms: toInt(attrs.rooms),
    bedrooms: toInt(attrs.bedrooms),
    city: ad.location?.city || '',
    postalCode: ad.location?.zipcode || '',
    description: ad.body || '',
    photos,
    thumbnail: photos[0] || '',
    propertyType: attrs.real_estate_type || '',
    energyClass: attrs.energy_rate || '',
    ghgClass: attrs.ges || '',
  }
}

function parseBienici($) {
  const script = $('#__NEXT_DATA__')
  if (script.length) {
    const json = JSON.parse(script.html())
    const ad = json?.props?.pageProps?.ad
      || json?.props?.pageProps?.classified
      || json?.props?.pageProps
    if (ad && (ad.price || ad.surfaceArea)) {
      return {
        title: ad.title || `${ad.propertyType || ''} ${ad.roomsQuantity || ''}p ${ad.surfaceArea || ''}m2`.trim(),
        price: ad.price || null,
        surface: ad.surfaceArea || null,
        rooms: ad.roomsQuantity || null,
        bedrooms: ad.bedroomsQuantity || null,
        city: ad.city || '',
        postalCode: ad.postalCode || '',
        description: ad.description || '',
        photos: (ad.photos || []).map((p) => p.url || p),
        thumbnail: ad.photos?.[0]?.url || ad.photos?.[0] || '',
        propertyType: ad.propertyType || '',
        energyClass: ad.energyClassification || '',
        ghgClass: ad.ghgClassification || '',
      }
    }
  }

  return parseLdJson($)
}

function parseSeloger($) {
  let rawData = null
  $('script').each((_, el) => {
    const content = $(el).html() || ''
    const match = content.match(/window\["initialData"\]\s*=\s*JSON\.parse\("(.+?)"\)/)
    if (match) {
      try {
        const unescaped = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\')
        rawData = JSON.parse(unescaped)
      } catch (e) { /* ignore */ }
    }
  })

  if (rawData) {
    const listing = rawData.cards?.list?.find((c) => c.cardType === 'classified') || rawData
    return {
      title: listing.title || '',
      price: listing.pricing?.price || listing.price || null,
      surface: listing.livingArea || listing.surfaceArea || null,
      rooms: listing.roomCount || listing.roomsQuantity || null,
      bedrooms: listing.bedroomCount || null,
      city: listing.city || '',
      postalCode: listing.zipCode || '',
      description: listing.description || '',
      photos: (listing.photos || []).map((p) => p.url || p),
      thumbnail: listing.photos?.[0]?.url || listing.photos?.[0] || '',
      propertyType: listing.propertyType || '',
      energyClass: listing.energyPerformanceDiagnostic?.value || '',
      ghgClass: listing.greenHouseGasEmission?.value || '',
    }
  }

  const script = $('#__NEXT_DATA__')
  if (script.length) {
    try {
      const json = JSON.parse(script.html())
      const pp = json?.props?.pageProps
      if (pp) {
        const ad = pp.classified || pp.listing || pp.ad || pp
        return {
          title: ad.title || '',
          price: ad.price || ad.pricing?.price || null,
          surface: ad.livingArea || ad.surfaceArea || null,
          rooms: ad.roomCount || ad.roomsQuantity || null,
          bedrooms: ad.bedroomCount || null,
          city: ad.city || '',
          postalCode: ad.zipCode || ad.postalCode || '',
          description: ad.description || '',
          photos: (ad.photos || []).map((p) => p.url || p),
          thumbnail: ad.photos?.[0]?.url || ad.photos?.[0] || '',
          propertyType: ad.propertyType || '',
          energyClass: '',
          ghgClass: '',
        }
      }
    } catch (e) { /* ignore */ }
  }

  return parseLdJson($)
}

function parseLdJson($) {
  const ldScript = $('script[type="application/ld+json"]')
  if (!ldScript.length) return null

  for (let i = 0; i < ldScript.length; i++) {
    try {
      const json = JSON.parse($(ldScript[i]).html())
      const item = json['@type'] === 'Product' || json['@type'] === 'Residence'
        ? json
        : json['@graph']?.find((g) => g['@type'] === 'Product' || g['@type'] === 'Residence')

      if (item) {
        return {
          title: item.name || '',
          price: item.offers?.price || null,
          surface: null,
          rooms: null,
          bedrooms: null,
          city: '',
          postalCode: '',
          description: item.description || '',
          photos: item.image ? (Array.isArray(item.image) ? item.image : [item.image]) : [],
          thumbnail: Array.isArray(item.image) ? item.image[0] : (item.image || ''),
          propertyType: '',
          energyClass: '',
          ghgClass: '',
        }
      }
    } catch (e) { /* ignore */ }
  }

  return null
}

function parseOgTags($) {
  const getMeta = (prop) => $(`meta[property="${prop}"]`).attr('content')
    || $(`meta[name="${prop}"]`).attr('content') || ''

  return {
    title: getMeta('og:title') || $('title').text() || '',
    price: null,
    surface: null,
    rooms: null,
    bedrooms: null,
    city: '',
    postalCode: '',
    description: getMeta('og:description') || getMeta('description'),
    photos: getMeta('og:image') ? [getMeta('og:image')] : [],
    thumbnail: getMeta('og:image'),
    propertyType: '',
    energyClass: '',
    ghgClass: '',
  }
}

const HTML_PARSERS = {
  leboncoin: parseLeboncoin,
  bienici: parseBienici,
  seloger: parseSeloger,
}

// ===========================================================
// FONCTION PRINCIPALE
// ===========================================================

async function fetchViaHtml(url, siteName) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Sec-CH-UA': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  }

  const response = await axios.get(url, {
    headers,
    timeout: 15000,
    maxRedirects: 5,
    validateStatus: (status) => status < 500,
  })

  if (response.status === 403 || response.status === 429) {
    throw new Error(`HTTP ${response.status}`)
  }

  const $ = cheerio.load(response.data)
  const siteParser = HTML_PARSERS[siteName]
  let data = siteParser ? siteParser($) : null

  if (!data || !data.title) {
    data = parseOgTags($)
  }

  return data
}

exports.fetchMetadata = onCall(
  {
    region: 'europe-west1',
    timeoutSeconds: 30,
    memory: '256MiB',
    cors: [/localhost/, /home-seeker-e4c16\.web\.app/, /home-seeker-e4c16\.firebaseapp\.com/],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Vous devez etre connecte.')
    }

    const { url } = request.data
    if (!url || typeof url !== 'string') {
      throw new HttpsError('invalid-argument', 'URL invalide.')
    }

    const siteName = detectSite(url)
    if (!siteName) {
      throw new HttpsError(
        'invalid-argument',
        'URL non reconnue. Sites supportes : leboncoin.fr, seloger.com, bienici.com'
      )
    }

    // Strategie 1 : Appel API interne du site (JSON direct)
    const apiFetcher = API_FETCHERS[siteName]
    if (apiFetcher) {
      console.log(`Trying ${siteName} API...`)
      const apiData = await apiFetcher(url)
      if (apiData && apiData.title) {
        console.log(`${siteName} API succeeded`)
        return { ...apiData, sourceSite: siteName }
      }
      console.warn(`${siteName} API returned no data, falling back to HTML...`)
    }

    // Strategie 2 : Scraping HTML classique
    try {
      console.log(`Trying HTML scraping for ${siteName}...`)
      const htmlData = await fetchViaHtml(url, siteName)
      if (htmlData) {
        console.log('HTML scraping succeeded')
        return { ...htmlData, sourceSite: siteName }
      }
    } catch (e) {
      console.warn('HTML scraping failed:', e.message)
    }

    console.error(`All strategies failed for ${siteName}`)
    throw new HttpsError(
      'internal',
      'Impossible de recuperer les informations. Le site bloque peut-etre les requetes automatiques.'
    )
  }
)
