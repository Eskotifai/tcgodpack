import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogListPage } from './catalog-list-page';

describe('CatalogListPage', () => {
  let component: CatalogListPage;
  let fixture: ComponentFixture<CatalogListPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogListPage],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogListPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
