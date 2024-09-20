import React from 'react'

import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'

import { ExternalLink, Megaphone, X } from 'lucide-react'

import Link from 'next/link'
import styles from '../../styles/Home.module.css'
import { useTranslation } from 'next-i18next'

/**
 * Introduction event notification card.
 * @param {object} onHide Invoked when the user wants to hide the prompt
 */
export default function AnnouncementPrompt({ announcement, onHide }) {
  const { i18n, t } = useTranslation(['common'])
  const locale = i18n.languages[0]

  return (
    <Card className={styles.card}>
      <Card.Body>
        <Card.Title className={styles.cardTitle}>
          <Megaphone size={22} />
          <span className={styles.cardTitleText}>
            {announcement.title[locale]}
          </span>
          <Button
            variant="link"
            className={styles.cardButton}
            onClick={() => onHide()}
          >
            <X size={22} />
          </Button>
        </Card.Title>
        <Card.Text>
          <p>{announcement.description[locale]}</p>
        </Card.Text>

        {announcement.url && (
          <Link
            href={announcement.url}
            passHref
          >
            <Button
              target="_blank"
              variant="link"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                maxWidth: 'fit-content',
              }}
            >
              {t('cards.announcements.readMore')}
              <ExternalLink size={16} />
            </Button>
          </Link>
        )}
      </Card.Body>
    </Card>
  )
}
