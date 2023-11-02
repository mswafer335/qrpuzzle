FROM node:12

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY tslint.json ./
COPY .env ./
COPY 0001.jpg ./
COPY bgNew.jpg ./
COPY bgNewer.jpg ./
COPY sideNew1.jpg ./
COPY src /app/src


RUN npm install
RUN npm run build

EXPOSE 1370 1370 465 465

CMD [ "npm", "run", "start" ]