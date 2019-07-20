function getLang() {
  if (navigator.languages != undefined) return navigator.languages[0];
  else return navigator.language;
}
const lang = getLang();
const translation = {
  month: {
    'ru-RU': ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'],
    'en-US': ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEN', 'OCT', 'NOV', 'DEC'],
  },
};

export default function translate(text) {
  return translation[text][lang] ? translation[text][lang] : translation[text]['en-US'];
}
