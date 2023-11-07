#!/bin/bash

# Fail if any error occurs
set -euxo pipefail

# Find all child directories with a requirements.txt file
directories=(*/)

# Loop through the child directories and run run.sh if it exists
for dir in "${directories[@]}"; do
    if [ -f "${dir}run.sh" ]; then
        echo "Running ${dir}run.sh..."
        cd "${dir}"
        bash "run.sh"
        echo "Execution of ${dir}run.sh completed."
        cd ..
    fi
done

ls -la
ls -la spo-parser/
ls -la course-downloader/
ls -la thi-translator/
ls -la room-distances/