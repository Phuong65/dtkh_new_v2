import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'pipeCheckImg'
})
export class PipeCheckImg implements PipeTransform {
    transform(value: string): boolean {
        const regexSrcG = /src="(.*?)"/g;
        if (value.match(regexSrcG) && Boolean((value.match(regexSrcG)).length)) {
            return true;
        }
        return false;
    }
}
