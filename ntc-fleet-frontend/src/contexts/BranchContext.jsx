import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const BranchContext = createContext();

export const useBranch = () => {
  return useContext(BranchContext);
};

export const BranchProvider = ({ children }) => {
  const { user } = useAuth();
  
  // selectedBranch: 'ALL' for super admin viewing all, or specific branch ID
  const [selectedBranch, setSelectedBranch] = useState('ALL');

  // When user role or branch changes, reset the selected branch logic
  useEffect(() => {
    if (user) {
      if (user.role === 'SUPER_ADMIN') {
        setSelectedBranch('ALL');
      } else {
        setSelectedBranch(user.branch); // Branch admins or lower are locked to their branch
      }
    }
  }, [user]);

  // Provide a safe way to set branch that respects roles
  const changeSelectedBranch = (branchId) => {
    if (user?.role === 'SUPER_ADMIN') {
      setSelectedBranch(branchId);
    }
    // other roles cannot change their selected branch
  };

  return (
    <BranchContext.Provider value={{ selectedBranch, changeSelectedBranch }}>
      {children}
    </BranchContext.Provider>
  );
};
