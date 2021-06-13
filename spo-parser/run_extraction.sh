#!/bin/bash

mkdir -p SPOs
python3 download_spo_pdfs.py

mkdir -p weightings
for filename in SPOs/*.pdf; do
	outfile=$(echo "$filename" | sed 's/^SPOs/weightings/' | sed 's/.pdf$/.json/')
	echo "Analyzing $filename => $outfile"
	python3 extract_grade_weighting.py "$filename" "$outfile"
done