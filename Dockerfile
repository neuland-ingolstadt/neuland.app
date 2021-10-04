FROM python:3 AS spo
WORKDIR /opt/
COPY spo-parser/ .
RUN apt-get update \
	&& apt-get install -y libgl1 ghostscript \
	&& pip install requests opencv-python camelot-py ghostscript
RUN ./run_extraction.sh



FROM node:14

WORKDIR /opt/next

ARG NEXT_PUBLIC_DISCORD_URLS
ARG NODE_EXTRA_CA_CERTS
ENV NEXT_PUBLIC_DISCORD_URLS $NEXT_PUBLIC_DISCORD_URLS
ENV NODE_EXTRA_CA_CERTS $NODE_EXTRA_CA_CERTS

COPY rogue-thi-app/package.json rogue-thi-app/package-lock.json ./
RUN npm install
COPY rogue-thi-app/ .
COPY --from=spo /opt/spo-grade-weights.json data/

RUN npm run build

USER node
EXPOSE 3000
CMD ["npm", "start"]