import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import ReactPlaceholder from 'react-placeholder'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import { NoSessionError, UnavailableSessionError } from '../lib/backend/thi-session-handler'
import API from '../lib/backend/authenticated-api'
import { normalizeLecturers } from '../lib/backend-utils/lecturers-utils'

import styles from '../styles/Lecturers.module.css'

import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', [
      'lecturers',
      'common',
      'api-translations'
    ]))
  }
})

/**
 * Page containing the lecturer search and details.
 */
export default function Lecturers () {
  const router = useRouter()
  const [personalLecturers, setPersonalLecturers] = useState(null)
  const [allLecturers, setAllLecturers] = useState(null)
  const [didFetch, setDidFetch] = useState(false)
  const [filteredLecturers, setFilteredLecturers] = useState(null)
  const [search, setSearch] = useState('')
  const [focusedLecturer, setFocusedLecturer] = useState(null)

  const { t } = useTranslation(['lecturers', 'api-translations'])

  useEffect(() => {
    async function load () {
      try {
        const rawData = await API.getPersonalLecturers()
        const data = normalizeLecturers(rawData)
        setPersonalLecturers(data)
        setFilteredLecturers(data)
      } catch (e) {
        if (e instanceof NoSessionError || e instanceof UnavailableSessionError) {
          router.replace('/login?redirect=lecturers')
        } else {
          console.error(e)
          alert(e)
        }
      }
    }
    load()
  }, [router])

  useEffect(() => {
    async function load () {
      if (!search) {
        setFilteredLecturers(personalLecturers)
        return
      }

      if (!allLecturers) {
        if (didFetch) {
          return
        }

        setDidFetch(true)
        setFilteredLecturers(null)
        try {
          const rawData = await API.getLecturers('0', 'z')
          const data = normalizeLecturers(rawData)
          setAllLecturers(data)
          return
        } catch (e) {
          if (e instanceof NoSessionError) {
            router.replace('/login?redirect=lecturers')
          } else {
            console.error(e)
            alert(e)
          }
          return
        }
      }

      const normalizedSearch = search.toLowerCase().trim()
      const checkField = value => value && value.toString().toLowerCase().includes(normalizedSearch)
      const filtered = allLecturers
        .filter(x => checkField(x.name) ||
          checkField(x.vorname) ||
          checkField(x.email) ||
          checkField(x.tel_dienst) ||
          checkField(x.raum)
        )
        .slice(0, 20)

      setFilteredLecturers(filtered)
    }
    load()
  }, [router, didFetch, search, personalLecturers, allLecturers])

  const getTranslatedFunction = (lecturer) => {
    return t(`apiTranslations.lecturerFunctions.${lecturer.funktion}`, { ns: 'api-translations' })
  }

  const getTranslatedOrganization = (lecturer) => {
    return t(`apiTranslations.lecturerOrganizations.${lecturer.organisation}`, { ns: 'api-translations' })
  }

  return (
    <AppContainer>
      <AppNavbar title={t('lecturers.appbar.title')} />

      <AppBody>
        <Modal size="lg" show={!!focusedLecturer} onHide={() => setFocusedLecturer(null)}>
          {focusedLecturer && (
            <>
              <Modal.Header closeButton>
                <Modal.Title>{focusedLecturer.titel} {focusedLecturer.vorname} {focusedLecturer.name}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <strong>{t('lecturers.modals.details.title')}</strong>: {focusedLecturer.titel}<br />
                <strong>{t('lecturers.modals.details.surname')}</strong>: {focusedLecturer.name}<br />
                <strong>{t('lecturers.modals.details.forename')}</strong>: {focusedLecturer.vorname}<br />
                <strong>{t('lecturers.modals.details.organization')}</strong>: {getTranslatedOrganization(focusedLecturer)}<br />
                <strong>{t('lecturers.modals.details.function')}</strong>: {getTranslatedFunction(focusedLecturer)}<br />

                <strong>{t('lecturers.modals.details.room')}</strong>:{' '}
                {focusedLecturer.room_short && (
                  <Link href={`/rooms?highlight=${focusedLecturer.room_short}`}>
                    {focusedLecturer.raum}
                  </Link>
                )}
                {focusedLecturer.room_short ? '' : (focusedLecturer.raum || t('lecturers.modals.details.not_available'))}
                <br />

                <strong>{t('lecturers.modals.details.email')}</strong>:{' '}
                {focusedLecturer.email.includes('@') && (
                  <a href={`mailto:${focusedLecturer.email}`}>
                    {focusedLecturer.email}
                  </a>
                )}
                {!focusedLecturer.email.includes('@') && (
                  <>
                    {focusedLecturer.email || t('lecturers.modals.details.not_available')}
                  </>
                )}
                <br />

                <strong>{t('lecturers.modals.details.phone')}</strong>:{' '}
                {focusedLecturer.tel_dienst && (
                  <a href={`tel:${focusedLecturer.tel_dienst.split(/\s(?!\d)/)[0]}`}>
                    {focusedLecturer.tel_dienst}
                  </a>
                )}
                {!focusedLecturer.tel_dienst && t('lecturers.modals.details.not_available')}
                <br />

                <strong>{t('lecturers.modals.details.office_hours')}</strong>: {focusedLecturer.sprechstunde}<br />
                <strong>{t('lecturers.modals.details.insights')}</strong>: {focusedLecturer.einsichtnahme}<br />
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setFocusedLecturer(null)}>
                  {t('lecturers.modals.details.actions.close')}
                </Button>
              </Modal.Footer>
            </>
          )}
        </Modal>

        <Form>
          <Form.Group>
            <Form.Control
              as="input"
              placeholder={t('lecturers.search.placeholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </Form.Group>
        </Form>

        <h3>
          {search ? t('lecturers.search.search_results') : t('lecturers.search.personal_lecturers')}
        </h3>
        <ReactPlaceholder type="text" rows={20} ready={filteredLecturers}>
          <ListGroup>
            {filteredLecturers && filteredLecturers.map((x, i) => (
              <ListGroup.Item key={i} className={styles.item} onClick={() => setFocusedLecturer(x)} action>
                <div className={styles.left}>
                  <div className={styles.title}>
                    {x.vorname} {x.name}
                  </div>
                  <div className={styles.details}>
                    {getTranslatedFunction(x)}
                  </div>
                </div>
                <div className={styles.right}>
                    {x.raum && (
                      <>
                        {t('lecturers.body.room')}:{' '}
                        {x.room_short && (
                          <Link href={`/rooms?highlight=${x.room_short}`}>
                            {x.raum}
                          </Link>
                        )}
                        {!x.room_short && x.raum}
                      </>
                    )}
                    {x.raum && x.tel_dienst && (<br />)}
                    {x.tel_dienst && (
                      <a href={`tel:${x.tel_dienst.split(/\s(?!\d)/)[0]}`}>
                        {x.tel_dienst}
                      </a>
                    )}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </ReactPlaceholder>
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
