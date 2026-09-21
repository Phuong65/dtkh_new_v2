import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DanhMucKhoaHocRoutingModule } from './danh-muc-khoa-hoc-routing.module';
import { SharedModule } from '@shared/shared.module';
import { DropdownModule } from 'primeng/dropdown';
import { KhoaHocComponent } from './khoa-hoc/khoa-hoc.component';
import { InputTextModule } from 'primeng/inputtext';
import { BaiHocComponent } from './bai-hoc/bai-hoc.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TabViewModule } from 'primeng/tabview';
import { InputSwitchModule } from 'primeng/inputswitch';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AngularResizeElementModule } from 'angular-resize-element';
import { InputMaskModule } from 'primeng/inputmask';
import { BankAudioViewerComponent } from './bank-audio-viewer/bank-audio-viewer.component';
import { PanelComponent } from './panel/panel.component';
// import { NgxResizableModule } from '@3dgenomes/ngx-resizable';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ProgressBarModule } from 'primeng/progressbar';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatListModule } from '@angular/material/list';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatPaginatorModule } from '@angular/material/paginator';
import { TableModule } from 'primeng/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PaginatorModule } from 'primeng/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { SplitterModule } from 'primeng/splitter';
import { QuanlydeComponent } from './quanlyde/quanlyde.component';
import { DialogModule } from 'primeng/dialog';
import { PickListModule } from 'primeng/picklist';
import { BaiHocV2Component } from './bai-hoc-v2/bai-hoc-v2.component';
import { PanelModule } from 'primeng/panel';
import { MatStepperModule } from '@angular/material/stepper';
// import { KehoachComponent } from './kehoach/kehoach.component';

@NgModule({
    declarations: [
        KhoaHocComponent,
        BaiHocComponent,
        BankAudioViewerComponent,
        PanelComponent,
        QuanlydeComponent,
        BaiHocV2Component,
        // KehoachComponent
    ],
    imports: [
        MatStepperModule,
        PanelModule,
        PickListModule,
        DialogModule,
        SplitterModule,
        MatMenuModule,
        PaginatorModule,
        MatButtonModule,
        MatIconModule,
        TableModule,
        MatPaginatorModule,
        MatButtonToggleModule,
        MatListModule,
        DragDropModule,
        ProgressBarModule,
        RadioButtonModule,
        InputSwitchModule,
        TooltipModule,
        ButtonModule,
        CheckboxModule,
        MultiSelectModule,
        CommonModule,
        SharedModule,
        DanhMucKhoaHocRoutingModule,
        FormsModule,
        DropdownModule,
        ReactiveFormsModule,
        InputTextModule,
        NgbModule,
        TabViewModule,
        SelectButtonModule,
        AngularResizeElementModule,
        InputMaskModule,
        // NgxResizableModule,
        MatProgressBarModule,
        PdfViewerModule
    ]
})
export class DanhMucKhoaHocModule {
}
