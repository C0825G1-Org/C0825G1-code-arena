import axiosClient from '../../../../shared/services/axiosClient';

export interface ShopItem {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category: string;
    stock: number;
    isActive: boolean;
}

export interface ShopPurchase {
    id: number;
    item: ShopItem;
    quantity: number;
    totalCost: number;
    purchasedAt: string;
}

export const shopService = {
    getItems: async (): Promise<ShopItem[]> => {
        const response = await axiosClient.get('/shop/items');
        return response as unknown as ShopItem[];
    },

    getBalance: async (): Promise<number> => {
        const response = await axiosClient.get('/shop/balance');
        return (response as any).shopBalance;
    },

    purchaseItem: async (itemId: number, quantity: number = 1): Promise<ShopPurchase> => {
        const response = await axiosClient.post(`/shop/purchase/${itemId}?quantity=${quantity}`);
        return response as unknown as ShopPurchase;
    },

    getHistory: async (): Promise<ShopPurchase[]> => {
        const response = await axiosClient.get('/shop/history');
        return response as unknown as ShopPurchase[];
    },

    equipFrame: async (itemId: number): Promise<any> => {
        const response = await axiosClient.patch(`/users/settings/equip-frame/${itemId}`);
        return response;
    }
};
