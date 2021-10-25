#!/bin/bash

# This script is used by the CI pipeline to automatically
# setup the Android environment of the THI App
# Requirements: Java

PROJECT_SUBDIR="rogue-thi-app"

GRADLE_VERSION="6.9.1"
NODE_VERSION="v14.18.1"

NODE_DIR="node-$NODE_VERSION-linux-x64"
NODE_ARCHIVE="${NODE_DIR}.tar.xz"
NODE_URL="https://nodejs.org/dist/$NODE_VERSION/$NODE_ARCHIVE"

wget $NODE_URL
tar xf $NODE_ARCHIVE
export PATH=$(pwd)/$NODE_DIR/bin:$PATH

cd $PROJECT_SUBDIR

npx next telemetry disable
npx cap telemetry off

npm install
npm run build

npx next build
npx next export
npx cap sync android

cd android
./gradlew wrapper --gradle-version=${GRADLE_VERSION} --distribution-type=bin

