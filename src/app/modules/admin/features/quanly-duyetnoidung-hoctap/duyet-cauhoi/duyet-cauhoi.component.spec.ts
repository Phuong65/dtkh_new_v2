import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DuyetCauhoiComponent } from './duyet-cauhoi.component';

describe('DuyetCauhoiComponent', () => {
  let component: DuyetCauhoiComponent;
  let fixture: ComponentFixture<DuyetCauhoiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DuyetCauhoiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DuyetCauhoiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
