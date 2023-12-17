import Container from 'react-bootstrap/Container'
import PropTypes from 'prop-types'
import React from 'react'

import styles from '../../styles/AppBody.module.css'

/**
 * Wrapper for the body of every page.
 */
export default function AppBody({ className, children }) {
  return (
    <Container className={[className, styles.container]}>{children}</Container>
  )
}
AppBody.propTypes = {
  className: PropTypes.string,
  children: PropTypes.any,
}
