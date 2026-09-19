import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThuongxuyenTuluanComponent } from './thuongxuyen-tuluan.component';

describe('ThuongxuyenTuluanComponent', () => {
  let component: ThuongxuyenTuluanComponent;
  let fixture: ComponentFixture<ThuongxuyenTuluanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThuongxuyenTuluanComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThuongxuyenTuluanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
