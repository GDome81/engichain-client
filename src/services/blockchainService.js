import apiClient from './apiService';

class BlockchainService {
  constructor() {
    this.baseUrl = '/blockchain';
  }

  // Certify data on blockchain
  async certifyData(blockchainRequest) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/data`, blockchainRequest, {
        responseType: 'text'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Certify category on blockchain
  async certifyCategory(blockchainRequest) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/category`, blockchainRequest, {
        responseType: 'text'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Certify company on blockchain
  async certifyCompany(blockchainRequest) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/certify-company`, blockchainRequest, {
        responseType: 'text'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handler
  handleError(error) {
    console.error('BlockchainService Error:', error);
    return {
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status || 500
    };
  }
}

export default new BlockchainService();