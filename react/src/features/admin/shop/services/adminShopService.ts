import { axiosClient } from "../../../../shared/services/axiosClient";
import { ShopItem } from "../../../user/shop/services/shopService";

export const adminShopService = {
    getAllItems: async () => {
        return axiosClient.get<ShopItem[]>('/admin/shop/items').then(res => res.data);
    },

    createItem: async (formData: FormData) => {
        return axiosClient.post<ShopItem>('/admin/shop/items', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }).then(res => res.data);
    },

    updateItem: async (id: number, formData: FormData) => {
        return axiosClient.put<ShopItem>(`/admin/shop/items/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }).then(res => res.data);
    },

    deleteItem: async (id: number) => {
        await axiosClient.delete(`/admin/shop/items/${id}`);
    }
};
