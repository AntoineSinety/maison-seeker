import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '../../../contexts/AuthContext'
import Loader from '../../common/Loader/Loader'

function ProtectedRoute() {
  const { user, loading } = useAuthContext()

  if (loading) return <Loader />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

export default ProtectedRoute
