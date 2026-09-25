import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SinhvienCathiComponent } from './sinhvien-cathi.component';

describe('SinhvienCathiComponent', () => {
  let component: SinhvienCathiComponent;
  let fixture: ComponentFixture<SinhvienCathiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ SinhvienCathiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SinhvienCathiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

