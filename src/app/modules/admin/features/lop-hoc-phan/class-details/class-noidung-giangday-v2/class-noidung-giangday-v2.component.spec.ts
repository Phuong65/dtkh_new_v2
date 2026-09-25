import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassNoidungGiangdayV2Component } from './class-noidung-giangday-v2.component';

describe('ClassNoidungGiangdayV2Component', () => {
  let component: ClassNoidungGiangdayV2Component;
  let fixture: ComponentFixture<ClassNoidungGiangdayV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ClassNoidungGiangdayV2Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassNoidungGiangdayV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

