import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuanlydeComponent } from './quanlyde.component';

describe('QuanlydeComponent', () => {
  let component: QuanlydeComponent;
  let fixture: ComponentFixture<QuanlydeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuanlydeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuanlydeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
