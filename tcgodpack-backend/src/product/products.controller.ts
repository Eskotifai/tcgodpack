import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Product } from './product.model';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async obtenerTodos(@Query('name') name?: string): Promise<Product[]> {
    if (name) {
      return this.productsService.buscarPorNombre(name);
    }
    return this.productsService.obtenerTodosProductos();
  }

  @Get(':number')
  async obtenerPorNumero(@Param('number') number: string): Promise<Product | undefined> {
    return this.productsService.obtenerPorNumero(Number(number));
  }

  @Post()
  async crearProducto(@Body() product: Product): Promise<Product> {
    return this.productsService.crearProducto(product);
  }
}
