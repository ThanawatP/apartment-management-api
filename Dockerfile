FROM node:8.1.1

ENV MONGO_URI localhost
ADD package.json /tmp/package.json
RUN cd /tmp && npm install --production && npm install --dev
RUN mkdir -p /usr/src/app && cp -a /tmp/node_modules /usr/src/app/
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN chmod +x ./run.sh
CMD ["./run.sh"]