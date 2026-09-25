import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThongTinCoBanComponent } from './thong-tin-co-ban.component';

describe('ThongTinCoBanComponent', () => {
  let component: ThongTinCoBanComponent;
  let fixture: ComponentFixture<ThongTinCoBanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThongTinCoBanComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThongTinCoBanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
