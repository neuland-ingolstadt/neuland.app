import re
import sys
import json
import camelot

if len(sys.argv) != 3:
	print("Usage: extract_grade_weighting.py <pdf file> <json output file>", file=sys.stderr)
	exit(1)

tables = camelot.read_pdf(sys.argv[1], pages="all")

entries = []
unfinished_table = False
for table in tables:
	data = table.data
	is_finished = "summe" in data[-1][1].lower()
	if is_finished:
		# remove sum row
		data = data[0 : -1]

	num_col = 0
	name_col = 1
	sws_col = 2
	weight_col = 7
	ects_col = 9

	if data[0][name_col] != "Modul" \
		or data[0][sws_col] != "SWS" \
		or "gewichtung" not in data[0][weight_col].lower():
		if unfinished_table:
			pass # continuation of previous table which had a valid header
		else:
			continue # ignore tables which dont list modules

	for row in data:
		apo_num = row[num_col].strip()
		if re.match("^\\d+(\\.\\d+)?$", apo_num) is None:
			continue

		weight = row[weight_col]
		if "gesamt" in weight.lower():
			weight = {
				"type": "sum",
				"weight": float(re.sub("\\D", "", weight))
			}
		else:
			try:
				weight = float(weight)
			except ValueError:
				weight = None

		try:
			ects = int(row[ects_col])
		except ValueError:
			ects = None

		try:
			workload = int(row[sws_col])
		except ValueError:
			workload = None

		entries.append({
			"apo_number": apo_num,
			"name": re.sub("\\s+", " ", row[name_col]),
			"weekly_workload": workload,
			"weight": weight,
			"ects": ects
		})

	unfinished_table = not is_finished

with open(sys.argv[2], "w+") as fd:
	json.dump(entries, fd)

print("ECTS sum:", sum(x["ects"] for x in entries if x["ects"] is not None))
