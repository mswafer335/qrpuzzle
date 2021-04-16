FROM node:12

# update packages
# RUN apt-get update

# create root application folder
WORKDIR /app

# copy configs to /app folder
COPY package*.json ./
COPY tsconfig.json ./
COPY tslint.json ./
COPY .env ./
# copy source code to /app/src folder
COPY src /app/src

# check files list
# RUN ls -a

RUN npm install
RUN npm run build

EXPOSE 1370

CMD [ "node", "./dist/index.js" ]