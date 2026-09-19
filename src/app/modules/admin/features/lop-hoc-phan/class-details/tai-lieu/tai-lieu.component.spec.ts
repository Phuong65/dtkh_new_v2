import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaiLieuComponent } from './tai-lieu.component';

describe('TaiLieuComponent', () => {
  let component: TaiLieuComponent;
  let fixture: ComponentFixture<TaiLieuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TaiLieuComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaiLieuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
