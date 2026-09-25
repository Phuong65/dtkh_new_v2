import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThongtinGiangvienkhacComponent } from './thongtin-giangvienkhac.component';

describe('ThongtinGiangvienkhacComponent', () => {
  let component: ThongtinGiangvienkhacComponent;
  let fixture: ComponentFixture<ThongtinGiangvienkhacComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ThongtinGiangvienkhacComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThongtinGiangvienkhacComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

