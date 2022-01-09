import React from 'react'

import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPoll, faTimes } from '@fortawesome/free-solid-svg-icons'

import styles from '../styles/Home.module.css'

const SURVEY_URL = process.env.NEXT_PUBLIC_SURVEY_URL

export default function SurveyCard ({ onHide }) {
  return (
    <Card className={styles.card}>
      <Card.Body>
        <Card.Title>
          <FontAwesomeIcon icon={faPoll} fixedWidth />
          {' '}
          Umfrage
          <Button variant="link" className={styles.cardButton} onClick={() => onHide()}>
            <FontAwesomeIcon title="Schließen" icon={faTimes} />
          </Button>
        </Card.Title>
        <Card.Text>
          <p>
            Die Studierendenvertretung möchte mit den Verkehrsbetrieben ein <strong>Semesterticket</strong> aushandeln.
            Wir möchten euch alle darum bitten, eure Meinung dazu zu äußern:
          </p>
          <p>
            <a href={SURVEY_URL} target="_blank" rel="noreferrer">
              <Button variant="outline-secondary">An Umfrage teilnehmen</Button>
            </a>
          </p>
        </Card.Text>
      </Card.Body>
    </Card>
  )
}
