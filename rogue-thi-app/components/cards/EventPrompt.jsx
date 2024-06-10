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
            Interessierst du dich für Informatik? Die Infoveranstaltung von
            Neuland Ingolstadt e.V. findet am{' '}
            <strong>Di, 10.10. um 18:00 in Raum J102</strong> statt. Komm
            vorbei!
          </p>
        </Card.Text>
      </Card.Body>
    </Card>
  )
}
