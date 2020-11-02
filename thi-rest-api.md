# Endpoint

- https://hiplan.thi.de/webservice/production2/index.php
- POST request
- `Content-Type: application/x-www-form-urlencoded`
- `User-Agent:Embarcadero RESTClient/1.0`

Only the House plan uses:
https://hiplan.thi.de/webservice/raumplan.html


# Services

## Session

### open

```
username: <username>
passwd:   <password>
service:  session
method:   open
format:   json
```

```json
{
    "data": [
        "<session token>",
        "<username>",
        3
    ],
    "date": "02.11.2020",
    "status": 0,
    "time": "20:28:40"
}
```

### isalive

```
service: session
method:  isalive
format:  json
session: <session token>
```

```json
{
    "data": "STATUS_OK",
    "date": "02.11.2020",
    "status": 0,
    "time": "20:34:28"
}
```

## Personal Data
```
service: thiapp
method:  persdata
format:  json
session: <session token>
```

```json
{
    "data": [
        0,
        {
            "pcounter": "<printing credits e.g. 42.13€>",
            "persdata": {
                "aaspf_echt": "<B for bachelor, M for master>",
                "bibnr": "<library number>",
                "email": "<personal email>",
                "fachrich": "<course of study e.g. Informatik, Robotik, ...>",
                "fhmail": "<thi email>",
                "mtknr": "<Matrikelnummer>",
                "name": "<second name>",
                "ort": "<city>",
                "plz": "<city postcode>",
                "po_url": "<URL of the Pruefungsordnung>",
                "pvers": "<version number of the Pruefungsordnung>",
                "rchtg": null,
                "rue": "1",
                "rue_sem": "WS 2020/21",
                "stg": "<short course of study e.g. ROB>",
                "stgru": "<semester number>",
                "str": "<home street>",
                "swpkt": "{NULL,NULL,NULL}",
                "telefon": "",
                "user": "<thi username>",
                "vname": "<first name>"
            }
        }
    ],
    "date": "02.11.2020",
    "status": 0,
    "time": "20:46:21"
}
```

## Grades
```
service: thiapp
method:  grades
format:  json
session: <session token>
```

```json
{
    "data": [
        0,
        [
            {
                "anrech": "",
                "ects": "5,0",
                "fristsem": "",
                "frwpf": "null",
                "kztn": "z_",
                "note": "<your grade, e.g. 1,0 or 4,0>",
                "pon": "110",
                "stg": "<short course of study e.g. ROB>",
                "titel": "Computer-Forensik"
            },
            {
                "anrech": "",
                "ects": "5,0",
                "fristsem": "",
                "frwpf": "null",
                "kztn": "z_",
                "note": "<your grade, e.g. 1,0 or 4,0>",
                "pon": "210",
                "stg": "<short course of study e.g. ROB>",
                "titel": "Security Engineering in der IT"
            },
            // more...
        ]
    ],
    "date": "02.11.2020",
    "status": 0,
    "time": "20:46:49"
}
```

## Personal Timetable
```
service: thiapp
method:  stpl
format:  json
session: <session token>
day:     02
month:   11
year:    2020
details: 0
```

```json
{
    "data": [
        0,
        "WS 2020",
        [
            {
                "datum": "2020-11-01",
                "name": "Allerheiligen"
            }
        ],
        [
            {
                "bis": "09:45:00",
                "datum": "2020-10-26",
                "dozent": "Schiele, T.",
                "ectspoints": "5",
                "fach": "Technische Mechanik 1",
                "inhalt": null,
                "literatur": null,
                "pruefung": "schrP90 - schriftliche Prüfung, 90 Minuten",
                "raum": "E_Online",
                "stg": "ROB-B",
                "stgru": "ROB1",
                "sws": "4",
                "teilgruppe": "0",
                "veranstaltung": "ROB-TM1",
                "von": "08:15:00",
                "ziel": null
            },
            {
                "bis": "11:25:00",
                "datum": "2020-10-27",
                "dozent": "Endisch, C.",
                "ectspoints": "5",
                "fach": "Elektrotechnik",
                "inhalt": null,
                "literatur": null,
                "pruefung": "schrP90 - schriftliche Prüfung, 90 Minuten",
                "raum": "E_Online",
                "stg": "ROB-B",
                "stgru": "ROB1",
                "sws": "4",
                "teilgruppe": "0",
                "veranstaltung": "ROB-ET",
                "von": "09:00:00",
                "ziel": null
            },
            // MORE! ...
        ],
        [
            {
                "bis": "2020-11-13",
                "intervall": "Prüfungsanmeldung",
                "von": "2020-11-04"
            }
        ]
    ],
    "date": "02.11.2020",
    "status": 0,
    "time": "20:57:14"
}
```

## Rooms
```
service: thiapp
method:  rooms
format:  json
session: <session token>
day:     02
month:   11
year:    2020
```

```json
{
    "data": [
        0,
        {
            "email": null,
            "rooms": [
                {
                    "datum": "2020-11-02",
                    "rtypes": [
                        {
                            "raumtyp": "Kleiner Hörsaal  (40-79 Plätze)",
                            "stunden": {
                                "1": {
                                    "bis": "09:00",
                                    "raeume": "B108, D113, D115, D213, D305, D312, D314, D315, D316, E001, E002, E101, E102, E103, G102, G105, G108, G202, G204, G208, G302, G304, G309",
                                    "von": "08:15"
                                },
                                "2": {
                                    "bis": "09:45",
                                    "raeume": "B108, D113, D115, D213, D305, D312, D314, D315, D316, E001, E002, E101, E102, E103, G102, G204, G208, G302, G304, G309",
                                    "von": "09:00"
                                },
                                // ...
                            }
                        },
                        {
                            "raumtyp": "PC Pool",
                            "stunden": {
                                //...
                            }
                        },
                        {
                            "raumtyp": "Seminarraum (< 40 Plätze)",
                            "stunden": {
                                //...
                            }
                        }
                    ]
                },
                // more days ...
            ]
        }
    ],
    "date": "02.11.2020",
    "status": 0,
    "time": "20:59:31"
}
```

## Mensa
```
service: thiapp
method:  mensa
format:  json
session: <session token>
```

```json
{
    "data": [
        {
            "gerichte": {
                "1": {
                    "name": [
                        "",
                        "Hähnchen Cordon Bleu mit Zitrone ",
                        "2,38 €",
                        "3,38 €",
                        "4,76 €"
                    ],
                    "zusatz": "Wz,Mi"
                },
                "2": {
                    "name": [
                        "",
                        "Ungarische Krautnudeln ",
                        "2,29 €",
                        "3,40 €",
                        "4,58 €"
                    ],
                    "zusatz": "1,Wz,So"
                }
            },
            "tag": "Montag 02.11.2020"
        },
        // more days...
    ],
    "date": "02.11.2020",
    "status": 0,
    "time": "21:13:17"
}
```

## News
```
service: thiapp
method:  thiwebinfo
format:  json
session: <session token>
```

```json
{
    "data": [
        "<html source code>",
        "<html source code>"
    ],
    "date": "02.11.2020",
    "status": 0,
    "time": "21:14:31"
}
```

## Reservations (library)

### getreservation

```
service: thiapp
method:  reservations
format:  json
session: <session token>
type:    1
subtype: 1
cmd:     getreservation
data:   
```

```json
{
    "data": "No reservation data",
    "date": "02.11.2020",
    "status": -126,
    "time": "20:36:31"
}
```

```json
{
    "data": [
        0,
        [
            {
                "rcategory": "Lesesaal Galerie",
                "reservation_begin": "2020-11-03 06:00:00",
                "reservation_end": "2020-11-03 10:00:00",
                "reservation_id": "6678",
                "reserved_at": "2020-11-02 20:25:50",
                "reserved_by": "<username>",
                "resource": "2",
                "resource_id": "3",
                "rsubtype": "1"
            }
        ]
    ],
    "date": "02.11.2020",
    "status": 0,
    "time": "20:34:29"
}
```

### delreservation
```
service: thiapp
method:  reservations
format:  json
session: <session token>
type:    1
subtype: 1
cmd:     delreservation
data:    6678
```

```json
{
    "data": "No reservation data",
    "date": "02.11.2020",
    "status": -126,
    "time": "20:36:31"
}
```

### 
```
service: thiapp
method:  reservations
format:  json
session: <session token>
type:    1
subtype: 1
cmd:     getavailabilities
data:   
```

parts redacted, see getavailabilities-full.json
```json
{
	"date": "02.11.2020",
	"time": "20:37:54",
	"data": [
		0,
		[
			{
				"date": "2020-11-02",
				"hasReservation": false,
				"resource": [
					{
						"from": "18:00",
						"to": "24:00",
						"resources": {
							"1": {
								"room_name": "Lesesaal Nord (alte Bibliothek)",
								"seats": [
									"1",
									"4",
									"5",
									"8",
									"9",
									"12",
									"14",
									"16",
									"18",
									"20",
									"21",
									"24",
									"25",
									"28",
									"29",
									"32",
									"33",
									"36",
									"37",
									"40",
									"41",
									"44",
									"45",
									"48",
									"49",
									"50",
									"51",
									"52",
									"53",
									"54",
									"56",
									"57"
								],
								"num_seats": 32,
								"maxnum_seats": 32
							},
                            // more rooms ...
                        }
                    }
                ]
            },
            // more days, more times ...
        ]
    ],
    "status": 0
}
```
