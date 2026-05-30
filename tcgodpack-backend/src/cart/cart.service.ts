// import { Injectable } from '@nestjs/common';
// import * as fs from 'fs/promises';
// import * as path from 'path';
// import { Cart, CartProduct } from './cart.model';

// @Injectable()
// export class CartService {
//   private readonly dataDir = path.join(process.cwd(), 'data');
//   private readonly filePath = path.join(this.dataDir, 'cart.json');
//   private writeQueue: Promise<void> = Promise.resolve();

//   // Lee todos los carritos del archivo
//   private async obtenerTodos(): Promise<Cart[]> {
//     try {
//       const data = await fs.readFile(this.filePath, 'utf-8');
//       return JSON.parse(data) as Cart[];
//     } catch {
//       return [];
//     }
//   }

//   // Escritura atómica y en cola para evitar corrupciones por concurrencia
//   private async doAtomicWrite(carritos: Cart[]): Promise<void> {
//     await fs.mkdir(this.dataDir, { recursive: true });
//     const tmp = this.filePath + '.tmp';
//     await fs.writeFile(tmp, JSON.stringify(carritos, null, 2), 'utf-8');
//     await fs.rename(tmp, this.filePath);
//   }

//   private enqueueWrite(carritos: Cart[]): Promise<void> {
//     // Encadenamos escrituras para que se ejecuten secuencialmente
//     this.writeQueue = this.writeQueue.then(
//       () => this.doAtomicWrite(carritos),
//       () => this.doAtomicWrite(carritos),
//     );
//     return this.writeQueue;
//   }

//   // Busca el carrito de un usuario específico. Si no existe, devuelve uno vacío estructurado
//   async obtenerPorUsuario(username: string): Promise<Cart> {
//     const carritos = await this.obtenerTodos();
//     const carritoUsuario = carritos.find((c) => c.username === username);

//     // Si no tiene carrito en el JSON, le retornamos una estructura inicializada limpia
//     return carritoUsuario || { username, products: [] };
//   }

//   // AÑADIR PRODUCTO AL CARRITO AGRUPADO
//   async agregarProducto(
//     username: string,
//     nuevoProducto: CartProduct,
//   ): Promise<Cart> {
//     const productName = String(nuevoProducto.productName ?? '').trim();
//     const quantity = Number(nuevoProducto.quantity);
//     if (!productName) throw new Error('productName is required');
//     if (!Number.isFinite(quantity) || quantity <= 0)
//       throw new Error('quantity must be a positive number');

//     nuevoProducto.productName = productName;
//     nuevoProducto.quantity = Math.floor(quantity);

//     const carritos = await this.obtenerTodos();
//     let carritoUsuario = carritos.find((c) => c.username === username);

//     if (!carritoUsuario) {
//       carritoUsuario = { username, products: [] };
//       carritos.push(carritoUsuario);
//     }

//     const productoExistente = carritoUsuario.products.find(
//       (p) => String(p.productName).trim().toLowerCase() === productName.toLowerCase(),
//     );

//     if (productoExistente) {
//       productoExistente.quantity += nuevoProducto.quantity;
//     } else {
//       carritoUsuario.products.push(nuevoProducto);
//     }

//     try {
//       await this.enqueueWrite(carritos);
//     } catch (err) {
//       throw new Error('Error al escribir en el archivo de carritos: ' + String(err));
//     }

//     return carritoUsuario;
//   }
// }

import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Cart, CartProduct } from './cart.model';
import { JsonHandlerService } from '../shared/json-handler/json-handler.service';
import { Product } from '../product/product.model';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class CartService {
  private static readonly maxUnitsInCart = 10;

  constructor(private readonly jsonHandler: JsonHandlerService,
    private readonly profileService: ProfileService,
  ) {}

  private async obtenerTodos(): Promise<Cart[]> {
    return this.jsonHandler.readData<Cart>('cart');
  }

  async obtenerPorEmail(email: string): Promise<Cart> {
    const carritos = await this.obtenerTodos();
    const carritoUsuario = carritos.find((c) => c.email === email);

    if (carritoUsuario) {
      carritoUsuario.products = Array.isArray(carritoUsuario.products)
        ? carritoUsuario.products
        : [];
      return carritoUsuario;
    }

    const carritoVacio: Cart = { email, products: [] };
    carritos.push(carritoVacio);

    try {
      await this.jsonHandler.writeData('cart', carritos);
    } catch {
      // Si no puede persistir, igual devolvemos el carrito vacío en memoria.
    }

    return carritoVacio;
  }

  private getTotalUnits(cart: Cart): number {
    return (cart.products ?? []).reduce((sum, item) => {
      const quantity = Math.floor(Number(item.quantity ?? 0));
      return sum + Math.max(0, quantity);
    }, 0);
  }

  private getInsufficientStockProducts(cart: Cart, products: Product[]): string[] {
    const productCatalog = new Map<number, Product>(
      products.map((product) => [product.number, product]),
    );

    return (cart.products ?? [])
      .filter((item) => {
        const catalogProduct = productCatalog.get(item.product.number);
        const requestedQuantity = Math.max(0, Math.floor(Number(item.quantity ?? 0)));

        return !catalogProduct || Math.floor(Number(catalogProduct.available ?? 0)) < requestedQuantity;
      })
      .map((item) => item.product.name);
  }

  async agregarProducto(
    email: string,
    nuevoProducto: CartProduct,
  ): Promise<Cart> {
    const product = nuevoProducto.product;
    const quantity = Number(nuevoProducto.quantity);
    
    if (!product || !String(product.name ?? '').trim()) {
      throw new BadRequestException('product is required');
    }
    if (!Number.isFinite(Number(product.number)) || Number(product.number) <= 0) {
      throw new BadRequestException('product.number is required');
    }
    if (!String(product.imageUrl ?? '').trim()) {
      throw new BadRequestException('product.imageUrl is required');
    }
    if (!Number.isFinite(Number(product.price)) || Number(product.price) < 0) {
      throw new BadRequestException('product.price must be a non-negative number');
    }
    if (!Number.isFinite(quantity) || quantity <= 0)
      throw new BadRequestException('quantity must be a positive number');

    const requestedQuantity = Math.floor(quantity);
    const normalizedProduct = {
      ...product,
      number: Math.floor(Number(product.number)),
      price: Number(product.price),
      available: Math.floor(Number(product.available ?? 0)),
      name: String(product.name).trim(),
      imageUrl: String(product.imageUrl).trim(),
    };
    nuevoProducto.product = normalizedProduct;

    const carritos = await this.obtenerTodos();
    let carritoUsuario = carritos.find((c) => c.email === email);

    if (!carritoUsuario) {
      carritoUsuario = { email: email, products: [] };
      carritos.push(carritoUsuario);
    }

    const currentTotalUnits = this.getTotalUnits(carritoUsuario);
    const remainingUnits = CartService.maxUnitsInCart - currentTotalUnits;

    if (remainingUnits <= 0) {
      throw new BadRequestException('la cantidad de unidades seleccionadas supera el espacio actual del carrito');
    }

    if (requestedQuantity > remainingUnits) {
      throw new BadRequestException('la cantidad de unidades seleccionadas supera el espacio actual del carrito');
    }

    const productoExistente = carritoUsuario.products.find(
      (p) => p.product.number === normalizedProduct.number,
    );

    if (productoExistente) {
      productoExistente.quantity = Math.max(0, Math.floor(productoExistente.quantity ?? 0)) + requestedQuantity;
    } else {
      carritoUsuario.products.push({
        product: normalizedProduct,
        quantity: requestedQuantity,
      });
    }

    try {
      await this.jsonHandler.writeData('cart', carritos);
    } catch (err) {
      throw new InternalServerErrorException('Error al guardar el carrito');
    }

    return carritoUsuario;
  }

  async procesarCompra(email: string): Promise<Cart> {
    const carritos = await this.obtenerTodos();
    const carritoUsuario = carritos.find((c) => c.email === email);

    if (!carritoUsuario || !(carritoUsuario.products?.length ?? 0)) {
      throw new BadRequestException('El carrito está vacío');
    }

    const productos = await this.jsonHandler.readData<Product>('product');
    const insufficientProducts = this.getInsufficientStockProducts(carritoUsuario, productos);

    if (insufficientProducts.length > 0) {
      throw new BadRequestException(
        `La cantidad de unidades seleccionadas supera el espacio actual del carrito. No tienen stock suficiente: ${insufficientProducts.join(', ')}`,
      );
    }

    const updatedProducts = productos.map((product) => {
      const cartItem = carritoUsuario.products.find((item) => item.product.number === product.number);

      if (!cartItem) {
        return product;
      }

      return {
        ...product,
        available: Math.max(0, Math.floor(Number(product.available ?? 0)) - Math.floor(Number(cartItem.quantity ?? 0))),
      };
    });

    const purchasedNames = carritoUsuario.products.map((item) => item.product.name);

    carritoUsuario.products = [];

    try {
      await this.jsonHandler.writeData('product', updatedProducts);
      await this.jsonHandler.writeData('cart', carritos);
      await this.profileService.agregarProductosComprados(email, purchasedNames);
    } catch (err) {
      throw new InternalServerErrorException('Error al procesar la compra');
    }

    return carritoUsuario;
  }
}