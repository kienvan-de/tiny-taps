export const TAG_CATEGORIES = ['age', 'category'] as const;
export type TagCategory = typeof TAG_CATEGORIES[number];

export interface PredefinedTag {
  name: string;
  category: TagCategory;
  sortOrder: number;
}

export const PREDEFINED_TAGS: PredefinedTag[] = [
  // Age groups
  { name: '0-1',      category: 'age',      sortOrder: 0  },
  { name: '1-2',      category: 'age',      sortOrder: 1  },
  { name: '2-3',      category: 'age',      sortOrder: 2  },
  { name: '3+',       category: 'age',      sortOrder: 3  },
  // Content categories
  { name: 'Animals',  category: 'category', sortOrder: 10 },
  { name: 'Vehicles', category: 'category', sortOrder: 11 },
  { name: 'Food',     category: 'category', sortOrder: 12 },
  { name: 'Colors',   category: 'category', sortOrder: 13 },
  { name: 'Shapes',   category: 'category', sortOrder: 14 },
  { name: 'Numbers',  category: 'category', sortOrder: 15 },
  { name: 'Nature',   category: 'category', sortOrder: 16 },
];

export function getTagsByCategory(category: TagCategory): PredefinedTag[] {
  return PREDEFINED_TAGS.filter(t => t.category === category);
}