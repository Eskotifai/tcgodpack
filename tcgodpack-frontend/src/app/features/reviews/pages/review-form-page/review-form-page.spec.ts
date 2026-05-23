import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewFormPage } from './review-form-page';

describe('ReviewFormPage', () => {
  let component: ReviewFormPage;
  let fixture: ComponentFixture<ReviewFormPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewFormPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewFormPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
