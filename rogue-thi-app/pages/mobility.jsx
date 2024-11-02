import React, { useEffect, useState } from 'react'

import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import {
  RenderMobilityEntry,
  getMobilityEntries,
  getMobilityLabel,
  getMobilitySettings,
} from '../lib/backend-utils/mobility-utils'
import stations from '../data/mobility.json'
import { useTime } from '../lib/hooks/time-hook'

import styles from '../styles/Mobility.module.css'
import { useTranslation } from 'next-i18next'

import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function Bus() {
  const time = useTime()
  const [kind, setKind] = useState(null)
  const [station, setStation] = useState(null)
  const [data, setData] = useState(null)
  const [dataError, setDataError] = useState(null)
  const { t } = useTranslation('mobility')

  useEffect(() => {
    const { kind, station } = getMobilitySettings()
    setKind(kind)
    setStation(station)
  }, [])

  useEffect(() => {
    async function load() {
      try {
        if (kind) {
          localStorage.mobilityKind = kind
          setData(null)
          setDataError(null)
          setData(await getMobilityEntries(kind, station))
        } else {
          delete localStorage.mobilityKind
        }
        if (station) {
          localStorage.mobilityStationV2 = station
        } else {
          delete localStorage.mobilityStationV2
        }
      } catch (e) {
        setDataError(e.message)
      }
    }
    load()
  }, [kind, station, time])

  /**
   * Changes the mobility type.
   * @param {string} kind Mobility type (either `bus`, `train`, `parking` or `charging`)
   */
  function changeKind(kind) {
    setKind(kind)
    setData(null)
    if (kind === 'bus' || kind === 'train') {
      setStation(stations[kind].defaultStation)
    } else {
      setStation(null)
    }
  }

  return (
    <AppContainer>
      <AppNavbar title={getMobilityLabel(kind, station, t)} />

      <AppBody>
        <Form className={styles.stationForm}>
          <Form.Group>
            <Form.Label>{t('form.type.label')}</Form.Label>
            <Form.Control
              as="select"
              value={kind}
              onChange={(e) => changeKind(e.target.value)}
            >
              <option value="bus">{t('form.type.option.bus')}</option>
              <option value="train">{t('form.type.option.train')}</option>
              <option value="parking">{t('form.type.option.parking')}</option>
              <option value="charging">{t('form.type.option.charging')}</option>
              ç
            </Form.Control>
          </Form.Group>
          {(kind === 'bus' || kind === 'train') && (
            <Form.Group>
              <Form.Label>
                {kind === 'bus'
                  ? t('form.station.label.bus')
                  : t('form.station.label.train')}
              </Form.Label>
              <Form.Control
                as="select"
                value={station || ''}
                onChange={(e) => setStation(e.target.value)}
              >
                {kind &&
                  stations[kind].stations.map((station) => (
                    <option
                      key={station.id}
                      value={station.id}
                    >
                      {station.name}
                    </option>
                  ))}
              </Form.Control>
            </Form.Group>
          )}
        </Form>

        <ListGroup>
          <ReactPlaceholder
            type="text"
            rows={10}
            ready={data || dataError}
          >
            {dataError && (
              <ListGroup.Item className={styles.mobilityItem}>
                {t('transport.error.retrieval')}
                <br />
                {dataError}
              </ListGroup.Item>
            )}
            {data && data.length === 0 && (
              <ListGroup.Item className={styles.mobilityItem}>
                {t('transport.details.noElements')}
              </ListGroup.Item>
            )}
            {data &&
              data.map((item, idx) => (
                <ListGroup.Item
                  key={idx}
                  className={styles.mobilityItem}
                >
                  <RenderMobilityEntry
                    kind={kind}
                    item={item}
                    maxLen={200}
                    styles={styles}
                    detailed={true}
                    t={t}
                  />
                </ListGroup.Item>
              ))}
          </ReactPlaceholder>
        </ListGroup>

        <AppTabbar />
      </AppBody>
    </AppContainer>
  )
}

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['mobility', 'common'])),
  },
})
