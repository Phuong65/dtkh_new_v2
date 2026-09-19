import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IctuFacultyReporterComponent } from './ictu-faculty-reporter.component';

describe('IctuFacultyReporterComponent', () => {
  let component: IctuFacultyReporterComponent;
  let fixture: ComponentFixture<IctuFacultyReporterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ IctuFacultyReporterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IctuFacultyReporterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
