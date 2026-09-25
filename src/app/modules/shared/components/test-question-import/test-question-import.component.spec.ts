import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelperService } from '@core/services/helper.service';

import { TestQuestionImportComponent } from './test-question-import.component';

describe('TestQuestionImportComponent', () => {
  let component: TestQuestionImportComponent;
  let fixture: ComponentFixture<TestQuestionImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestQuestionImportComponent],
      providers: [
        { provide: HelperService, useValue: {} }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestQuestionImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
