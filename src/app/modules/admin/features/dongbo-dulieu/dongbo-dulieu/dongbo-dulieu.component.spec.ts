import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DongboDulieuComponent } from './dongbo-dulieu.component';

describe('DongboDulieuComponent', () => {
  let component: DongboDulieuComponent;
  let fixture: ComponentFixture<DongboDulieuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DongboDulieuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DongboDulieuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
