import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';

import { TestQuestionReviewComponent } from './test-question-review.component';

describe('TestQuestionReviewComponent', () => {
  let component: TestQuestionReviewComponent;
  let fixture: ComponentFixture<TestQuestionReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestQuestionReviewComponent],
      providers: [
        { provide: AuthService, useValue: { accessToken: '' } },
        { provide: HelperService, useValue: { sort: (items: unknown[]) => [...items] } }
      ],
      errorOnUnknownElements: true,
      errorOnUnknownProperties: true
    }).compileComponents();

    fixture = TestBed.createComponent(TestQuestionReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render the empty state', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Không có câu hỏi nào');
  });

  for (const questionType of ['radio', 'checkbox']) {
    it(`should render disabled ${questionType} answers through the real standalone template`, () => {
      fixture.componentRef.setInput('questions', [
        { id: 10, group_id: 0, part: 1, question_direction: 'Sample direction' },
        {
          id: 11, group_id: 10, part: 1, question_number: 1,
          question_direction: 'Choose an answer', question_type: questionType,
          answer_correct: '1',
          answer_option: [{ id: '1', value: 'Alpha' }, { id: '2', value: 'Beta' }]
        }
      ]);
      fixture.detectChanges();

      const selector = questionType === 'radio' ? 'ovic-groups-radio-v2' : 'ovic-groups-checkbox';
      const answers = fixture.nativeElement.querySelector(selector) as HTMLElement;
      expect(answers).toBeTruthy();
      expect(answers.textContent).toContain('Alpha');
      expect(answers.textContent).toContain('Beta');
      if (questionType === 'radio') {
        const inputs = Array.from(answers.querySelectorAll('input[type="radio"]')) as HTMLInputElement[];
        expect(inputs.length).toBe(2);
        expect(inputs[0].checked).toBeTrue();
      } else {
        const buttons = Array.from(answers.querySelectorAll('button')) as HTMLButtonElement[];
        expect(buttons.length).toBe(2);
        expect(buttons.every(button => button.disabled)).toBeTrue();
      }
    });
  }
});
