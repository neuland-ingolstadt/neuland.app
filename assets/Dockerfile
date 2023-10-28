FROM python:3 AS spo
WORKDIR /opt/
COPY spo-parser/requirements.txt .
RUN apt-get update \
	&& apt-get install -y libgl1 ghostscript \
	&& pip install -r requirements.txt

COPY spo-parser .
RUN ./run_extraction.sh


# course names are currently unused

#FROM python:3 as courses
#WORKDIR /opt/
#ARG THI_ICAL_USER
#ARG THI_ICAL_SESSION
#ENV THI_ICAL_USER $THI_ICAL_USER
#ENV THI_ICAL_SESSION $THI_ICAL_SESSION
#COPY course-downloader .
#RUN pip install -r requirements.txt \
#	&& python3 obtain_course_list.py



FROM rust:1 as calendar
WORKDIR /opt/
COPY date-scraper .
RUN ./run_extraction.sh



FROM python:3 as roomdistances
WORKDIR /opt/
COPY room-distances .
RUN pip install -r requirements.txt \
	&& python3 calculate-distances.py



FROM python:3 as thitranslator
WORKDIR /opt/
COPY thi-translator .
RUN pip install -r requirements.txt \
	&& python3 thi-translator.py



FROM alekzonder/puppeteer:latest AS pwaicons
USER root
WORKDIR /opt/
COPY rogue-thi-app/public/favicon.svg .
RUN mkdir ./splash && \
    npx pwa-asset-generator --no-sandbox=true --path-override '/' --xhtml --favicon --dark-mode favicon.svg ./splash/ && \
    tar cf splash.tar.gz splash



FROM nginx:latest
COPY --from=spo /opt/spo-grade-weights.json /usr/share/nginx/html/generated/
#COPY --from=courses /opt/ical-courses.json /usr/share/nginx/html/generated/
COPY --from=thitranslator /opt/thi-api-translations /usr/share/nginx/html/generated/
COPY --from=calendar /opt/calendar.json /usr/share/nginx/html/generated/
COPY --from=roomdistances /opt/room-distances.json /usr/share/nginx/html/generated/
COPY --from=pwaicons /opt/splash.tar.gz /usr/share/nginx/html/generated/
