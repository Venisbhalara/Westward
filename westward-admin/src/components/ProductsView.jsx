import React, { useState } from 'react';
import { Package, Search, Plus, Edit3, Trash2, X, Check } from 'lucide-react';

function money(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function ProductsView({ products, onRefresh }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const categories = ['All', 'Shirts', 'Jackets', 'Denim', 'Trousers', 'Footwear', 'Knitwear'];

  const filtered = (products || []).filter((p) => {
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const q = search.toLowerCase().trim();
    if (!q) return matchesCat;
    return matchesCat && ((p.name || '').toLowerCase().includes(q) || (p.color || '').toLowerCase().includes(q));
  });

  const handleOpenAdd = () => {
    setIsNew(true);
    setEditingProduct({
      id: 'prod_' + Math.random().toString(36).slice(2, 9),
      name: '',
      category: 'Shirts',
      price: 4990,
      color: 'Natural Ivory',
      sizes: ['S', 'M', 'L', 'XL'],
      image: '8350480',
      description: 'Hand-tailored western essential made from pure organic cotton.',
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingProduct.name || !editingProduct.price) return;
    setSaving(true);
    try {
      if (isNew) {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingProduct),
        });
      } else {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingProduct),
        });
      }
      setEditingProduct(null);
      onRefresh();
    } catch (err) {
      alert('Failed to save product: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the catalog?`)) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      alert('Failed to delete product: ' + err.message);
    }
  };

  return (
    <div className="view-container">
      <div className="data-panel-card">
        <div className="panel-header-bar">
          <div className="panel-title">
            <h3>
              <Package size={18} style={{ color: 'var(--forest)' }} />
              Atelier Garment Inventory ({filtered.length})
            </h3>
          </div>
          <div className="panel-controls">
            <div className="search-input-wrap">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search products by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-icon-action btn-primary-action"
              onClick={handleOpenAdd}
            >
              <Plus size={15} />
              <span>Add New Piece</span>
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Piece</th>
                <th>Category</th>
                <th>Tonal Palette</th>
                <th>Sizes Curated</th>
                <th>Retail Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--muted-foreground)' }}>
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => (
                  <tr key={prod.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <img
                          src={`http://localhost:5173/images/${prod.image || '8350480'}.jpg`}
                          alt={prod.name}
                          style={{ width: 44, height: 56, objectFit: 'cover', borderRadius: 4, background: '#f3efe6' }}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=100';
                          }}
                        />
                        <div>
                          <div style={{ fontFamily: 'Georgia, serif', fontWeight: 500, color: 'var(--foreground)', fontSize: 15 }}>{prod.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--subtle)' }}>SKU: {prod.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="status-pill confirmed" style={{ background: '#f3efe6', color: 'var(--foreground)', borderColor: 'var(--border)' }}>
                        {prod.category}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted-foreground)' }}>{prod.color || 'Standard'}</td>
                    <td>
                      <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                        {Array.isArray(prod.sizes) ? prod.sizes.join(', ') : 'S, M, L, XL'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--foreground)' }}>{money(prod.price)}</td>
                    <td>
                      <div className="action-button-group">
                        <button
                          type="button"
                          className="btn-icon-action"
                          onClick={() => {
                            setIsNew(false);
                            setEditingProduct({ ...prod });
                          }}
                          title="Edit Piece"
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action"
                          style={{ color: '#b91c1c' }}
                          onClick={() => handleDelete(prod.id, prod.name)}
                          title="Delete Piece"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {editingProduct && (
        <div className="modal-backdrop" onClick={() => setEditingProduct(null)}>
          <div
            className="modal-content-card"
            style={{ maxWidth: 540 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{isNew ? 'Create New Collection Piece' : 'Edit Atelier Piece'}</h3>
              <button
                type="button"
                className="btn-icon-action"
                style={{ padding: 6 }}
                onClick={() => setEditingProduct(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    style={{
                      width: '100%',
                      background: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '10px 12px',
                      color: 'var(--foreground)',
                      fontSize: 13,
                    }}
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 6, textTransform: 'uppercase' }}>
                      Category *
                    </label>
                    <select
                      style={{
                        width: '100%',
                        background: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '10px 12px',
                        color: 'var(--foreground)',
                        fontSize: 13,
                      }}
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    >
                      {categories.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 6, textTransform: 'uppercase' }}>
                      Retail Price (₹ INR) *
                    </label>
                    <input
                      type="number"
                      required
                      min={100}
                      style={{
                        width: '100%',
                        background: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '10px 12px',
                        color: 'var(--foreground)',
                        fontSize: 13,
                      }}
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 6, textTransform: 'uppercase' }}>
                    Color Palette Tone
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      background: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '10px 12px',
                      color: 'var(--foreground)',
                      fontSize: 13,
                    }}
                    value={editingProduct.color || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, color: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-icon-action"
                  onClick={() => setEditingProduct(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-icon-action btn-primary-action"
                >
                  <Check size={15} />
                  <span>{saving ? 'Saving...' : 'Save to Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
