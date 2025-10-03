import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter as Router } from 'react-router-dom'
import Layout from './components/Layout'
import theme from './theme'

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Layout />
      </Router>
    </ChakraProvider>
  )
}

export default App
