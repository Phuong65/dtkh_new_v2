import { OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({standalone: false, 
    name: 'showlabel'
})
export class ShowLabelData implements PipeTransform, OnDestroy {

    constructor(private sanitized: DomSanitizer) { }

    ngOnDestroy(): void {

    }

    transform(id: any, data: any[], id_label: string = 'id', label: string = 'label'): SafeHtml {
        if (data && data.length) {
            const index = data.findIndex( m => m[ id_label ].toString().toLowerCase() === id.toString().toLowerCase() );
            if ( index !== -1 ) {
                return data[index][label];
            }
            return '';
        }
        return '';
    }
}
