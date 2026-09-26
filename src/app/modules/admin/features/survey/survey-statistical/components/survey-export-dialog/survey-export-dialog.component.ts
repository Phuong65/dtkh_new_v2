import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import {
    SURVEY_EXPORT_ALL,
    SurveyExportFilter,
    SurveyExportOption
} from '../../models/survey-export.model';

@Component({
    selector: 'app-survey-export-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, MultiSelectModule],
    templateUrl: './survey-export-dialog.component.html',
    styleUrls: ['./survey-export-dialog.component.css']
})
export class SurveyExportDialogComponent {
    @Input() visible: boolean = false;
    @Input() showFacultyFilter: boolean = true;
    @Input() facultyOptions: SurveyExportOption<number | string>[] = [];
    @Input() cohortOptions: SurveyExportOption<string>[] = [];
    @Input() groupOptions: SurveyExportOption<string>[] = [];
    @Input() estimatedRows: number = 0;
    @Input() exporting: boolean = false;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() filterChange = new EventEmitter<SurveyExportFilter>();
    @Output() export = new EventEmitter<SurveyExportFilter>();

    facultyIds: Array<number | typeof SURVEY_EXPORT_ALL> = [SURVEY_EXPORT_ALL];
    cohorts: string[] = [SURVEY_EXPORT_ALL];
    groupIds: string[] = [SURVEY_EXPORT_ALL];

    open(): void {
        this.facultyIds = [SURVEY_EXPORT_ALL];
        this.cohorts = [SURVEY_EXPORT_ALL];
        this.groupIds = [SURVEY_EXPORT_ALL];
        this.emitFilterChange();
    }

    close(): void {
        this.visible = false;
        this.visibleChange.emit(false);
    }

    onSelectionChange(field: 'faculty' | 'cohort' | 'group', event: any): void {
        const itemValue = event && event.itemValue;
        const values = [...((event && event.value) || [])];
        const normalized = this.normalizeAllSelection(values, itemValue);

        if (field === 'faculty') this.facultyIds = normalized as Array<number | typeof SURVEY_EXPORT_ALL>;
        if (field === 'cohort') this.cohorts = normalized as string[];
        if (field === 'group') this.groupIds = normalized as string[];
        this.emitFilterChange();
    }

    submit(): void {
        if (this.exporting || this.estimatedRows <= 0) return;
        this.export.emit(this.currentFilter());
    }

    private normalizeAllSelection(values: any[], itemValue: any): any[] {
        if (!values.length) return [SURVEY_EXPORT_ALL];
        if (itemValue === SURVEY_EXPORT_ALL) return [SURVEY_EXPORT_ALL];
        const withoutAll = values.filter(value => value !== SURVEY_EXPORT_ALL);
        return withoutAll.length ? withoutAll : [SURVEY_EXPORT_ALL];
    }

    private currentFilter(): SurveyExportFilter {
        return {
            facultyIds: [...this.facultyIds],
            cohorts: [...this.cohorts],
            groupIds: [...this.groupIds]
        };
    }

    private emitFilterChange(): void {
        this.filterChange.emit(this.currentFilter());
    }
}
