import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../../contexts/AuthContext'
import { useHouseholdContext } from '../../../contexts/HouseholdContext'
import { formatPrice, formatSurface } from '../../../utils/formatters'
import VoteControls from '../VoteControls/VoteControls'
import styles from './ListingCard.module.scss'

const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250" fill="%23E0DCD5"%3E%3Crect width="400" height="250"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%236B6B6B"%3EPas d\'image%3C/text%3E%3C/svg%3E'

function ListingCard({ listing, partnerId }) {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { members } = useHouseholdContext()

  const importerName = listing.importedBy === user.uid
    ? 'Moi'
    : (members[listing.importedBy]?.displayName?.split(' ')[0] || 'Partenaire')

  const isNew = listing.importedBy !== user.uid
    && (!listing.lastSeenBy?.[user.uid])

  const handleClick = () => {
    navigate(`/listing/${listing.id}`)
  }

  return (
    <article className={styles.card} onClick={handleClick}>
      <div className={styles.imageWrapper}>
        <img
          src={listing.thumbnail || PLACEHOLDER_IMG}
          alt={listing.title || 'Annonce'}
          className={styles.image}
          onError={(e) => { e.target.src = PLACEHOLDER_IMG }}
        />
        {isNew && <span className={styles.badge}>Nouveau</span>}
        {listing.sourceSite && (
          <span className={styles.source}>{listing.sourceSite}</span>
        )}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>
          {listing.title || 'Annonce sans titre'}
        </h3>

        <div className={styles.details}>
          {listing.price && (
            <span className={styles.price}>{formatPrice(listing.price)}</span>
          )}
          {listing.surface && (
            <span className={styles.surface}>{formatSurface(listing.surface)}</span>
          )}
          {listing.rooms && (
            <span className={styles.rooms}>{listing.rooms}p</span>
          )}
          {(listing.city || listing.postalCode) && (
            <span className={styles.city}>
              {listing.city}{listing.postalCode ? ` (${listing.postalCode})` : ''}
            </span>
          )}
        </div>

        {listing.notes && (
          <p className={styles.notes}>{listing.notes}</p>
        )}

        <div className={styles.footer} onClick={(e) => e.stopPropagation()}>
          <VoteControls listing={listing} compact />
          <div className={styles.footerRight}>
            <span className={styles.importedBy}>
              {importerName}
            </span>
            <a
              href={listing.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.externalLink}
              title="Voir l'annonce originale"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}

export default ListingCard
