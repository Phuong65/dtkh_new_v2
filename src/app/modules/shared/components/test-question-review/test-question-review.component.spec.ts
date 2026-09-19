import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestQuestionReviewComponent } from './test-question-review.component';

describe('TestQuestionReviewComponent', () => {
  let component: TestQuestionReviewComponent;
  let fixture: ComponentFixture<TestQuestionReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestQuestionReviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestQuestionReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
