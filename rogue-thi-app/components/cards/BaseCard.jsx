import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Link from 'next/link'
import PropTypes from 'prop-types'
import React from 'react'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'

import styles from '../../styles/Home.module.css'
import { useTranslation } from 'next-i18next'

/**
 * Base card which all dashboard cards should extend.
 * @param {string} link Route to open when clicked
 * @param {object} icon FontAwesome icon object
 * @param {string} title Title of the card
 * @param {string} className Class name to attach to the card
 * @param {object[]} children Body of the card
 */
export default function BaseCard({
  link,
  icon,
  title,
  i18nKey,
  className,
  children,
}) {
  const { t } = useTranslation('dashboard')
  return (
    <Link href={link}>
      <Card className={[styles.card, className]}>
        <Card.Body>
          <Card.Title>
            <FontAwesomeIcon
              icon={icon}
              fixedWidth
            />{' '}
            {title || t(`${i18nKey}.title`)}
            <Button
              variant="link"
              className={styles.cardButton}
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </Button>
          </Card.Title>
          {children}
        </Card.Body>
      </Card>
    </Link>
  )
}
BaseCard.propTypes = {
  link: PropTypes.string.isRequired,
  icon: PropTypes.object.isRequired,
  title: PropTypes.string,
  i18nKey: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.any,
}
