import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { TestQuestionReviewV2Component } from './test-question-review-v2.component';

describe('TestQuestionReviewV2Component', () => {
  let component: TestQuestionReviewV2Component;
  let fixture: ComponentFixture<TestQuestionReviewV2Component>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestQuestionReviewV2Component],
      providers: [
        { provide: AuthService, useValue: { accessToken: 'token' } },
        { provide: HelperService, useValue: { sort: (items: any[]) => items } }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestQuestionReviewV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render p-chip elements for inputbox questions', () => {
    component.convertQuestion([
      {
        id: 1,
        group_id: 0,
        part: 1,
        question_direction: 'Part 1',
        children: []
      },
      {
        id: 2,
        group_id: 1,
        question_number: 1,
        question_direction: 'Fill in the blank',
        question_type: 'inputbox',
        answer_correct: 'alpha|beta',
        answer_option: null,
        config: { cols: 1, invertedAnswer: false }
      }
    ]);
    fixture.detectChanges();

    const chips = fixture.nativeElement.querySelectorAll('p-chip');
    expect(chips.length).toBe(2);
    expect(chips[0].textContent).toContain('alpha');
    expect(chips[1].textContent).toContain('beta');
  });
});
