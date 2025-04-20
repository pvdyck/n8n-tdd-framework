#!/bin/bash

# Script to publish the package to npm
# This script assumes you're already logged in to npm (npm login)

# Build the package
echo "Building the package..."
npm run build

# Run tests
echo "Running tests..."
npm test

# Create a tarball for local testing
echo "Creating a tarball for local testing..."
npm pack

# Publish to npm
echo "Publishing to npm..."
npm publish

echo "Package published to npm!"
echo "Visit https://www.npmjs.com/package/n8n-tdd-framework to see your package."