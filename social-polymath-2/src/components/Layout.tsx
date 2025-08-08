import { Box, Flex } from '@chakra-ui/react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import SideNav from './SideNav';
import ChannelList from './ChannelList';
import CreateChannel from './CreateChannel';

const Layout = () => {
  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Flex>
        <Box as="main" flex="1" pr="280px">
          <Routes>
            <Route path="/" element={<ChannelList />} />
            <Route path="/create" element={<CreateChannel />} />
          </Routes>
        </Box>
        <SideNav />
      </Flex>
    </Box>
  );
};

export default Layout;
