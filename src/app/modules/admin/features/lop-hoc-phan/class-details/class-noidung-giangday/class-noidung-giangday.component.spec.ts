import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassNoidungGiangdayComponent } from './class-noidung-giangday.component';

describe('ClassNoidungGiangdayComponent', () => {
  let component: ClassNoidungGiangdayComponent;
  let fixture: ComponentFixture<ClassNoidungGiangdayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClassNoidungGiangdayComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassNoidungGiangdayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


