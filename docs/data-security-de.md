# Neuland App Datensicherheit

TL;DR: Nur du und die THI Haben Zugriff auf dein Passwort sowie deine
persönlichen Daten.

## Speichert ihr meine Daten?

Nur lokal auf deinem Gerät.

## Klaut ihr mein Passwort?

Wir haben keinen Zugriff auf dein Passwort.

## Wie funktioniert das?

Normalerweise wenn man der Browser eine REST API benutzt wird `fetch` oder
`XMLHttpRequests` in Javascript benutzt. Der Browser verhindert aber dass
eine Seite A (z.B. neuland.app) auf eine Seite B (z.B. thi.de) zugreift.
Als Lösung kann entweder Seite B (also thi.de) CORS Header setzen oder man
muss über einen Proxy auf thi.de zugreifen.
In unserem Fall benutzen wir einen reinen Websocket/TCP Proxy. Der Browser
sendet also Websocket Pakete die in TCP Pakete umgewandelt werden. Anstatt von
`fetch` benutzen wir `forge`, eine TLS und HTTP Implementierung in Javascript.
Anfragen an thi.de werden also im Browser verschlüsselt und nur von unserem
Proxy weitergegeben. So hat nur der THI Server und der Browser Zugriff auf
Passwörter und Nutzerdaten.

## Ich vertraue euch trotzdem nicht

Gerne kannst du hier auf Github den Source Code der Neuland App lesen und
diese wenn du möchtest auch selbst auf deinem Server installieren.
