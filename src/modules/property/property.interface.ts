export interface propertyPayload {
  categoryId: string;
  title: string;
  description: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  image?: string;
  amenities: string[];
  isAvailable?: boolean;
}