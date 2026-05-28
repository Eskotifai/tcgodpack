import { Product } from './product';

export interface CartProduct {
	product: Product;
	quantity: number;
}

export interface Cart {
	email: string;
	products?: CartProduct[];
}
