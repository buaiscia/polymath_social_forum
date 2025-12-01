import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Text,
  Progress,
  Alert,
  AlertIcon,
  type UseDisclosureReturn,
} from '@chakra-ui/react';
import { type KeyboardEvent } from 'react';
import type { LoginPayload, RegisterPayload } from '../context/authTypes';

const passwordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (/[A-Z]/.test(password)) score += 25;
  if (/[a-z]/.test(password)) score += 20;
  if (/\d/.test(password)) score += 15;
  if (/[^\w\s]/.test(password)) score += 15;
  return Math.min(score, 100);
};

interface AuthModalsProps {
  loginDisclosure: UseDisclosureReturn;
  registerDisclosure: UseDisclosureReturn;
  loginForm: LoginPayload;
  registerForm: RegisterPayload;
  loginError: string | null;
  registerError: string | null;
  loginLoading: boolean;
  registerLoading: boolean;
  onLoginFieldChange: (field: keyof LoginPayload, value: string) => void;
  onRegisterFieldChange: (field: keyof RegisterPayload, value: string) => void;
  onLoginSubmit: () => void;
  onRegisterSubmit: () => void;
}

export const AuthModals = ({
  loginDisclosure,
  registerDisclosure,
  loginForm,
  registerForm,
  loginError,
  registerError,
  loginLoading,
  registerLoading,
  onLoginFieldChange,
  onRegisterFieldChange,
  onLoginSubmit,
  onRegisterSubmit,
}: AuthModalsProps) => {
  const submitOnEnter = (event: KeyboardEvent<HTMLInputElement>, submitAction: () => void) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitAction();
    }
  };

  return (
    <>
      <Modal isOpen={loginDisclosure.isOpen} onClose={loginDisclosure.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sign in</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Email or username</FormLabel>
                <Input
                  value={loginForm.identifier}
                  onChange={(event) => onLoginFieldChange('identifier', event.target.value)}
                  onKeyDown={(event) => submitOnEnter(event, onLoginSubmit)}
                  placeholder="you@example.com"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => onLoginFieldChange('password', event.target.value)}
                  onKeyDown={(event) => submitOnEnter(event, onLoginSubmit)}
                  placeholder="••••••••"
                />
              </FormControl>
              {loginError && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {loginError}
                </Alert>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={loginDisclosure.onClose}>
              Cancel
            </Button>
            <Button colorScheme="navy" onClick={onLoginSubmit} isLoading={loginLoading}>
              Sign in
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={registerDisclosure.isOpen} onClose={registerDisclosure.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create an account</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={registerForm.email}
                  onChange={(event) => onRegisterFieldChange('email', event.target.value)}
                  onKeyDown={(event) => submitOnEnter(event, onRegisterSubmit)}
                  placeholder="you@example.com"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  value={registerForm.username}
                  onChange={(event) => onRegisterFieldChange('username', event.target.value)}
                  onKeyDown={(event) => submitOnEnter(event, onRegisterSubmit)}
                  placeholder="scholar123"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => onRegisterFieldChange('password', event.target.value)}
                  onKeyDown={(event) => submitOnEnter(event, onRegisterSubmit)}
                  placeholder="Strong password"
                />
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Use at least 8 characters with upper & lower case, a number and a symbol.
                </Text>
                <Progress mt={2} value={passwordStrength(registerForm.password)} size="sm" colorScheme="navy" />
              </FormControl>
              {registerError && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {registerError}
                </Alert>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={registerDisclosure.onClose}>
              Cancel
            </Button>
            <Button colorScheme="navy" onClick={onRegisterSubmit} isLoading={registerLoading}>
              Create account
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
