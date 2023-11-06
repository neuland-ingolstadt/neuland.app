import os
import json
import re

simplifyName = re.compile(r'\W|und|u\./g')
def simplify(name):
	return simplifyName.sub("", name).lower()

result = {}

for filename in os.listdir("./weightings/"):
	name = filename.replace(".json", "")
	with open("./weightings/" + filename) as fd:
		content = json.load(fd)
		for entry in content:
			entry["name"] = simplify(entry["name"])

		result[name] = content

ects_sums = []
for name in result:
	ects = 0
	for entry in result[name]:
		if type(entry["ects"]) == int:
			ects += entry["ects"]

	ects_sums.append((name, ects))

ects_sums.sort(key=lambda x: x[1])
for name, ects in ects_sums:
	print("{:3d} {}".format(ects, name))

with open("spo-grade-weights.json", "w+", encoding="utf-8") as fd:
	json.dump(result, fd, ensure_ascii=False)
