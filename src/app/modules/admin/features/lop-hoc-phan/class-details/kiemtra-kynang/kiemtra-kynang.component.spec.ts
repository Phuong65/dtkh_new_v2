import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KiemtraKynangComponent } from './kiemtra-kynang.component';

describe('KiemtraKynangComponent', () => {
  let component: KiemtraKynangComponent;
  let fixture: ComponentFixture<KiemtraKynangComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ KiemtraKynangComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KiemtraKynangComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

