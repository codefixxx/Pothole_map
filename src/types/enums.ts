export const Status = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  ONGOING: 'ONGOING',
  FIXED: 'FIXED',
  REJECTED: 'REJECTED',
} as const;
export type Status = (typeof Status)[keyof typeof Status];

export const MunicipalityRole = {
  OFFICER: 'OFFICER',
  MANAGER: 'MANAGER',
} as const;
export type MunicipalityRole = (typeof MunicipalityRole)[keyof typeof MunicipalityRole];

export const DuplicateStatus = {
  POTENTIAL: 'POTENTIAL',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
} as const;
export type DuplicateStatus = (typeof DuplicateStatus)[keyof typeof DuplicateStatus];

export const ImageProcessingState = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;
export type ImageProcessingState = (typeof ImageProcessingState)[keyof typeof ImageProcessingState];

export const Role = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];
