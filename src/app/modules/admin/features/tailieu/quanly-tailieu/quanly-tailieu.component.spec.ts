import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuanlyTailieuComponent } from './quanly-tailieu.component';

describe('QuanlyTailieuComponent', () => {
  let component: QuanlyTailieuComponent;
  let fixture: ComponentFixture<QuanlyTailieuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ QuanlyTailieuComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuanlyTailieuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

