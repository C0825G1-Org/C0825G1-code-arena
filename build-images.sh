#!/bin/bash

echo "======================================================="
echo "  Code Arena - Build Judge Images (Linux/Mac)"
echo "======================================================="

# Build C++
echo ""
echo "[1/4] Building C++ Image (judge-cpp)..."
docker build -t judge-cpp ./judge-images/cpp || { echo "Failed to build C++ image"; exit 1; }

# Build Java
echo ""
echo "[2/4] Building Java Image (judge-java)..."
docker build -t judge-java ./judge-images/java || { echo "Failed to build Java image"; exit 1; }

# Build Python
echo ""
echo "[3/4] Building Python Image (judge-python)..."
docker build -t judge-python ./judge-images/python || { echo "Failed to build Python image"; exit 1; }

# Build JavaScript
echo ""
echo "[4/4] Building JavaScript Image (judge-js)..."
docker build -t judge-js ./judge-images/js || { echo "Failed to build JavaScript image"; exit 1; }

echo ""
echo "======================================================="
echo "  SUCCESS: All images built and tagged successfully!"
echo "======================================================="
