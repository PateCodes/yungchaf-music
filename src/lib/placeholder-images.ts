import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  price?: number;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;
