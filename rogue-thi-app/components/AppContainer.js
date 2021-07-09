import Container from 'react-bootstrap/Container'
import PropTypes from 'prop-types'
import React from 'react'

import styles from '../styles/AppContainer.module.css'

export default function AppContainer ({ className, children }) {
  return (
    <Container className={[className, styles.container]}>
      {children}
    </Container>
  )
}
AppContainer.propTypes = {
  className: PropTypes.string,
  children: PropTypes.any
}
