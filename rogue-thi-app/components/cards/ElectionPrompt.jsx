import React from 'react'

import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'

import { Vote, X } from 'lucide-react'

import styles from '../../styles/Home.module.css'
import { useTranslation } from 'next-i18next'

const electionUrl = process.env.NEXT_PUBLIC_ELECTION_URL

/**
 * Student council election notification card.
 * @param {object} onHide Invoked when the user wants to hide the prompt
 */
export default function ElectionPrompt({ onHide }) {
  const { t } = useTranslation(['dashboard'])
  return (
    <Card className={styles.card}>
      <Card.Body>
        <Card.Title className={styles.cardTitle}>
          <Vote size={22} />
          <span className={styles.cardTitleText}>{t('election.title')}</span>
          <Button
            variant="link"
            className={styles.cardButton}
            onClick={() => onHide()}
          >
            <X size={22} />
          </Button>
        </Card.Title>
        <Card.Text>
          <p>{t('election.text')}</p>
          <a
            href={electionUrl}
            ping="/api/election-vote-ping"
            target="_blank"
            rel="noreferrer"
          >
            <Button>{t('election.button')}</Button>
          </a>
        </Card.Text>
      </Card.Body>
    </Card>
  )
}
