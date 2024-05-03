import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Link from 'next/link'
import PropTypes from 'prop-types'
import React from 'react'

import { ChevronRight } from 'lucide-react'

import styles from '../../styles/Home.module.css'
import { useTranslation } from 'next-i18next'

/**
 * Base card which all dashboard cards should extend.
 * @param {string} link Route to open when clicked
 * @param {JSX} icon Icon to display in the card
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
          <Card.Title className={styles.cardTitle}>
            {icon && React.createElement(icon, { size: 22 })}
            <span className={styles.cardTitleText}>
              {title || t(`${i18nKey}.title`)}
            </span>
            <Button
              variant="link"
              className={styles.cardButton}
            >
              <ChevronRight size={22} />
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
  isDismissible: PropTypes.bool,
  i18nKey: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.any,
}
