import { useState, useMemo } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { useHouseholdContext } from '../../contexts/HouseholdContext'
import ListingImport from '../../components/listings/ListingImport/ListingImport'
import ListingGrid from '../../components/listings/ListingGrid/ListingGrid'
import styles from './DashboardPage.module.scss'

const FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'to_review', label: 'A consulter' },
  { key: 'my_likes', label: 'Mes likes' },
  { key: 'both_like', label: 'Coups de coeur' },
  { key: 'disagree', label: 'Desaccords' },
]

function DashboardPage() {
  const { user } = useAuthContext()
  const { listings, household } = useHouseholdContext()
  const [filter, setFilter] = useState('all')

  const partnerId = household?.memberIds?.find((id) => id !== user.uid) || null

  const activeListings = useMemo(() => {
    return listings.filter((l) => l.status === 'active')
  }, [listings])

  const filteredListings = useMemo(() => {
    return activeListings.filter((listing) => {
      const myVote = listing.votes?.[user.uid] || null
      const partnerVote = partnerId ? (listing.votes?.[partnerId] || null) : null

      switch (filter) {
        case 'to_review':
          return !myVote
        case 'my_likes':
          return myVote === 'like'
        case 'both_like':
          return myVote === 'like' && partnerVote === 'like'
        case 'disagree':
          return (
            myVote && partnerVote &&
            myVote !== partnerVote
          )
        default:
          return true
      }
    })
  }, [activeListings, filter, user.uid, partnerId])

  return (
    <div className={styles.page}>
      <ListingImport />

      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key === 'all' && <span className={styles.count}>{activeListings.length}</span>}
          </button>
        ))}
      </div>

      {filteredListings.length === 0 ? (
        <div className={styles.empty}>
          {activeListings.length === 0
            ? 'Aucune annonce pour le moment. Collez un lien ci-dessus pour commencer.'
            : 'Aucune annonce ne correspond a ce filtre.'
          }
        </div>
      ) : (
        <ListingGrid listings={filteredListings} partnerId={partnerId} />
      )}
    </div>
  )
}

export default DashboardPage
