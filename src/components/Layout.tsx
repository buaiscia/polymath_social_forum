import { Box, Flex } from '@chakra-ui/react';
import { Routes, Route } from 'react-router-dom';
import SideNav from './SideNav';
import Dashboard from './Dashboard';
import CreateChannel from './CreateChannel';
import Channel from './Channel';
import MyChannels from './MyChannels';

const Layout = () => {
  return (
    <Box minH="100vh" bg="gray.50">
      {/* <Navbar /> */}
      <Flex>
        <SideNav />
        <Box as="main" flex="1" pl="280px">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateChannel />} />
            <Route path="/my-channels" element={<MyChannels />} />
            <Route path="/channels/:id" element={<Channel />} />
          </Routes>
        </Box>
      </Flex>
    </Box>
  );
};

export default Layout;
