import { ElementRef, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({standalone: true, 
    name: 'getAnsDragDropPipe'
})
export class GetAnsDragDropPipe implements PipeTransform {

    constructor(private sanitized: DomSanitizer) {

    }

    transform(ans: string, dragDrop: { id: string, value: string }[]): string[] {
        if (ans && dragDrop) {
            const ar_ans = ans.split(',');
            const result = [];
            ar_ans.forEach(f => {
                const index = dragDrop.findIndex(i => i.id === f);
                if (index !== -1) {
                    result.push(dragDrop[index].value);
                }
            })            
            return result;            
        }
        return [];
    }
}
