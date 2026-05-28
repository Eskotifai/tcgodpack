import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Cart, CartProduct } from './cart.model';
import { CartService } from './cart.service';

@Controller('cart') // http://localhost:3000/cart
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // POST http://localhost:3000/cart/add
  // Espera un body como: { "username": "cliente@gmail.com", "productName": "Carta Zoro", "quantity": 1 }
  @Post('add')
  async añadirAlCarrito(
    @Body()
    body: {
      email: string;
      productName: string;
      quantity: number;
    },
  ): Promise<Cart> {
    const itemProducto = new CartProduct(body.productName, body.quantity);
    return await this.cartService.agregarProducto(body.email, itemProducto);
  }

  // GET http://localhost:3000/cart?email=cliente@gmail.com
  // Devuelve el objeto completo del carrito de ese usuario
  @Get()
  async verMiCarrito(@Query('email') email: string): Promise<Cart> {
    return await this.cartService.obtenerPorEmail(email);
  }
}
