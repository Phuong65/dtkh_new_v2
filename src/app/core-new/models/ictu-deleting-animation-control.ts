import { computed, signal, Signal, WritableSignal } from '@angular/core';
import { map, Observable, Subject } from 'rxjs';

export interface IctuDeletableService {
    delete: (id: number) => Observable<unknown>;
}

export class IctuDeletingAnimationControl<T = unknown> {
    private readonly ids: WritableSignal<number[]> = signal<number[]>([]);

    readonly totalItems: Signal<number>;

    readonly percent: Signal<number> = computed((): number => {
        if (this.totalItems() <= 0) {
            return 0;
        }
        return 100 - ((100 / this.totalItems()) * this.ids().length);
    });

    private readonly progressSubject = new Subject<number>();
    private hasError: boolean = false;

    constructor(items: number[], private readonly service: IctuDeletableService) {
        this.ids.set([...items]);
        this.totalItems = signal<number>(items.length);
    }

    get progress(): Observable<number> {
        return this.progressSubject.asObservable();
    }

    run(): void {
        if (!this.ids().length) {
            if (this.hasError) {
                this.progressSubject.error(new Error('Không thể xóa một hoặc nhiều mục'));
            } else {
                this.progressSubject.complete();
            }
            return;
        }

        this.deleteNext();
    }

    private deleteNext(): void {
        const id: number = this.ids()[0];
        this.service.delete(id).pipe(
            map((): number => this.removeId(id))
        ).subscribe({
            next: (percent: number): void => {
                this.progressSubject.next(percent);
                this.run();
            },
            error: (): void => {
                this.hasError = true;
                this.progressSubject.next(this.removeId(id));
                this.run();
            }
        });
    }

    private removeId(id: number): number {
        this.ids.update((items: number[]): number[] => items.filter((_id: number): boolean => _id !== id));
        return this.percent();
    }
}
