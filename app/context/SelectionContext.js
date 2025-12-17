/* eslint-disable prettier/prettier */
import React, { createContext, useContext, useState } from 'react';

const SelectionContext = createContext();

export const SelectionProvider = ({ children }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <SelectionContext.Provider
      value={{
        selectedItem,
        setSelectedItem,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
};

export default SelectionProvider;
