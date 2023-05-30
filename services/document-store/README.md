This is a service to store and retrive JSON documents for the neuland.app

## Getting Started

First, install the dependencies:
```bash
yarn install
```

First, run the development server:

```bash
yarn start
```

The API of the documentation store is running on localhost:6001.

## Usage
For each scrape job there is a specific endpoint to store and retrive the corresponding JSON Document. For now look at the folder `/src/routes` to view the current API routes. An API Documentation will be added in the future.

### Scrape Services
1. Run the scrape services scheduled in a fixed intervall
2. Post the data to the corresponding endpoint
   3. If it does not exist yet, implement it the same way as the other endpoints

### neuland.app
1. Run a scheduled task to call the API of this service to get the latest data

