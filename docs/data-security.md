# Neuland App Data Safety
TL;DR: Only you and the THI will have access to your password and other
sensitive information.

### Will my data be stored?
Only on your own device.

### Will you steal my password?
We can't.

### Will my data be accesible to you?
No. It is transmitted end to end encrypted between your browser and the THI
Server. Even though our server is used as a proxy we can only see encrypted
data.

### How does this work?
Normally when accessing a REST API your browser makes requests to it using
`fetch` or `XMLHttpRequests`. Because of CORS policies the App is not able to
directly contact the THI API. Instead it connects via a Proxy which is hosted
on our server. Our proxy however acts as a pure Websocket/TCP proxy, i.e.
Websocket packets sent by your Browser are sent as raw TCP packets to the THI
server. Instead of using `fetch` and `XMLHttpRequests` we use `forge`, which is
a full javascript implementation of TLS and HTTP. This way packets are
encrypted in your browser and simply relayed by our server. Only the THI server
and your browser have access to plain text packet contents.

### What if i still do not trust you?
You can read the source code of the neuland app here on github.
If you want, you can even install it on your own server.
