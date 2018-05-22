#!/bin/bash
if [ -z "${MONGO_URI}" ]; then
  export MONGO_URI=localhost
fi
npm run start