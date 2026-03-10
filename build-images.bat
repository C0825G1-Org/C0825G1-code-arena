@echo off
setlocal enabledelayedexpansion

echo =======================================================
echo   Code Arena - Build Judge Images (Windows)
echo =======================================================

echo.
echo [1/4] Building C++ Image (judge-cpp)...
docker build -t judge-cpp ./judge-images/cpp
if !errorlevel! neq 0 ( echo Failed to build C++ image & pause & exit /b !errorlevel! )

echo.
echo [2/4] Building Java Image (judge-java)...
docker build -t judge-java ./judge-images/java
if !errorlevel! neq 0 ( echo Failed to build Java image & pause & exit /b !errorlevel! )

echo.
echo [3/4] Building Python Image (judge-python)...
docker build -t judge-python ./judge-images/python
if !errorlevel! neq 0 ( echo Failed to build Python image & pause & exit /b !errorlevel! )

echo.
echo [4/4] Building JavaScript Image (judge-js)...
docker build -t judge-js ./judge-images/js
if !errorlevel! neq 0 ( echo Failed to build JavaScript image & pause & exit /b !errorlevel! )

echo.
echo =======================================================
echo   SUCCESS: All images built and tagged successfully!
echo =======================================================
pause
