import apiClient from './apiService';

class CategoryService {
  constructor() {
    this.baseUrl = '/category';
  }

  // Get categories with pagination
  async getCategories(pageNumber = 0, pageSize = 10, order = 'creationDate') {
    try {
      const params = {
        page: pageNumber,
        size: pageSize,
        asc: false,
        sortBy: order
      };
      const response = await apiClient.get(this.baseUrl, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Find category by ID
  async findCategoryById(categoryId) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${categoryId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handler
  handleError(error) {
    console.error('CategoryService Error:', error);
    return {
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status || 500
    };
  }
}

export default new CategoryService();