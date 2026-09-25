import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CauhoiKetthucHocphanComponent } from './cauhoi-ketthuc-hocphan.component';

describe('CauhoiKetthucHocphanComponent', () => {
  let component: CauhoiKetthucHocphanComponent;
  let fixture: ComponentFixture<CauhoiKetthucHocphanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CauhoiKetthucHocphanComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CauhoiKetthucHocphanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

