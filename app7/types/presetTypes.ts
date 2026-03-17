export interface PresetCategory {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at: number;
  updated_at: number;
}

export interface PresetItem {
  id: string;
  title: string;
  category_id: string;
  description?: string;
  positive: string;
  negative?: string;
  image?: string;
  visibility: 'public' | 'authenticated' | 'level_based';
  preset_type?: string;
  view_count: number;
  favorite_count: number;
  use_count: number;
  created_at: number;
  updated_at: number;
  last_used_at?: number;
  is_favorited?: boolean;
}

export interface PresetDetail extends PresetItem {
  effect_images?: string[];
  categories?: Record<string, string>;
  is_favorited: boolean;
}

export interface PresetListResponse {
  categories: Record<string, string>;
  presets: PresetItem[];
  data: PresetItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  current_category: string;
}

export interface PresetSearchParams {
  category_id?: string;
  sort?: 'newest' | 'popular' | 'most_viewed' | 'most_favorited';
  page?: number;
  limit?: number;
}