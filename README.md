Running server on windows
========================

- Install docker toolbox for windows (Normal docker should work, but Segun had problems... this is fine)
- Open docker quickstart terminal

- Configure virtualbox virtual machine to expose to LAN;
- ^^ GR: This isn' working and VM doesnt startup. But leaving here for later...
	- type `docker-machine stop` to stop the vm
	- from start menu, find VirtualBox
	- In the list of virtual machines, select `Default` and settings
	- Under Network, add a 3rd network adaptor, set Attached to to Bridged Adaptor
	- OK and close
	- Start VM again with `docker-machine start`

- Type `cd <directory to Server folder>` (can drag folder onto terminal after typing cd)
- Type `./Install.sh` to install the docker image (note: case sensitive)
- Type `./RunServer.sh` (note: case sensitive). This should pop up a chrome browser that points to the virtual machine
- the docker terminal should now say
	- `<date> GMT+0000 (UTC) Server is listening on port 8080`
	- this indicates the server is running
- Go to the chrome webpage that popped up. If it loaded before the docker image started you may need to refresh
- There should be a websocket text box with the current address. Click the Connect button. If this is successfull this should then disable, and disconnect enable (this should be pretty much instant)
- If there are any errors, open the chrome menu, and "More Tools...", "Developer Tools" and look at the console for any clues