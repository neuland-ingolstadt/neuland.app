const DEEPL_ENDPOINT = process.env.NEXT_PUBLIC_DEEPL_ENDPOINT || ''
const DEEPL_API_KEY = process.env.DEEPL_API_KEY || ''

/**
 * Translates a text using DeepL.
 * @param {String} text The text to translate
 * @param {String} target The target language
 * @returns {String}
 */
export async function translate (text, target) {
  const resp = await fetch(`${DEEPL_ENDPOINT}`,
    {
      method: 'POST',
      mode: 'cors',
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `text=${encodeURI(text)}&target_lang=${target}`
    })

  if (resp.status === 200) {
    const result = await resp.json()
    return result.translations.map(x => x.text)[0]
  } else {
    throw new Error('DeepL returned an error: ' + await resp.text())
  }
}
