FROM python:3
WORKDIR /opt

# copy files
COPY . .

# install depencencies
RUN bash ./install.sh

# add user
RUN groupadd -r -g 1000 assets && useradd --no-log-init -r -m -g assets -u 1000 assets

# set up cronjobs
RUN apt install -y busybox-static
RUN mkdir -p /var/spool/cron/crontabs
RUN busybox crontab -u assets cron

ENTRYPOINT bash ./run.sh
