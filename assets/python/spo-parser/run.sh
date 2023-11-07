#! /bin/bash

# Fail if any error occurs
set -euxo pipefai

# Specify the name of the Bash script
bash_script="run_parser.sh"

# Check if the Python script exists
if [ -f "$bash_script" ]; then
    # Run the Python script
    bash "$bash_script"
else
    echo "Bash script '$bash_script' not found."
    exit 1
fi