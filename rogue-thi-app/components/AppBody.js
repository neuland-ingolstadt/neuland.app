import React from 'react'
import PropTypes from 'prop-types'
import Container from 'react-bootstrap/Container'

import styles from '../styles/AppBody.module.css'

export default function AppBody ({ className, children }) {
  return (
    <Container className={[className, styles.container]}>
      {children}
    </Container>
  )
}
AppBody.propTypes = {
  className: PropTypes.string,
  children: PropTypes.any
}
