import { Injectable } from '@nestjs/common';
import { Product } from './product.model';
import { JsonHandlerService } from '../shared/json-handler/json-handler.service';

@Injectable()
export class ProductsService {
  // 1. Usamos Inyección de Dependencias a través del constructor
  constructor(private readonly jsonHandler: JsonHandlerService) {}

  async obtenerTodosProductos(): Promise<Product[]> {
    // 2. Le pedimos los datos al manejador usando el nombre correcto: 'products'
    return this.jsonHandler.readData<Product>('product');
  }

  async obtenerPorNumero(number: number): Promise<Product | undefined> {
    // 3. Reutilizamos obtenerTodosProductos() en lugar del antiguo obtenerTodos()
    const productos = await this.obtenerTodosProductos();
    return productos.find((producto) => producto.number === number);
  }

  async buscarPorNombre(name: string): Promise<Product[]> {
    const productos = await this.obtenerTodosProductos();
    return productos.filter((producto) =>
      producto.name.toLowerCase().includes(name.toLowerCase()),
    );
  }

  async crearProducto(product: Product): Promise<Product> {
    const name = String(product.name ?? '').trim();
    const number = Number(product.number);
    const price = Number(product.price);
    const available = Number(product.available);
    const imageUrl = String(product.imageUrl ?? '').trim();

    if (!name) throw new Error('name is required');
    if (!Number.isFinite(number) || number <= 0)
      throw new Error('number must be a positive number');
    if (!Number.isFinite(price) || price < 0)
      throw new Error('price must be a non-negative number');
    if (!Number.isFinite(available) || available < 0)
      throw new Error('available must be a non-negative number');
    if (!imageUrl) throw new Error('imageUrl is required');

    const productos = await this.obtenerTodosProductos();
    if (productos.some((item) => item.number === number)) {
      throw new Error('A product with that number already exists');
    }

    const nuevoProducto = new Product(
      name,
      Math.floor(number),
      price,
      Math.floor(available),
      imageUrl,
    );

    productos.push(nuevoProducto);
    
    // 4. Escribimos los datos usando nuestra herramienta centralizada y el nombre plural
    await this.jsonHandler.writeData('product', productos);
    
    return nuevoProducto;
  }
}
