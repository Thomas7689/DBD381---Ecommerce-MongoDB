FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .
COPY .env .env


# Expose the port 
EXPOSE 5000

# Run app
CMD ["node", "index.js"]
