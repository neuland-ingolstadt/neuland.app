import styles from '../../styles/RoomMap.module.css'
import { useTranslation } from 'next-i18next'

export default function FloorControl({
  floors,
  currentFloor,
  setCurrentFloor,
}) {
  const { t } = useTranslation(['rooms', 'api-translations'])

  function translateFloor(floor) {
    const translated = t(`rooms.map.floors.${floor.toLowerCase()}`)

    if (translated.startsWith('rooms.')) {
      return floor
    }

    return translated
  }

  return (
    <div className="maplibregl-ctrl-top-right">
      <div
        className={`maplibregl-ctrl ${styles.floorControl} ${styles.ctrlContainer}`}
      >
        {floors.map((floor) => (
          <span
            key={floor}
            className={`maplibregl-ctrl-icon ${styles.floorButton} ${
              currentFloor === floor ? styles.floorButtonActive : ''
            }`}
            onClick={() => setCurrentFloor(floor)}
          >
            {translateFloor(floor)}
          </span>
        ))}
      </div>
    </div>
  )
}
