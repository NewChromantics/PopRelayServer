@echo off

echo Warning; this won't execute properly on Docker-toolbox. Run RunServer.sh instead from the docker terminal

set PWD=%~dp0
docker run -it --rm --name PopRelayServer --publish 8080:8080 --volume "%PWD%":/usr/src/app/PopRelayServer/ PopRelayServer

