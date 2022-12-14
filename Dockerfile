FROM node:14-slim

WORKDIR /mpl

COPY package.json .

RUN npm install 

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
