import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../../contexts/AuthContext'
import { signOut } from '../../../services/auth'
import styles from './Header.module.scss'

function Header() {
  const { user, userProfile } = useAuthContext()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <NavLink to="/">Maison Seeker</NavLink>
      </div>

      <nav className={styles.nav}>
        <NavLink
          to="/"
          end
          className={({ isActive }) => isActive ? styles.active : ''}
        >
          Annonces
        </NavLink>
        <NavLink
          to="/map"
          className={({ isActive }) => isActive ? styles.active : ''}
        >
          Carte
        </NavLink>
        <NavLink
          to="/archive"
          className={({ isActive }) => isActive ? styles.active : ''}
        >
          Archives
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => isActive ? styles.active : ''}
        >
          Reglages
        </NavLink>
      </nav>

      <div className={styles.user}>
        <span className={styles.name}>
          {userProfile?.displayName || user?.email}
        </span>
        <button onClick={handleSignOut} className={styles.logout}>
          Deconnexion
        </button>
      </div>
    </header>
  )
}

export default Header
