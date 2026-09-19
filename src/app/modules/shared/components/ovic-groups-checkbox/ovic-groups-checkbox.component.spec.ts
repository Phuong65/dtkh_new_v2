import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OvicGroupsCheckboxComponent } from './ovic-groups-checkbox.component';

describe('OvicGroupsCheckboxComponent', () => {
  let component: OvicGroupsCheckboxComponent;
  let fixture: ComponentFixture<OvicGroupsCheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OvicGroupsCheckboxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OvicGroupsCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
