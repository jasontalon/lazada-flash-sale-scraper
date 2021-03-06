FROM node:10.17-alpine

WORKDIR /usr/src/app

COPY package*.json .npmrc ./

RUN npm install

COPY . /usr/src/app

EXPOSE 8080

CMD [ "npm", "start" ]