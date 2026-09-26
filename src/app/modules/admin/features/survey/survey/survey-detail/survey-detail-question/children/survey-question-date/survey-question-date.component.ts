import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from "@modules/shared/shared.module";
import { TextFieldModule } from '@angular/cdk/text-field';
import { SurveyQuestion } from '@modules/shared/models/survey-question';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EditableTextComponent } from "../../editable-text/editable-text.component";
import { NotificationService } from '@core/services/notification.service';
import { SurveyQuestionService } from '@modules/shared/services/survey-question.service';


@Component({
  selector: 'app-survey-question-date',
  standalone: true,
  imports: [CommonModule, SharedModule, TextFieldModule, FormsModule, EditableTextComponent],
  templateUrl: './survey-question-date.component.html',
  styleUrls: ['./survey-question-date.component.css']
})
export class SurveyQuestionDateComponent implements OnInit {
  private noitifi = inject(NotificationService);
  private surveysQuestionService = inject(SurveyQuestionService);

  @Input() questionParams!: SurveyQuestion;
  @Output() questionParamsChange = new EventEmitter<SurveyQuestion>();

  question: SurveyQuestion;

  ngOnInit(): void {
    this.question = this.questionParams;
  }

  updateQuestion(data: SurveyQuestion) {
    this.questionParams = data;
    this.questionParamsChange.emit(this.questionParams);
  }


}