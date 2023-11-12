#!/bin/bash
set -euxo pipefail

apt-get update
apt-get install -y libgl1 ghostscript

(cd ./room-distances && pip install -r requirements.txt)
(cd ./spo-parser && pip install -r requirements.txt)
