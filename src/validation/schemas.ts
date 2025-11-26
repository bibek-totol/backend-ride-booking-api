import { z } from 'zod';


export const registerSchema = z.object({
name: z.string().min(2),
email: z.string().email(),
password: z.string().min(6),
role: z.enum(['rider','driver','admin']).optional()
});


export const loginSchema = z.object({
email: z.string().email(),
password: z.string().min(6)
});


export const requestRideSchema = z.object({
pickup: z.object({ lat: z.number(), lng: z.number(), address: z.string().optional() }),
destination: z.object({ lat: z.number(), lng: z.number(), address: z.string().optional() }),
 price: z.number(),
});


export const updateRideStatusSchema = z.object({
status: z.enum(['accepted','rejected','picked_up','in_transit','completed','cancelled']),
note: z.string().optional()
});


export const setAvailabilitySchema = z.object({
online: z.boolean()
});