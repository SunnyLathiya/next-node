export type User = {
  id: string;
  name: string;
  email: string;
};

export type Post = {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  author: { id: string; name: string };
  likesCount: number;
  dislikesCount: number;
  liked: boolean;
  disliked: boolean;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PostInput = {
  title: string;
  content: string;
  isPublic: boolean;
};

export type PaginatedPosts = {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type FieldError = {
  field: string;
  message: string;
};
