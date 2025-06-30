import React, { createContext, useState, useEffect, useContext } from 'react';
import principalEntityService from '../services/principalEntityService';

const PrincipalEntityContext = createContext();

export const PrincipalEntityProvider = ({ children }) => {
  const [principalEntity, setPrincipalEntity] = useState(null);

  useEffect(() => {
    const savedEntity = principalEntityService.getPrincipalEntity();
    if (savedEntity) {
      setPrincipalEntity(savedEntity);
    }
  }, []);

  const selectPrincipalEntity = (entity) => {
    principalEntityService.savePrincipalEntity(entity);
    setPrincipalEntity(entity);
  };

  const clearPrincipalEntity = () => {
    principalEntityService.clearPrincipalEntity();
    setPrincipalEntity(null);
  };

  return (
    <PrincipalEntityContext.Provider value={{ principalEntity, selectPrincipalEntity, clearPrincipalEntity }}>
      {children}
    </PrincipalEntityContext.Provider>
  );
};

export const usePrincipalEntity = () => useContext(PrincipalEntityContext);