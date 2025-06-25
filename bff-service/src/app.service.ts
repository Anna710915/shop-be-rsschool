import { HttpException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import axios, { AxiosRequestConfig } from 'axios';
import NodeCache from 'node-cache';

@Injectable()
export class AppService {
  private cache = new NodeCache({ stdTTL: 120 });
  
  async route(req: Request) {
    console.log('originalUrl:', req.originalUrl);

    // Check for cached GET /products request
    if (req.method === 'GET' && req.originalUrl.includes('/products')) {
      const cached = this.cache.get(req.originalUrl);
      if (cached) {
        console.log('Returning cached products list');
        return cached;
      }
    }

    const recipientUrl = this.getRecipientUrl(req.originalUrl);
    const response = this.sendRequest(recipientUrl, req.method, req.headers, req.originalUrl, {});
    // Store in cache only if it's a GET products list
    if (req.method === 'GET' && req.originalUrl.includes('/products')) {
      this.cache.set(req.originalUrl, response);
    }
    
    return response;
  }

  async routeWithBody(req: Request, body: any) {
    console.log('originalUrl:', req.originalUrl);
    console.log('body:', body);

    const recipientUrl = this.getRecipientUrl(req.originalUrl);
    return this.sendRequest(recipientUrl, req.method, req.headers, req.originalUrl, body);
  }

  private getRecipientUrl(originalUrl: string): string {
    const recipient = originalUrl.split('/')[1];
    console.log('recipient:', recipient);

    const recipientUrl = process.env[recipient];
    console.log('recipientUrl:', recipientUrl);

    return recipientUrl;
  }

  private async sendRequest(
    recipientUrl: string,
    method: string,
    headers: any,
    originalUrl: string,
    body: any,
  ) {
    if (!recipientUrl) {
      throw new HttpException('Recipient URL is undefined', 502);
    }

    const config: AxiosRequestConfig = {
      method,
      url: `${recipientUrl}${originalUrl}`,
      headers: {
        authorization: headers['authorization']
      },
      ...(Object.keys(body).length && { data: body }),
    };

    console.log('axiosConfig:', config);

    try {
      const response = await axios(config);
      console.log('response from recipient:', response.data);
      return response.data;
    } catch (error) {
      const status = error.response?.status || 500;
      const message =
        error.response?.data || 'An error occurred while forwarding the request';
      console.error('Request failed:', message);
      throw new HttpException(message, status);
    }
  }
}
