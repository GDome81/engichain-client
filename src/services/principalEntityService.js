const PRINCIPAL_ENTITY_KEY = 'principalEntity';

const principalEntityService = {
  savePrincipalEntity(entity) {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(PRINCIPAL_ENTITY_KEY, JSON.stringify(entity));
    }
  },

  getPrincipalEntity() {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const entity = sessionStorage.getItem(PRINCIPAL_ENTITY_KEY);
      return entity ? JSON.parse(entity) : null;
    }
    return null;
  },

  clearPrincipalEntity() {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(PRINCIPAL_ENTITY_KEY);
    }
  },
};

export default principalEntityService;