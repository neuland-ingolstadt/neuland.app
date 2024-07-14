import { CircleChevronRight, Info } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'

import 'maplibre-gl/dist/maplibre-gl.css'
import styles from '../../styles/RoomMap.module.css'

export default function AttributionControl({ attribution }) {
  const [clickedOnce, setClickedOnce] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const map = useMap().current

  const attributionRef = useRef(null)
  const [targetWidth, setTargetWidth] = useState(0)

  useEffect(() => {
    function getTargetWidth() {
      if (!attributionRef.current) {
        return
      }

      attributionRef.current.style.width = 'auto'
      const width = attributionRef.current.offsetWidth + 6
      attributionRef.current.style.width = width + 'px'

      attributionRef.current.style.transition =
        'width 0.3s ease-in-out, opacity 0.3s ease-in-out'

      setTargetWidth(width)
    }

    getTargetWidth()
  }, [attributionRef])

  const toggleCollapsed = useCallback(
    (value) => {
      if (!attributionRef.current) {
        return
      }

      const collapsedTemp = value ?? !collapsed

      if (value !== undefined) {
        setCollapsed(value)
      } else {
        setCollapsed((prev) => !prev)
      }

      if (!collapsedTemp) {
        attributionRef.current.style.width = targetWidth + 'px'
        attributionRef.current.style.opacity = '1'
      } else {
        attributionRef.current.style.width = '0px'
        attributionRef.current.style.opacity = '0'
      }
    },
    [collapsed, targetWidth]
  )

  // hides the attribution when the map is moved
  useEffect(() => {
    if (!map) {
      return
    }

    map.on('movestart', () => {
      toggleCollapsed(true)
    })
  }, [collapsed, map, toggleCollapsed])

  // hides the attribution after 5 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('clickedOnce', clickedOnce)

      // if the use opens the attribution, don't hide it
      if (clickedOnce) {
        return
      }

      toggleCollapsed(true)
    }, 5000)

    return () => clearTimeout(timeout)
    // Only run this effect when the user clicks the attribution and on the first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clickedOnce])

  if (!map) {
    return null
  }

  return (
    <div className="maplibregl-ctrl-bottom-right">
      <div
        className={`maplibregl-ctrl ${styles.attributionWrapper} ${styles.ctrlContainer}`}
      >
        <div className={styles.attributionText}>
          <div ref={attributionRef}>{attribution}</div>
        </div>

        <a
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setClickedOnce(true)
            toggleCollapsed()
          }}
          className={styles.attributionButton}
        >
          <div
            className={styles.attributionIcon}
            style={{
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            }}
          >
            {collapsed ? <Info size={20} /> : <CircleChevronRight size={20} />}
          </div>
        </a>
      </div>
    </div>
  )
}
