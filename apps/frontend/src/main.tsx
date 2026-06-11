import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, system } from './components/chakra-ui'
import App from './App.tsx'
import { LanguageProvider } from './interfaces/public/i18n/LanguageContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ChakraProvider>
  </StrictMode>,
)
