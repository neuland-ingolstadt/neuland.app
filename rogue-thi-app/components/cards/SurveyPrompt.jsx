import React from 'react'

import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'

import { BarChart2, X } from 'lucide-react'

import styles from '../../styles/Home.module.css'

const SURVEY_URL = process.env.NEXT_PUBLIC_SURVEY_URL

/**
 * Prompt for surveys.
 * @param {object} onHide Invoked when the user wants to hide the prompt
 */
export default function SurveyPrompt({ onHide }) {
  return (
    <Card className={styles.card}>
      <Card.Body>
        <Card.Title className={styles.cardTitle}>
          <BarChart2 size={22} />
          <span className={styles.cardTitleText}>Umfrage</span>
          <Button
            variant="link"
            className={styles.cardButton}
            onClick={() => onHide()}
          >
            <X size={22} />
          </Button>
        </Card.Title>
        <Card.Text>
          <p>
            Die Studierendenvertretung möchte mit den Verkehrsbetrieben ein{' '}
            <strong>Semesterticket</strong> aushandeln. Wir möchten euch alle
            darum bitten, eure Meinung dazu zu äußern:
          </p>
          <p>
            <a
              href={SURVEY_URL}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline-secondary">An Umfrage teilnehmen</Button>
            </a>
          </p>
        </Card.Text>
      </Card.Body>
    </Card>
  )
}
