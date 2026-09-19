import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestQuestionReviewV2Component } from './test-question-review-v2.component';

describe('TestQuestionReviewV2Component', () => {
  let component: TestQuestionReviewV2Component;
  let fixture: ComponentFixture<TestQuestionReviewV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestQuestionReviewV2Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestQuestionReviewV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
