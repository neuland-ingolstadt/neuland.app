FROM python:3

RUN pip install websockify
RUN groupadd -r python && useradd --no-log-init -r -g python python

USER python
EXPOSE 3000
CMD ["websockify", "3000", "togo.my-mensa.de:443"]
