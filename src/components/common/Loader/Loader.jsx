import styles from './Loader.module.scss'

function Loader() {
  return (
    <div className={styles.container}>
      <div className={styles.spinner} />
    </div>
  )
}

export default Loader
