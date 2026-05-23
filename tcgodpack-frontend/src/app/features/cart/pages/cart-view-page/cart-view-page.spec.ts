import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartViewPage } from './cart-view-page';

describe('CartViewPage', () => {
  let component: CartViewPage;
  let fixture: ComponentFixture<CartViewPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartViewPage],
    }).compileComponents();

    fixture = TestBed.createComponent(CartViewPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
