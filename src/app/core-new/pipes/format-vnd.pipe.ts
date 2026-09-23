import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    standalone: true,
    name: 'formatVndPipe'
})
export class FormatVndPipe implements PipeTransform {
    transform(value: number): string {
        return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    }
}