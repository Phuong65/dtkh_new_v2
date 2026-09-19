import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestQuestionImportV2Component } from './test-question-import-v2.component';

describe('TestQuestionImportV2Component', () => {
  let component: TestQuestionImportV2Component;
  let fixture: ComponentFixture<TestQuestionImportV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestQuestionImportV2Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestQuestionImportV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
