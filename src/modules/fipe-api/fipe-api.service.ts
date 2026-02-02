import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class FipeApiService {
  private readonly logger = new Logger(FipeApiService.name);
  private readonly baseUrl = (process.env.API_FIPE_URL || 'https://api.invertexto.com/v1/fipe/').replace(/\/$/, '');
  private readonly token = process.env.API_FIPE_TOKEN;

  async getBrands(type: number) {
    if (!this.token) {
        this.logger.error('API_FIPE_TOKEN is missing in environment variables');
        throw new InternalServerErrorException('FIPE API Token configuration missing');
    }

    try {
      const url = `${this.baseUrl}/brands/${type}`;
      this.logger.log(`Fetching brands from: ${url}`);
      
      const response = await axios.get(url, {
        params: { token: this.token },
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error fetching FIPE brands: ${error.message}`, error.response?.data);
      // Return detailed error for debugging
      const details = error.response?.data?.message || error.message;
      throw new InternalServerErrorException(`Failed to fetch brands: ${details}`);
    }
  }

  async getModels(brandId: number) {
    if (!this.token) {
        this.logger.error('API_FIPE_TOKEN is missing in environment variables');
        throw new InternalServerErrorException('FIPE API Token configuration missing');
    }

    try {
      const url = `${this.baseUrl}/models/${brandId}`;
      const response = await axios.get(url, {
        params: { token: this.token },
      });
      return response.data;
    } catch (error: any) {
       this.logger.error(`Error fetching FIPE models: ${error.message}`, error.response?.data);
       const details = error.response?.data?.message || error.message;
       throw new InternalServerErrorException(`Failed to fetch models: ${details}`);
    }
  }
}
