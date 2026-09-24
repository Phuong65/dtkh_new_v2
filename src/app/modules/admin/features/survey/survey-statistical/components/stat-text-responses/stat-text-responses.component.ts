import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';

interface GroupedResponse {
    value: string;
    count: number;
    percentage: number;
}

interface RawItem {
    value: string;
    createdAt: string;
}

@Component({
    selector: 'app-stat-text-responses',
    standalone: true,
    imports: [CommonModule, TableModule],
    templateUrl: './stat-text-responses.component.html',
    styleUrls: ['./stat-text-responses.component.css']
})
export class StatTextResponsesComponent {
    @Input() responses: string[] = [];
    @Input() grouped: GroupedResponse[] = [];
    @Input() total: number = 0;
    @Input() rawItems: RawItem[] = [];
    @Input() questionTitle: string = '';

    /** Toggle giữa view "gộp" và view "tất cả" */
    viewMode: 'grouped' | 'all' = 'grouped';
}
