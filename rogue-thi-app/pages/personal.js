import React, { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Button from 'react-bootstrap/Button'
import ListGroup from 'react-bootstrap/ListGroup'
import ReactPlaceholder from 'react-placeholder'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'
import FilterFoodModal from '../components/modal/FilterFoodModal'
import PersonalDataModal from '../components/modal/PersonalDataModal'
import PersonalizeModal from '../components/modal/PersonalizeModal'

import {
  faArrowRightFromBracket,
  faArrowRightToBracket,
  faBug,
  faChevronRight,
  faCopy,
  faExternalLink,
  faGavel,
  faShield
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { NoSessionError, UnavailableSessionError, forgetSession } from '../lib/backend/thi-session-handler'
import { ShowFoodFilterModal, ShowPersonalDataModal, ShowPersonalizeModal, ThemeContext } from './_app'
import { calculateECTS, loadGradeAverage, loadGrades } from '../lib/backend-utils/grades-utils'
import API from '../lib/backend/authenticated-api'

import styles from '../styles/Personal.module.css'
import themes from '../data/themes.json'

export default function Personal () {
  const [userdata, setUserdata] = useState(null)
  const [average, setAverage] = useState(null)
  const [ects, setEcts] = useState(null)
  const [grades, setGrades] = useState(null)
  const [missingGrades, setMissingGrades] = useState(null)
  const [showDebug, setShowDebug] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const [isStudent, setIsStudent] = useState(true)
  const [, setShowThemeModal] = useContext(ShowPersonalizeModal)
  const [, setShowFoodFilterModal] = useContext(ShowFoodFilterModal)
  const [, setShowPersonalDataModal] = useContext(ShowPersonalDataModal)
  const theme = useContext(ThemeContext)
  const router = useRouter()

  const CopyableField = ({ label, value }) => {
    // This is a component that renders a label and a value.
    // Only the value and the icon are clickable to copy the value to the clipboard.
    // The label is not clickable.

    const handleCopy = async () => {
      // Copies the value to the clipboard, and shows an alert.
      await navigator.clipboard.writeText(value);
      alert(`${label} in die Zwischenablage kopiert.`);
    };

    return (
      <span onClick={e => {
        if (!value) {
          // If the value is empty, stop the event from propagating.
          e.preventDefault();
          return;
        }
        e.stopPropagation();
      }}>
        {label}:{' '}
        {value ? (
          <>
            <span style={{ cursor: 'pointer' }} onClick={handleCopy}>
              {value}
            </span>
            <FontAwesomeIcon
              icon={faCopy}
              style={{ marginLeft: '5px', cursor: 'pointer' }}
              onClick={handleCopy}
            />
          </>
        ) : null}
      </span>
    );
  };


  useEffect(() => {
    async function load () {
      try {
        if (localStorage.debugUnlocked) {
          setShowDebug(true)
        }

        if (localStorage.session === 'guest') {
          setIsStudent(false)
          setIsGuest(true)
          return
        }

        if (localStorage.isStudent === 'false') {
          setIsStudent(false)
          return
        }

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
    }

    load()
  }, [router])

 return (<AppContainer>
    <AppNavbar title="Profil"/>

    <AppBody>
      <ReactPlaceholder type="text" rows={20} ready={userdata || !isStudent}>

        {(isStudent || !isGuest) &&
          <ListGroup>
            <ListGroup.Item action onClick={() => setShowPersonalDataModal(true)}>
              <div className={styles.name_interaction_icon}>
                <FontAwesomeIcon icon={faChevronRight} className="text-muted"/>
              </div>
              {userdata && userdata.name + ', ' + userdata.vname}<br/>
              {userdata && userdata.fachrich}
            </ListGroup.Item>

            <ListGroup.Item className="text-muted">
              <span className={userdata ? styles.personal_value : styles.personal_value_loading}>
              {userdata && userdata.stgru + '. Semester'}<br/>
              </span>
              {userdata && (
                <>
                  <CopyableField label="Mat.-Nr:" value={userdata.mtknr} /> <br />
                  <CopyableField label="Bib.-Nr" value={userdata.bibnr} />
                </>
              )}

            </ListGroup.Item>

            <ListGroup.Item action onClick={() => window.open('/grades', '_self')}>
              <div className={styles.interaction_icon}>
                <span className="text-muted">
                  {grades && missingGrades && grades.length + '/' + (grades.length + missingGrades.length)}{' '}Noten{' '}
                  <FontAwesomeIcon icon={faChevronRight}/>
                </span>
              </div>
              <span className="text-muted">
                {ects !== null && ects + ' ECTS'}
                {average && ' · '}
                {average && '∅ ' + average}
              </span>
            </ListGroup.Item>
          </ListGroup>
        }

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
              Personalisierung
            </ListGroup.Item>
          ))}

          <ListGroup.Item action onClick={() => setShowFoodFilterModal(true)}>
            <div className={styles.interaction_icon}>
              <span className="text-muted">
                <FontAwesomeIcon icon={faChevronRight}/>
              </span>
            </div>
            Essenspräferenzen
          </ListGroup.Item>

        </ListGroup>

        <br/>

        <ListGroup>

          <ListGroup.Item action
                          onClick={() => window.open('https://www3.primuss.de/cgi-bin/login/index.pl?FH=fhin', '_blank')}>
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

          {(!isStudent || isGuest) &&
            <ListGroup.Item action onClick={() => window.open('https://mythi.de', '_blank')}>
              <FontAwesomeIcon icon={faExternalLink} className={styles.interaction_icon}/>
              MyTHI
            </ListGroup.Item>
          }
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

        <br/>

        <div className={styles.logout_button}>
          <Button
            variant={isGuest ? 'success' : 'danger'}
            onClick={() => forgetSession(router)}>
            {isGuest ? 'Login' : 'Logout'} <FontAwesomeIcon icon={isGuest ? faArrowRightToBracket : faArrowRightFromBracket} />
          </Button>
        </div>

        <PersonalDataModal userdata={userdata}/>
        <PersonalizeModal/>
        <FilterFoodModal/>
      </ReactPlaceholder>
      <AppTabbar/>
    </AppBody>
  </AppContainer>)
}
