#!/bin/bash
set -euxo pipefail

# (cd ./room-distances && bash ./run.sh)
# (cd ./spo-parser && bash ./run.sh)

busybox crond -f -L /dev/stdout
