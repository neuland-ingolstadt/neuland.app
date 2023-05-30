# file originally by github/DanielMehlber
# https://github.com/neuland-ingolstadt/neuland.app/issues/162#issuecomment-1248568498

import os
import re
import sys
import json
import requests
from concurrent.futures import ThreadPoolExecutor

# the URL has the following schema / parameters:
# https://www3.primuss.de/stpl/index.php
#   ?FH=fhin
#   &Language=de
#   &mode=ical
#   &Session=<session>
#   &User=<username>
#   &sem=43
#   &type=1
#   &typeid=<course>
#
# session and username are provided via ENV variables
URL = "https://www3.primuss.de/stpl/index.php"

def get_course_name(user, session, course_id):
    # defining the parameters to be sent to the API
    params = {  
        'FH': 'fhin',
        'Language': 'de',
        'mode': 'ical',
        'Session': session,
        'User': user,
        'sem': '43',
        'type': '1',
        'typeid': course_id
    }
    
    # sending get request and saving the response as response object
    r = requests.get(url=URL, params=params)

    # every response bigger than 150 Bytes contains iCal data
    if r.status_code != 200 or len(r.content) <= 150:
        print(course_id, None, file=sys.stderr)
        return course_id, None

    # https://stackoverflow.com/a/51570425
    header = r.headers['content-disposition'].encode("latin1").decode("utf-8")
    filename = re.findall(r'filename\*?=([^;]+)', header, flags=re.IGNORECASE | re.UNICODE)
    filename = filename[0].strip().strip('"').rstrip(".ics")
    print(course_id, filename, file=sys.stderr)
    return course_id, filename

def main():
    start = 0
    end = 1000

    user = os.getenv("THI_ICAL_USER")
    session = os.getenv("THI_ICAL_SESSION")

    exector = ThreadPoolExecutor(4)
    results = exector.map(lambda i: get_course_name(user, session, i), range(start, end))

    courses = {}
    for course_id, name in results:
        if name is None:
            continue
        
        courses[name] = course_id

    with open("ical-courses.json", "w+") as fd:
        json.dump(courses, fd)

if __name__ == '__main__':
    main()