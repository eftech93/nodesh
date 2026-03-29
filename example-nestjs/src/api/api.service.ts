import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface ApiRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}

@Injectable()
export class ApiService {
  private baseURL: string = '';
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  constructor(private readonly httpService: HttpService) {}

  /**
   * Set base URL for all API calls
   */
  setBaseURL(url: string): void {
    this.baseURL = url.replace(/\/$/, '');
  }

  /**
   * Set default headers for all requests
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, options?: ApiRequestOptions): Promise<T> {
    const fullUrl = this.buildUrl(url);
    const response = await firstValueFrom(
      this.httpService.get<T>(fullUrl, {
        headers: { ...this.defaultHeaders, ...options?.headers },
        params: options?.params,
        timeout: options?.timeout,
      })
    );
    return response.data;
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    const fullUrl = this.buildUrl(url);
    const response = await firstValueFrom(
      this.httpService.post<T>(fullUrl, data, {
        headers: { ...this.defaultHeaders, ...options?.headers },
        params: options?.params,
        timeout: options?.timeout,
      })
    );
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    const fullUrl = this.buildUrl(url);
    const response = await firstValueFrom(
      this.httpService.put<T>(fullUrl, data, {
        headers: { ...this.defaultHeaders, ...options?.headers },
        params: options?.params,
        timeout: options?.timeout,
      })
    );
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    const fullUrl = this.buildUrl(url);
    const response = await firstValueFrom(
      this.httpService.patch<T>(fullUrl, data, {
        headers: { ...this.defaultHeaders, ...options?.headers },
        params: options?.params,
        timeout: options?.timeout,
      })
    );
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, options?: ApiRequestOptions): Promise<T> {
    const fullUrl = this.buildUrl(url);
    const response = await firstValueFrom(
      this.httpService.delete<T>(fullUrl, {
        headers: { ...this.defaultHeaders, ...options?.headers },
        params: options?.params,
        timeout: options?.timeout,
      })
    );
    return response.data;
  }

  /**
   * Test connectivity to an endpoint
   */
  async ping(url: string): Promise<{ success: boolean; latency: number; status?: number }> {
    const start = Date.now();
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { timeout: 5000 })
      );
      return {
        success: true,
        latency: Date.now() - start,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - start,
      };
    }
  }

  /**
   * Make request to local API (useful for testing own endpoints)
   */
  async local<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<T> {
    const localBase = process.env.API_BASE_URL || 'http://localhost:3000';
    const previousBase = this.baseURL;
    this.setBaseURL(localBase);
    
    try {
      switch (method) {
        case 'GET':
          return await this.get<T>(path, options);
        case 'POST':
          return await this.post<T>(path, data, options);
        case 'PUT':
          return await this.put<T>(path, data, options);
        case 'PATCH':
          return await this.patch<T>(path, data, options);
        case 'DELETE':
          return await this.delete<T>(path, options);
      }
    } finally {
      this.setBaseURL(previousBase);
    }
  }

  private buildUrl(url: string): string {
    if (url.startsWith('http')) return url;
    if (this.baseURL) {
      return `${this.baseURL}/${url.replace(/^\//, '')}`;
    }
    return url;
  }
}
