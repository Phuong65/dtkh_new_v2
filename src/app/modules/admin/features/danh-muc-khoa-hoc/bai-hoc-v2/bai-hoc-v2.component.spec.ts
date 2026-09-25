import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaiHocV2Component } from './bai-hoc-v2.component';

describe('BaiHocV2Component', () => {
  let component: BaiHocV2Component;
  let fixture: ComponentFixture<BaiHocV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BaiHocV2Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BaiHocV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


