#!/bin/bash

set -e

BUILD_DIR="build"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

echo "Compilando..."

find streetbrawler -name "*.java" > sources.txt

javac -encoding UTF-8 -d "$BUILD_DIR" @sources.txt

rm sources.txt

echo "Executando..."

java -cp "$BUILD_DIR" streetbrawler.Main