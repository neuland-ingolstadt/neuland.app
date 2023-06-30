import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Button from 'react-bootstrap/Button'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Link from 'next/link'
import ListGroup from 'react-bootstrap/ListGroup'
import Row from 'react-bootstrap/Row'

import AppBody from '../components/page/AppBody'
import AppContainer from '../components/page/AppContainer'
import AppNavbar from '../components/page/AppNavbar'
import AppTabbar from '../components/page/AppTabbar'

import { NoSessionError, UnavailableSessionError, callWithSession } from '../lib/backend/thi-session-handler'
import API from '../lib/backend/anonymous-api'

import styles from '../styles/Common.module.css'

const GIT_URL = process.env.NEXT_PUBLIC_GIT_URL

/**
 * Page containing debug tools for development purposes.
 */
export default function Debug () {
  const [parameters, setParameters] = useState([])
  const [result, setResult] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function load () {
      try {
        const initialParams = [
          {
            name: 'service',
            value: 'thiapp'
          },
          {
            name: 'method',
            value: 'persdata'
          },
          {
            name: 'session',
            // don't do anything with the session key, just return it
            value: await callWithSession(session => session)
          },
          {
            name: 'format',
            value: 'json'
          }
        ]

        setParameters(initialParams)
      } catch (e) {
        if (e instanceof NoSessionError || e instanceof UnavailableSessionError) {
          router.replace('/login?redirect=debug')
        } else {
          console.error(e)
          alert(e)
        }
      }
    }
    load()
  }, [router])

  function changeParameterName (i, name) {
    parameters[i].name = name
    setParameters(parameters.slice(0))
  }
  function changeParameterValue (i, value) {
    parameters[i].value = value
    setParameters(parameters.slice(0))
  }
  function addParameter () {
    const newParams = parameters.concat([{
      name: '',
      value: ''
    }])
    setParameters(newParams)
  }
  function removeParameter (index) {
    const newParams = parameters.slice(0)
    newParams.splice(index, 1)
    setParameters(newParams)
  }

  async function submit () {
    const params = {}
    for (const entry of parameters) {
      params[entry.name] = entry.value
    }
    try {
      setResult('Loading...')
      const resp = await API.request(params)
      setResult(JSON.stringify(resp, null, 4))
    } catch (e) {
      console.error(e)
      setResult(e.toString())
    }
  }

  return (
    <AppContainer>
      <AppNavbar title="API Playground" />

      <AppBody>
        <h3 className={styles.heading}>Documentation</h3>
        You can find an inofficial API documentation{' '}
        <Link href={`${GIT_URL}/blob/master/docs/thi-rest-api.md`}>
          here on Github
        </Link>
        <br />
        Below you can experiment with the API. The session field is auto filled with
        a valid session token for your user.

        <h3 className={styles.heading}>Fields</h3>
        <ListGroup>
          {parameters && parameters.map((param, idx) =>
            <ListGroup.Item key={idx} className={styles.item}>
              <Row>
                <Col>
                  <Form.Control
                    type="text"
                    placeholder="name"
                    value={param.name}
                    onChange={e => changeParameterName(idx, e.target.value)}
                  />
                </Col>
                <Col>
                  <Form.Control
                    type={parameters[idx].name === 'session' ? 'password' : 'text'}
                    placeholder="value"
                    value={param.value}
                    onChange={e => changeParameterValue(idx, e.target.value)}
                  />
                </Col>
                <Col>
                  <Button variant="danger" onClick={() => removeParameter(idx)}>
                    Remove
                  </Button>
                </Col>
              </Row>
            </ListGroup.Item>
          )}
        </ListGroup>
        <br />
        <Button variant="primary" onClick={submit}>Submit</Button>
        {' '}
        <Button variant="success" onClick={addParameter}>Add Field</Button>

        <br />
        <h3 className={styles.heading}>Result</h3>
        <pre>
          {result}
        </pre>
      </AppBody>

      <AppTabbar />
    </AppContainer>
  )
}
