# Local build: "DOCKER_BUILDKIT=1 docker build --progress=plain -t steam-comment-service-bot ."
# Requires BuildKit! https://docs.docker.com/build/buildkit
# Start: "docker run -p 4000:4000 -v <destination path>:/usr/src/steam-comment-service-bot steam-comment-service-bot"

FROM node:lts-alpine

# Create destination directory
RUN mkdir -p /usr/src/steam-comment-service-bot
WORKDIR /usr/src/steam-comment-service-bot

# Copy the app, note .dockerignore
COPY . /usr/src/steam-comment-service-bot
RUN ls -al /usr/src/steam-comment-service-bot

# Set ownership and switch to unprivileged user
RUN chown -R node:node ./
USER node
RUN ls -al /usr/src/steam-comment-service-bot

# Expose port a port if a plugin requires one, in this case 4000 for the pre-installed steam-comment-bot-rest plugin
EXPOSE 4000

# Start the application, it auto installs dependencies on the first start
CMD [ "npm", "run", "start" ]
