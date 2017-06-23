Running locally on Windows & Osx
========================
- install node.js 
	- Windows: https://nodejs.org/en/download/ 
	- OSX: 
		- install home brew https://brew.sh/ `/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
`
		- install node js: `brew install node.js`
- install modules (see which ones are required in `DockerFile`).
	- `npm install ip`
	- `npm install websocket` etc
- open a terminal, `cd` into this directory and run `node Server.js` and the two websockets should open. 
- Navigate to http://localhost:8080/ to see the test interface.
- Connect to see messages as a client.

Usage
=========================
- As an observing client, connect a websocket to `<ip>:8080`. Binary & Text messages will come in as the server sends them
- As a god(server in the literal sense) connect a websocket to `<ip>:8081`. All messages (Binary & Text) will be relayed to all clients
- To find the server on the LAN, send a UDP broadcast packet with `whoisserver` to port `8082` and a reply with the server IP and port(8081) will be replied.
