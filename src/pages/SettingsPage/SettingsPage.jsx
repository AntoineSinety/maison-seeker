import { useAuthContext } from '../../contexts/AuthContext'
import { useHouseholdContext } from '../../contexts/HouseholdContext'
import styles from './SettingsPage.module.scss'

function SettingsPage() {
  const { user, userProfile } = useAuthContext()
  const { household } = useHouseholdContext()

  return (
    <div className={styles.page}>
      <h1>Reglages</h1>

      <section className={styles.section}>
        <h2>Mon compte</h2>
        <div className={styles.info}>
          <div className={styles.row}>
            <span className={styles.label}>Prenom</span>
            <span>{userProfile?.displayName}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Email</span>
            <span>{user?.email}</span>
          </div>
        </div>
      </section>

      {household && (
        <section className={styles.section}>
          <h2>Foyer</h2>
          <div className={styles.info}>
            <div className={styles.row}>
              <span className={styles.label}>Nom</span>
              <span>{household.name}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Membres</span>
              <span>{household.memberIds.length} / 2</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Code d'invitation</span>
              <span className={styles.code}>{household.inviteCode}</span>
            </div>
          </div>
          {household.memberIds.length < 2 && (
            <p className={styles.hint}>
              Partagez ce code avec votre partenaire pour qu'il/elle rejoigne le foyer.
            </p>
          )}
        </section>
      )}
    </div>
  )
}

export default SettingsPage
