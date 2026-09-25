import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { QuestionStat, OptionStatData, RateStatData } from '@modules/shared/models/survey-statistics.model';

export interface OptionSelectEvent {
    type: 'option' | 'rate';
    key: string;          // id option hoặc star value
    label: string;        // tên hiển thị
}

@Component({
    selector: 'app-stat-question-chart',
    standalone: true,
    imports: [CommonModule, ChartModule],
    templateUrl: './stat-question-chart.component.html',
    styleUrls: ['./stat-question-chart.component.css']
})
export class StatQuestionChartComponent implements OnInit {
    @Input() stat: QuestionStat;
    @Output() optionSelected = new EventEmitter<OptionSelectEvent>();

    chartData: any;
    chartOptions: any;
    chartType: string = 'pie';

    /** Map từ option label → màu (đồng bộ với chart) */
    legendColors: string[] = [];

    // Cho RATE
    averageScore: number = 0;
    maxStar: number = 5;

    ngOnInit(): void {
        this.buildChart();
    }

    /**
     * Báo parent khi user nhấn vào dòng đáp án hoặc nút Xem so sánh.
     */
    selectOption(event: OptionSelectEvent): void {
        this.optionSelected.emit(event);
    }

    buildChart(): void {
        if (!this.stat) return;

        const type = this.stat.question.question_type;

        if (this.stat.data.type === 'option') {
            this.buildOptionChart(type);
        } else if (this.stat.data.type === 'rate') {
            this.buildRateChart();
        }
    }

    /**
     * RADIO / SELECT / YES_NO / CHECKBOX / MULTI_SELECT → Doughnut
     */
    private buildOptionChart(questionType: string): void {
        const data = this.stat.data as OptionStatData;
        const labels = data.items.map(item => item.label);
        const counts = data.items.map(item => item.count);

        const hasOther = this.stat.question.allow_other_answer === 1 && data.otherCount && data.otherCount > 0;

        // Nếu câu hỏi cho phép "Khác" và có người chọn → thêm slice "Khác"
        if (hasOther) {
            labels.push('Khác');
            counts.push(data.otherCount);
        }

        // Tạo màu: options bình thường theo thứ tự, "Khác" luôn đỏ
        const colors = this.generateColors(data.items.length);
        if (hasOther) {
            colors.backgrounds.push('rgba(239, 68, 68, 0.85)');
            colors.borders.push('rgba(239, 68, 68, 1)');
        }
        this.legendColors = colors.backgrounds;

        // Tất cả các loại lựa chọn đều hiển thị doughnut (hình tròn rỗng giữa)
        this.chartType = 'doughnut';
        this.chartData = {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: colors.backgrounds,
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        };
        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx: any) => {
                            const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
                            const value = ctx.parsed;
                            const pct = total > 0 ? Math.round((value / total) * 100 * 10) / 10 : 0;
                            return `${ctx.label}: ${value} (${pct}%)`;
                        }
                    }
                }
            }
        };
    }

    /**
     * RATE → Bar dọc + average
     */
    private buildRateChart(): void {
        const data = this.stat.data as RateStatData;
        this.averageScore = data.average;
        this.maxStar = Math.max(...data.distribution.map(d => d.star));

        const labels = data.distribution.map(d => `${d.star} ★`);
        const counts = data.distribution.map(d => d.count);

        this.chartType = 'bar';
        this.chartData = {
            labels: labels,
            datasets: [{
                label: 'Số lượt đánh giá',
                data: counts,
                backgroundColor: '#fbbf24',
                borderColor: '#f59e0b',
                borderWidth: 1
            }]
        };
        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        };
    }

    /**
     * Tạo bảng màu cho biểu đồ
     */
    private generateColors(count: number): { backgrounds: string[], borders: string[] } {
        const palette = [
            { bg: 'rgba(67, 97, 238, 0.85)', border: 'rgba(67, 97, 238, 1)' },
            { bg: 'rgba(34, 197, 94, 0.85)', border: 'rgba(34, 197, 94, 1)' },
            { bg: 'rgba(245, 158, 11, 0.85)', border: 'rgba(245, 158, 11, 1)' },
            { bg: 'rgba(6, 182, 212, 0.85)', border: 'rgba(6, 182, 212, 1)' },
            { bg: 'rgba(139, 92, 246, 0.85)', border: 'rgba(139, 92, 246, 1)' },
            { bg: 'rgba(236, 72, 153, 0.85)', border: 'rgba(236, 72, 153, 1)' },
            { bg: 'rgba(249, 115, 22, 0.85)', border: 'rgba(249, 115, 22, 1)' },
            { bg: 'rgba(20, 184, 166, 0.85)', border: 'rgba(20, 184, 166, 1)' },
            { bg: 'rgba(99, 102, 241, 0.85)', border: 'rgba(99, 102, 241, 1)' },
            { bg: 'rgba(16, 185, 129, 0.85)', border: 'rgba(16, 185, 129, 1)' },
        ];

        const backgrounds: string[] = [];
        const borders: string[] = [];

        for (let i = 0; i < count; i++) {
            const color = palette[i % palette.length];
            backgrounds.push(color.bg);
            borders.push(color.border);
        }

        return { backgrounds, borders };
    }
}
