import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DongboDulieuMainComponent } from './dongbo-dulieu-main.component';

describe('DongboDulieuMainComponent', () => {
  let component: DongboDulieuMainComponent;
  let fixture: ComponentFixture<DongboDulieuMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ DongboDulieuMainComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DongboDulieuMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

