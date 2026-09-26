import { createContext, useContext } from 'react'
import { DEFAULT_LOCALE, locales, type Locale, type Messages } from './messages'

type I18nValue = { locale: Locale; messages: Messages }

// Valor padrão já é pt-BR, então funciona sem nenhum <Provider> por fora.
// Quando entrar troca de idioma, basta envolver o app com
// <I18nContext.Provider value={...}>.
export const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  messages: locales[DEFAULT_LOCALE],
})

export function useI18n() {
  return useContext(I18nContext)
}
