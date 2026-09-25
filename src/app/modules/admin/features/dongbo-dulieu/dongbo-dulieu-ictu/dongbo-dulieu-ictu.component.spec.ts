import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DongboDulieuIctuComponent } from './dongbo-dulieu-ictu.component';

describe('DongboDulieuIctuComponent', () => {
  let component: DongboDulieuIctuComponent;
  let fixture: ComponentFixture<DongboDulieuIctuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DongboDulieuIctuComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DongboDulieuIctuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
