import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(30).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  biography: z.string().max(300, 'Bio must not exceed 300 characters').optional(),
  interests: z.array(z.string().min(1).max(30)).max(10, 'Maximum 10 interests allowed').optional(),
  languages: z.array(z.string().min(2).max(30)).max(5, 'Maximum 5 languages allowed').optional(),
  country: z.string().max(50).optional(),
  gender: z.string().max(30).optional(),
  discoveryEnabled: z.boolean().optional(),
  visibilitySettings: z
    .object({
      showCountry: z.boolean(),
      showGender: z.boolean(),
      showInterests: z.boolean(),
    })
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
