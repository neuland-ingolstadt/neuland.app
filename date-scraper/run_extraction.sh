#!/bin/bash

# TODO always get the neweset pdf file(s) from https://www.thi.de/studium/pruefung/semestertermine/
wget 'https://www.thi.de/fileadmin/daten/studienangelegenheiten/Allgemeines/Semestertermine_Studium_WS2223_und_SS23_-_05.07.2022.pdf' -O calendar.pdf

cargo run -- calendar.pdf calendar.json
