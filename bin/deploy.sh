#!/usr/bin/env bash

# deploy API
ssh 35.202.251.208 "cd altfolio-live && git pull && yarn && sudo pm2 kill && sudo -E pm2 start ecosystem.config.js"

# build and deploy client
REACT_APP_SOCKET_URL=wss://live.altfolio.live yarn build
aws s3 sync build/ s3://altfolio.live