/**
 * Normalizes lecturer data.
 * This removes invalid entries and converts phone numbers to a standardized format.
 * @param {object[]} entries
 * @returns {object[]}
 */
export function normalizeLecturers (entries) {
  return entries
    .filter(x => !!x.vorname) // remove dummy entries
    .map(x => ({
      ...x,
      // try to reformat phone numbers to DIN 5008 International
      tel_dienst: x.tel_dienst
        .trim()
        .replace(/\(0\)/g, '') // remove (0) in +49 (0) 8441
        .replace(/(\d|\/|^)(\s|-|\/|\(|\))+(?=\d|\/)/g, '$1') // remove spaces, -, / and braces in numbers
        .replace(/^-?(\d{3,5})$/, '+49 841 9348$1') // add prefix for suffix-only numbers
        .replace(/^9348/, '+49 841 9348') // add missing +49 841 prefix to THI numbers
        .replace(/^49/, '+49') // fix international format
        .replace(/^((\+?\s*49)|0)\s*841\s*/, '+49 841 '),
      room_short: ((x.raum || '').match(/[A-Z]\s*\d+/g) || [''])[0]
        .replace(/\s+/g, '') || null
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
