import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionTypeRadioComponent } from './question-type-radio/question-type-radio.component';
import { GroupingQuestionComponent } from '@modules/admin/features/cauhoi-tracnghiem/question-types/grouping-question/grouping-question.component';
import { DragAndDropQuestionComponent } from '@modules/admin/features/cauhoi-tracnghiem/question-types/drag-and-drop-question/drag-and-drop-question.component';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { GroupRadioQuestionComponent } from './group-radio-question/group-radio-question.component';
import { GroupInputQuestionComponent } from './group-input-question/group-input-question.component';
import { QuestionTypeInputBoxComponent } from './question-type-input-box/question-type-input-box.component';
import { QuestionTypeReorderWordsComponent } from './question-type-reorder-words/question-type-reorder-words.component';
import { QuestionTypeRadioEditorComponent } from './question-type-radio-editor/question-type-radio-editor.component';
import { InputQuestionDirectionComponent } from '@modules/admin/features/cauhoi-tracnghiem/input-question-direction/input-question-direction.component';
import { SafeHtmlSinglePipe } from '@modules/shared/pipes/safe-html-single.pipe';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { QuestionTypeArrangeParagraphsComponent } from './question-type-arrange-paragraphs/question-type-arrange-paragraphs.component';
import { SharedModule } from "@shared/shared.module";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { KatexImgDirective } from "@modules/shared/directives/katex-img.directive";
import { GroupRadioQuestionV2Component } from './group-radio-question-v2/group-radio-question-v2.component';

@NgModule({
	declarations: [
		DragAndDropQuestionComponent,
		GroupingQuestionComponent,
		QuestionTypeRadioComponent,
		GroupRadioQuestionComponent,
		GroupInputQuestionComponent,
		QuestionTypeInputBoxComponent,
		QuestionTypeReorderWordsComponent,
		QuestionTypeRadioEditorComponent,
		QuestionTypeArrangeParagraphsComponent,
		GroupRadioQuestionV2Component
	],
	exports: [
		DragAndDropQuestionComponent,
		GroupingQuestionComponent,
		QuestionTypeRadioComponent,
		GroupRadioQuestionComponent,
		GroupInputQuestionComponent,
		QuestionTypeInputBoxComponent,
		QuestionTypeReorderWordsComponent,
		QuestionTypeRadioEditorComponent,
		QuestionTypeArrangeParagraphsComponent,
		GroupRadioQuestionV2Component
	],
	imports: [
		CommonModule,
		InputTextModule,
		FormsModule,
		TextareaModule,
		ButtonModule,
		RippleModule,
		SelectModule,
		CheckboxModule,
		TooltipModule,
		LoadMediaOnTextDirective,
		SafeHtmlSinglePipe,
		InputQuestionDirectionComponent,
		SharedModule,
		DragDropModule,
		KatexImgDirective,
	]
})
export class QuestionTypesModule { }