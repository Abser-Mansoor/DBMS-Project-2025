export interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  quantity: number;
  available: number;
  description: string;
  published_year: string;
  publisher: string;
  location: string;
  status: 'available' | 'not available';
  created_at: string;
  updated_at: string;
}

export type SortOrder = 'asc' | 'desc';

export interface BookFilter {
  category?: string;
  author?: string;
  title?: string;
  available?: boolean;
}

export interface BookSort {
  field: 'title' | 'author' | 'category';
  order: 'asc' | 'desc';
}

export interface BorrowRequest {
  _id: string;
  student: string;
  book: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  requestDate: string;
  borrowDate: string;
  approvalDate?: string;
  returnDate?: string;
  dueDate?: string;
  adminNotes?: string;
  actualReturnDate?: string;
  fine?: number;
  studentName?: string;
  bookTitle?: string;
}

export interface NewBookRequest {
  _id: string;
  studentId: string;
  studentName: string;
  bookName: string;
  author: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  processedDate?: string;
}

export interface BookFormData {
  name: string;
  author: string;
  genre: string;
  reason: string;
} 