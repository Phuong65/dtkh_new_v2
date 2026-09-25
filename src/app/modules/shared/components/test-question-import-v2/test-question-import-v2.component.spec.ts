import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';

import { TestQuestionImportV2Component } from './test-question-import-v2.component';

describe('TestQuestionImportV2Component', () => {
  let component: TestQuestionImportV2Component;
  let fixture: ComponentFixture<TestQuestionImportV2Component>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestQuestionImportV2Component],
      providers: [
        { provide: HelperService, useValue: { convertFileFromBase64: () => null } },
        { provide: NotificationService, useValue: {} }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestQuestionImportV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add new chip tokens safely without duplicate and preserve immutability', () => {
    const original: string[] = ['answer1'];
    const next = component.onAddChips({ value: 'answer2' }, original);
    expect(original[0]).toBe('answer1');
    expect(original.length).toBe(1);
    expect(next[0]).toBe('answer1|answer2');

    // Duplicate should not be added
    const noDup = component.onAddChips({ value: 'answer2' }, next);
    expect(noDup[0]).toBe('answer1|answer2');
  });

  it('should remove chip token safely and return a new array', () => {
    const original = ['answer1|answer2|answer3'];
    const updated = component.onRemoveChips({ value: 'answer2' }, original);
    expect(original[0]).toBe('answer1|answer2|answer3');
    expect(updated[0]).toBe('answer1|answer3');
  });

  it('should interactively add and remove chips via UI elements', () => {
    component.hasContent = true;
    component.questionImport = [
      {
        part: 10,
        group_id: 0,
        question_type: 'inputbox',
        question_direction: 'Direction',
        answer_option: [],
        children: [
          {
            part: 10,
            group_id: 1,
            question_number: 1,
            question_direction: 'Fill word',
            question_type: 'inputbox',
            answer_correct: ['apple|banana'],
            answer_option: [],
            config: { cols: 1, invertedAnswer: false }
          }
        ]
      }
    ];
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[placeholder="Thêm đáp án..."]') as HTMLInputElement;
    const addButton = fixture.nativeElement.querySelector('.lesson-answer-input button') as HTMLButtonElement;
    expect(input).toBeTruthy();
    expect(addButton).toBeTruthy();

    input.value = 'cherry';
    addButton.click();
    fixture.detectChanges();

    let chips = fixture.nativeElement.querySelectorAll('p-chip');
    expect(chips.length).toBe(3);
    expect(chips[2].textContent).toContain('cherry');
  });

  it('should render chips for inputbox questions', () => {
    component.hasContent = true;
    component.questionImport = [
      {
        part: 10,
        group_id: 0,
        question_type: 'inputbox',
        question_direction: 'Direction',
        answer_option: [],
        children: [
          {
            part: 10,
            group_id: 1,
            question_number: 1,
            question_direction: 'Fill word',
            question_type: 'inputbox',
            answer_correct: ['apple|banana'],
            answer_option: [],
            config: { cols: 1, invertedAnswer: false }
          }
        ]
      }
    ];
    fixture.detectChanges();

    const chips = fixture.nativeElement.querySelectorAll('p-chip');
    expect(chips.length).toBe(2);
    expect(chips[0].textContent).toContain('apple');
    expect(chips[1].textContent).toContain('banana');
  });
});
