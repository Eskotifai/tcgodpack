import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class AuthService {
  constructor(private readonly profileService: ProfileService) {}

  async login(username: string, password: string): Promise<{ token: string; role: string }> {
    const usuario = await this.profileService.obtenerPorUsuario(username);

    if (!usuario || usuario.password !== password) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    const token = Buffer.from(`${usuario.username}:${usuario.role}`).toString('base64');
    return { 
      token,
      role: usuario.role
     };
  }
}
