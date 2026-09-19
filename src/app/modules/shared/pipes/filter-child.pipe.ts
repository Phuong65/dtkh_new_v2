import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filterChild'
})
export class FilterChildPipe implements PipeTransform {
    transform(items: any[], childName: string, searchText: any, arrayCols: any[]): any[] {
        if (!items) return [];
        if (!searchText && searchText !== 0) return items;
        const keyword = String(searchText).toLowerCase();
        const result: any[] = [];

        for (const item of items) {
            const children = item[childName];

            if (!Array.isArray(children)) continue;

            const matchedChildren = children.filter(child =>
                arrayCols.some(col =>
                    child[col] !== null &&
                    child[col] !== undefined &&
                    String(child[col]).toLowerCase().includes(keyword)
                )
            );

            if (matchedChildren.length > 0) {
                result.push({
                    ...item,
                    [childName]: matchedChildren
                });
            }
        }

        return result;
    }
}
