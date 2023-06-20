import requests
import os
from dotenv import load_dotenv
import json
import deepl
from pathlib import Path
import re
from shutil import copy

API_URL = "https://hiplan.thi.de/webservice/production2/index.php"
DEEPL_API_URL = "https://api.deepl.com/v2/translate"
MAIN_DIR = Path(__file__).parent.parent / "rogue-thi-app" / "data"

DEEPL_API_KEY = os.getenv("DEEPL_API_KEY")
THI_USERNAME = os.getenv("THI_USERNAME")
THI_PASSWORD = os.getenv("THI_PASSWORD")

GENDER_REGEX = re.compile(r"\(\w+\)")

LANGUAGES = ["EN-US"]


class ThiTranslator:
    def __init__(self):
        load_dotenv()

        self.DEEPL_API_KEY = os.getenv("DEEPL_API_KEY")
        self.THI_USERNAME = os.getenv("THI_USERNAME")
        self.THI_PASSWORD = os.getenv("THI_PASSWORD")

        self.__check_env()

        self.translator = deepl.Translator(self.DEEPL_API_KEY)
        self.session_id = self.__open_session()
        self.path = Path(__file__).parent / "data"

        if not self.path.exists():
            self.path.mkdir()

        print(f'Opened session with id "{self.session_id}"')

    def __check_env(self):
        """Checks if the environment variables are set"""
        if not self.DEEPL_API_KEY:
            raise ValueError("DEEPL_API_KEY is not set")

        if not self.THI_USERNAME:
            raise ValueError("THI_USERNAME is not set")

        if not self.THI_PASSWORD:
            raise ValueError("THI_PASSWORD is not set")

    def __open_session(self):
        """Opens a session with the THI API and returns the session id"""
        data = {
            "method": "open",
            "service": "session",
            "username": self.THI_USERNAME,
            "passwd": self.THI_PASSWORD,
            "format": "json",
        }

        session_req = requests.post(API_URL, data=data)
        return session_req.json()["data"][0]

    def __close_session(self):
        """Closes the session with the given session id"""
        data = {
            "method": "close",
            "service": "session",
            "session": self.session_id,
            "format": "json",
        }

        session_req = requests.post(API_URL, data=data)
        return session_req.json()["data"]

    def __get_lecturers(self):
        """Returns a list of all lecturers"""
        data = {
            "method": "lecturers",
            "service": "thiapp",
            "session": self.session_id,
            "format": "json",
            "from": "a",
            "to": "z",
        }

        lecturers_req = requests.post(API_URL, data=data)

        return lecturers_req.json()["data"][1]

    def __extract_all_functions(self, lecturers):
        """Extracts all functions from the lecturers"""
        functions = [
            lecturer["funktion"] for lecturer in lecturers if lecturer["funktion"] != ""
        ]

        # remove (in) or (r) from functions (e.g. Professor(in) -> Professor)
        functions = list(set(functions))
        cleaned_function = [GENDER_REGEX.sub("", function) for function in functions]

        return functions, cleaned_function

    def __translate(self, text):
        """Translates the function to english using the DeepL API"""
        results = {
            'de': text
        }

        for lang in LANGUAGES:
            result = self.translator.translate_text(text, target_lang=lang)
            results[lang.split("-")[0].lower()] = result.text

        return results

    def __translate_genders(self, text, cleaned_text):
        """Translates the function to english using the DeepL API"""
        results = {
            'de': text
        }

        for lang in LANGUAGES:
            result = self.translator.translate_text(cleaned_text, target_lang=lang)
            results[lang.split("-")[0].lower()] = result.text

        return results

    def translate_lecturer_functions(self):
        """
        Extracts all functions from the lecturers and translates them to english.
        Returns a dict with the original functions and the translated functions nested in a dict with the language as key.
        """

        lecturers = self.__get_lecturers()
        functions, cleaned_functions = self.__extract_all_functions(lecturers)

        translated = [self.__translate_genders(function, cleaned) for function, cleaned in zip(functions, cleaned_functions)]

        return dict(zip(functions, translated))

    def translate_lecturer_organizations(self):
        """
        Extracts all organizations from the lecturers and translates them to english.
        Returns a dict with the original organizations and the translated organizations nested in a dict with the language as key.
        """

        lecturers = self.__get_lecturers()
        organizations = [lecturer["organisation"] for lecturer in lecturers if lecturer["organisation"] != ""]
        organizations = [lecturer for lecturer in organizations if lecturer is not None]
        organizations = list(set(organizations))

        translated = [self.__translate(organization) for organization in organizations]

        return dict(zip(organizations, translated))

    def close(self):
        """Closes the session"""
        self.__close_session()

        print(f'Closed session with id "{self.session_id}"')

    def save_file(self, data, name):
        """Saves the data to a file with the given name"""
        with open(self.path / name, "w+", encoding="utf-8") as f:
            f.write(json.dumps(data, indent=4, ensure_ascii=False))

    def move_output_files(self):
        """Moves the output files to the data folder in the rogue thi app"""
        files = [file for file in self.path.glob("*.json") if file.is_file()]

        for file in files:
            copy(file, MAIN_DIR / file.name)


def main():
    translator = ThiTranslator()

    # Functions
    translator.save_file(
        translator.translate_lecturer_functions(), "lecturer-functions.json"
    )

    # Organizations
    translator.save_file(
        translator.translate_lecturer_organizations(), "lecturer-organizations.json"
    )

    translator.close()
    translator.move_output_files()


if __name__ == "__main__":
    main()
