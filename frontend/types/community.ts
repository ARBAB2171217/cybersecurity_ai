export interface Comment {
  id: string;
  reportId: string;
  userId: string;
  parentId: string | null;
  content: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

export interface CommentCreateRequest {
  content: string;
  parentId?: string | null;
}

export interface CommentUpdateRequest {
  content: string;
}

export interface CommunityVerificationRequest {
  verdict: "CONFIRMED" | "SUSPICIOUS" | "MORE_EVIDENCE";
}

export interface AbuseReportCreateRequest {
  reason: "SPAM" | "FAKE_INFORMATION" | "HARASSMENT" | "ILLEGAL_CONTENT" | "OTHER";
  details?: string;
}
