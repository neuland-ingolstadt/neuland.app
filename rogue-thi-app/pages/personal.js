import React, { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import { NoSessionError, UnavailableSessionError, forgetSession } from '../lib/backend/thi-session-handler'
import API from '../lib/backend/authenticated-api'

import styles from '../styles/Personal.module.css'
import themes from '../data/themes.json'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRightFromBracket,
  faBug,
  faChevronRight,
  faExternalLink,
  faGavel,
  faShield
} from '@fortawesome/free-solid-svg-icons'
import { calculateECTS, loadGradeAverage, loadGrades } from '../lib/backend-utils/grades-utils'
import PersonalizeModal from '../components/modal/PersonalizeModal'
import { ShowThemeModal, ThemeContext } from './_app'
import Button from 'react-bootstrap/Button'

export default function Personal () {
  const [userdata, setUserdata] = useState(null)
  const [average, setAverage] = useState(null)
  const [ects, setEcts] = useState(null)
  const [grades, setGrades] = useState(null)
  const [missingGrades, setMissingGrades] = useState(null)
  const [showDebug, setShowDebug] = useState(false)
  const [showThemeModal, setShowThemeModal] = useContext(ShowThemeModal)
  const theme = useContext(ThemeContext)
  const router = useRouter()

  useEffect(() => {
    async function load () {
      try {
        const response = await API.getPersonalData()
        const data = response.persdata
        data.pcounter = response.pcounter
        setUserdata(data)

        const average = await loadGradeAverage()
        setAverage(average)

        const { finished, missing } = await loadGrades()
        setGrades(finished)
        setMissingGrades(missing)

        const j = await calculateECTS()
        setEcts(j)
      } catch (e) {
        if (e instanceof NoSessionError || e instanceof UnavailableSessionError) {
          router.replace('/login?redirect=personal')
        } else {
          console.error(e)
          alert(e)
        }
      }

      if (localStorage.debugUnlocked) {
        setShowDebug(true)
      }
    }

    load()
  }, [router])

  return (<AppContainer>
    <AppNavbar title="Dein Profil"/>

    <AppBody>
      <ReactPlaceholder type="text" rows={20} ready={userdata}>

        <ListGroup>
          <ListGroup.Item action>
            <div className={styles.name_interaction_icon}>
              <FontAwesomeIcon icon={faChevronRight} className="text-muted"/>
            </div>
            {userdata && userdata.name + ', ' + userdata.vname}<br/>
            {userdata && userdata.fachrich}
          </ListGroup.Item>

          <ListGroup.Item className="text-muted">
            <span className={userdata ? styles.personal_value : styles.personal_value_loading}>
            {userdata && userdata.stgru + '. Semester'}<br/>
            <a
              /* see: https://github.com/neuland-ingolstadt/THI-App/issues/90#issuecomment-924768749 */
              href={userdata?.po_url && userdata.po_url.replace('verwaltung-und-stabsstellen', 'hochschulorganisation')}
              target="_blank"
              rel="noreferrer">
            Deine SPO <FontAwesomeIcon icon={faExternalLink}/>
            </a>
            </span>
            {userdata && 'Mat.-Nr: ' + userdata.mtknr}<br/>
            {userdata && 'Bib.-Nr: ' + userdata.bibnr}
          </ListGroup.Item>

          <ListGroup.Item action onClick={() => window.open('/grades', '_self')}>
            <div className={styles.interaction_icon}>
              <span className="text-muted">
                {grades && missingGrades && grades.length + '/' + (grades.length + missingGrades.length)}{' '}Noten{' '}
                <FontAwesomeIcon icon={faChevronRight}/>
              </span>
            </div>
            <span className="text-muted">
              {ects && ects + ' ECTS'}
              {average && ' · '}
              {average && '∅ ' + average}
            </span>
          </ListGroup.Item>

        </ListGroup>

        <br/>

        <ListGroup>

          {themes.filter(item => item.style.includes(theme[0])).map(item => (
            <ListGroup.Item action onClick={() => setShowThemeModal(true)} key={item.style}>
              <div className={styles.interaction_icon}>
            <span className="text-muted">
              {item.name}{' '}
              <FontAwesomeIcon icon={faChevronRight}/>
            </span>
              </div>
              Theme
            </ListGroup.Item>
          ))}

          <ListGroup.Item action>
            <div className={styles.interaction_icon}>
            <span className="text-muted">
              Allergene{' '}
              <FontAwesomeIcon icon={faChevronRight}/>
            </span>
            </div>
            Einstellungen
          </ListGroup.Item>

        </ListGroup>

        <br/>

        <ListGroup>

          <ListGroup.Item action onClick={() => window.open('https://www3.primuss.de/cgi-bin/login/index.pl?FH=fhin', '_blank')}>
            <FontAwesomeIcon icon={faExternalLink} className={styles.interaction_icon}/>
            Primuss
          </ListGroup.Item>

          <ListGroup.Item action onClick={() => window.open('https://moodle.thi.de/moodle', '_blank')}>
            <FontAwesomeIcon icon={faExternalLink} className={styles.interaction_icon}/>
            Moodle
          </ListGroup.Item>

          <ListGroup.Item action onClick={() => window.open('https://outlook.thi.de/', '_blank')}>
            <FontAwesomeIcon icon={faExternalLink} className={styles.interaction_icon}/>
            E-Mail
          </ListGroup.Item>

          <ListGroup.Item action onClick={() => window.open('https://mythi.de', '_blank')}>
            <FontAwesomeIcon icon={faExternalLink} className={styles.interaction_icon}/>
            MyTHI (Beschäftigten Portal)
          </ListGroup.Item>

        </ListGroup>

        <br/>

        <ListGroup>

          {showDebug && (
            <ListGroup.Item action onClick={() => window.open('/debug', '_self')}>
              <FontAwesomeIcon icon={faBug} className={styles.interaction_icon}/>
              API Spielwiese
            </ListGroup.Item>
          )}

          <ListGroup.Item action onClick={() => window.open('/imprint', '_self')}>
            <FontAwesomeIcon icon={faShield} className={styles.interaction_icon}/>
            Datenschutzerklärung
          </ListGroup.Item>

          <ListGroup.Item action onClick={() => window.open('/imprint', '_self')}>
            <FontAwesomeIcon icon={faGavel} className={styles.interaction_icon}/>
            Impressum
          </ListGroup.Item>

        </ListGroup>

        <br />

        <div className={styles.logout_button}>
          <Button variant={'danger'} onClick={() => forgetSession(router)}>
            Logout <FontAwesomeIcon icon={faArrowRightFromBracket}/>
          </Button>
        </div>

        <PersonalizeModal/>
      </ReactPlaceholder>
      <AppTabbar/>
    </AppBody>
  </AppContainer>)
}
