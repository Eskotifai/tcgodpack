export class CartProduct {
  constructor(
    public productName: string,
    public quantity: number,
  ) {}
}

export class Cart {
  constructor(
    public email: string,
    public products: CartProduct[] = [],
  ) {}
}
