import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuanlyKehoachHoctapComponent } from './quanly-kehoach-hoctap.component';

describe('QuanlyKehoachHoctapComponent', () => {
  let component: QuanlyKehoachHoctapComponent;
  let fixture: ComponentFixture<QuanlyKehoachHoctapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ QuanlyKehoachHoctapComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuanlyKehoachHoctapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

