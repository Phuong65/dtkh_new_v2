import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { NgxDocViewerModule } from 'ngx-doc-viewer';

import { OvicFlexibleTableComponent } from '@shared/components/ovic-flexible-table/ovic-flexible-table.component';
import { OvicDropdownComponent } from '@shared/components/ovic-dropdown/ovic-dropdown.component';
import { OvicAudioPlayerComponent } from '@shared/components/ovic-audio-player/ovic-audio-player.component';
import { OvicIconPickerComponent } from '@shared/components/ovic-icon-picker/ovic-icon-picker.component';
import { OvicTableComponent } from '@shared/components/ovic-table/ovic-table.component';
import { OvicDatePickerComponent } from '@shared/components/ovic-date-picker/ovic-date-picker.component';
import { OvicPreviewComponent } from '@shared/components/ovic-preview/ovic-preview.component';
import { OvicMultiSelectComponent } from '@shared/components/ovic-multi-select/ovic-multi-select.component';
import { OvicProgressComponent } from '@shared/components/ovic-progress/ovic-progress.component';
import { OvicDataPickerComponent } from '@shared/components/ovic-data-picker/ovic-data-picker.component';
import { OvicCurrencyInputComponent } from '@shared/components/ovic-currency-input/ovic-currency-input.component';
import { OvicFileManagerComponent } from '@shared/components/ovic-file-manager/ovic-file-manager.component';
import { OvicGroupsRadioComponent } from '@shared/components/ovic-groups-radio/ovic-groups-radio.component';
import { OvicRatingComponent } from '@shared/components/ovic-rating/ovic-rating.component';
import { OvicPercentagesTableComponent } from '@shared/components/ovic-percentages-table/ovic-percentages-table.component';
import { OvicQuestionsComponent } from '@shared/components/ovic-questions/ovic-questions.component';
import { OvicNavigationComponent } from '@shared/components/ovic-navigation/ovic-navigation.component';
import { OvicVideoPlayerComponent } from '@shared/components/ovic-video-player/ovic-video-player.component';
import { OvicInputBoxComponent } from '@shared/components/ovic-input-box/ovic-input-box.component';
import { OvicFileListComponent } from '@shared/components/ovic-file-list/ovic-file-list.component';
import { OvicFileDetailComponent } from '@shared/components/ovic-file-detail/ovic-file-detail.component';
import { OvicFileExplorerComponent } from '@shared/components/ovic-file-explorer/ovic-file-explorer.component';
import { OvicRecorderComponent } from '@shared/components/ovic-recorder/ovic-recorder.component';
import { OvicTextareaComponent } from '@shared/components/ovic-textarea/ovic-textarea.component';
import { OvicEditorComponent } from '@shared/components/ovic-editor/ovic-editor.component';
import { OvicDocumentListComponent } from '@shared/components/ovic-document-list/ovic-document-list.component';
import { OvicDocumentViewerComponent } from '@shared/components/ovic-document-viewer/ovic-document-viewer.component';
import { OvicDownloadProgressComponent } from '@shared/components/ovic-download-progress/ovic-download-progress.component';
import { OvicPersonalFileExplorerComponent } from '@shared/components/ovic-personal-file-explorer/ovic-personal-file-explorer.component';
import { OvicPreviewSingleGoogleDriveFileComponent } from '@shared/components/ovic-preview-single-google-drive-file/ovic-preview-single-google-drive-file.component';
import { OvicDocumentDownloaderComponent } from '@shared/components/ovic-document-downloader/ovic-document-downloader.component';
import { OvicPreviewFileFullsizeComponent } from '@shared/components/ovic-preview-file-fullsize/ovic-preview-file-fullsize.component';
import { OvicMediaPlayerComponent } from '@shared/components/ovic-media-player/ovic-media-player.component';
import { OvicRightContentMenuComponent } from '@shared/components/ovic-right-content-menu/ovic-right-content-menu.component';
import { OvicAvatarMakerComponent } from '@shared/components/ovic-avatar-maker/ovic-avatar-maker.component';

import { OvicFileNamePipe } from '@shared/pipes/ovic-file-name.pipe';
import { OvicFileExtensionPipe } from '@shared/pipes/ovic-file-extension.pipe';
import { OvicTimerMmSsPipe } from '@shared/pipes/ovic-timer-mm-ss.pipe';
import { OvicDateTimePipe } from '@shared/pipes/ovic-date-time.pipe';
import { OvicTimePipe } from '@shared/pipes/ovic-time.pipe';
import { OvicFileIconPipe } from '@shared/pipes/ovic-file-icon.pipe';
import { OvicDatePipe } from '@shared/pipes/ovic-date.pipe';
import { FileTypePipe } from '@shared/pipes/file-type.pipe';
import { OvicFileSizePipe } from '@shared/pipes/ovic-file-size.pipe';
import { OvicSafeUrlPipe } from '@shared/pipes/ovic-safe-url.pipe';
import { OvicFileShareStatePipe } from '@shared/pipes/ovic-file-share-state.pipe';
import { OvicSafeResourceUrlPipe } from '@shared/pipes/ovic-safe-resource-url.pipe';
import { OvicSafeHtmlPipe } from '@shared/pipes/ovic-safe-html.pipe';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';
import { PipeCheckImg } from '@shared/pipes/pipe-check-img';
import { RawHtmlPipe } from '@shared/pipes/innerhtml-raw-pipe';
import { SafeHtmlDecodePipe } from '@shared/pipes/safe-html-decode';
import { ShowLabelData } from '@shared/pipes/show-label-data.pipe';
import { FocusInputPipe } from '@shared/pipes/focus-input.pipe';

import { OvicYoutubeThumbnailDirective } from '@shared/directives/ovic-youtube-thumbnail.directive';
import { OvicVideoAspectRatio16x9Directive } from '@shared/directives/ovic-video-aspect-ratio16x9.directive';
import { OvicLoaderDirective } from '@shared/directives/ovic-loader.directive';
import { OvicEditorDirective } from '@shared/directives/ovic-editor.directive';
import { OvicDropAndDragDirective } from '@shared/directives/ovic-drop-and-drag.directive';
import { OvicMediaLoaderDirective } from '@shared/directives/ovic-media-loader.directive';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MultiSelectModule } from 'primeng/multiselect';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ImageCropperModule } from 'ngx-image-cropper';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { BindCssVariablesDirective } from './directives/bind-css-variables.directive';
import { OvicLoggerDirective } from './directives/ovic-logger.directive';
import { SideFiltersComponent } from './components/side-filters/side-filters.component';
import { OvicDateInputComponent } from './components/ovic-date-input/ovic-date-input.component';
import { InputMaskModule } from 'primeng/inputmask';
import { OvicFlexibleTableNewComponent } from './components/ovic-flexible-table-new/ovic-flexible-table-new.component';
import { PaginatorModule } from 'primeng/paginator';
import { OvicInputAddressFourLayoutsComponent } from './components/ovic-input-address-four-layouts/ovic-input-address-four-layouts.component';
import { OvicDateToUtcPipe } from './pipes/ovic-date-to-utc.pipe';
import { OvicLazyLoadDirective } from './directives/ovic-lazy-load.directive';
import { FileListLocalComponent } from './components/file-list-local/file-list-local.component';
import { FileListLocalOnTableComponent } from './components/file-list-local-on-table/file-list-local-on-table.component';
import { GetUserinfoDirective } from './directives/get-userinfo.directive';
import { CustomOvicTooltipDirective } from './directives/custom-ovic-tooltip.directive';
import { OvicPlyrDirective } from './directives/ovic-plyr.directive';
import { NgxViewerDirective } from './directives/ngx-viewer.directive';


import { OpenFileManagerComponent } from './components/open-file-manager/open-file-manager.component';
import { AutoFocusDirective } from './directives/auto-focus.directive';
import { FilterPipe } from './directives/filter.pipe';
import { YoutubeManagerComponent } from './components/youtube-manager/youtube-manager.component';
import { OvicVideoPlayerNewComponent } from './components/ovic-video-player-new/ovic-video-player-new.component';
import { MatListModule } from '@angular/material/list';
import { OvicCkeditorDocumentComponent } from './components/ovic-ckeditor-document/ovic-ckeditor-document.component';
import { ProgressBarModule } from 'primeng/progressbar';
import { SuInputSwitchComponent } from './components/su-input-switch/su-input-switch.component';
import { FilesManagementNewComponent } from './components/files-management-new/files-management-new.component';
import { FileUploadModule } from 'primeng/fileupload';
import { DialogModule } from 'primeng/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SidebarModule } from 'primeng/sidebar';
import { CheckboxModule } from 'primeng/checkbox';
import { ContextMenuModule } from 'primeng/contextmenu';
import { OpenFileManagerV2Component } from './components/open-file-manager-v2/open-file-manager-v2.component';
import { ResizingImageComponent } from './components/resizing-image/resizing-image.component';
import { AvataMakerComponent } from './components/avata-maker-v2/avata-maker.component';
import { EditorModule } from 'primeng/editor';
import { ViewDocumentComponent } from './components/view-document/view-document.component';
import { TreeCustomComponent } from './components/tree-custom/tree-custom.component';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { AudioViewerComponent } from './components/audio-viewer/audio-viewer.component';
import { OvicGroupsCheckboxComponent } from './components/ovic-groups-checkbox/ovic-groups-checkbox.component';
import { FileListChatComponent } from './components/file-list-chat/file-list-chat.component';
import { ImageModule } from 'primeng/image';
import { OvicGroupsRadioV2Component } from '@shared/components/ovic-groups-radio-v2/ovic-groups-radio-v2.component';
import { TestQuestionImportComponent } from './components/test-question-import/test-question-import.component';
import { TestQuestionReviewComponent } from './components/test-question-review/test-question-review.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TestQuestionImportV2Component } from './components/test-question-import-v2/test-question-import-v2.component';
import { ChipsModule } from 'primeng/chips';
import { StringToArrayPipe } from './pipes/string-to-array-pipe';
import { GetAnsDragDropPipe } from './pipes/get-ans-drag-drop.pipe';
import { TestQuestionReviewV2Component } from './components/test-question-review-v2/test-question-review-v2.component';
import { LatexHandleComponent } from './components/latex-handle/latex-handle.component';
import { ViewThuongxuyenTuluanComponent } from './components/view-thuongxuyen-tuluan/view-thuongxuyen-tuluan.component';
import { PaginatorLocalPipe } from '@modules/shared/pipes/paginator-local.pipe';
import { DividerModule } from 'primeng/divider';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DuplicateArrayPipe } from './pipes/duplicate-array.pipe';
import { LoadMediaOnTextDirective } from './directives/load-media-on-text.directive';
import { IctuMediaLinkPipe } from './pipes/ictu-media-link.pipe';
import { QuestionPrefixPipe } from './pipes/question-prefix.pipe';
import { SafeHtmlSinglePipe } from './pipes/safe-html-single.pipe';
import { ExtractCorrectAnswerPipe } from './pipes/extract-correct-answer.pipe';
import { ViewTestComponent } from './components/view-test/view-test.component';
import { OvicGroupsCheckboxV2Component } from './components/ovic-groups-checkbox-v2/ovic-groups-checkbox-v2.component';
import { PreventDoubleClickDirective } from './directives/prevent-double-click.directive';
import { AutoResizeTextareaDirective } from './directives/auto-resize-textarea.directive';
import { ListEditorComponent } from './components/list-editor/list-editor.component';
import { ContenteditableModelDirective } from './directives/contenteditable-model.directive';
import { FormDocumentFileAndLinkComponent } from './components/form-document-file-and-link/form-document-file-and-link.component';
import { MatButtonModule } from '@angular/material/button';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { FilterChildPipe } from './pipes/filter-child.pipe';
import { IdentityPipe } from './pipes/identity.pipe';
import { MatDialogModule } from '@angular/material/dialog';
import { KatexImgDirective } from './directives/katex-img.directive';


@NgModule({
	declarations: [
		OvicFlexibleTableComponent,
		OvicDropdownComponent,
		OvicAudioPlayerComponent,
		SafeHtmlPipe,
		OvicIconPickerComponent,
		OvicTableComponent,
		OvicDatePickerComponent,
		OvicPreviewComponent,
		OvicMultiSelectComponent,
		OvicProgressComponent,
		OvicDataPickerComponent,
		OvicCurrencyInputComponent,
		OvicFileManagerComponent,
		OvicGroupsRadioComponent,
		OvicRatingComponent,
		OvicPercentagesTableComponent,
		OvicQuestionsComponent,
		OvicNavigationComponent,
		OvicVideoPlayerComponent,
		OvicInputBoxComponent,
		OvicFileListComponent,
		OvicFileDetailComponent,
		OvicFileExplorerComponent,
		OvicRecorderComponent,
		OvicTextareaComponent,
		OvicEditorComponent,
		OvicDocumentListComponent,
		OvicDocumentViewerComponent,
		OvicDownloadProgressComponent,
		OvicPersonalFileExplorerComponent,
		OvicPreviewSingleGoogleDriveFileComponent,
		OvicDocumentDownloaderComponent,
		OvicPreviewFileFullsizeComponent,
		OvicMediaPlayerComponent,
		OvicRightContentMenuComponent,
		OvicAvatarMakerComponent,

		OvicFileNamePipe,
		OvicFileExtensionPipe,
		OvicTimerMmSsPipe,
		OvicDateTimePipe,
		OvicTimePipe,
		OvicFileIconPipe,
		OvicDatePipe,
		FileTypePipe,
		OvicFileSizePipe,
		OvicSafeUrlPipe,
		OvicFileShareStatePipe,
		OvicSafeResourceUrlPipe,
		OvicSafeHtmlPipe,
		RawHtmlPipe,
		StringToArrayPipe,
		GetAnsDragDropPipe,
		ShowLabelData,
		FocusInputPipe,
		PaginatorLocalPipe,
		DuplicateArrayPipe,
		FilterChildPipe,
		IdentityPipe,

		OvicYoutubeThumbnailDirective,
		OvicVideoAspectRatio16x9Directive,
		OvicLoaderDirective,
		OvicEditorDirective,
		OvicDropAndDragDirective,
		OvicMediaLoaderDirective,
		BindCssVariablesDirective,
		OvicLoggerDirective,
		SideFiltersComponent,
		OvicDateInputComponent,
		OvicFlexibleTableNewComponent,
		OvicInputAddressFourLayoutsComponent,
		OvicDateToUtcPipe,
		OvicLazyLoadDirective,
		FileListLocalComponent,
		FileListLocalOnTableComponent,
		GetUserinfoDirective,
		CustomOvicTooltipDirective,
		ContenteditableModelDirective,

		OpenFileManagerComponent,
		AutoFocusDirective,
		FilterPipe,
		YoutubeManagerComponent,
		OvicVideoPlayerNewComponent,
		OvicCkeditorDocumentComponent,
		SuInputSwitchComponent,
		FilesManagementNewComponent,
		OpenFileManagerV2Component,
		AvataMakerComponent,
		ResizingImageComponent,
		ViewDocumentComponent,
		TreeCustomComponent,
		AudioViewerComponent,
		OvicGroupsCheckboxComponent,
		FileListChatComponent,
		OvicGroupsRadioV2Component,
		PipeCheckImg,
		TestQuestionImportComponent,
		TestQuestionReviewComponent,
		SafeHtmlDecodePipe,
		TestQuestionImportV2Component,
		TestQuestionReviewV2Component,
		LatexHandleComponent,
		ViewThuongxuyenTuluanComponent,
		ViewTestComponent,
		OvicGroupsCheckboxV2Component,
		PreventDoubleClickDirective,
		AutoResizeTextareaDirective,
		ListEditorComponent,
		FormDocumentFileAndLinkComponent

	],
	imports: [
		ConfirmPopupModule,
		EditorModule,
		CommonModule,
		RouterModule,
		FormsModule,
		DropdownModule,
		InputNumberModule,
		TableModule,
		InputTextModule,
		MatProgressBarModule,
		MatMenuModule,
		CalendarModule,
		NgxDocViewerModule,
		ReactiveFormsModule,
		DragDropModule,
		OvicPlyrDirective,
		MultiSelectModule,
		PdfViewerModule,
		NgxViewerDirective,
		ImageCropperModule,
		RippleModule,
		TooltipModule,
		InputMaskModule,
		PaginatorModule,
		MatListModule,
		ProgressBarModule,
		DialogModule,
		FileUploadModule,
		MatProgressSpinnerModule,
		SidebarModule,
		CheckboxModule,
		ContextMenuModule,
		MatIconModule,
		ImageModule,
		MatTooltipModule,
		ChipsModule,
		DividerModule,
		NgbTooltipModule,
		LoadMediaOnTextDirective,
		IctuMediaLinkPipe,
		QuestionPrefixPipe,
		SafeHtmlSinglePipe,
		ExtractCorrectAnswerPipe,
		MatButtonModule,
		OverlayPanelModule,
		MatDialogModule,
		KatexImgDirective
	],
	exports: [
		OvicDropdownComponent,
		OvicFlexibleTableComponent,
		OvicAudioPlayerComponent,
		SafeHtmlPipe,
		OvicIconPickerComponent,
		OvicTableComponent,
		OvicDatePickerComponent,
		OvicPreviewComponent,
		OvicMultiSelectComponent,
		OvicProgressComponent,
		OvicDataPickerComponent,
		OvicCurrencyInputComponent,
		OvicFileManagerComponent,
		OvicGroupsRadioComponent,
		OvicRatingComponent,
		OvicPercentagesTableComponent,
		OvicQuestionsComponent,
		OvicNavigationComponent,
		OvicVideoPlayerComponent,
		OvicInputBoxComponent,
		OvicFileListComponent,
		OvicFileDetailComponent,
		OvicFileExplorerComponent,
		OvicRecorderComponent,
		OvicTextareaComponent,
		OvicEditorComponent,
		OvicDocumentListComponent,
		OvicDocumentViewerComponent,
		OvicDownloadProgressComponent,
		OvicPersonalFileExplorerComponent,
		OvicPreviewSingleGoogleDriveFileComponent,
		OvicDocumentDownloaderComponent,
		OvicPreviewFileFullsizeComponent,
		OvicMediaPlayerComponent,
		OvicRightContentMenuComponent,
		OvicDateInputComponent,
		FileListLocalComponent,
		FileListLocalOnTableComponent,
		OvicFlexibleTableNewComponent,
		OvicInputAddressFourLayoutsComponent,

		OvicFileNamePipe,
		OvicFileExtensionPipe,
		OvicTimerMmSsPipe,
		OvicDateTimePipe,
		OvicTimePipe,
		OvicFileIconPipe,
		OvicDatePipe,
		FileTypePipe,
		OvicFileSizePipe,
		OvicSafeUrlPipe,
		OvicFileShareStatePipe,
		OvicSafeResourceUrlPipe,
		OvicSafeHtmlPipe,
		OvicDateToUtcPipe,
		PipeCheckImg,
		RawHtmlPipe,
		StringToArrayPipe,
		GetAnsDragDropPipe,
		ShowLabelData,
		FocusInputPipe,
		PaginatorLocalPipe,
		DuplicateArrayPipe,
		FilterChildPipe,

		OvicYoutubeThumbnailDirective,
		OvicVideoAspectRatio16x9Directive,
		OvicLoaderDirective,
		OvicEditorDirective,
		OvicDropAndDragDirective,
		OvicMediaLoaderDirective,
		OvicLoggerDirective,
		OvicLazyLoadDirective,
		GetUserinfoDirective,
		CustomOvicTooltipDirective,
		ContenteditableModelDirective,

		OpenFileManagerComponent,
		AutoFocusDirective,
		FilterPipe,
		YoutubeManagerComponent,
		OvicVideoPlayerNewComponent,
		OvicCkeditorDocumentComponent,
		SuInputSwitchComponent,
		FilesManagementNewComponent,
		OpenFileManagerV2Component,
		ResizingImageComponent,
		AvataMakerComponent,
		ViewDocumentComponent,
		TreeCustomComponent,
		AudioViewerComponent,
		OvicGroupsCheckboxComponent,
		FileListChatComponent,
		OvicGroupsRadioV2Component,
		TestQuestionImportComponent,
		TestQuestionReviewComponent,
		SafeHtmlDecodePipe,
		TestQuestionImportV2Component,
		TestQuestionReviewV2Component,
		LatexHandleComponent,
		ViewThuongxuyenTuluanComponent,
		ViewTestComponent,
		OvicGroupsCheckboxV2Component,
		PreventDoubleClickDirective,
		AutoResizeTextareaDirective,
		ListEditorComponent,
		FormDocumentFileAndLinkComponent,
		IdentityPipe
	]
})
export class SharedModule { }
