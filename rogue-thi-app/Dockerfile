FROM node:14

WORKDIR /opt/next

COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

USER node
EXPOSE 3000
CMD ["npm", "start"]
