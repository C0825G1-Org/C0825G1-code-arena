#!/bin/bash

JS_FILE="solution.js"
TESTCASE_DIR="/testcases"

if [ ! -f "$JS_FILE" ]; then
  echo "RUNTIME_ERROR"
  echo "solution.js not found"
  exit 0
fi

FOUND_TESTCASES=false

for input_file in ${TESTCASE_DIR}/*.in; do
  [ -e "$input_file" ] || continue
  FOUND_TESTCASES=true
  
  test_filename=$(basename "$input_file")
  test_id=${test_filename%.in}
  
  echo "--- TESTCASE ${test_id} ---"
  
  timeout 2s node $JS_FILE < "$input_file" > "user_output${test_id}.txt" 2> runtime_error.txt
  EXIT_CODE=$?
  
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
  echo "ERROR: No testcases found"
  exit 1
fi

echo "--- ALL_DONE ---"
exit 0
