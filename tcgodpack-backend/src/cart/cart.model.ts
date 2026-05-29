import { Product } from '../product/product.model';

export class CartProduct {
  constructor(
    public product: Product,
    public quantity: number,
  ) {}
}

export class Cart {
  constructor(
    public email: string,
    public products: CartProduct[] = [],
  ) {}
}
