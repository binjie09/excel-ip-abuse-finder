# Stage 1: Build the React client
FROM node:20-alpine as client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Setup the Server
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production

# Copy server source
COPY server/ ./server

# Copy built client assets to where the server expects them
# Server index.js points to '../client/dist', so let's replicate that structure
# /app/server
# /app/client/dist
RUN mkdir -p client/dist
COPY --from=client-build /app/client/dist ./client/dist

# Expose the API port
EXPOSE 3000

# Set working directory to server where package.json and index.js are relative to correct paths 
# (Actually my server/index.js requires '../client/dist' so running from /app/server is key)
WORKDIR /app/server

# Environment variables should be passed at runtime
# CMD to start the server
CMD ["node", "index.js"]
