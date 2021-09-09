FROM node:14

WORKDIR /opt/next

ARG NEXT_PUBLIC_DISCORD_URLS
ARG NEXT_PUBLIC_ENABLE_AVERAGES
ENV NEXT_PUBLIC_DISCORD_URLS $NEXT_PUBLIC_DISCORD_URLS
ENV NEXT_PUBLIC_ENABLE_AVERAGES $NEXT_PUBLIC_ENABLE_AVERAGES

COPY package.json package-lock.json ./
RUN npm install
COPY . .

RUN wget -O data/rooms.json 'https://map.thi.de/geoserver/wfs?service=wfs&version=2.0.0&request=GetFeature&outputFormat=application%2Fjson&typeName=mythi%3ATHI_Raeume'

RUN npm run build

USER node
EXPOSE 3000
CMD ["npm", "start"]
