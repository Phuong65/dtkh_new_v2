import {Injectable} from '@angular/core';
import {CoursePlanActivities} from "@shared/models/course-plan-activities";
import { saveAs } from 'file-saver';
import {asBlob} from "@shared/vendor/html-docx"
import {Classes} from "@shared/models/classes";

@Injectable({
    providedIn: 'root'
})
export class ExportNoidongDecuongByHtmlService {

    constructor() {
    }

    async exportHtmlToWord(htmlContent:string, fileName?: string){


        try {
            const fileBuffer = await asBlob(htmlContent , {
                orientation : 'portrait' ,
                margins     : {
                    top    : 1000 ,
                    right  : 1000 ,
                    bottom : 1000 ,
                    left   : 1000 ,
                    header : 440 ,
                    footer : 0 ,
                    gutter : 0
                },


            } );
            saveAs( fileBuffer , fileName + '.docx' );

        } catch ( e ) {
            console.log( e );
        }
    }


    // replaceContentCenter(htmlContent:string): any[]{
    //     const regex = /<p[^>]*>(.*?)<\/p>/g;
    //     let match;
    //     const contentArray = [];
    //
    //     while ((match = regex.exec(htmlContent)) !== null) {
    //         // Xóa các thẻ HTML con (như <span>, <o:p>) để lấy nội dung thuần túy
    //         const textContent = match[1].replace(/<[^>]*>/g, '').replace('&nbsp;','').trim();
    //         contentArray.push(textContent.replace('Chủ đề ','').trim());
    //     }
    //
    //     return contentArray;
    // }

    replaceContent(htmlContent:string): any[]{
        const regex = /<p[^>]*>(.*?)<\/p>/g;
        let match;
        const contentArray = [];

        while ((match = regex.exec(htmlContent)) !== null) {
            // Xóa các thẻ HTML con (như <span>, <o:p>) để lấy nội dung thuần túy
            const textContent = match[1].replace(/<[^>]*>/g, '').replace('&nbsp;','').trim();
            contentArray.push(textContent);
        }

        return contentArray;
    }
}
