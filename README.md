# THI-App

This is a reverse engineered documentation for the REST API used by the official
app of the Technische Hochschule Ingolstadt as well as an open source, web-based 
replacement built on React and Next.js.

## App

Rogue THI App aims at implementing all important features of the official
app as free and open source software with a modern UI.
It connects to the official backend via a WebSocket-to-TCP proxy. The HTTPS
stack is implemented in JavaScript and runs in the browser, so that the proxy
never comes in contact with unencrypted user data.

You can find more information on this in [this document](data-security.md).

## API Documentation

Currently the documentation consists of a list of valid requests and examples
of their responses.
You can view [the full list here](thi-rest-api.md). This documentation was
created manually by using the official App and logging requests with mitmproxy.
The Rogue THI App also includes an API Playground which handles session
generation and API communication.

## Attribution

Even though the developers of this project are part of the StudVer (students
representatives) of the THI this project crurently is not part of, developed
for or supported by the StudVer or the THI itself. 
