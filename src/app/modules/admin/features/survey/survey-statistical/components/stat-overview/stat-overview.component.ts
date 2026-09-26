import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatOverview } from '@modules/shared/models/survey-statistics.model';

@Component({
    selector: 'app-stat-overview',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './stat-overview.component.html',
    styleUrls: ['./stat-overview.component.css']
})
export class StatOverviewComponent {
    @Input() overview: StatOverview | null = null;

    formatNumber(value: number): string {
        return Number(value || 0).toLocaleString('vi-VN');
    }
}
