export interface CategoryDto {
  id: string;
  name: string;
  description?: string;
  parentCategoryId?: string | null;
  parentCategoryName?: string | null;
  isActive: boolean;
  subCategories?: CategoryDto[];
}

export type CategoryStatusChangedPayload = Pick<
  CategoryDto,
  'id' | 'name' | 'description' | 'parentCategoryId' | 'isActive'
>;
