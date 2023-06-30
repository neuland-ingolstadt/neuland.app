FROM node:16

WORKDIR /opt/node

COPY package.json package-lock.json .
RUN npm install

COPY . .

USER node
EXPOSE 3001
CMD ["npm", "start"]
