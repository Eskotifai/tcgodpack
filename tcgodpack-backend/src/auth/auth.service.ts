import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class AuthService {
  constructor(private readonly profileService: ProfileService) {}

  
  async login(email: string, password: string): Promise<{ token: string; role: string }> {
    
    // Buscamos en el archivo JSON usando el email directamente
    const usuario = await this.profileService.obtenerPorCorreo(email);

    // Si el usuario no existe o la contraseña no coincide, rebotamos con un 401
    if (!usuario || usuario.password !== password) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }
    
    const token = Buffer.from(`${usuario.email}:${usuario.role}`).toString('base64');
    
    return { 
      token,
      role: usuario.role
    };
  }
}
