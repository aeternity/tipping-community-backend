FROM node:12-alpine

# Installs latest Chromium (77) package.
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      freetype-dev \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      git

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Add user so we don't need --no-sandbox.
RUN addgroup -S pptruser && adduser --uid 1001 -S -g pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

WORKDIR /app
COPY package.json /app
RUN npm install --only=production

COPY . /app

RUN chown -R pptruser:pptruser /app

# Run everything after as non-privileged user.
USER pptruser
RUN npx sequelize-cli db:migrate

EXPOSE 3000

CMD ["node", "server.js"]
