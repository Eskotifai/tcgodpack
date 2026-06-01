import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  constructor(private router: Router) {}

  goTo(path: string) {
    // prevent full page reloads
    this.router.navigateByUrl(path);
  }

  goHome() {
    this.router.navigateByUrl('/');
  }
}
