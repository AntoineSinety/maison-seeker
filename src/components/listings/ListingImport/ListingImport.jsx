import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../../services/firebase'
import { useAuthContext } from '../../../contexts/AuthContext'
import { useHouseholdContext } from '../../../contexts/HouseholdContext'
import { addListing } from '../../../services/listings'
import { geocodeCity } from '../../../services/geocoding'
import { isValidListingUrl, detectSite } from '../../../utils/validators'
import styles from './ListingImport.module.scss'

function ListingImport() {
  const { user } = useAuthContext()
  const { householdId } = useHouseholdContext()

  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)

  const [city, setCity] = useState('')
  const [price, setPrice] = useState('')
  const [surface, setSurface] = useState('')
  const [rooms, setRooms] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [notes, setNotes] = useState('')

  const handleFetch = async (e) => {
    e.preventDefault()

    if (!isValidListingUrl(url)) {
      setError('URL non reconnue. Sites supportes : leboncoin.fr, seloger.com, bienici.com')
      return
    }

    setLoading(true)
    setError(null)
    setPreview(null)

    try {
      const fetchMetadata = httpsCallable(functions, 'fetchMetadata')
      const result = await fetchMetadata({ url })
      const data = result.data

      setPreview(data)
      setCity(data.city || '')
      setPrice(data.price ? String(data.price) : '')
      setSurface(data.surface ? String(data.surface) : '')
      setRooms(data.rooms ? String(data.rooms) : '')
      setBedrooms(data.bedrooms ? String(data.bedrooms) : '')
      setNotes('')
    } catch (err) {
      setError('Impossible de recuperer les infos. Verifiez le lien et reessayez.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)

    try {
      const coordinates = city ? await geocodeCity(city, preview?.postalCode) : null

      await addListing(householdId, {
        sourceUrl: url,
        sourceSite: detectSite(url),
        title: preview?.title || '',
        description: preview?.description || '',
        photos: preview?.photos || [],
        thumbnail: preview?.thumbnail || '',
        price: price ? parseInt(price, 10) : null,
        surface: surface ? parseInt(surface, 10) : null,
        rooms: rooms ? parseInt(rooms, 10) : null,
        bedrooms: bedrooms ? parseInt(bedrooms, 10) : null,
        city: city || '',
        postalCode: preview?.postalCode || '',
        propertyType: preview?.propertyType || '',
        energyClass: preview?.energyClass || '',
        ghgClass: preview?.ghgClass || '',
        notes,
        coordinates,
        importedBy: user.uid,
      })

      setUrl('')
      setPreview(null)
      setCity('')
      setPrice('')
      setSurface('')
      setRooms('')
      setBedrooms('')
      setNotes('')
    } catch (err) {
      setError('Erreur lors de la sauvegarde.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setPreview(null)
    setError(null)
  }

  return (
    <div className={styles.container}>
      {!preview ? (
        <form className={styles.urlForm} onSubmit={handleFetch}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Coller un lien leboncoin, seloger ou bienici..."
            disabled={loading}
            className={styles.urlInput}
          />
          <button type="submit" disabled={loading || !url} className={styles.fetchBtn}>
            {loading ? 'Chargement...' : 'Importer'}
          </button>
        </form>
      ) : (
        <div className={styles.preview}>
          <div className={styles.previewHeader}>
            <h3>Apercu de l'annonce</h3>
            <button onClick={handleCancel} className={styles.cancelBtn}>Annuler</button>
          </div>

          {preview.thumbnail && (
            <img
              src={preview.thumbnail}
              alt={preview.title}
              className={styles.previewImage}
              onError={(e) => { e.target.style.display = 'none' }}
            />
          )}

          {preview.title && (
            <p className={styles.previewTitle}>{preview.title}</p>
          )}

          {preview.description && (
            <p className={styles.previewDesc}>{preview.description}</p>
          )}

          <div className={styles.fields}>
            <label className={styles.field}>
              <span>Ville</span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Lyon"
              />
            </label>

            <label className={styles.field}>
              <span>Prix (EUR)</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="285000"
              />
            </label>

            <label className={styles.field}>
              <span>Surface (m2)</span>
              <input
                type="number"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                placeholder="95"
              />
            </label>

            <label className={styles.field}>
              <span>Pieces</span>
              <input
                type="number"
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                placeholder="4"
              />
            </label>

            <label className={styles.field}>
              <span>Chambres</span>
              <input
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                placeholder="3"
              />
            </label>

            <label className={styles.field}>
              <span>Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Vos observations..."
                rows={2}
              />
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className={styles.saveBtn}
          >
            {loading ? 'Sauvegarde...' : 'Ajouter l\'annonce'}
          </button>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}

export default ListingImport
