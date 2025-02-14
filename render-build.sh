#!/bin/bash

echo "Installing Chromium..."
apt-get update
apt-get install -y chromium-browser

echo "Setting CHROME_PATH..."
export CHROME_PATH="/usr/bin/chromium-browser"
