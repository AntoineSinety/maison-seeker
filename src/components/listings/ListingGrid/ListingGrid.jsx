import ListingCard from '../ListingCard/ListingCard'
import styles from './ListingGrid.module.scss'

function ListingGrid({ listings, partnerId }) {
  return (
    <div className={styles.grid}>
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} partnerId={partnerId} />
      ))}
    </div>
  )
}

export default ListingGrid
