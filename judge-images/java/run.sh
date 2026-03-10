#!/bin/bash

JAVA_FILE="Main.java"
CLASS_NAME="Main"
TESTCASE_DIR="/testcases"

# ====== COMPILE ======
if [ ! -f "$JAVA_FILE" ]; then
  echo "COMPILE_ERROR"
  echo "Main.java not found in /app"
  ls -la /app
  exit 0
fi

javac $JAVA_FILE 2> compile_error.txt

if [ $? -ne 0 ]; then
  echo "COMPILE_ERROR"
  cat compile_error.txt
  exit 0
fi

# ====== RUN ALL TESTCASES ======
FOUND_TESTCASES=false

for input_file in ${TESTCASE_DIR}/*.in; do
  [ -e "$input_file" ] || continue
  FOUND_TESTCASES=true
  
  test_filename=$(basename "$input_file")
  test_id=${test_filename%.in}
  
  echo "--- TESTCASE ${test_id} ---"
  
  /usr/bin/time -o "stats${test_id}.txt" -f "TIME: %e\nMEM: %M" timeout 2s java $CLASS_NAME < "$input_file" > "user_output${test_id}.txt" 2> runtime_error.txt
  EXIT_CODE=$?
  
  # In metrics ra log để parser đọc
  if [ -f "stats${test_id}.txt" ]; then
    cat "stats${test_id}.txt"
  fi
  
  if [ $EXIT_CODE -eq 124 ]; then
    echo "STATUS: TLE"
    continue
  fi
  
  if [ $EXIT_CODE -ne 0 ]; then
    echo "STATUS: RE"
    cat runtime_error.txt
    continue
  fi
  
  echo "STATUS: SUCCESS"
  echo "ACTUAL_OUTPUT_START"
  cat "user_output${test_id}.txt"
  echo "ACTUAL_OUTPUT_END"
done

if [ "$FOUND_TESTCASES" = false ]; then
  echo "ERROR: No testcases found in ${TESTCASE_DIR}"
  ls -la ${TESTCASE_DIR}
  exit 1
fi

echo "--- ALL_DONE ---"
exit 0