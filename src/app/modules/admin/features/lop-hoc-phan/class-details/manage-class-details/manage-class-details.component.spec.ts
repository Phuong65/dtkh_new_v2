import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageClassDetailsComponent } from './manage-class-details.component';

describe('ManageClassDetailsComponent', () => {
  let component: ManageClassDetailsComponent;
  let fixture: ComponentFixture<ManageClassDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ManageClassDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageClassDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
