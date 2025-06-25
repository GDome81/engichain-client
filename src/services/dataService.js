import apiClient from './apiService';

class DataService {
  constructor() {
    this.baseUrl = '/data';
  }

  // Create a new data item
  async createData(data) {
    try {
      const response = await apiClient.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get paginated data
  async getData(pageNumber = 0, pageSize = 10, sortBy = 'creationDate', asc = false) {
    try {
      const params = {
        page: pageNumber,
        size: pageSize,
        sortBy: sortBy,
        asc: asc,
      };
      const response = await apiClient.get(this.baseUrl, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Find data items by category ID with pagination
  async findDataByCategory(categoryId, pageNumber = 0, pageSize = 10, order = 'creationDate') {
    try {
      const params = {
        id: categoryId,
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

  // Find data item by ID
  async findDataById(dataId) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${dataId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Find public data item by ID
  async findPublicDataById(dataId) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/public/${dataId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Find container by owner ID
  async findContainerByOwnerId(ownerId) {
    try {
      const params = { ownerId };
      const response = await apiClient.get(`${this.baseUrl}/container`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Find children by owner ID
  async findChildren(ownerId) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${ownerId}/children`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Find parents by owner ID
  async findParents(ownerId) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${ownerId}/parents`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update data item
  async updateData(dataId, data) {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${dataId}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Publish data item
  async publishData(dataId) {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${dataId}/publish`, {});
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete data item
  async deleteData(dataId) {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/${dataId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Upload file
  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post(`${this.baseUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handler
  handleError(error) {
    console.error('DataService Error:', error);
    return {
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status || 500
    };
  }
}

export default new DataService();