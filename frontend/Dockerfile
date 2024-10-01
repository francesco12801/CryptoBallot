# Use the official Node.js image as a base image for building the frontend
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

# Remove the default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy a custom Nginx configuration file to the container
COPY nginx.conf /etc/nginx/conf.d

# Copy the build folder from the previous stage to Nginx's default serving directory
COPY --from=frontend /app/build /usr/share/nginx/html

# Expose port 80 to allow external access
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
