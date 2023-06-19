import schedule
import os
import time
import requests
import json
import dotenv


def run_spo_parser():
    os.system("sh run_extraction.sh")

    spo_filename = os.getenv("SPO_WEIGHTS_FILENAME")

    with open(spo_filename) as f:
        weights = json.load(f)

    host = os.getenv("STORAGE_HOST")
    port = os.getenv("STORAGE_PORT")

    response = None
    try:
        response = requests.post(f"http://{host}:{port}/documents/spo", json={'spo': weights})
    except Exception as e:
        print(e)
        print(f"Response of request: {response}")


schedule.every().day.do(run_spo_parser)


def main():
    dotenv.load_dotenv()
    run_spo_parser()
    while True:
        schedule.run_pending()
        time.sleep(60 * 60)  # 60s * 60 = one hour


if __name__ == '__main__':
    main()
