FROM node:14

WORKDIR /opt/next
ENV NODE_ENV production

COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
