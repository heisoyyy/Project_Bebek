import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import EggProductionView from './views/EggProductionView';
import FeedView from './views/FeedView';
import InventoryView from './views/InventoryView';
import CoopsView from './views/CoopsView';
import FinanceView from './views/FinanceView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} openModal={(type) => {
          if (type === 'egg') setActiveTab('eggs');
          if (type === 'feedUsage' || type === 'feedPurchase') setActiveTab('feed');
          if (type === 'sale') setActiveTab('inventory');
        }} />;
      case 'eggs':
        return <EggProductionView />;
      case 'feed':
        return <FeedView />;
      case 'inventory':
        return <InventoryView />;
      case 'coops':
        return <CoopsView />;
      case 'finance':
        return <FinanceView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {renderActiveView()}
      </main>
    </div>
  );
}
