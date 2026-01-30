FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application files
COPY . .

# Build Next.js app
RUN npm run build

# Expose ports
EXPOSE 3000 5000

# Start both backend and frontend
CMD ["sh", "-c", "node server.js & npm start"]
