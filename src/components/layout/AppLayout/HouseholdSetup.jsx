import { useState } from 'react'
import { useAuthContext } from '../../../contexts/AuthContext'
import { createHousehold, joinHousehold } from '../../../services/households'
import { signOut } from '../../../services/auth'
import styles from './HouseholdSetup.module.scss'

function HouseholdSetup() {
  const { user } = useAuthContext()
  const [mode, setMode] = useState(null) // 'create' | 'join'
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [createdCode, setCreatedCode] = useState(null)

  const handleCreate = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await createHousehold(user.uid, name)
      setCreatedCode(result.inviteCode)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await joinHousehold(user.uid, inviteCode)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (createdCode) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h2>Foyer cree !</h2>
          <p>Partagez ce code avec votre partenaire :</p>
          <div className={styles.code}>{createdCode}</div>
          <p className={styles.hint}>
            Votre partenaire devra entrer ce code apres son inscription.
            La page se mettra a jour automatiquement.
          </p>
        </div>
      </div>
    )
  }

  if (!mode) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h2>Bienvenue sur Maison Seeker</h2>
          <p>Pour commencer, creez ou rejoignez un foyer.</p>

          <div className={styles.choices}>
            <button onClick={() => setMode('create')} className={styles.choiceBtn}>
              Creer un foyer
            </button>
            <button onClick={() => setMode('join')} className={styles.choiceBtnSecondary}>
              Rejoindre un foyer
            </button>
          </div>

          <button onClick={signOut} className={styles.logoutLink}>
            Se deconnecter
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2>{mode === 'create' ? 'Creer un foyer' : 'Rejoindre un foyer'}</h2>

        {error && <p className={styles.error}>{error}</p>}

        {mode === 'create' ? (
          <form onSubmit={handleCreate}>
            <label className={styles.field}>
              <span>Nom du foyer</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Alice & Bob"
                required
              />
            </label>
            <button type="submit" className={styles.choiceBtn} disabled={loading}>
              {loading ? 'Creation...' : 'Creer'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin}>
            <label className={styles.field}>
              <span>Code d'invitation</span>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABCD1234"
                maxLength={8}
                required
              />
            </label>
            <button type="submit" className={styles.choiceBtn} disabled={loading}>
              {loading ? 'Connexion...' : 'Rejoindre'}
            </button>
          </form>
        )}

        <button onClick={() => { setMode(null); setError(null) }} className={styles.logoutLink}>
          Retour
        </button>
      </div>
    </div>
  )
}

export default HouseholdSetup
