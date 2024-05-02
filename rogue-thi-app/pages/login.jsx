import React, { useState } from 'react'
import { useRouter } from 'next/router'

import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'

import {
  createGuestSession,
  createSession,
} from '../lib/backend/thi-session-handler'

import { Trans, useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import styles from '../styles/Login.module.css'

const ORIGINAL_ERROR_WRONG_CREDENTIALS = 'Wrong credentials'

const IMPRINT_URL = process.env.NEXT_PUBLIC_IMPRINT_URL
const PRIVACY_URL = process.env.NEXT_PUBLIC_PRIVACY_URL
const GIT_URL = process.env.NEXT_PUBLIC_GIT_URL
const GUEST_ONLY = process.env.NEXT_PUBLIC_GUEST_ONLY === 'true'

const KNOWN_BACKEND_ERRORS = ['Response is not valid JSON']

export default function Login() {
  const router = useRouter()
  const { redirect } = router.query

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [saveCredentials, setSaveCredentials] = useState(false)
  const [failure, setFailure] = useState(false)
  const { t } = useTranslation('login')

  /**
   * Temporary workaround for #208.
   * Resets the dashboard configuration on every login.
   */
  function applyDashboardWorkaround() {
    delete localStorage.personalizedDashboard
    delete localStorage.personalizedDashboardHidden
  }

  /**
   * Logs in the user.
   * @param {Event} e DOM event that triggered the login
   */
  async function login(e) {
    try {
      e.preventDefault()
      await createSession(username, password, saveCredentials)
      applyDashboardWorkaround()
      router.replace('/' + (redirect || ''))
    } catch (e) {
      if (e.message.includes(ORIGINAL_ERROR_WRONG_CREDENTIALS)) {
        setFailure(t('error.wrongCredentials'))
      } else {
        console.error(e)
        if (KNOWN_BACKEND_ERRORS.some((error) => e.message.includes(error))) {
          setFailure(t('error.backend'))
        } else {
          setFailure(t('error.generic'))
        }
      }
    }
  }

  /**
   * Logs in the user as a guest.
   * @param {Event} e DOM event that triggered the login
   */
  async function guestLogin(e) {
    e.preventDefault()
    createGuestSession()
    applyDashboardWorkaround()
    router.replace('/')
  }

  return (
    <AppContainer>
      <AppNavbar
        title="neuland.app"
        showBack={false}
      />

      <AppBody>
        <div className={styles.container}>
          <Form
            className={styles.main}
            onSubmit={login}
            autoComplete="on"
          >
            {failure && <Alert variant="danger">{failure}</Alert>}

            {!failure && redirect && (
              <Alert variant="warning">{t('alert')}</Alert>
            )}

            {GUEST_ONLY && <p>{t('guestOnly.warning')}</p>}
            {!GUEST_ONLY && (
              <>
                <Form.Group>
                  <Form.Label>{t('form.username')}</Form.Label>
                  <Form.Control
                    type="text"
                    autoComplete="username"
                    placeholder="abc1234"
                    className="form-control"
                    value={username}
                    isInvalid={!!failure}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>{t('form.password')}</Form.Label>
                  <Form.Control
                    type="password"
                    autoComplete="current-password"
                    className="form-control"
                    value={password}
                    isInvalid={!!failure}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Check
                    type="checkbox"
                    id="stay-logged-in"
                    label={t('form.save')}
                    onChange={(e) => setSaveCredentials(e.target.checked)}
                  />
                </Form.Group>

                <Form.Group>
                  <Button
                    type="submit"
                    variant="primary"
                    className={styles.loginButton}
                  >
                    {t('form.login')}
                  </Button>
                </Form.Group>
              </>
            )}

            <Form.Group>
              <Button
                type="submit"
                variant="secondary"
                className={styles.loginButton}
                onClick={guestLogin}
              >
                {t('form.guest')}
              </Button>
            </Form.Group>
          </Form>

          <div className={styles.disclaimer}>
            {GUEST_ONLY && (
              <>
                <h6>{t('guestOnly.title')}</h6>
                <p>{t('guestOnly.details')}</p>
                <p>{t('guestOnly.details2')}</p>
              </>
            )}
            <h6>{t('notes.title1')}</h6>
            <p>
              <Trans
                i18nKey="notes.text1"
                ns="login"
                components={{
                  a: (
                    <a
                      href="https://neuland-ingolstadt.de"
                      target="_blank"
                      rel="noreferrer"
                    />
                  ),
                }}
              />
            </p>
            <h6>{t('notes.title2')}</h6>
            <p>
              <Trans
                i18nKey="notes.text2"
                ns="login"
                components={{
                  strong: <strong />,
                }}
              />
            </p>
            <p>
              <a href={`${GIT_URL}/blob/master/docs/data-security-de.md`}>
                {t('links.security')}
              </a>
            </p>
            <p>
              <a
                href={IMPRINT_URL}
                target="_blank"
                rel="noreferrer"
              >
                {t('links.imprint')}
              </a>
              <> &ndash; </>
              <a
                href={PRIVACY_URL}
                target="_blank"
                rel="noreferrer"
              >
                {t('links.privacy')}
              </a>
              <> &ndash; </>
              <a
                href={GIT_URL}
                target="_blank"
                rel="noreferrer"
              >
                {t('links.github')}
              </a>
            </p>
          </div>
        </div>
      </AppBody>
    </AppContainer>
  )
}

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['login', 'common'])),
  },
})
