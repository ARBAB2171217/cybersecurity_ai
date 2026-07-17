import { api } from "@/lib/axios";
import type { Report } from "@/types";
import type { ApiResponse } from "./report.service";
import type {
  Comment,
  CommentCreateRequest,
  CommentUpdateRequest,
  CommunityVerificationRequest,
  AbuseReportCreateRequest,
} from "@/types/community";

export const communityService = {
  // Likes
  async toggleLike(reportId: string): Promise<ApiResponse<{ liked: boolean; likesCount: number }>> {
    const res = await api.post<ApiResponse<{ liked: boolean; likesCount: number }>>(
      `/community/reports/${reportId}/likes`
    );
    return res.data;
  },

  // Bookmarks
  async toggleBookmark(
    reportId: string
  ): Promise<ApiResponse<{ bookmarked: boolean; bookmarksCount: number }>> {
    const res = await api.post<ApiResponse<{ bookmarked: boolean; bookmarksCount: number }>>(
      `/community/reports/${reportId}/bookmarks`
    );
    return res.data;
  },

  async getBookmarks(): Promise<ApiResponse<Report[]>> {
    const res = await api.get<ApiResponse<Report[]>>("/community/bookmarks");
    return res.data;
  },

  // Comments
  async getComments(reportId: string): Promise<ApiResponse<Comment[]>> {
    const res = await api.get<ApiResponse<Comment[]>>(`/community/reports/${reportId}/comments`);
    return res.data;
  },

  async createComment(reportId: string, data: CommentCreateRequest): Promise<ApiResponse<Comment>> {
    const res = await api.post<ApiResponse<Comment>>(
      `/community/reports/${reportId}/comments`,
      data
    );
    return res.data;
  },

  async updateComment(commentId: string, data: CommentUpdateRequest): Promise<ApiResponse<Comment>> {
    const res = await api.put<ApiResponse<Comment>>(`/community/comments/${commentId}`, data);
    return res.data;
  },

  async deleteComment(commentId: string): Promise<ApiResponse<null>> {
    const res = await api.delete<ApiResponse<null>>(`/community/comments/${commentId}`);
    return res.data;
  },

  // Verification & Abuse
  async verifyReport(reportId: string, data: CommunityVerificationRequest): Promise<ApiResponse<any>> {
    const res = await api.post<ApiResponse<any>>(`/community/reports/${reportId}/verify`, data);
    return res.data;
  },

  async reportAbuse(reportId: string, data: AbuseReportCreateRequest): Promise<ApiResponse<any>> {
    const res = await api.post<ApiResponse<any>>(`/community/reports/${reportId}/abuse`, data);
    return res.data;
  },
};

export default communityService;
