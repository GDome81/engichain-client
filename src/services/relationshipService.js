import apiClient from './apiService';

class RelationshipService {
  constructor() {
    this.baseUrl = '/relationship';
  }

  // Create a single relationship
  async createRelationship(relationship) {
    try {
      const response = await apiClient.post(this.baseUrl, relationship);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create multiple relationships
  async createRelationships(relationships) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/list`, relationships);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update a relationship
  async updateRelationship(relationshipId, relationship) {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${relationshipId}`, relationship);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete a relationship
  async deleteRelationship(relationshipId) {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/${relationshipId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get relationships for a specific owner
  async getRelationshipsByOwner(ownerId) {
    try {
      console.log(`[RelationshipService] Loading relationships for owner: ${ownerId}`);
      
      // Get both children and parents relationships using allSettled for resilience
      const results = await Promise.allSettled([
        apiClient.get(`/data/${ownerId}/children`),
        apiClient.get(`/data/${ownerId}/parents`)
      ]);

      const childrenResponse = results[0];
      const parentsResponse = results[1];

      console.log(`[RelationshipService] Children response status:`, childrenResponse.status);
      console.log(`[RelationshipService] Parents response status:`, parentsResponse.status);

      const children = childrenResponse.status === 'fulfilled' && Array.isArray(childrenResponse.value.data) ? childrenResponse.value.data : [];
      const parentData = parentsResponse.status === 'fulfilled' ? parentsResponse.value.data : null;

      console.log(`[RelationshipService] Processed children (${children.length}):`, children);
      console.log(`[RelationshipService] Raw parent data:`, parentData);

      const relationships = [];

      // Add children relationships (this node -> child)
      children.forEach(child => {
        if (child && child.id) {
          relationships.push({
            id: `${ownerId}-${child.id}`,
            from: parseInt(ownerId, 10),
            to: child.id,
            label: 'contains',
            type: 'child'
          });
        }
      });

      // Add parent relationships from the graph structure
      if (parentData && Array.isArray(parentData.relationships)) {
        parentData.relationships.forEach(rel => {
          relationships.push({
            ...rel,
            type: 'parent'
          });
        });
      }
      
      console.log(`[RelationshipService] Final relationships (${relationships.length}):`, relationships);
      return relationships;
    } catch (error) {
      console.error(`[RelationshipService] Error loading relationships for ${ownerId}:`, error);
      console.error(`[RelationshipService] Error details:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw this.handleError(error);
    }
  }
  
  // Get container data for a specific owner
  async getContainerData(ownerId) {
    try {
      const response = await apiClient.get(`/data/container?ownerId=${ownerId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handler
  handleError(error) {
    console.error('RelationshipService Error:', error);
    return {
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status || 500
    };
  }
}

export default new RelationshipService();