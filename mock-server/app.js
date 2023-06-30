const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3001

const SESSION_TOKEN = 'iamasessiontoken'

const services = {
    session: {
        open: params => ({
            data: [
                SESSION_TOKEN,
                params.username,
                0
            ]
        }),
        isalive: params => ({
            data: 'STATUS_OK',
            date: '01.01.2023',
            status: 0,
            time: '00:00:00'
        })
    }
}

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  res.send('This is just an illusion')
})

app.post('/webservice/zits_s_40_test/index.php', (req, res) => {
    const service = req.body.service
    const method = req.body.method
    const format = req.body.format

    if (format !== 'json') {
        res.status(400)
    }

    if (services.hasOwnProperty(service)) {
        if (services[service].hasOwnProperty(method)) {
            res.json(services[service][method](req.body))
        } else {
            res.send(400)
        }
    } else {
        res.send(400)
    }
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
