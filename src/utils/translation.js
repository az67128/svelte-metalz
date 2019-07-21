function getLang() {
  // if (navigator.languages != undefined) return navigator.languages[0];
  // else return navigator.language;
  return 'en-US';
}
const lang = getLang();
const translation = {
  month: {
    'ru-RU': ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'],
    'en-US': ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEN', 'OCT', 'NOV', 'DEC'],
  },
  genreSelectTitle: {
    'ru-RU': 'ВЫБЕРИТЕ ЖАНРЫ',
    'en-US': 'SELECT GENRES',
  },
};

export default function translate(text) {
  return translation[text][lang] ? translation[text][lang] : translation[text]['en-US'];
}
