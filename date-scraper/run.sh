#!/bin/bash
set -euxo pipefail

rm -f *.pdf

for file in $(curl 'https://www.thi.de/studium/pruefung/semestertermine/' | grep -Eo '/fileadmin[^"]+.pdf'); do
    wget "https://thi.de$file"
done

cargo run -- calendar.json
mv calendar.json /generated/calendar.json
