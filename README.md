# THI-App

The official App of the Technische Hochschule Ingolstadt looks dated, and has a
number of shortcomings. Such as frequent crashes, incompatability with some
Android versions, unreadable texts with dark mode on iOS, ...

This project aims at documenting the API used by the App and also includes
a nextjs based replacement called "Rogue THI App".

## Rogue THI App

The rogue THI App aims at implementing all important features of the official
app, while using a modern UI and being free and open source software.
The App connects to the THI REST API via a pure Websocket-TCP proxy. The HTTPS
Layer is implemented in the browser and thus the Proxy server cannot access
sensible user data.
More info on this topic in [this document](data-security.md)


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
