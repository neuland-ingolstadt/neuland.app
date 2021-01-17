# Custom Mensa API Endpoint
The mensa data is publicly available at
https://www.max-manager.de/daten-extern/sw-erlangen-nuernberg/xml/mensa-ingolstadt.xml
We provide an API which is used by our app. While we initially used the same
format as the officials App mensa API request we since moved to a custom
easier-to-parse format.

## Endpoint
GET https://neuland.app/api/mensa

## Response

### Root
```json
[
  <day object 1>,
  <day object 2>,
  ...
]
```

### Day object
```json
{
  "timestamp": "ISO 8601 String",
  "meals": [
    <meal object 1>,
    <meal object 2>,
    ...
  ]
}
```

### Meal object
```json
{
  "name": "full dish name",
  "prices": [
    <students price>,
    <employees price>,
    <guest price>
  ],
  "allergens": [
    "1",
    "4"
    ...
  ]
}
```

### Example
```json
[
  {
    "timestamp": "2021-01-18",
    "meals": [
      {
        "name": "Puten Cordon Bleu mit Zitrone Pommes-Frites",
        "prices": [
          3.39,
          4.39,
          6.78
        ],
        "allergens": [
          "1",
          "4",
          "7",
          "Wz",
          "Mi"
        ]
      }
    ]
  }
]
```
