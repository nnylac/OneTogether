import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, system } from './components/chakra-ui'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <App />
    </ChakraProvider>
  </StrictMode>,
)
