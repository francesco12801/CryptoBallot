# Use the official Node.js image as a base image
FROM node:14 AS frontend

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application’s code to the working directory
COPY . .

# Build the app for production
RUN npm run build

# Use an official Nginx image to serve the React app
FROM nginx:alpine

# Copy the build folder to Nginx's default directory
COPY --from=frontend /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
