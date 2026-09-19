import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'identity',
    pure: true
})
export class IdentityPipe implements PipeTransform {

    transform(items: any[]): any[] {
        return items;
    }

}
