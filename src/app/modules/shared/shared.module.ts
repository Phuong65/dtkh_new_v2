import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OvicDropdownComponent } from './components/ovic-dropdown/ovic-dropdown.component';
import { OvicEditorComponent } from './components/ovic-editor/ovic-editor.component';
import { FilterPipe } from './directives/filter.pipe';
import { SafeHtmlDecodePipe } from './pipes/safe-html-decode';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';
import { SafeHtmlSinglePipe } from './pipes/safe-html-single.pipe';
import { OvicSafeUrlPipe } from './pipes/ovic-safe-url.pipe';
import { ShowLabelData } from './pipes/show-label-data.pipe';
import { StringToArrayPipe } from './pipes/string-to-array-pipe';
import { IctuMediaLinkPipe } from './pipes/ictu-media-link.pipe';
import { PaginatorLocalPipe } from './pipes/paginator-local.pipe';
import { KatexImgDirective } from './directives/katex-img.directive';
import { LoadMediaOnTextDirective } from './directives/load-media-on-text.directive';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OvicDropdownComponent,
    OvicEditorComponent,
    FilterPipe,
    SafeHtmlDecodePipe,
    SafeHtmlPipe,
    SafeHtmlSinglePipe,
    OvicSafeUrlPipe,
    ShowLabelData,
    StringToArrayPipe,
    IctuMediaLinkPipe,
    PaginatorLocalPipe,
    KatexImgDirective,
    LoadMediaOnTextDirective
  ],
  exports: [
    OvicDropdownComponent,
    OvicEditorComponent,
    FilterPipe,
    SafeHtmlDecodePipe,
    SafeHtmlPipe,
    SafeHtmlSinglePipe,
    OvicSafeUrlPipe,
    ShowLabelData,
    StringToArrayPipe,
    IctuMediaLinkPipe,
    PaginatorLocalPipe,
    KatexImgDirective,
    LoadMediaOnTextDirective
  ]
})
export class SharedModule { }

