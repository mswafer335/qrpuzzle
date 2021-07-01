FROM node:12

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY tslint.json ./
COPY .env ./
COPY src /app/src


RUN npm install
RUN npm run build

EXPOSE 1370 1370 465 465

CMD [ "node", "./dist/index.js" ]