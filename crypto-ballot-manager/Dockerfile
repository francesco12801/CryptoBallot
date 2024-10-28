FROM node:18-alpine

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN npm install

# Expose port
EXPOSE 4005

# Start the service
CMD ["npm", "start"]