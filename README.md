# neuland.app

An open source, web-based replacement for the official app of the
Technische Hochschule Ingolstadt built with React and Next.js.
It includes a reverse engineered documentation for the REST backend
used by the official app.

> [!CAUTION]  
> The Neuland REST API is deprecated and was replaced by the GraphQL API.
> 
> You can find the new API documentation at [api.neuland.app](https://api.neuland.app/).

## About

### App

The app aims at implementing all important features of the official
app as free and open source software with a modern UI.
It connects to the official backend via a WebSocket-to-TCP proxy. The HTTPS
stack is implemented in JavaScript and runs in the browser, so that the proxy
never comes in contact with unencrypted user data.

You can find more information on this in [this document](docs/data-security.md).

### API Documentation

Currently the documentation consists of a list of valid requests and examples
of their responses.
You can view [the full list here](docs/thi-rest-api.md). This documentation was
created manually by using the official app and logging requests with `mitmproxy`.
The app also includes a [debugging tool](https://neuland.app/debug) which handles session generation
and API communication.

## Attribution

Even though some developers of this project are part of the StudVer (student council)
of the THI, this project is not part of, developed for or supported by the StudVer
or the THI.
