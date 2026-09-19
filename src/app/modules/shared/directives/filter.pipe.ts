import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filter'
})
export class FilterPipe implements PipeTransform {
    transform(items: any[], searchText: any, arrayCols: any[], useV2: boolean = false): any[] {
        if (useV2) {
            return this.transformV2(items, searchText, arrayCols);
        } else {
            if (!items) return [];
            if (!searchText && searchText !== 0) return items;
            return items.filter(item => {
                return arrayCols.some(key => {
                    return String(item[key]).toLowerCase().includes(String(searchText).toLowerCase());
                });
            });
        }
    }

    transformV2(items: any[], searchText: any, arrayCols: any[]): any[] {
        if (!items) return [];
        if (!searchText && searchText !== 0) return items;

        return items.filter(item => {
            if (this.filterArray(item.children, searchText, arrayCols) === true) {

                item['filter'] === true;
            }

            if (item.children && item.children.length > 0) {
                this.transformV2(item.children, searchText, arrayCols);
            }

            return this.filterArray(item, searchText, arrayCols);
        });

        // return items.filter(item => { 

        //     if (item.children && item.children.length > 0) {
        //         item.children = this.transformV2(item.children, searchText, arrayCols);
        //     }

        //     return arrayCols.some(key => {
        //         return String(item[key]).toLowerCase().includes(String(searchText).toLowerCase());
        //     });
        // });
    }

    filterArray(item: any, searchText: any, arrayCols: any[]): boolean {
        return arrayCols.some(key => {
            return String(item[key]).toLowerCase().includes(String(searchText).toLowerCase()) && item['filter'] === true;
        });
    }
}

