import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SurveyAnswerRaw } from '@modules/shared/models/survey-statistics.model';

interface TeacherStatItem {
    id: number;
    name: string;
    count: number;
    percentage: number;
    average: number;
}

@Component({
    selector: 'app-stat-teacher-panel',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './stat-teacher-panel.component.html',
    styleUrls: ['./stat-teacher-panel.component.css']
})
export class StatTeacherPanelComponent implements OnChanges {
    @Input() answers: SurveyAnswerRaw[] = [];
    @Input() teacherNames: Map<number, string> = new Map<number, string>();
    @Input() classNames: Map<number, string> = new Map<number, string>();
    @Input() placeholderShown: boolean = false;
    @Input() mode: 'count' | 'rate' = 'count';

    groupBy: 'teacher' | 'class' = 'teacher';
    items: TeacherStatItem[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['answers'] || changes['teacherNames'] || changes['classNames'] || changes['mode']) {
            this.buildItems();
        }
    }

    setGroupBy(groupBy: 'teacher' | 'class'): void {
        if (this.groupBy === groupBy) return;
        this.groupBy = groupBy;
        this.buildItems();
    }

    private buildItems(): void {
        const grouped = new Map<number, { count: number; totalScore: number; validScores: number }>();
        const names = this.groupBy === 'teacher' ? this.teacherNames : this.classNames;
        let validTotal = 0;

        this.answers.forEach(answer => {
            const rawId = this.groupBy === 'teacher' ? answer.teacher_id : answer.class_id;
            if (rawId == null) return;
            const id = Number(rawId);
            if (!Number.isFinite(id)) return;

            validTotal++;
            const current = grouped.get(id) || { count: 0, totalScore: 0, validScores: 0 };
            current.count++;

            if (this.mode === 'rate') {
                const score = Number(answer.answer_id ?? answer.answer_text);
                if (!isNaN(score)) {
                    current.totalScore += score;
                    current.validScores++;
                }
            }
            grouped.set(id, current);
        });

        const fallback = this.groupBy === 'teacher' ? 'Giảng viên' : 'Lớp';
        this.items = Array.from(grouped.entries())
            .map(([id, value]) => ({
                id,
                name: names.get(id) || `${fallback} #${id}`,
                count: value.count,
                percentage: validTotal > 0 ? Math.round((value.count / validTotal) * 1000) / 10 : 0,
                average: value.validScores > 0 ? Math.round((value.totalScore / value.validScores) * 10) / 10 : 0
            }))
            .sort((a, b) => this.mode === 'rate'
                ? b.average - a.average || b.count - a.count || a.name.localeCompare(b.name)
                : b.count - a.count || a.name.localeCompare(b.name));
    }
}
