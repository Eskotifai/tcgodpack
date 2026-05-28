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

@Injectable()
export class CartService {
  constructor(private readonly jsonHandler: JsonHandlerService) {}

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

    nuevoProducto.quantity = Math.floor(quantity);
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

    const productoExistente = carritoUsuario.products.find(
      (p) => p.product.number === normalizedProduct.number,
    );

    if (productoExistente) {
      productoExistente.quantity += nuevoProducto.quantity;
    } else {
      carritoUsuario.products.push(nuevoProducto);
    }

    try {
      await this.jsonHandler.writeData('cart', carritos);
    } catch (err) {
      throw new InternalServerErrorException('Error al guardar el carrito');
    }

    return carritoUsuario;
  }
}