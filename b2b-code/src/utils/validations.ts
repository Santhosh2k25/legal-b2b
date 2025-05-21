import { z } from 'zod';

// Validation helpers
const nameRegex = /^[A-Za-z\s]+$/;
const phoneRegex = /^\+?[1-9]\d{9,11}$/;
const landlineRegex = /^[0-9]{2,4}[-\s]?[0-9]{6,8}$/;

// Common validations
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const emailSchema = z.string()
  .email('Invalid email address')
  .min(1, 'Email is required');

export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{9,11}$/, 'Invalid phone number format');

// Lawyer Registration Schema
export const lawyerRegistrationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),
  practiceType: z.string().min(1, 'Practice type is required'),
  barCouncilNumber: z.string()
    .min(1, 'Bar Council Number is required')
    .regex(/^[A-Z]{2}\/[0-9]{4}\/[0-9]{4}$/, 'Invalid Bar Council Number format (e.g., KA/1234/2024)'),
  aadhaarNumber: z.string()
    .length(12, 'Aadhaar number must be 12 digits')
    .regex(/^[0-9]{12}$/, 'Aadhaar number must contain only digits'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Firm Registration Schema
export const firmRegistrationSchema = z.object({
  firmName: z.string().min(1, 'Firm name is required'),
  ceoName: z.string()
    .min(1, 'CEO name is required')
    .regex(nameRegex, 'Name can only contain letters and spaces')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Name cannot be only spaces'),
  registrationNumber: z.string()
    .min(1, 'Registration number is required')
    .regex(/^[A-Z0-9-/]+$/, 'Invalid registration number format'),
  establishedYear: z.string()
    .regex(/^\d{4}$/, 'Invalid year format')
    .refine(year => {
      const yearNum = parseInt(year);
      const currentYear = new Date().getFullYear();
      return yearNum >= 1900 && yearNum <= currentYear;
    }, 'Year must be between 1900 and current year'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  phone: z.string()
    .regex(phoneRegex, 'Invalid phone number format. Example: +911234567890')
    .refine(val => val.length >= 10 && val.length <= 13, 'Phone number must be between 10 and 13 digits'),
  landline: z.string()
    .regex(landlineRegex, 'Invalid landline format. Example: 011-12345678')
    .refine(val => {
      const digitsOnly = val.replace(/[-\s]/g, '');
      return digitsOnly.length >= 8 && digitsOnly.length <= 12;
    }, 'Landline number must be between 8 and 12 digits'),
  address: z.string().min(10, 'Please provide a complete address'),
  website: z.string().url('Invalid website URL').optional(),
  employeeCount: z.string()
    .regex(/^\d+$/, 'Must be a valid number')
    .refine(val => parseInt(val) > 0, 'Must have at least one employee'),
  description: z.string().min(20, 'Please provide a brief description of your firm').optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});