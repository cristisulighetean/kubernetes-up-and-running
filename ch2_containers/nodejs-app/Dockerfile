FROM node:16-alpine

# Specify the directory inside the image in which all commands will run
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all of the app files into the image
COPY . .

# Default command to run when starting the container
CMD [ "npm", "start" ]
