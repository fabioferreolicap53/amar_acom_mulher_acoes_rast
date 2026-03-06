import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden md:pt-16">
        <div className="md:hidden">
           <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
        </div>
        <main className="flex-1 overflow-y-auto p-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
