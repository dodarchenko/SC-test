import { z } from 'zod';
import { id, isoDate, pageFields, percentage, quantity, url } from './common';

const positive = z.number().positive();

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1),
  date: isoDate,
  reviewerName: z.string().min(1),
  reviewerEmail: z.string().email(),
});

/** GET /products/{id} */
export const productSchema = z.object({
  id,
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  price: positive,
  discountPercentage: percentage,
  rating: z.number().min(0).max(5),
  stock: z.number().int().nonnegative(),
  tags: z.array(z.string().min(1)),
  /** Not every product has a brand. */
  brand: z.string().min(1).optional(),
  sku: z.string().min(1),
  weight: positive,
  dimensions: z.object({ width: positive, height: positive, depth: positive }),
  warrantyInformation: z.string().min(1),
  shippingInformation: z.string().min(1),
  availabilityStatus: z.string().min(1),
  reviews: z.array(reviewSchema),
  returnPolicy: z.string().min(1),
  minimumOrderQuantity: quantity,
  meta: z.object({ createdAt: isoDate, updatedAt: isoDate, barcode: z.string().min(1), qrCode: url }),
  images: z.array(url).min(1),
  thumbnail: url,
});
/** A product as listed in the catalog: enough to pick it and compare it with other endpoints. */
const catalogProductSchema = productSchema.pick({
  id: true,
  title: true,
  price: true,
  discountPercentage: true,
  category: true,
});
export type CatalogProduct = z.infer<typeof catalogProductSchema>;

/** Fields to request from the listing (`select`), derived from the schema so the two can't drift. `id` always comes back. */
export const catalogFields = Object.keys(catalogProductSchema.shape).filter((field) => field !== 'id');

/** GET /products?select=… */
export const catalogPageSchema = z.object({ products: z.array(catalogProductSchema), ...pageFields });
