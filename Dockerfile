FROM alekzonder/puppeteer:latest AS pwaicons
USER root
WORKDIR /opt/
COPY rogue-thi-app/public/favicon.svg .
RUN mkdir ./splash && npx pwa-asset-generator --no-sandbox=true --path-override '/' --xhtml --dark-mode favicon.svg ./splash/

FROM node:20

WORKDIR /opt/next

ARG NEXT_PUBLIC_HACKERMAN_FLAGS
ARG NEXT_PUBLIC_ELECTION_URL
ARG NEXT_PUBLIC_GUEST_ONLY
ARG NEXT_PUBLIC_THI_API_MODE
ARG NEXT_PUBLIC_THI_API_KEY
ENV NEXT_PUBLIC_HACKERMAN_FLAGS $NEXT_PUBLIC_HACKERMAN_FLAGS
ENV NEXT_PUBLIC_ELECTION_URL $NEXT_PUBLIC_ELECTION_URL
ENV NEXT_PUBLIC_GUEST_ONLY $NEXT_PUBLIC_GUEST_ONLY
ARG NEXT_PUBLIC_THI_API_MODE $NEXT_PUBLIC_THI_API_MODE
ENV NEXT_PUBLIC_THI_API_KEY $NEXT_PUBLIC_THI_API_KEY

COPY rogue-thi-app/package.json rogue-thi-app/package-lock.json ./
COPY rogue-thi-app/ .

COPY --from=pwaicons /opt/splash/ public/

RUN npm run build

USER node
EXPOSE 3000
CMD ["npm", "start"]
