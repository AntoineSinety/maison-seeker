import { useMemo } from 'react'
import { useHouseholdContext } from '../../contexts/HouseholdContext'
import { useAuthContext } from '../../contexts/AuthContext'
import ListingGrid from '../../components/listings/ListingGrid/ListingGrid'
import styles from './ArchivePage.module.scss'

function ArchivePage() {
  const { user } = useAuthContext()
  const { listings, household } = useHouseholdContext()

  const partnerId = household?.memberIds?.find((id) => id !== user.uid) || null

  const archivedListings = useMemo(() => {
    return listings.filter((l) => l.status === 'archived')
  }, [listings])

  return (
    <div className={styles.page}>
      <h1>Archives</h1>
      <p className={styles.subtitle}>
        {archivedListings.length} annonce{archivedListings.length > 1 ? 's' : ''} archivee{archivedListings.length > 1 ? 's' : ''}
      </p>

      {archivedListings.length === 0 ? (
        <div className={styles.empty}>
          Aucune annonce archivee pour le moment.
        </div>
      ) : (
        <ListingGrid listings={archivedListings} partnerId={partnerId} />
      )}
    </div>
  )
}

export default ArchivePage
