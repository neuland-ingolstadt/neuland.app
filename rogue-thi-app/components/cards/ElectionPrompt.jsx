import React from 'react'

import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'

import { Vote, X } from 'lucide-react'

import { Trans, useTranslation } from 'next-i18next'
import styles from '../../styles/Home.module.css'

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
          <p>
            <Trans
              i18nKey="election.text"
              ns="dashboard"
              components={{ strong: <strong />, br: <br /> }}
            />
          </p>
          <a
            href={electionUrl}
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
