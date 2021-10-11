FROM node:lts-alpine3.14 

WORKDIR /home/app

RUN apk upgrade --update-cache --available && \
    apk add openssl && \
    rm -rf /var/cache/apk/*

COPY cert.sh .

RUN sh cert.sh

RUN apk del  openssl

COPY package.json .

RUN npm install --production

COPY proxy.js .

ENTRYPOINT [ "node", "proxy.js"]