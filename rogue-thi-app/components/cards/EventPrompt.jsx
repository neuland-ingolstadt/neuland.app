import React from 'react'

import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'

import { Presentation, X } from 'lucide-react'

import styles from '../../styles/Home.module.css'

/**
 * Introduction event notification card.
 * @param {object} onHide Invoked when the user wants to hide the prompt
 */
export default function EventPrompt({ onHide }) {
  return (
    <Card className={styles.card}>
      <Card.Body>
        <Card.Title className={styles.cardTitle}>
          <Presentation size={22} />
          <span className={styles.cardTitleText}>Infoveranstaltung</span>
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
            Stell dir vor es sind Wahlen, aber keiner geht hin? So macht Demokratie doch keinen Sinn!{' '}
            <strong>Di. 11.06 bis Do. 13.06</strong> unter:{' '}
            <a href='https://studverthi.de/jetzt-waehlen'>studverthi.de/jetzt-waehlen</a>
          </p>
        </Card.Text>
      </Card.Body>
    </Card>
  )
}
