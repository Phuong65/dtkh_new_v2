import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OvicGroupsRadioV2Component } from './ovic-groups-radio-v2.component';

describe('OvicGroupsRadioV2Component', () => {
  let component: OvicGroupsRadioV2Component;
  let fixture: ComponentFixture<OvicGroupsRadioV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OvicGroupsRadioV2Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OvicGroupsRadioV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
