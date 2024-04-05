#!/bin/bash
set -euxo pipefail
python ./calculate_distances.py
mv ./room-distances.json /generated/room-distances.json
