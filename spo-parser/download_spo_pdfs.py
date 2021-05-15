import re
import requests

url = "https://www.thi.de/"

# TODO: we could get the list of paths automatically
path_prefix = "hochschule/ueber-uns/hochschulorganisation/stabsstelle-recht/"
paths = [
	"satzungen-business-school",
	"satzungen-fakultaet-elektro-und-informationstechnik",
	"satzungen-fakultaet-informatik",
	"satzungen-fakultaet-maschinenbau",
	"satzungen-fakultaet-wirtschaftsingenieurwesen",
	"satzungen-campus-neuburg",
	"satzungen-studienfakultaet-iaw",
]

course_reg = re.compile(r"<a href=\"(/hochschule/ueber-uns/hochschulorganisation/stabsstelle-recht/[^\"]+/[^\"]+)\"")
appendix_reg = re.compile(r"<a href=\"([^\"]*anlage[^\"]*.pdf)\"", re.IGNORECASE)

for path in paths:
	print("Handling path", path)
	r = requests.get(url + path_prefix + path)
	r.raise_for_status()
	for course in course_reg.finditer(r.text):
		course_name = course[1].split("/")[-1]

		r = requests.get(url + course[1])
		r.raise_for_status()

		appendix = appendix_reg.search(r.text)
		if appendix is None:
			print("No appendix found for", course_name)
			continue
		r = requests.get(url + appendix[1])
		r.raise_for_status()

		filename = "SPOs/{}.pdf".format(course_name)
		print("Creating file", filename)
		with open(filename, "wb+") as fd:
			fd.write(r.content)
