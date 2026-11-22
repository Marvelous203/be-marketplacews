export type ThreadType =
  | 'DISCUSSION'
  | 'QUESTION'
  | 'SHOWCASE'
  | 'WANTED'
  | 'ANNOUNCEMENT';

export type ThreadStatus = 'PUBLISHED' | 'LOCKED' | 'HIDDEN' | 'ARCHIVED';

export type WantedStatus = 'OPEN' | 'IN_DISCUSSION' | 'AWARDED' | 'CLOSED' | 'EXPIRED';

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  allowedThreadTypes: ThreadType[];
  threadCount: number;
}

export interface ForumAuthor {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  badge?: 'SELLER_VERIFIED' | 'STAFF' | 'TRUSTED_MEMBER' | 'NEW_MEMBER';
}

export interface ForumThread {
  id: string;
  categorySlug: string;
  categoryName: string;
  author: ForumAuthor;
  threadType: ThreadType;
  title: string;
  slug: string;
  summary: string;
  bodyMd: string;
  status: ThreadStatus;
  pinned: boolean;
  replyCount: number;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  lastActivityAt: string;

  // Type-specific metadata
  wantedDetails?: {
    goalSummary: string;
    budgetRange: string;
    budgetCurrency: string;
    targetDate?: string;
    status: WantedStatus;
    proposalCount: number;
  };
  questionDetails?: {
    hasAcceptedAnswer: boolean;
  };
  showcaseDetails?: {
    relatedListingSlug?: string;
    relatedListingTitle?: string;
    coverImageUrl?: string;
  };
}
