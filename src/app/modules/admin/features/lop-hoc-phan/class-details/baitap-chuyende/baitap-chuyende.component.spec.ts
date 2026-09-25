import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaitapChuyendeComponent } from './baitap-chuyende.component';

describe('BaitapChuyendeComponent', () => {
  let component: BaitapChuyendeComponent;
  let fixture: ComponentFixture<BaitapChuyendeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ BaitapChuyendeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BaitapChuyendeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

