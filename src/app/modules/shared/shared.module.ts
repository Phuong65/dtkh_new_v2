import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OvicDropdownComponent } from './components/ovic-dropdown/ovic-dropdown.component';
import { OvicEditorComponent } from './components/ovic-editor/ovic-editor.component';
import { FilterPipe } from './directives/filter.pipe';
import { SafeHtmlDecodePipe } from './pipes/safe-html-decode';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OvicDropdownComponent,
    OvicEditorComponent,
    FilterPipe,
    SafeHtmlDecodePipe
  ],
  exports: [
    OvicDropdownComponent,
    OvicEditorComponent,
    FilterPipe,
    SafeHtmlDecodePipe
  ]
})
export class SharedModule { }
