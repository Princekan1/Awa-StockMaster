import { useNavigate } from 'react-router-dom';
import { useInventoryStore } from '../store/useInventoryStore';
import Header from '../components/Header';
import ProductForm from '../components/ProductForm';

export default function ProductNew() {
  const addProduct = useInventoryStore((s) => s.addProduct);
  const products = useInventoryStore((s) => s.products);
  const navigate = useNavigate();
  return (
    <div className="max-w-lg">
      <Header title="Add Product" subtitle="Register a new item in your shop" />
      <div className="ui-card p-5"><ProductForm existingProducts={products} onSubmit={(data) => navigate(`/products/${addProduct(data).id}`)} /></div>
    </div>
  );
}
