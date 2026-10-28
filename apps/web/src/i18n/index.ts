import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './en';
import { ga } from './ga';

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ga: { translation: ga } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
