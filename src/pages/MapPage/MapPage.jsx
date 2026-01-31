import { useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useAuthContext } from '../../contexts/AuthContext'
import { useHouseholdContext } from '../../contexts/HouseholdContext'
import { formatPrice, formatSurface } from '../../utils/formatters'
import { FRANCE_CENTER, DEFAULT_ZOOM } from '../../utils/constants'
import 'leaflet/dist/leaflet.css'
import styles from './MapPage.module.scss'

function getMarkerColor(listing, userId, partnerId) {
  const myVote = listing.votes?.[userId] || null
  const partnerVote = partnerId ? (listing.votes?.[partnerId] || null) : null

  if (myVote === 'like' && partnerVote === 'like') return '#27AE60'
  if (myVote === 'dislike' && partnerVote === 'dislike') return '#E74C3C'
  if (myVote && partnerVote && myVote !== partnerVote) return '#F39C12'
  return '#95A5A6'
}

function createIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 24px; height: 24px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  })
}

function FitBounds({ listings }) {
  const map = useMap()

  useEffect(() => {
    if (listings.length === 0) return

    const bounds = L.latLngBounds(
      listings.map((l) => [l.coordinates.lat, l.coordinates.lng])
    )
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
  }, [listings, map])

  return null
}

function MapPage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { listings, household } = useHouseholdContext()

  const partnerId = household?.memberIds?.find((id) => id !== user.uid) || null

  const geoListings = useMemo(() => {
    return listings.filter(
      (l) => l.status === 'active' && l.coordinates?.lat && l.coordinates?.lng
    )
  }, [listings])

  return (
    <div className={styles.page}>
      <h1>Carte des annonces</h1>
      <p className={styles.subtitle}>{geoListings.length} annonce{geoListings.length > 1 ? 's' : ''} sur la carte</p>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ background: '#27AE60' }} /> Les 2 aiment
        </span>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ background: '#F39C12' }} /> Desaccord
        </span>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ background: '#E74C3C' }} /> Les 2 rejettent
        </span>
        <span className={styles.legendItem}>
          <span className={styles.dot} style={{ background: '#95A5A6' }} /> En attente
        </span>
      </div>

      <div className={styles.mapWrapper}>
        <MapContainer
          center={[FRANCE_CENTER.lat, FRANCE_CENTER.lng]}
          zoom={DEFAULT_ZOOM}
          className={styles.map}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds listings={geoListings} />

          {geoListings.map((listing) => {
            const color = getMarkerColor(listing, user.uid, partnerId)
            return (
              <Marker
                key={listing.id}
                position={[listing.coordinates.lat, listing.coordinates.lng]}
                icon={createIcon(color)}
              >
                <Popup>
                  <div className={styles.popup}>
                    {listing.thumbnail && (
                      <img
                        src={listing.thumbnail}
                        alt=""
                        className={styles.popupImage}
                      />
                    )}
                    <strong>{listing.title || listing.city || 'Annonce'}</strong>
                    <div className={styles.popupDetails}>
                      {listing.price && <span>{formatPrice(listing.price)}</span>}
                      {listing.surface && <span>{formatSurface(listing.surface)}</span>}
                    </div>
                    <button
                      className={styles.popupBtn}
                      onClick={() => navigate(`/listing/${listing.id}`)}
                    >
                      Voir le detail
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}

export default MapPage
