import { Box, Container } from '@chakra-ui/react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import ChannelList from './ChannelList';
import CreateChannel from './CreateChannel';

const Layout = () => {
  return (
    <Box>
      <Navbar />
      <Container maxW="container.xl" py={8}>
        <Routes>
          <Route path="/" element={<ChannelList />} />
          <Route path="/create" element={<CreateChannel />} />
        </Routes>
      </Container>
    </Box>
  );
};

export default Layout;
