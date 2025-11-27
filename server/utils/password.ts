import bcrypt from 'bcryptjs';

const DEFAULT_SALT_ROUNDS = 12;

export const hashPassword = async (password: string) => bcrypt.hash(password, DEFAULT_SALT_ROUNDS);

export const verifyPassword = async (password: string, hash: string) => bcrypt.compare(password, hash);

// Password requirements:
// - Minimum 8 characters
// - At least one lowercase letter
// - At least one uppercase letter
// - At least one digit
// - At least one special character
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

export const isPasswordStrong = (password: string) => PASSWORD_RULE.test(password);
