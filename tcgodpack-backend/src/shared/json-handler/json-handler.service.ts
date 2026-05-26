import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class JsonHandlerService {
  private readonly dataDir = path.resolve(process.cwd(), 'data');
  
  // Mapa de colas: Creamos una cola independiente para cada archivo (.json)
  // Así, guardar un producto no bloquea el guardado de un usuario
  private writeQueues: Map<string, Promise<void>> = new Map();

  async readData<T>(fileName: string): Promise<T[]> {
    try {
      const filePath = path.join(this.dataDir, `${fileName}.json`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent) as T[];
    } catch {
      return []; // Si no existe o hay error, devuelve un arreglo vacío
    }
  }

  // Logica de guardado con colas por archivo (writeData)
  async writeData<T>(fileName: string, data: T[]): Promise<boolean> {
    const filePath = path.join(this.dataDir, `${fileName}.json`);
    
    // Obtenemos la cola actual de ese archivo específico, o creamos una nueva
    let currentQueue = this.writeQueues.get(fileName) || Promise.resolve();

    // Encolamos la nueva escritura (enqueueWrite de George)
    currentQueue = currentQueue.then(
      () => this.doAtomicWrite(filePath, data),
      () => this.doAtomicWrite(filePath, data) // Si la anterior falló, intentamos igual
    );

    // Actualizamos la cola en el mapa
    this.writeQueues.set(fileName, currentQueue);
    
    // Esperamos a que termine esta escritura
    await currentQueue;
    return true;
  }

  // La escritura segura de George (doAtomicWrite)
  private async doAtomicWrite<T>(filePath: string, data: T[]): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      const tmpPath = filePath + '.tmp';
      // Escribe en un archivo temporal primero
      await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
      // Lo renombra de golpe (atómico)
      await fs.rename(tmpPath, filePath);
    } catch (error) {
      console.error(`Error escribiendo en ${filePath}:`, error);
      throw new InternalServerErrorException('Error al guardar los datos');
    }
  }
}
