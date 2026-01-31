import { Outlet, Navigate } from 'react-router-dom'
import { useAuthContext } from '../../../contexts/AuthContext'
import { useHouseholdContext } from '../../../contexts/HouseholdContext'
import Header from '../Header/Header'
import HouseholdSetup from './HouseholdSetup'
import Loader from '../../common/Loader/Loader'
import styles from './AppLayout.module.scss'

function AppLayout() {
  const { userProfile } = useAuthContext()
  const { loading } = useHouseholdContext()

  if (loading) return <Loader />

  if (!userProfile?.householdId) {
    return <HouseholdSetup />
  }

  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
