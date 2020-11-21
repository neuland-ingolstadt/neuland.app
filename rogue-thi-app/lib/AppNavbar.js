import React from 'react'
import PropTypes from 'prop-types'
import Head from 'next/head'

import Button from 'react-bootstrap/Button'
import Navbar from 'react-bootstrap/Navbar'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons'
import { useRouter } from 'next/router'

import styles from './AppNavbar.module.css'

export default function AppNavbar ({ title, showBack, children }) {
  const router = useRouter()

  if (typeof showBack === 'undefined') {
    showBack = true
  }

  function goBack () {
    router.back()
  }

  return (
    <>
      <Head>
        <meta charset='utf-8' />
        <meta http-equiv='X-UA-Compatible' content='IE=edge' />
        <meta name='viewport' content='width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no' />
        <meta name='description' content='Rogue THI App' />
        <meta name='keywords' content='THI, Technische Hochschule Ingolstadt, App' />
        <title>Rogue THI App</title>

        <link rel="manifest" href="/manifest.json" />
        <link href='/favicon32.png' rel='icon' type='image/png' sizes='32x32' />
        <link href='/favicon64.png' rel='icon' type='image/png' sizes='64x64' />
        <link href='/favicon512.png' rel='icon' type='image/png' sizes='512x512' />
        <link rel="apple-touch-icon" href="/favicon512.png"></link>
        <meta name="theme-color" content="#005a9b" />
      </Head>
      <Navbar sticky="top" className={styles.navbar + ' justify-content-between'}>
        <Navbar.Brand>
          {showBack && (
            <Button variant="link" onClick={() => goBack()} className={styles.back}>
              <FontAwesomeIcon icon={faChevronLeft} />
              {' Zurück'}
            </Button>
          )}
        </Navbar.Brand>
        <Navbar.Brand className={styles.title}>
          {title}
        </Navbar.Brand>
        <div>
          {children}
        </div>
      </Navbar>
    </>
  )
}
AppNavbar.propTypes = {
  title: PropTypes.string,
  showBack: PropTypes.bool,
  children: PropTypes.array
}
