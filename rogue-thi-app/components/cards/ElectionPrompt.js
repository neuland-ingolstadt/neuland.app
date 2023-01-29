import React from 'react'

import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'

import { faCheckToSlot, faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import styles from '../../styles/Home.module.css'

const electionUrl = process.env.NEXT_PUBLIC_ELECTION_URL

/**
 * Student council election notification card.
 * @param {object} onHide Invoked when the user wants to hide the prompt
 */
export default function ElectionPrompt ({ onHide }) {
  return (
    <Card className={styles.card}>
      <Card.Body>
        <Card.Title>
          <FontAwesomeIcon icon={faCheckToSlot} fixedWidth />
          {' '}
          Hochschulwahlen
          <Button variant="link" className={styles.cardButton} onClick={() => onHide()}>
            <FontAwesomeIcon title="Schließen" icon={faTimes} />
          </Button>
        </Card.Title>
        <Card.Text>
          <p>
            Aktuell finden die Hochschulwahlen statt. Deine Teilnahme ist wichtig, um die demokratischen Strukturen an unserer Hochschule zu stärken.
          </p>
          <a href={electionUrl} ping="/api/election-vote-ping" target="_blank" rel="noreferrer">
            <Button>
              Stimme online abgeben
            </Button>
          </a>
        </Card.Text>
      </Card.Body>
    </Card>
  )
}
