import React, { useEffect, useState } from 'react';
import { adminShopService } from '../services/adminShopService';
import { ShopItem } from '../../../user/shop/services/shopService';
import { 
    X,
    CalendarPlus as Plus,
    PencilSimple as Pencil, 
    Trash, 
    UploadSimple as Upload, 
    ShoppingCart as Shop, 
    Image as ImageIcon, 
    Tag, 
    Coins, 
    Stack 
} from '@phosphor-icons/react';
import { toast } from 'react-toastify';

export const AdminShopPage: React.FC = () => {
    const [items, setItems] = useState<ShopItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        category: 'avatar_frame',
        stock: -1,
        isActive: true
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const data = await adminShopService.getAllItems();
            setItems(data);
        } catch (error) {
            toast.error('Không thể tải danh sách vật phẩm');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleOpenModal = (item?: ShopItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                description: item.description || '',
                price: item.price,
                category: item.category,
                stock: item.stock,
                isActive: item.isActive ?? true
            });
            setImagePreview(item.imageUrl || null);
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                description: '',
                price: 0,
                category: 'avatar_frame',
                stock: -1,
                isActive: true
            });
            setImagePreview(null);
        }
        setSelectedImage(null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingItem(null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('price', formData.price.toString());
            data.append('category', formData.category);
            data.append('stock', formData.stock.toString());
            data.append('isActive', formData.isActive.toString());
            if (selectedImage) {
                data.append('image', selectedImage);
            }

            if (editingItem) {
                await adminShopService.updateItem(editingItem.id, data);
                toast.success('Cập nhật vật phẩm thành công');
            } else {
                await adminShopService.createItem(data);
                toast.success('Thêm vật phẩm thành công');
            }
            fetchItems();
            handleCloseModal();
        } catch (error) {
            toast.error('Có lỗi xảy ra khi lưu vật phẩm');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa vật phẩm này?')) {
            try {
                await adminShopService.deleteItem(id);
                toast.success('Đã xóa vật phẩm');
                fetchItems();
            } catch (error) {
                toast.error('Lỗi khi xóa vật phẩm');
            }
        }
    };

    return (
        <div className="p-6 space-y-6 bg-[#0f111a] min-h-screen text-gray-100">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <Shop size={28} className="text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Quản lý Cửa hàng</h1>
                        <p className="text-gray-400 text-sm">Quản lý vật phẩm, Badge và Khung Avatar</p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                    <Plus size={20} weight="bold" />
                    Thêm Vật Phẩm
                </button>
            </div>

            <div className="bg-[#161b22] border border-gray-700/50 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#1c2128] text-gray-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Vật phẩm</th>
                            <th className="px-6 py-4">Phân loại</th>
                            <th className="px-6 py-4">Giá (ELO)</th>
                            <th className="px-6 py-4">Kho</th>
                            <th className="px-6 py-4">Trạng thái</th>
                            <th className="px-6 py-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                        ) : (!items || items.length === 0) ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    Chưa có vật phẩm nào trong cửa hàng.
                                </td>
                            </tr>
                        ) : items.map((item) => (
                            <tr key={item.id} className="hover:bg-[#1c2128]/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <ImageIcon size={20} className="text-gray-500" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-200">{item.name}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                        item.category === 'avatar_frame' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                                    }`}>
                                        {item.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-indigo-400">
                                    {item.price}
                                </td>
                                <td className="px-6 py-4 text-gray-400">
                                    {item.stock === -1 ? '∞' : item.stock}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`flex items-center gap-1.5 ${item.isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                                        {item.isActive ? 'Đang bán' : 'Ẩn'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenModal(item)}
                                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                                        >
                                            <Trash size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#161b22] border border-gray-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#1c2128]">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                {editingItem ? 'Chỉnh sửa vật phẩm' : 'Thêm vật phẩm mới'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-white transition-colors">
                                <X size={20} weight="bold" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                                            <Tag size={14} /> Tên vật phẩm
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="Ví dụ: Khung Vàng"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                                            <ImageIcon size={14} /> Phân loại
                                        </label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                        >
                                            <option value="avatar_frame">Khung Avatar (avatar_frame)</option>
                                            <option value="badge">Huy hiệu (badge)</option>
                                            <option value="other">Khác</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Mô tả</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="Mô tả công dụng hoặc vẻ ngoài của vật phẩm..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                                            <Coins size={14} /> Giá (Elo)
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                                            className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                                            <Stack size={14} /> Số lượng kho (-1 = ∞)
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="-1"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                                            className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                                        <ImageIcon size={14} /> Hình ảnh vật phẩm
                                    </label>
                                    <div className="flex gap-4 items-start">
                                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden bg-gray-800/50">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                                            ) : (
                                                <ImageIcon size={32} className="text-gray-600" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <label className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors text-sm font-medium">
                                                <Upload size={18} />
                                                Tải ảnh lên
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                            </label>
                                            <p className="text-[10px] text-gray-500 uppercase leading-relaxed font-semibold">
                                                KHUYẾN NGHỊ: PNG TRONG SUỐT, TỶ LỆ 1:1 (HÌNH VUÔNG).
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-700 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-medium text-gray-300 cursor-pointer">
                                        Hiển thị trong cửa hàng ngay lập tức
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-700 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
                                >
                                    {isSubmitting ? 'Đang lưu...' : editingItem ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
