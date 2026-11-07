import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  PlusCircle,
  MinusCircle,
  Tag,
  PackageCheck,
} from 'lucide-react';
import PageHeader from './PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import { formatPrice } from '../../lib/format';
import {
  getLocalProducts,
  saveLocalProduct,
  deleteLocalProduct,
  updateProductStock,
} from '../../lib/mockData';
import type { Product } from '../../lib/types';

export default function Inventory() {
  const { lang } = useLanguage();
  const [products, setProducts] = useState<Product[]>(() => getLocalProducts());
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [openModal, setOpenModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState('hair');
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(10);
  const [sku, setSku] = useState('');

  const reload = () => {
    setProducts([...getLocalProducts()]);
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setNameAr('');
    setNameEn('');
    setCategory('hair');
    setPrice(500);
    setStock(20);
    setSku(`SKU-${Date.now().toString().slice(-4)}`);
    setOpenModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setNameAr(p.name_ar);
    setNameEn(p.name_en);
    setCategory(p.category);
    setPrice(p.price);
    setStock(p.stock_quantity);
    setSku(p.sku || '');
    setOpenModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) return;

    const newProd: Product = {
      id: editingProduct ? editingProduct.id : 'prod-' + Date.now(),
      name_ar: nameAr.trim(),
      name_en: nameEn.trim() || nameAr.trim(),
      category,
      price: Number(price) || 0,
      stock_quantity: Number(stock) || 0,
      sku: sku.trim() || undefined,
      is_active: true,
      created_at: editingProduct?.created_at || new Date().toISOString(),
    };

    saveLocalProduct(newProd);
    reload();
    setOpenModal(false);
  };

  const handleDelete = (prodId: string) => {
    if (window.confirm(lang === 'ar' ? 'هل أنتِ متأكدة من حذف هذا المنتج من المخزون؟' : 'Are you sure you want to delete this product?')) {
      deleteLocalProduct(prodId);
      reload();
    }
  };

  const handleAdjustStock = (prodId: string, delta: number) => {
    updateProductStock(prodId, delta);
    reload();
  };

  // Filtered
  const filtered = products.filter((p) => {
    const q = query.toLowerCase();
    const matchQuery =
      !q ||
      p.name_ar.toLowerCase().includes(q) ||
      p.name_en.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q));

    if (!matchQuery) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    return true;
  });

  const lowStockCount = products.filter((p) => p.stock_quantity <= 5).length;
  const totalStockItems = products.reduce((sum, p) => sum + p.stock_quantity, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={lang === 'ar' ? 'المخزون والمنتجات' : 'Inventory & Products'}
        title={lang === 'ar' ? 'إدارة منتجات العناية المنزلية' : 'Retail Products & Stock'}
        subtitle={
          lang === 'ar'
            ? 'متابعة كميات المخزون، أسعار منتجات العناية، وتوفيرها للإضافة السريعة في فواتير الاستقبال المفتوحة.'
            : 'Track boutique retail stock, prices, and enable instant add-on to client tabs at reception.'
        }
        actions={
          <button onClick={handleOpenAdd} className="btn-primary">
            <Plus className="h-4 w-4" />
            <span>{lang === 'ar' ? 'إضافة منتج جديد' : 'New Product'}</span>
          </button>
        }
      />

      {/* KPI Ribbon (Clean horizontal, NOT bento) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-pearl/80 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs text-mocha-500 font-medium">
              {lang === 'ar' ? 'إجمالي المنتجات المسجلة' : 'Catalog Products'}
            </p>
            <p className="text-2xl font-bold font-mono text-espresso mt-1">{products.length}</p>
          </div>
          <span className="p-2.5 rounded-xl bg-pearl/40 text-espresso">
            <ShoppingBag className="w-5 h-5" />
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-pearl/80 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs text-mocha-500 font-medium">
              {lang === 'ar' ? 'إجمالي القطع في المستودع' : 'Total Units in Stock'}
            </p>
            <p className="text-2xl font-bold font-mono text-espresso mt-1">{totalStockItems}</p>
          </div>
          <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
            <PackageCheck className="w-5 h-5" />
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-pearl/80 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs text-mocha-500 font-medium">
              {lang === 'ar' ? 'منتجات أوشكت على النفاد' : 'Low Stock Alert (<= 5)'}
            </p>
            <p className={`text-2xl font-bold font-mono mt-1 ${lowStockCount > 0 ? 'text-amber-600' : 'text-espresso'}`}>
              {lowStockCount}
            </p>
          </div>
          <span className={`p-2.5 rounded-xl ${lowStockCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-pearl/40 text-mocha-500'}`}>
            <AlertTriangle className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mocha-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث باسم المنتج أو الكود SKU...' : 'Search product or SKU…'}
            className="field-input mt-0 ps-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
            { id: 'hair', label: lang === 'ar' ? 'شعر' : 'Hair' },
            { id: 'skincare', label: lang === 'ar' ? 'بشرة' : 'Skincare' },
            { id: 'moroccan_bath', label: lang === 'ar' ? 'حمام مغربي' : 'Moroccan' },
            { id: 'nails', label: lang === 'ar' ? 'أظافر ورموش' : 'Nails' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                categoryFilter === cat.id
                  ? 'bg-espresso text-ivory'
                  : 'bg-white border border-pearl text-mocha-600 hover:border-mocha-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-pearl/80 bg-white shadow-soft overflow-hidden">
        <div className="overflow-x-auto admin-scroll">
          <table className="w-full text-start text-xs">
            <thead className="bg-ivory border-b border-pearl text-mocha-500 font-semibold">
              <tr>
                <th className="py-3.5 px-4 text-start">{lang === 'ar' ? 'المنتج' : 'Product'}</th>
                <th className="py-3.5 px-4 text-start">{lang === 'ar' ? 'القسم' : 'Category'}</th>
                <th className="py-3.5 px-4 text-start">{lang === 'ar' ? 'الكود (SKU)' : 'SKU'}</th>
                <th className="py-3.5 px-4 text-start">{lang === 'ar' ? 'السعر' : 'Price'}</th>
                <th className="py-3.5 px-4 text-start">{lang === 'ar' ? 'الكمية بالمخزن' : 'Stock Quantity'}</th>
                <th className="py-3.5 px-4 text-center">{lang === 'ar' ? 'تعديل سريع للرصيد' : 'Quick Adjust'}</th>
                <th className="py-3.5 px-4 text-end">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pearl/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-mocha-400">
                    {lang === 'ar' ? 'لا توجد منتجات مطابقة للبحث' : 'No products found'}
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const isLow = prod.stock_quantity <= 5;
                  return (
                    <tr key={prod.id} className="hover:bg-pearl/20 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-espresso text-sm">
                          {lang === 'ar' ? prod.name_ar : prod.name_en}
                        </div>
                        <div className="text-[11px] text-mocha-400">
                          {lang === 'ar' ? prod.name_en : prod.name_ar}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pearl/60 text-mocha-700">
                          {prod.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-mocha-500">
                        {prod.sku || '—'}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-rosegold-700 text-sm">
                        {formatPrice(prod.price, lang)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono font-semibold ${
                            isLow
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isLow && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                          <span>{prod.stock_quantity} {lang === 'ar' ? 'عبوة' : 'units'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(prod.id, -1)}
                            disabled={prod.stock_quantity <= 0}
                            className="p-1 rounded-lg border border-pearl bg-ivory hover:bg-rose-50 text-mocha-500 hover:text-rose-600 disabled:opacity-30 transition"
                            title="-1"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(prod.id, 5)}
                            className="px-2 py-1 rounded-lg border border-pearl bg-ivory hover:bg-emerald-50 text-mocha-600 hover:text-emerald-700 text-[11px] font-mono font-semibold transition"
                            title="+5 عبوات"
                          >
                            +5
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-end">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 rounded-lg border border-pearl bg-ivory hover:bg-pearl/60 text-espresso transition"
                            title={lang === 'ar' ? 'تعديل' : 'Edit'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(prod.id)}
                            className="p-1.5 rounded-lg border border-pearl bg-ivory hover:bg-rose-50 text-mocha-400 hover:text-rose-600 transition"
                            title={lang === 'ar' ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl border border-pearl max-w-md w-full p-6 shadow-elevated text-start space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-pearl">
              <h3 className="font-bold text-base text-espresso">
                {editingProduct
                  ? lang === 'ar'
                    ? 'تعديل بيانات المنتج'
                    : 'Edit Product'
                  : lang === 'ar'
                  ? 'إضافة منتج عناية جديد'
                  : 'Add Retail Product'}
              </h3>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="p-1 rounded-lg hover:bg-pearl text-mocha-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-espresso mb-1">
                {lang === 'ar' ? 'اسم المنتج بالعربية:' : 'Product Name (Arabic):'}
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: سيروم الذهب والكافيار للترميم"
                className="w-full px-3 py-2 rounded-xl border border-pearl text-xs focus:border-rosegold-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-espresso mb-1">
                {lang === 'ar' ? 'الاسم بالإنجليزية:' : 'Product Name (English):'}
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Caviar Gold Hair Serum"
                className="w-full px-3 py-2 rounded-xl border border-pearl text-xs focus:border-rosegold-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-espresso mb-1">
                  {lang === 'ar' ? 'القسم:' : 'Category:'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-pearl text-xs focus:border-rosegold-400 focus:outline-none bg-white"
                >
                  <option value="hair">{lang === 'ar' ? 'عناية بالشعر' : 'Hair'}</option>
                  <option value="skincare">{lang === 'ar' ? 'عناية بالبشرة' : 'Skincare'}</option>
                  <option value="moroccan_bath">{lang === 'ar' ? 'حمام مغربي' : 'Moroccan Bath'}</option>
                  <option value="nails">{lang === 'ar' ? 'أظافر ورموش' : 'Nails & Lashes'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-espresso mb-1">
                  {lang === 'ar' ? 'كود المخزن (SKU):' : 'SKU:'}
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SKU-8821"
                  className="w-full px-3 py-2 rounded-xl border border-pearl text-xs font-mono focus:border-rosegold-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-espresso mb-1">
                  {lang === 'ar' ? 'سعر البيع (ج.م):' : 'Price (EGP):'}
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-pearl text-xs font-mono focus:border-rosegold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-espresso mb-1">
                  {lang === 'ar' ? 'الكمية الابتدائية بالمخزن:' : 'Stock Quantity:'}
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-pearl text-xs font-mono focus:border-rosegold-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-pearl">
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 rounded-xl border border-pearl text-xs font-medium text-mocha-600 hover:bg-pearl/50"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-espresso hover:bg-espresso/90 text-ivory text-xs font-semibold shadow-soft"
              >
                {editingProduct
                  ? lang === 'ar'
                    ? 'حفظ التعديلات'
                    : 'Save Changes'
                  : lang === 'ar'
                  ? 'إضافة المنتج'
                  : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

