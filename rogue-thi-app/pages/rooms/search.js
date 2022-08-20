import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLinux } from '@fortawesome/free-brands-svg-icons'

import AppBody from '../../components/page/AppBody'
import AppContainer from '../../components/page/AppContainer'
import AppNavbar from '../../components/page/AppNavbar'
import AppTabbar from '../../components/page/AppTabbar'

import { BUILDINGS_ALL, DURATION_PRESET, filterRooms, getNextValidDate } from '../../lib/backend-utils/rooms-utils'
import { formatFriendlyTime, formatISODate, formatISOTime } from '../../lib/date-utils'
import { NoSessionError } from '../../lib/backend/thi-session-handler'

import styles from '../../styles/RoomsSearch.module.css'

const BUILDINGS = ['A', 'B', 'BN', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'M', 'P', 'W', 'Z']
const DURATIONS = ['00:15', '00:30', '00:45', '01:00', '01:15', '01:30', '01:45', '02:00', '02:15', '02:30', '02:45', '03:00', '03:15', '03:30', '03:45', '04:00', '04:15', '04:30', '04:45', '05:00', '05:15', '05:30', '05:45', '06:00']
const TUX_ROOMS = ['G308']

export default function Rooms () {
  const router = useRouter()
  const startDate = getNextValidDate()

  const [building, setBuilding] = useState(BUILDINGS_ALL)
  const [date, setDate] = useState(formatISODate(startDate))
  const [time, setTime] = useState(formatISOTime(startDate))
  const [duration, setDuration] = useState(DURATION_PRESET)

  const [searching, setSearching] = useState(false)
  const [filterResults, setFilterResults] = useState(null)

  const filter = useCallback(async () => {
    setSearching(true)
    setFilterResults(null)

    const rooms = await filterRooms(date, time, building, duration)

    console.log(`Found ${rooms.length} results`)
    setFilterResults(rooms)
  }, [building, date, duration, time])

  useEffect(() => {
    async function load () {
      try {
        await filter()
      } catch (e) {
        if (e instanceof NoSessionError) {
          router.replace('/login?redirect=rooms%2Fsearch')
        } else {
          console.error(e)
          alert(e)
        }
      }
    }
    load()
  }, [filter, router])

  return (
    <AppContainer>
      <AppNavbar title="Erweiterte Raumsuche" />

      <AppBody>
        <Form>
          <div className={styles.searchForm}>
            <Form.Group>
              <Form.Label>
                Gebäude
              </Form.Label>
              <Form.Control
                as="select"
                value={building}
                onChange={e => setBuilding(e.target.value)}
              >
                <option key={BUILDINGS_ALL}>{BUILDINGS_ALL}</option>
                {BUILDINGS.map(b => <option key={b}>{b}</option>)}
              </Form.Control>
            </Form.Group>
            <Form.Group>
              <Form.Label>
                Datum
              </Form.Label>
              <Form.Control
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>
                Uhrzeit
              </Form.Label>
              <Form.Control
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>
                Dauer
              </Form.Label>
              <Form.Control
                as="select"
                value={duration}
                onChange={e => setDuration(e.target.value)}
              >
                {DURATIONS.map(d => <option key={d}>{d}</option>)}
              </Form.Control>
            </Form.Group>
          </div>
          <Button onClick={() => filter()}>
            Suchen
          </Button>
        </Form>

        <br />

        {searching &&
          <ReactPlaceholder type="text" rows={10} ready={filterResults}>
            <ListGroup>
              {filterResults && filterResults.map((result, idx) =>
                <ListGroup.Item key={idx} className={styles.item}>
                  <div className={styles.left}>
                    <Link href={`/rooms?highlight=${result.room}`}>
                      {result.room}
                    </Link>
                    {TUX_ROOMS.includes(result.room) && <> <FontAwesomeIcon title="Linux" icon={faLinux} /></>}
                    <div className={styles.details}>
                      {result.type}
                    </div>
                  </div>
                  <div className={styles.right}>
                    frei ab {formatFriendlyTime(result.from)}<br />
                    bis {formatFriendlyTime(result.until)}
                  </div>
                </ListGroup.Item>
              )}
              {filterResults && filterResults.length === 0 &&
                <ListGroup.Item className={styles.item}>
                  Keine freien Räume gefunden.
                </ListGroup.Item>
              }
            </ListGroup>
          </ReactPlaceholder>
        }
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
