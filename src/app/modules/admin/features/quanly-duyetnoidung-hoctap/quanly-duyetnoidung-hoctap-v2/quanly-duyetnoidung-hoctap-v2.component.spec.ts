import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuanlyDuyetnoidungHoctapV2Component } from './quanly-duyetnoidung-hoctap-v2.component';

describe('QuanlyDuyetnoidungHoctapV2Component', () => {
  let component: QuanlyDuyetnoidungHoctapV2Component;
  let fixture: ComponentFixture<QuanlyDuyetnoidungHoctapV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuanlyDuyetnoidungHoctapV2Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuanlyDuyetnoidungHoctapV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
