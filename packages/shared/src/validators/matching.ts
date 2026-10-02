import { z } from 'zod';

export const matchingPreferencesSchema = z.object({
  mode: z.enum(['random', 'interests', 'language', 'country']),
  interests: z.array(z.string().min(1).max(30)).max(10).optional(),
  preferredLanguages: z.array(z.string().min(2).max(30)).max(5).optional(),
  preferredCountry: z.string().max(50).optional(),
});

export type MatchingPreferencesInput = z.infer<typeof matchingPreferencesSchema>;
