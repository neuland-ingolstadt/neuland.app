# Mensa Booking API

The Studentenwerk Erlangen Nürnberg added a mensa seat reservation system during the COVID-19 pandemic.
It is embedded on <https://www.werkswelt.de/mensareservierung> using an iframe.
The real URL is <https://togo.my-mensa.de/5ecb878c-9f58-4aa0-bb1b/erl77vB3r/reservations/formular/>
Below is a short reference of the API requests used by the reservation system.

## Request Verification E-Mail

POST <https://togo.my-mensa.de/5ecb878c-9f58-4aa0-bb1b/erl77vB3r/reservations/request_access_code>

Request:

```http
email=REDACTED
```

Response:

```json
{
 "email": "REDACTED",
 "data": "versendet"
}
```

## Check Verification Code

POST <https://togo.my-mensa.de/5ecb878c-9f58-4aa0-bb1b/erl77vB3r/reservations/check_access_token>

Request:

```http
email=REDACTED&accesscode=REDACTED
```

Response is a number `0` for failure and `3` for success.

## Cancel Reservation

GET <https://togo.my-mensa.de/5ecb878c-9f58-4aa0-bb1b/erl77vB3r/reservations/cancelcommit?k=REDACTED&i=REDACTED>

With `i=${reservation.id}` and `k=${reservation.krz}`

## Reserve Seat

POST <https://togo.my-mensa.de/5ecb878c-9f58-4aa0-bb1b/erl77vB3r/reservations/add_by_client>

Request (with additional newlines for readability)

```http
dauer=30
&gruppe=1
&vorname=REDACTED
&name=REDACTED
&strasse_nr=REDACTED
&plz=REDACTED
&ort=REDACTED
&telefon=REDACTED
&email=REDACTED
&accesscode=REDACTED
&save_allowed=on
&nutzungsbedingungen=on
&drei_g=on
&date_val=0
&date=Bitte+Datum+w%C3%A4hlen
&einrichtung_val=7
&einrichtung=Mensa+Ingolstadt
&zeitpunkt=11%3A00
&tkid=664
&date_iso=2021-09-07
```

Response on success

```json
{
 "message": {
  "status": "success",
  "text": "Die Reservierung wurde erfolgreich vorgenommen.",
  "info": "Die Reservierungsbest\u00e4tigung wurde an REDACTED gesendet"
 },
 "tk": {
  "Tischkonfiguration": {
   "id": "664",
   "location_id": "7",
   "stand_id": "84",
   "bemerkung": "Aktuell u50",
   "standdate": "2021-06-14",
   "mo_start": "11:00:00",
   "mo_ende": "13:50:00",
   "di_start": "11:00:00",
   "di_ende": "13:50:00",
   "mi_start": "11:00:00",
   "mi_ende": "13:50:00",
   "do_start": "11:00:00",
   "do_ende": "13:50:00",
   "fr_start": "11:00:00",
   "fr_ende": "13:50:00",
   "sa_start": "00:00:00",
   "sa_ende": "00:00:00",
   "so_start": "00:00:00",
   "so_ende": "00:00:00",
   "plaetze": "58",
   "gruppen": "3",
   "dauer_in_min": "30",
   "sperrzeit_in_min": "0",
   "karenz_vor_start_in_min": "10",
   "karenz_nach_start_in_min": "10",
   "sitznamen": "",
   "open": true,
   "bam": true,
   "cas": false,
   "modified": "2021-06-14 12:30:17",
   "created": "2021-06-14 12:29:58"
  },
  "Stand": {
   "id": "84",
   "date": "2020-10-03",
   "label": "Mehr Pl\u00e4tze ING"
  },
  "Location": {
   "loc_id": "7",
   "customer_id": "1",
   "daily_first_login": "0000-00-00 00:00:00",
   "einrichtung": "Mensa Ingolstadt",
   "einrichtung_lang": "",
   "rang": "70",
   "dir": "mensa-ingolstadt",
   "anschrift": "",
   "plz": "",
   "ort": "",
   "arr_map_cont_locs": "",
   "ctv_pl_dir": "",
   "ctv_content_subdirs": "",
   "ctv_news_subdir": "",
   "url_original_ctvplaylist": "",
   "susti": "",
   "prodgrpLocID": "7",
   "slsys_englisch": "1",
   "slsys_fv": "",
   "slsys_ap": "",
   "slsys_tp": "",
   "aktiver_tl1import": false,
   "print_config": "erlangen_nuernberg_07_mensa_ingolstadt",
   "globale_artikel": false,
   "timestamp": "2017-10-31 11:22:36"
  }
 },
 "client": {
  "Client": {
   "id": "REDACTED (some number)",
   "id_string": "REDACTED (email verification code)",
   "anrede_id": "0",
   "vorname": "REDACTED",
   "name": "REDACTED",
   "email": "REDACTED",
   "language": "de",
   "mensacard_nr": "",
   "strasse_nr": "REDACTED",
   "plz": "REDACTED",
   "ort": "REDACTED",
   "bezirk": "",
   "telefon": "REDACTED",
   "typ": "3",
   "guthaben": "0.00",
   "blocked_until": null,
   "created": "2021-09-04 13:20:01",
   "modified": "2021-09-04 13:43:46"
  },
  "ClientTyp": {
   "id": "3",
   "name": "Gast",
   "preis_feld": "Preis3"
  },
  "Anrede": {
   "id": null,
   "name": null
  }
 },
 "reservation": {
  "Reservation": {
   "client_id": "REDACTED (clent.Client.id from above)",
   "location_id": "7",
   "tag": "2021-09-07",
   "uhrzeit_start": "11:00",
   "dauer": "30",
   "tischgruppe": "1",
   "tischkonfiguration_id": "664",
   "modified": "2021-09-04 13:49:19",
   "created": "2021-09-04 13:49:19",
   "uhrzeit_ende": "11:30:00",
   "tischnr": 1,
   "id": "REDACTED (some id number)",
   "krz": "REDACTED (reservation code)",
   "sitzplatz": false
  }
 },
 "data": {
  "dauer": "30",
  "gruppe": "1",
  "vorname": "REDACTED",
  "name": "REDACTED",
  "strasse_nr": "REDACTED",
  "plz": "REDACTED",
  "ort": "REDACTED",
  "telefon": "REDACTED",
  "email": "REDACTED",
  "accesscode": "REDACTED (email verification code)",
  "save_allowed": "on",
  "nutzungsbedingungen": "on",
  "drei_g": "on",
  "date_val": "0",
  "date": "Bitte Datum w\u00e4hlen",
  "einrichtung_val": "7",
  "einrichtung": "Mensa Ingolstadt",
  "zeitpunkt": "11:00",
  "tkid": "664",
  "date_iso": "2021-09-07"
 },
 "intern_error": ""
}
```

Response on error

```json
{
 "message": {
  "status": "error",
  "code": "E_ABC_4",
  "text": "Kein Tisch mehr frei!",
  "info": "Leider wurde zwischenzeitlich vom Buchungssystem eine andere Reservierung angenommen."
 },
 "tk": [],
 "client": {
  "Client": {
   "id": "REDACTED",
   "id_string": "REDACTED",
   "anrede_id": "0",
   "vorname": "REDACTED",
   "name": "REDACTED",
   "email": "REDACTED",
   "language": "de",
   "mensacard_nr": "REDACTED",
   "strasse_nr": "REDACTED",
   "plz": "REDACTED",
   "ort": "REDACTED",
   "bezirk": "",
   "telefon": "",
   "typ": "3",
   "guthaben": "0.00",
   "blocked_until": null,
   "created": "2021-09-04 13:20:01",
   "modified": "2021-09-04 13:20:01"
  },
  "ClientTyp": {
   "id": "3",
   "name": "Gast",
   "preis_feld": "Preis3"
  },
  "Anrede": {
   "id": null,
   "name": null
  }
 },
 "reservation": [],
 "data": {
  "dauer": "30",
  "vorname": "REDACTED",
  "name": "REDACTED",
  "strasse_nr": "REDACTED",
  "plz": "REDACTED",
  "ort": "REDACTED",
  "telefon": "",
  "email": "REDACTED",
  "accesscode": "REDACTED",
  "save_allowed": "on",
  "nutzungsbedingungen": "on",
  "drei_g": "on",
  "date_val": "2021-09-04",
  "date": "Sa, 04. Sep 2021",
  "einrichtung_val": "7",
  "einrichtung": "Mensa Ingolstadt",
  "date_iso": "2021-09-04"
 },
 "intern_error": ""
}
```
