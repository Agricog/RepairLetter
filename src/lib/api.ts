import type { ApiResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL;

class ApiClient {
  private getAuthToken: (() => Promise<string | null>) | null = null;

  setAuthTokenGetter(getter: () => Promise<string | null>): void {
    this.getAuthToken = getter;
  }

  private async headers(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.getAuthToken) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${API_URL}${path}`, {
        method: 'GET',
        headers: await this.headers(),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Request failed' }));
        return { success: false, error: error.error ?? `HTTP ${res.status}` };
      }

      const data = await res.json();
      return { success: true, data: data as T };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Network error' };
    }
  }

  async post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: await this.headers(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Request failed' }));
        return { success: false, error: error.error ?? `HTTP ${res.status}` };
      }

      const data = await res.json();
      return { success: true, data: data as T };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Network error' };
    }
  }

  async getBlob(path: string): Promise<Blob | null> {
    try {
      const h = await this.headers();
      delete (h as Record<string, string>)['Content-Type'];
      const res = await fetch(`${API_URL}${path}`, {
        method: 'GET',
        headers: h,
      });
      if (!res.ok) return null;
      return await res.blob();
    } catch {
      return null;
    }
  }

  async uploadToR2(uploadUrl: string, file: File): Promise<boolean> {
    try {
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const api = new ApiClient();
