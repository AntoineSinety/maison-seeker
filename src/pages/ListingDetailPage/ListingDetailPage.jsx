import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'
import { useHouseholdContext } from '../../contexts/HouseholdContext'
import { markSeen, updateListing, archiveListing, unarchiveListing, deleteListing } from '../../services/listings'
import { geocodeCity } from '../../services/geocoding'
import { formatPrice, formatSurface, formatDate } from '../../utils/formatters'
import VoteControls from '../../components/listings/VoteControls/VoteControls'
import styles from './ListingDetailPage.module.scss'

function PhotoGallery({ photos, title }) {
  const [current, setCurrent] = useState(0)

  const goTo = (idx) => {
    setCurrent(Math.max(0, Math.min(idx, photos.length - 1)))
  }

  return (
    <div className={styles.gallery}>
      <div className={styles.galleryMain}>
        <img
          src={photos[current]}
          alt={`${title || 'Photo'} ${current + 1}`}
          className={styles.mainImage}
          onError={(e) => { e.target.style.display = 'none' }}
        />
        {photos.length > 1 && (
          <>
            <button
              className={styles.galleryPrev}
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
            >
              &#8249;
            </button>
            <button
              className={styles.galleryNext}
              onClick={() => goTo(current + 1)}
              disabled={current === photos.length - 1}
            >
              &#8250;
            </button>
            <span className={styles.galleryCount}>{current + 1} / {photos.length}</span>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className={styles.thumbs}>
          {photos.map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className={`${styles.thumb} ${i === current ? styles.thumbActive : ''}`}
              onClick={() => setCurrent(i)}
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ListingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { listings, householdId, members } = useHouseholdContext()

  const listing = listings.find((l) => l.id === id)

  const [editing, setEditing] = useState(false)
  const [editCity, setEditCity] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editSurface, setEditSurface] = useState('')
  const [editNotes, setEditNotes] = useState('')

  // Mark as seen on mount
  useEffect(() => {
    if (listing && householdId) {
      markSeen(householdId, listing.id, user.uid)
    }
  }, [listing?.id, householdId, user.uid])

  if (!listing) {
    return (
      <div className={styles.notFound}>
        <p>Annonce introuvable</p>
        <button onClick={() => navigate('/')}>Retour</button>
      </div>
    )
  }

  const startEdit = () => {
    setEditCity(listing.city || '')
    setEditPrice(listing.price?.toString() || '')
    setEditSurface(listing.surface?.toString() || '')
    setEditNotes(listing.notes || '')
    setEditing(true)
  }

  const saveEdit = async () => {
    const coordinates = editCity ? await geocodeCity(editCity, listing.postalCode) : listing.coordinates
    await updateListing(householdId, listing.id, {
      city: editCity,
      price: editPrice ? parseInt(editPrice, 10) : null,
      surface: editSurface ? parseInt(editSurface, 10) : null,
      notes: editNotes,
      coordinates,
    })
    setEditing(false)
  }

  const handleArchive = async () => {
    if (listing.status === 'archived') {
      await unarchiveListing(householdId, listing.id)
    } else {
      await archiveListing(householdId, listing.id)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Supprimer cette annonce ?')) {
      await deleteListing(householdId, listing.id)
      navigate('/')
    }
  }

  return (
    <div className={styles.page}>
      <button onClick={() => navigate(-1)} className={styles.back}>
        Retour
      </button>

      <div className={styles.layout}>
        <div className={styles.imageSection}>
          {listing.photos?.length > 0 ? (
            <PhotoGallery photos={listing.photos} title={listing.title} />
          ) : listing.thumbnail ? (
            <img
              src={listing.thumbnail}
              alt={listing.title}
              className={styles.mainImage}
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className={styles.noImage}>Pas d'image</div>
          )}
        </div>

        <div className={styles.infoSection}>
          <div className={styles.header}>
            <h1>{listing.title || 'Annonce sans titre'}</h1>
            {listing.sourceSite && (
              <span className={styles.source}>{listing.sourceSite}</span>
            )}
          </div>

          <div className={styles.keyInfo}>
            {listing.price && (
              <span className={styles.price}>{formatPrice(listing.price)}</span>
            )}
            {listing.surface && (
              <span className={styles.surface}>{formatSurface(listing.surface)}</span>
            )}
            {listing.rooms && (
              <span className={styles.surface}>{listing.rooms} piece{listing.rooms > 1 ? 's' : ''}</span>
            )}
            {listing.bedrooms && (
              <span className={styles.surface}>{listing.bedrooms} chambre{listing.bedrooms > 1 ? 's' : ''}</span>
            )}
            {listing.city && (
              <span className={styles.city}>
                {listing.city}{listing.postalCode ? ` (${listing.postalCode})` : ''}
              </span>
            )}
          </div>

          {(listing.propertyType || listing.energyClass || listing.ghgClass) && (
            <div className={styles.badges}>
              {listing.propertyType && (
                <span className={styles.badgeInfo}>{listing.propertyType}</span>
              )}
              {listing.energyClass && (
                <span className={styles.badgeDpe}>DPE : {listing.energyClass}</span>
              )}
              {listing.ghgClass && (
                <span className={styles.badgeGes}>GES : {listing.ghgClass}</span>
              )}
            </div>
          )}

          <div className={styles.voteSection}>
            <VoteControls listing={listing} />
          </div>

          {listing.description && (
            <div className={styles.description}>
              <h3>Description</h3>
              <p>{listing.description}</p>
            </div>
          )}

          {!editing && listing.notes && (
            <div className={styles.notes}>
              <h3>Notes</h3>
              <p>{listing.notes}</p>
            </div>
          )}

          {editing ? (
            <div className={styles.editForm}>
              <h3>Modifier</h3>
              <div className={styles.editFields}>
                <label>
                  <span>Ville</span>
                  <input type="text" value={editCity} onChange={(e) => setEditCity(e.target.value)} />
                </label>
                <label>
                  <span>Prix (EUR)</span>
                  <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                </label>
                <label>
                  <span>Surface (m2)</span>
                  <input type="number" value={editSurface} onChange={(e) => setEditSurface(e.target.value)} />
                </label>
                <label className={styles.fullWidth}>
                  <span>Notes</span>
                  <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} />
                </label>
              </div>
              <div className={styles.editActions}>
                <button onClick={saveEdit} className={styles.saveBtn}>Sauvegarder</button>
                <button onClick={() => setEditing(false)} className={styles.cancelBtn}>Annuler</button>
              </div>
            </div>
          ) : null}

          <div className={styles.meta}>
            <span>
              Ajoute par {listing.importedBy === user.uid ? 'moi' : (members[listing.importedBy]?.displayName?.split(' ')[0] || 'partenaire')} le {formatDate(listing.importedAt)}
            </span>
            {listing.status === 'archived' && (
              <span className={styles.archivedBadge}>Archive</span>
            )}
          </div>

          <div className={styles.actions}>
            <a
              href={listing.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.linkBtn}
            >
              Voir l'annonce originale
            </a>
            {!editing && (
              <button onClick={startEdit} className={styles.editBtn}>
                Modifier
              </button>
            )}
            <button onClick={handleArchive} className={styles.archiveBtn}>
              {listing.status === 'archived' ? 'Desarchiver' : 'Archiver'}
            </button>
            <button onClick={handleDelete} className={styles.deleteBtn}>
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListingDetailPage
