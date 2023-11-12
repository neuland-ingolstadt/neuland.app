#!/bin/bash
set -euxo pipefail
python ./calculate-distances.py
mv ./room-distances.json /generated/room-distances.json
