import { Component, ElementRef, computed, signal, viewChildren } from '@angular/core';

export type CourseDetailPreviewGroupId = 'outline' | 'question-bank';

export interface CourseDetailPreviewItem {
    id: string;
    title: string;
}

export interface CourseDetailPreviewGroup {
    id: CourseDetailPreviewGroupId;
    label: string;
    items: readonly CourseDetailPreviewItem[];
}

@Component({
    selector: 'app-course-detail-preview',
    standalone: true,
    templateUrl: './course-detail-preview.html',
    styleUrl: './course-detail-preview.css'
})
export class CourseDetailPreview {
    readonly groupButtons = viewChildren<ElementRef<HTMLButtonElement>>('groupButton');
    readonly itemButtons = viewChildren<ElementRef<HTMLButtonElement>>('itemButton');

    readonly groups: readonly CourseDetailPreviewGroup[] = [
        {
            id: 'outline',
            label: 'Biên soạn đề cương',
            items: [
                { id: 'course-information', title: 'Thông tin học phần' },
                { id: 'objectives-outcomes', title: 'Mục tiêu và chuẩn đầu ra' },
                { id: 'teaching-plan', title: 'Nội dung và kế hoạch giảng dạy' },
                { id: 'assessment-design', title: 'Thiết kế kiểm tra – đánh giá' },
                { id: 'review-approval-export', title: 'Rà soát, phê duyệt và xuất đề cương' }
            ]
        },
        {
            id: 'question-bank',
            label: 'Xây dựng ngân hàng và đề kiểm tra',
            items: [
                { id: 'test-configuration', title: 'Cấu hình bài kiểm tra' },
                { id: 'question-matrix', title: 'Ma trận câu hỏi theo CĐR/CPI' },
                { id: 'question-bank', title: 'Ngân hàng câu hỏi' },
                { id: 'exam-form', title: 'Form đề' },
                { id: 'exam-management', title: 'Sinh và quản lý đề' }
            ]
        }
    ];

    readonly activeGroupId = signal<CourseDetailPreviewGroupId>('outline');
    readonly activeItemId = signal('course-information');
    readonly activeGroup = computed(() => this.groups.find(group => group.id === this.activeGroupId()) ?? this.groups[0]);
    readonly activeItem = computed(() => this.activeGroup().items.find(item => item.id === this.activeItemId()) ?? this.activeGroup().items[0]);

    selectGroup(groupId: CourseDetailPreviewGroupId): void {
        const group = this.groups.find(item => item.id === groupId);
        if (!group || group.id === this.activeGroupId()) return;

        this.activeGroupId.set(group.id);
        this.activeItemId.set(group.items[0].id);
    }

    selectItem(itemId: string): void {
        if (!this.activeGroup().items.some(item => item.id === itemId)) return;
        this.activeItemId.set(itemId);
    }

    onGroupKeydown(event: KeyboardEvent, index: number): void {
        const targetIndex = this.getTargetIndex(event.key, index, this.groups.length, 'horizontal');
        if (targetIndex === null) return;

        event.preventDefault();
        this.selectGroup(this.groups[targetIndex].id);
        this.groupButtons()[targetIndex]?.nativeElement.focus();
    }

    onItemKeydown(event: KeyboardEvent, index: number): void {
        const items = this.activeGroup().items;
        const targetIndex = this.getTargetIndex(event.key, index, items.length, 'vertical');
        if (targetIndex === null) return;

        event.preventDefault();
        this.selectItem(items[targetIndex].id);
        this.itemButtons()[targetIndex]?.nativeElement.focus();
    }

    private getTargetIndex(key: string, currentIndex: number, length: number, direction: 'horizontal' | 'vertical'): number | null {
        if (key === 'Home') return 0;
        if (key === 'End') return length - 1;
        if (direction === 'horizontal' && key === 'ArrowRight') return (currentIndex + 1) % length;
        if (direction === 'horizontal' && key === 'ArrowLeft') return (currentIndex - 1 + length) % length;
        if (direction === 'vertical' && key === 'ArrowDown') return (currentIndex + 1) % length;
        if (direction === 'vertical' && key === 'ArrowUp') return (currentIndex - 1 + length) % length;
        return null;
    }
}
