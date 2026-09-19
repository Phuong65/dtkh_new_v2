import { Pipe, PipeTransform } from '@angular/core';


@Pipe( {
    name: 'paginatorLocal'
} )

export class PaginatorLocalPipe implements PipeTransform {
    constructor () { }
    
    transform ( data: any[], page: number, limit: number ): any[] {
        if ( data && data.length ) {
            const newData = [ ...data ];
            const result = [];
            newData.splice( page * limit, limit ).forEach( ( f, key ) => {
                f[ 'index' ] = page * limit + 1 + key;
                result.push( f );
            } )
            return result;
        }
        return [];
    }
}
