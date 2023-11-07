# THI Translator

## Description

This scripts aims to translate all german words used in the API results of the THI to english. It uses the [DeepL API](https://www.deepl.com/docs-api/) to translate the words.

## Usage

For simplicity this script is not embedded to the dockerfile. To use it you have to run it manually and copy the main project.

In the future this script should be embedded to the dockerfile and run automatically.

```bash
# Install dependencies
pip install -r requirements.txt
```

- Create a .env file in the root directory of the project
- Enter your DeepL API key in the .env file

    ```bash
    # .env
    DEEPL_API_KEY=your-api-key
    ```

- Enter your THI credentials in the .env file

    ```bash
    # .env
    THI_USERNAME=your-username
    THI_PASSWORD=your-password
    ```

```bash
# Run the script
python thi-translator.py
```
