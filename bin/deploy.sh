#!/usr/bin/env bash
REACT_APP_SOCKET_URL=wss://live.altfolio.live && yarn build
aws s3 sync build/ s3://altfolio.live
