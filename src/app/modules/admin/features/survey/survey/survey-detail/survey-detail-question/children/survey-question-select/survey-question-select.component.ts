import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from "@modules/shared/shared.module";
import { TextFieldModule } from '@angular/cdk/text-field';
import { SurveyQuestion, SurveyQuestionExtend } from '@modules/shared/models/survey-question';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EditableTextComponent } from "../../editable-text/editable-text.component";
import { NotificationService } from '@core/services/notification.service';
import { SurveyQuestionService } from '@modules/shared/services/survey-question.service';


@Component({
  selector: 'app-survey-question-select',
  standalone: true,
  imports: [CommonModule, SharedModule, TextFieldModule, FormsModule, EditableTextComponent],
  templateUrl: './survey-question-select.component.html',
  styleUrls: ['./survey-question-select.component.css']
})
export class SurveyQuestionSelectComponent implements OnInit {

  constructor(private noitifi: NotificationService,
    private surveysQuestionService: SurveyQuestionService,
  ) { }

  @Input() questionParams!: SurveyQuestionExtend;
  @Output() questionParamsChange = new EventEmitter<SurveyQuestionExtend>();

  question: SurveyQuestionExtend;

  ngOnInit(): void {
    this.question = this.questionParams;
  }

  addAnswer(): void {
    const id = (this.question.answer_options.length + 1).toString();
    this.question.answer_options.push({ id: id, label: '' });
  }


  delAnswer(id: string): void {
    this.noitifi.confirmDelete().then(
      (a) => {
        if (a) {
          this.question.answer_options = this.question.answer_options.filter((item) => item.id != id);
          this.question.answer_options = this.surveysQuestionService.sortIdAnswer(this.question.answer_options);
        }
      },
      () => null
    );
  }

  updateQuestion(data: SurveyQuestionExtend) {
    this.questionParams = data;
    this.questionParamsChange.emit(this.questionParams);
  }


}