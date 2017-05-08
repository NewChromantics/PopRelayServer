hostname=`docker-machine ip`

start chrome http://$hostname:8080/

docker run -it --rm --name PopRelayServer --publish 8080:8080 --volume "$PWD":/usr/src/app/PopRelayServer/ poprelayserver
