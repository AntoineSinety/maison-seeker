import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { HouseholdProvider } from './contexts/HouseholdContext'
import ProtectedRoute from './components/auth/ProtectedRoute/ProtectedRoute'
import AppLayout from './components/layout/AppLayout/AppLayout'
import LoginPage from './pages/LoginPage/LoginPage'
import DashboardPage from './pages/DashboardPage/DashboardPage'
import MapPage from './pages/MapPage/MapPage'
import ListingDetailPage from './pages/ListingDetailPage/ListingDetailPage'
import ArchivePage from './pages/ArchivePage/ArchivePage'
import SettingsPage from './pages/SettingsPage/SettingsPage'

function App() {
  return (
    <BrowserRouter basename="/maison-seeker">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<HouseholdProvider><AppLayout /></HouseholdProvider>}>
              <Route index element={<DashboardPage />} />
              <Route path="map" element={<MapPage />} />
              <Route path="listing/:id" element={<ListingDetailPage />} />
              <Route path="archive" element={<ArchivePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
