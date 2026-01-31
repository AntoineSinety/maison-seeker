import { useAuthContext } from '../../../contexts/AuthContext'
import { useHouseholdContext } from '../../../contexts/HouseholdContext'
import { voteListing } from '../../../services/listings'
import styles from './VoteControls.module.scss'

function VoteControls({ listing, compact = false }) {
  const { user } = useAuthContext()
  const { householdId, household } = useHouseholdContext()

  const myVote = listing.votes?.[user.uid] || null
  const partnerId = household?.memberIds?.find((id) => id !== user.uid)
  const partnerVote = partnerId ? (listing.votes?.[partnerId] || null) : null

  const handleVote = async (vote) => {
    const newVote = myVote === vote ? null : vote
    await voteListing(householdId, listing.id, user.uid, newVote)
  }

  // Icones SVG
  const ThumbUp = ({ filled }) => (
    <svg width={compact ? 14 : 18} height={compact ? 14 : 18} viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  )

  const ThumbDown = ({ filled }) => (
    <svg width={compact ? 14 : 18} height={compact ? 14 : 18} viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
      <path d="M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
    </svg>
  )

  if (compact) {
    return (
      <div className={styles.compactContainer}>
        {/* Mon vote */}
        <div className={styles.compactMyVotes}>
          <button
            className={`${styles.compactBtn} ${myVote === 'like' ? styles.compactLikeActive : ''}`}
            onClick={() => handleVote('like')}
            title="J'aime"
          >
            <ThumbUp filled={myVote === 'like'} />
          </button>
          <button
            className={`${styles.compactBtn} ${myVote === 'dislike' ? styles.compactDislikeActive : ''}`}
            onClick={() => handleVote('dislike')}
            title="Je n'aime pas"
          >
            <ThumbDown filled={myVote === 'dislike'} />
          </button>
        </div>

        {/* Vote partenaire */}
        {partnerId && (
          <div className={styles.compactPartner}>
            {partnerVote === 'like' && (
              <span className={styles.compactPartnerLike} title="Partenaire aime">
                <ThumbUp filled /> Oui
              </span>
            )}
            {partnerVote === 'dislike' && (
              <span className={styles.compactPartnerDislike} title="Partenaire n'aime pas">
                <ThumbDown filled /> Non
              </span>
            )}
            {!partnerVote && (
              <span className={styles.compactPartnerWaiting} title="En attente du partenaire">
                ?
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.fullContainer}>
      {/* Mon vote */}
      <div className={styles.voteRow}>
        <span className={styles.label}>Mon avis</span>
        <div className={styles.voteBtns}>
          <button
            className={`${styles.voteBtn} ${myVote === 'like' ? styles.likeActive : ''}`}
            onClick={() => handleVote('like')}
          >
            <ThumbUp filled={myVote === 'like'} />
            <span>J'aime</span>
          </button>
          <button
            className={`${styles.voteBtn} ${myVote === 'dislike' ? styles.dislikeActive : ''}`}
            onClick={() => handleVote('dislike')}
          >
            <ThumbDown filled={myVote === 'dislike'} />
            <span>Je n'aime pas</span>
          </button>
        </div>
      </div>

      {/* Vote partenaire */}
      {partnerId && (
        <div className={styles.voteRow}>
          <span className={styles.label}>Partenaire</span>
          <div className={styles.partnerStatus}>
            {partnerVote === 'like' && (
              <span className={styles.partnerBadgeLike}>
                <ThumbUp filled /> Aime
              </span>
            )}
            {partnerVote === 'dislike' && (
              <span className={styles.partnerBadgeDislike}>
                <ThumbDown filled /> N'aime pas
              </span>
            )}
            {!partnerVote && (
              <span className={styles.partnerBadgeWaiting}>
                Pas encore vote
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default VoteControls
