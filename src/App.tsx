import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter as Router } from 'react-router-dom'
import Layout from './components/Layout'
import theme from './theme'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Layout />
        </Router>
      </AuthProvider>
    </ChakraProvider>
  )
}

export default App
