import { Pipe, PipeTransform } from '@angular/core';

@Pipe({standalone: false, 
    name: 'identity',
    pure: true
})
export class IdentityPipe implements PipeTransform {

    transform(items: any[]): any[] {
        return items;
    }

}
