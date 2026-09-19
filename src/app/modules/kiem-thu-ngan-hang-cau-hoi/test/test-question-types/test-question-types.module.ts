import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionTypeGroupingComponent } from './components/question-type-grouping/question-type-grouping.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SafeHtmlPipe } from '@app/modules/kiem-thu-ngan-hang-cau-hoi/pipes/safe-html.pipe';
import { IctuQuestionValuePipe } from '@app/modules/kiem-thu-ngan-hang-cau-hoi/pipes/ictu-question-value.pipe';
import { QuestionTypeRadioComponent } from './components/question-type-radio/question-type-radio.component';
import { QuestionTypeGroupRadioComponent } from './components/question-type-group-radio/question-type-group-radio.component';
import { QuestionTypeGroupInputComponent } from './components/question-type-group-input/question-type-group-input.component';
import { QuestionTypeInputBoxComponent } from './components/question-type-input-box/question-type-input-box.component';
import { QuestionTypeCheckBoxComponent } from './components/question-type-check-box/question-type-check-box.component';
import { QuestionTypeReorderWordsComponent } from './components/question-type-reorder-words/question-type-reorder-words.component';
import { QuestionTypeSelectBoxComponent } from './components/question-type-select-box/question-type-select-box.component';
import { QuestionTypeDragDropComponent } from './components/question-type-drag-drop/question-type-drag-drop.component';
import { GeneralModule } from '@app/modules/kiem-thu-ngan-hang-cau-hoi/general/general.module';
import { MatRadioModule } from '@angular/material/radio';
import { InputTextModule } from 'primeng/inputtext';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { IctuValueCorrectAnswerPipe } from '@modules/kiem-thu-ngan-hang-cau-hoi/pipes/ictu-value-correct-answer.pipe';
import { QuestionTypeReorderWords2Component } from '@modules/kiem-thu-ngan-hang-cau-hoi/test/test-question-types/components/question-type-reorder-words-2/question-type-reorder-words-2.component';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { QuestionTypeArrangeParagraphsComponent } from './components/question-type-arrange-paragraphs/question-type-arrange-paragraphs.component';

@NgModule( {
	declarations : [
		QuestionTypeGroupingComponent ,
		QuestionTypeRadioComponent ,
		QuestionTypeGroupRadioComponent ,
		QuestionTypeGroupInputComponent ,
		QuestionTypeInputBoxComponent ,
		QuestionTypeCheckBoxComponent ,
		QuestionTypeReorderWordsComponent ,
		QuestionTypeReorderWords2Component ,
		QuestionTypeSelectBoxComponent ,
		QuestionTypeDragDropComponent ,
		QuestionTypeArrangeParagraphsComponent
	] ,
	exports      : [
		QuestionTypeGroupingComponent ,
		QuestionTypeRadioComponent ,
		QuestionTypeGroupRadioComponent ,
		QuestionTypeGroupInputComponent ,
		QuestionTypeInputBoxComponent ,
		QuestionTypeCheckBoxComponent ,
		QuestionTypeReorderWordsComponent ,
		QuestionTypeReorderWords2Component ,
		QuestionTypeSelectBoxComponent ,
		QuestionTypeDragDropComponent ,
		QuestionTypeArrangeParagraphsComponent
	] ,
	imports      : [
		CommonModule ,
		SafeHtmlPipe ,
		IctuQuestionValuePipe ,
		GeneralModule ,
		MatRadioModule ,
		LoadMediaOnTextDirective ,
		InputTextModule ,
		MatOptionModule ,
		MatSelectModule ,
		DragDropModule ,
		IctuValueCorrectAnswerPipe
	]
} )
export class TestQuestionTypesModule {}
