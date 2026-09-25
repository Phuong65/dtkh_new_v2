import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LichGiangDayComponent } from './lich-giang-day.component';

describe('LichGiangDayComponent', () => {
  let component: LichGiangDayComponent;
  let fixture: ComponentFixture<LichGiangDayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ LichGiangDayComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LichGiangDayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

