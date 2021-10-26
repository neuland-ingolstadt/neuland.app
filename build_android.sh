#!/bin/bash

# This script is used by the CI pipeline to automatically
# setup the Android environment of the THI App
# Requirements: Java

PROJECT_SUBDIR="rogue-thi-app"

NODE_VERSION="v14.18.1"
ANDROID_BUILD_VERSION="7583922"
ANDROID_SDK_VERSION="r31.0.3"
ANDROID_PLATFORM_VERSION="platforms;android-30"

ANDROID_SDK_ROOT=$(pwd)/sdk_root

NODE_DIR="node-$NODE_VERSION-linux-x64"
NODE_ARCHIVE="${NODE_DIR}.tar.xz"
NODE_URL="https://nodejs.org/dist/$NODE_VERSION/$NODE_ARCHIVE"

ANDROID_TOOLS_ARCHIVE="commandlinetools-linux-${ANDROID_BUILD_VERSION}_latest.zip"
ANDROID_TOOLS_URL="https://dl.google.com/android/repository/$ANDROID_TOOLS_ARCHIVE"

wget $ANDROID_TOOLS_URL
unzip $ANDROID_TOOLS_ARCHIVE
export PATH=$(pwd)/cmdline-tools/bin:$PATH

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
yes "n" | npx cap sync android

yes | sdkmanager --sdk_root=$ANDROID_SDK_ROOT --install "$ANDROID_PLATFORM_VERSION"

cd android
ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT ./gradlew wrapper --distribution-type=bin
#ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT ./gradlew check  # TODO: prevent from failing!
ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT ./gradlew assemble
