import { z } from "zod";

// Define the schema using coercion
export const LeadFormSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  departure: z.string().min(2, "Départ requis"),
  destination: z.string().min(2, "Destination requis"),
  distance: z.coerce.number().positive("Doit être un nombre positif"),
  passengers: z.coerce.number().int().positive("Doit être un nombre entier"),
});

// Explicitly export the input type (for the form) and the output type
export type LeadFormData = z.input<typeof LeadFormSchema>;
export type LeadFormOutput = z.output<typeof LeadFormSchema>;