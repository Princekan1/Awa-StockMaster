import { useState } from 'react';
import { useStock } from './context/StockContext';
import PinLock from './components/PinLock';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import NavTabs from './components/NavTabs';
import InventoryList from './components/InventoryList';
import AddProductForm from './components/AddProductForm';
import './App.css';

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState('inventory');
  const [editingItem, setEditingItem] = useState(null);
  const { inv } = useStock();

  if (!isUnlocked) {
    return <PinLock onUnlock={() => setIsUnlocked(true)} />;
  }

  const lowStockCount = inv.filter((i) => i.qty <= i.min).length;

  const goToTab = (tab) => {
    if (tab !== 'add') setEditingItem(null);
    setActiveTab(tab);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setActiveTab('add');
  };

  const handleFormDone = () => {
    setEditingItem(null);
    setActiveTab('inventory');
  };

  return (
    <>
      <Header />
      <Dashboard />
      <NavTabs activeTab={activeTab} onTabChange={goToTab} lowStockCount={lowStockCount} />

      <div className="tab-content">
        {activeTab === 'inventory' && <InventoryList onEdit={handleEdit} />}
        {activeTab === 'add' && <AddProductForm editingItem={editingItem} onDone={handleFormDone} />}
        {activeTab === 'reports' && <p>Reports tab — coming next.</p>}
        {activeTab === 'debtors' && <p>Debtors tab — coming next.</p>}
        {activeTab === 'expenses' && <p>Expenses tab — coming next.</p>}
        {activeTab === 'more' && <p>More / settings tab — coming next.</p>}
      </div>
    </>
  );
}

export default App;
