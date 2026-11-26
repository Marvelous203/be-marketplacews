export type ThreadType =
  | 'DISCUSSION'
  | 'QUESTION'
  | 'SHOWCASE'
  | 'WANTED'
  | 'ANNOUNCEMENT';

export type ThreadStatus = 'PUBLISHED' | 'LOCKED' | 'HIDDEN' | 'ARCHIVED';

export type WantedStatus = 'OPEN' | 'IN_DISCUSSION' | 'AWARDED' | 'CLOSED' | 'EXPIRED';

export type ReactionType = 'HELPFUL' | 'TRIED' | 'NEED_DEMO';

export interface ThreadReactions {
  helpful: number;
  tried: number;
  needDemo: number;
}

export interface ThreadProposal {
  id: string;
  threadId: string;
  sellerId: string;
  sellerName: string;
  sellerBadge: string;
  priceMinor: number;
  currency: 'VND';
  estimatedDays: number;
  pitchSummary: string;
  demoUrl?: string;
  status: 'PENDING' | 'SHORTLISTED' | 'AWARDED';
  createdAt: string;
}

export interface ThreadReply {
  id: string;
  threadId: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
}

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
  reactions: ThreadReactions;
  proposals?: ThreadProposal[];
  replies?: ThreadReply[];
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
