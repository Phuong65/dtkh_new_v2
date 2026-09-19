import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestQuestionImportComponent } from './test-question-import.component';

describe('TestQuestionImportComponent', () => {
  let component: TestQuestionImportComponent;
  let fixture: ComponentFixture<TestQuestionImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestQuestionImportComponent ]
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
