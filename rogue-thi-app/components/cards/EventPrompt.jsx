import React from 'react'

import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'

import { faPersonChalkboard, faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import styles from '../../styles/Home.module.css'

/**
 * Introduction event notification card.
 * @param {object} onHide Invoked when the user wants to hide the prompt
 */
export default function EventPrompt({ onHide }) {
  return (
    <Card className={styles.card}>
      <Card.Body>
        <Card.Title>
          <FontAwesomeIcon
            icon={faPersonChalkboard}
            fixedWidth
          />{' '}
          Infoveranstaltung
          <Button
            variant="link"
            className={styles.cardButton}
            onClick={() => onHide()}
          >
            <FontAwesomeIcon
              title="Schließen"
              icon={faTimes}
            />
          </Button>
        </Card.Title>
        <Card.Text>
          <p>
            Interessierst du dich für Informatik? Die Infoveranstaltung von
            Neuland Ingolstadt e.V. findet am{' '}
            <strong>Di, 26.03. um 18:00 in Raum J102</strong> statt. Komm
            vorbei!
          </p>
        </Card.Text>
      </Card.Body>
    </Card>
  )
}
