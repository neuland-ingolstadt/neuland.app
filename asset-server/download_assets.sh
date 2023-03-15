#!/bin/bash

set -euxo pipefail

wget "$NEXT_PUBLIC_ASSETSERVER_URL/generated/spo-grade-weights.json" -O data/spo-grade-weights.json
wget "$NEXT_PUBLIC_ASSETSERVER_URL/generated/ical-courses.json" -O data/ical-courses.json
wget "$NEXT_PUBLIC_ASSETSERVER_URL/generated/calendar.json" -O data/calendar.json

cd public
wget "$NEXT_PUBLIC_ASSETSERVER_URL/generated/splash.tar.gz"
tar -xf splash.tar.gz
rm splash.tar.gz
