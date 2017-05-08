# non-onbuild version
#FROM node:4.5.0
#RUN mkdir -p /usr/src/app
#WORKDIR /usr/src/app
#ONBUILD COPY package.json /usr/src/app/
#ONBUILD RUN npm install
#ONBUILD COPY . /usr/src/app
#CMD [ "npm", "start" ]


FROM node:4-onbuild





# change dir before installing module
WORKDIR /usr/src/app
RUN npm install websocket
RUN npm install ip

# gr: make this an env var and read from .js
ENV HTTP_PORT=8080
EXPOSE 8080

ENV PATH_PREFIX=PopRelayServer/

