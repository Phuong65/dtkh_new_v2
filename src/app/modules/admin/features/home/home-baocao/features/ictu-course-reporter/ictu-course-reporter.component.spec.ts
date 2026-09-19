import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IctuCourseReporterComponent } from './ictu-course-reporter.component';

describe('IctuCourseReporterComponent', () => {
  let component: IctuCourseReporterComponent;
  let fixture: ComponentFixture<IctuCourseReporterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ IctuCourseReporterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IctuCourseReporterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
