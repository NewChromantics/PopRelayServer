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
