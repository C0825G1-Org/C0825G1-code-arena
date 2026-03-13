import React, { useEffect, useState } from 'react';
import { UserLayout } from '../../../../layouts/UserLayout';
import { shopService, ShopItem } from '../services/shopService';
import { ShoppingCart, Star, Lightning, Storefront, Check } from '@phosphor-icons/react';
import { toast as showToast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import { updateProfile } from '../../../auth/store/authSlice';

export const ShopPage = () => {
    const [items, setItems] = useState<ShopItem[]>([]);
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [buyingId, setBuyingId] = useState<number | null>(null);
    const [purchasedIds, setPurchasedIds] = useState<number[]>([]);
    const [equippingId, setEquippingId] = useState<number | null>(null);
    const [unequipping, setUnequipping] = useState(false);
    
    const user = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch();

    const fetchData = async () => {
        try {
            setLoading(true);
            const [fetchedItems, fetchedBalance, fetchedHistory] = await Promise.all([
                shopService.getItems(),
                shopService.getBalance(),
                shopService.getHistory()
            ]);
            const sortedItems = (fetchedItems || []).sort((a, b) => {
                const aEquipped = user?.avatarFrame === a.imageUrl;
                const bEquipped = user?.avatarFrame === b.imageUrl;
                if (aEquipped && !bEquipped) return -1;
                if (!aEquipped && bEquipped) return 1;

                const aPurchased = (fetchedHistory || []).some(p => p.item && Number(p.item.id) === Number(a.id));
                const bPurchased = (fetchedHistory || []).some(p => p.item && Number(p.item.id) === Number(b.id));
                if (aPurchased && !bPurchased) return -1;
                if (!aPurchased && bPurchased) return 1;

                return 0;
            });
            setItems(sortedItems);
            setBalance(fetchedBalance || 0);
            setPurchasedIds(fetchedHistory?.filter(p => p.item).map(p => Number(p.item.id)) || []);
        } catch (err: any) {
            console.error("Failed to load shop:", err);
            showToast.error("Không thể tải dữ liệu cửa hàng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePurchase = async (item: ShopItem) => {
        if (balance < item.price) {
            showToast.error(`Bạn không đủ ELO Tổng (Cần ${item.price})`);
            return;
        }

        try {
            setBuyingId(item.id);
            await shopService.purchaseItem(item.id, 1);
            showToast.success(`Mua thành công: ${item.name}!`);
            fetchData();
        } catch (err: any) {
            console.error(err);
            showToast.error(err.response?.data?.error || "Mua hàng thất bại");
        } finally {
            setBuyingId(null);
        }
    };

    const handleEquip = async (item: ShopItem) => {
        try {
            setEquippingId(item.id);
            const response = await shopService.equipFrame(item.id);
            showToast.success(`Đã trang bị: ${item.name}!`);
            dispatch(updateProfile({ avatarFrame: response.avatarFrame }));
        } catch (err: any) {
            console.error(err);
            showToast.error(err.response?.data?.error || "Trang bị thất bại");
        } finally {
            setEquippingId(null);
        }
    };

    const handleUnequip = async () => {
        try {
            setUnequipping(true);
            const response = await shopService.unequipFrame();
            showToast.success(`Đã gỡ khung avatar!`);
            dispatch(updateProfile({ avatarFrame: response.avatarFrame }));
        } catch (err: any) {
            console.error(err);
            showToast.error(err.response?.data?.error || "Gỡ thất bại");
        } finally {
            setUnequipping(false);
        }
    };

    return (
        <UserLayout>
            <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in-up">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-white mb-2 flex items-center gap-3">
                            <Storefront className="text-yellow-400" weight="fill" />
                            Cửa Hàng ELO
                        </h1>
                        <p className="text-slate-400">Dùng điểm ELO Tổng của bạn để mua các vật phẩm độc quyền.</p>
                    </div>

                    <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 flex flex-col items-end shadow-xl">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Số Dư Hiện Tại</span>
                        <div className="flex items-center gap-2">
                            <Star weight="fill" className="text-yellow-400 text-3xl animate-pulse" />
                            <span className="text-4xl font-black font-mono tracking-wider drop-shadow-sm text-yellow-500">
                                {balance.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Items Grid */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Lightning weight="duotone" className="text-6xl text-blue-500 animate-pulse" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="bg-slate-800/50 rounded-2xl p-12 text-center border border-slate-700/50">
                        <Storefront weight="light" className="text-7xl text-slate-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-300 mb-2">Cửa hàng đang trống</h3>
                        <p className="text-slate-500">Hiện tại chưa có vật phẩm nào được bày bán. Hãy quay lại sau nhé!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map(item => (
                            <div key={item.id} className="bg-slate-800/60 border border-slate-700 hover:border-blue-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] hover:-translate-y-1 group flex flex-col">
                                
                                {/* Image / Placeholder */}
                                <div className="h-48 w-full bg-slate-900 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10"></div>
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                            <ShoppingCart weight="duotone" className="text-6xl text-indigo-400/50" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 z-20">
                                        <span className="bg-blue-600 font-bold text-white text-xs px-3 py-1 rounded-full shadow-lg border border-blue-500">
                                            {item.category || 'Vật phẩm'}
                                        </span>
                                    </div>
                                    {item.stock !== -1 && (
                                        <div className="absolute top-3 right-3 z-20">
                                            <span className="bg-slate-900/80 font-bold text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-700">
                                                Còn: {item.stock}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{item.name}</h3>
                                    <p className="text-sm text-slate-400 mb-6 line-clamp-2 flex-1">{item.description}</p>
                                    
                                    {/* Action Row */}
                                    <div className="flex items-end justify-between mt-auto">
                                        <div>
                                            <span className="text-xs text-slate-500 font-bold uppercase">Giá</span>
                                            <div className="flex items-center gap-1.5 -mt-1">
                                                <Star weight="fill" className={balance >= item.price ? 'text-yellow-500 text-lg' : 'text-slate-500 text-lg'} />
                                                <span className={`text-xl font-black font-mono ${balance >= item.price ? 'text-yellow-400' : 'text-slate-400'}`}>
                                                    {item.price.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {purchasedIds.includes(Number(item.id)) ? (
                                            user?.avatarFrame === item.imageUrl ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-green-500/20 text-green-500 border border-green-500/50 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-sm ring-1 ring-green-500/20">
                                                        <Check weight="bold" /> Đang dùng
                                                    </div>
                                                    <button
                                                        onClick={() => handleUnequip()}
                                                        disabled={unequipping}
                                                        title="Gỡ khung avatar"
                                                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2.5 rounded-xl font-bold border border-red-500/30 transition-all text-sm hover:scale-[1.05] active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[60px]"
                                                    >
                                                        {unequipping ? "..." : "Gỡ"}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleEquip(item)}
                                                    disabled={equippingId === item.id}
                                                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 border border-purple-400/20"
                                                >
                                                    {equippingId === item.id ? (
                                                        <Lightning weight="fill" className="animate-spin" />
                                                    ) : (
                                                        <>Sử dụng</>
                                                    )}
                                                </button>
                                            )
                                        ) : (
                                            <button
                                                onClick={() => handlePurchase(item)}
                                                disabled={buyingId === item.id || item.stock === 0}
                                                className={`
                                                    relative px-6 py-2.5 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 overflow-hidden
                                                    ${buyingId === item.id 
                                                        ? 'bg-purple-600 text-white cursor-wait' 
                                                        : item.stock === 0
                                                            ? 'bg-red-500/20 text-red-500 cursor-not-allowed border border-red-500/50'
                                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-95'
                                                    }
                                                `}
                                            >
                                                {buyingId === item.id && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                                                {buyingId === item.id ? (
                                                    <>Đang xử lý...</>
                                                ) : item.stock === 0 ? (
                                                    <>Hết Hàng</>
                                                ) : (
                                                    <>
                                                        Mua <ShoppingCart weight="bold" />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </UserLayout>
    );
};

export default ShopPage;
