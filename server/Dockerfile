# Use the official Node.js 22 image as the base image
#1.Base Image: node:22
# This image includes Node.js and npm, which are required to run the application
FROM node:22

#2. Working Directory:
# Set the working directory inside the container
WORKDIR /usr/src/app

ENV PORT=8080

#4. Copy Application Code:
# Copy the rest of the application code to the working directory
COPY . .

#5.Expose Port:
# Expose the port the app runs on (e.g., 3000)
EXPOSE 8080

#6. Start Command:
# Define the command to run the application
CMD ["node", "server"]