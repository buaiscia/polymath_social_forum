import { Box } from '@chakra-ui/react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import ChannelList from './ChannelList';
import CreateChannel from './CreateChannel';

const Layout = () => {
  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Box as="main">
        <Routes>
          <Route path="/" element={<ChannelList />} />
          <Route path="/create" element={<CreateChannel />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default Layout;
