import { APP_CONFIGS } from './../../../../environments/environment';
import {
    Alignment,
    AlignmentType,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TabStopPosition,
    TabStopType,
    TextRun,
    UnderlineType,
    VerticalAlign,
    VerticalAlignAttributes,
    WidthType
} from "docx";
import * as fs from 'file-saver'
import { ThiShiftRooms } from "../models/thi-shift-room";
import { ThiShifts } from "../models/thi-shifts";
import { User } from '@core/models/user';
import { ElnKhoaHoc } from '../models/elng-khoa-hoc';

export class ExportPassOfRoomService {

    server_config = APP_CONFIGS;

    create ( room: ThiShiftRooms[], shift: ThiShifts, _user: User[], _courses: ElnKhoaHoc[] ): Document {

        const index_course = _courses.findIndex( m => m.id === shift.course_id );

        const full_content = [];
        const d = new Date( shift.time_start );

        room.forEach( ( f, key ) => {
            full_content.push( this.paragraph( APP_CONFIGS.donviquanly.toUpperCase(), false, false, 24, AlignmentType.CENTER, 250, 0, 0 ) );
            full_content.push( this.paragraph( APP_CONFIGS.donvitructhuoc.toUpperCase(), true, false, 24, AlignmentType.CENTER, 250, 0, 0 ) );
            full_content.push( this.paragraph( '-----------------------------', false, false, 24, AlignmentType.CENTER, 100, 0, 0 ) );
            full_content.push( this.paragraph( '', true, false, 28, AlignmentType.CENTER, 300, 40, 40 ) );
            full_content.push( this.paragraph( '', true, false, 28, AlignmentType.CENTER, 300, 40, 40 ) );
            full_content.push(
                new Paragraph( {
                    children: [
                        new TextRun( {
                            text: '- Học phần: ',
                            bold: false,
                            italics: false,
                            size: 24
                        } ),
                        new TextRun( {
                            text: index_course !== -1 ? _courses[ index_course ].title : ' -- ',
                            bold: true,
                            italics: false,
                            size: 24
                        } )
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: {
                        line: 300,
                        after: 0,
                        before: 0
                    },
                    indent: {
                        left: 0,
                        right: 0,
                    }
                } )
            )
            full_content.push(
                new Paragraph( {
                    children: [
                        new TextRun( {
                            text: '- Ngày thi: ',
                            bold: false,
                            italics: false,
                            size: 24
                        } ),
                        new TextRun( {
                            text: d.toLocaleString( 'en-GB' ),
                            bold: true,
                            italics: false,
                            size: 24
                        } ),
                        new TextRun( {
                            text: '                    - Ca thi: ',
                            bold: false,
                            italics: false,
                            size: 24
                        } ),
                        new TextRun( {
                            text: shift.name,
                            bold: true,
                            italics: false,
                            size: 24
                        } ),
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: {
                        line: 300,
                        after: 0,
                        before: 0
                    },
                    indent: {
                        left: 0,
                        right: 0,
                    }
                } )
            )

            // full_content.push( this.paragraph( 'Ca thi: ' + shift.name, true, false, 24, AlignmentType.LEFT, 300, 40, 40 ) );
            // full_content.push( this.paragraph( 'Môn: '.concat( index_course !== -1 ? _courses[ index_course ].title : ' -- ', '                 - Ngày giờ: ', d.toLocaleString( 'en-GB' ) ), true, false, 24, AlignmentType.LEFT, 300, 40, 40 ) );
            full_content.push( this.paragraph( '', true, false, 28, AlignmentType.CENTER, 300, 40, 40 ) );
            const tableContent = [];
            tableContent.push(
                new TableRow( {
                    children: [
                        this.tabelCell( [ 'Phòng' ], 24, 1500, AlignmentType.CENTER, true, false, 1, 100, 100, VerticalAlign.CENTER ),
                        this.tabelCell( [ 'Cán bộ coi thi' ], 24, 5500, AlignmentType.CENTER, true, false, 1, 100, 100, VerticalAlign.CENTER ),
                        this.tabelCell( [ 'Mã truy cập' ], 24, 2000, AlignmentType.CENTER, true, false, 1, 100, 100, VerticalAlign.CENTER ),
                    ]
                } )
            )

            if ( Array.isArray( f.canbo_coithi_ids ) ) {
                f.canbo_coithi_ids.forEach( ( id, key_id ) => {
                    const index = _user.findIndex( m => m.id.toString() === id.toString() );
                    if ( key_id === 0 ) {
                        tableContent.push(
                            new TableRow( {
                                children: [
                                    this.tabelCell( [ f.room ], 24, 1500, AlignmentType.LEFT, false, false, key_id === 0 ? f.canbo_coithi_ids.length : 1, 100, 100, VerticalAlign.CENTER ),
                                    this.tabelCell( [ 'CBCT0'.concat( ( key_id + 1 ).toString(), ': ', index !== -1 ? _user[ index ].display_name : ' - ', index !== -1 ? ' (' + _user[ index ].email + ')' : ' - ' ) ], 24, 6000, AlignmentType.LEFT, false, false, 1, 100, 100, VerticalAlign.CENTER ),
                                    this.tabelCell( [ f.pass_of_room ], 38, 2000, AlignmentType.CENTER, true, false, key_id === 0 ? f.canbo_coithi_ids.length : 1, 0, 0, VerticalAlign.CENTER ),
                                ]
                            } )
                        )
                    } else {
                        tableContent.push(
                            new TableRow( {
                                children: [
                                    this.tabelCell( [ 'CBCT0'.concat( ( key_id + 1 ).toString(), ': ', index !== -1 ? _user[ index ].display_name : ' - ', index !== -1 ? ' (' + _user[ index ].email + ')' : ' - ' ) ], 24, 6000, AlignmentType.LEFT, false, false, 1, 100, 100, VerticalAlign.CENTER ),
                                ],
                            } )
                        )
                    }

                } )

                full_content.push(
                    new Table( {
                        rows: tableContent,
                        alignment: AlignmentType.CENTER,
                        width: {
                            size: 9500,
                            type: WidthType.DXA,
                        }
                    } ),
                );

            }

            full_content.push( this.paragraph( '', true, false, 28, AlignmentType.CENTER, 300, 40, 40 ) );
            full_content.push(
                new Paragraph( {
                    children: [
                        new TextRun( {
                            text: '* ',
                            bold: true,
                            italics: false,
                            size: 24
                        } ),

                        new TextRun( {
                            text: 'Lưu ý',
                            bold: true,
                            italics: false,
                            underline: {
                                type: UnderlineType.SINGLE
                            },
                            size: 24
                        } ),

                        new TextRun( {
                            text: ': Trong trường hợp hệ thống báo mã truy cập không chính xác, liên hệ cán bộ tạo ca thi: '.concat( shift[ 'created_by_name' ] ),
                            bold: false,
                            italics: false,
                            size: 24
                        } ),
                        new TextRun( {
                            text: ' ('.concat( shift[ 'created_by_phone' ], ')' ),
                            bold: true,
                            italics: false,
                            size: 24
                        } )
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: {
                        line: 300,
                        after: 0,
                        before: 0
                    },
                    indent: {
                        left: 0,
                        right: 0,
                    }
                } )
            )

            full_content.push( this.paragraph( '', true, false, 24, AlignmentType.CENTER, 300, 0, 0 ) );
            full_content.push( this.paragraph( '', true, false, 24, AlignmentType.CENTER, 300, 0, 0 ) );
            full_content.push( this.paragraph( '------------------------------------------------------------------------------------', true, false, 24, AlignmentType.CENTER, 300, 0, 0 ) );
            full_content.push( this.paragraph( '', true, false, 24, AlignmentType.CENTER, 300, 0, 0 ) );
            full_content.push( this.paragraph( '', true, false, 24, AlignmentType.CENTER, 300, 0, 0 ) );

            // full_content.push(
            //     new Table( {
            //         rows: tableContent,
            //         alignment: AlignmentType.CENTER,
            //         width: {
            //             size: 10000,
            //             type: WidthType.DXA,
            //         }
            //     } ),
            // )
        } )

        const document = new Document( {
            sections: [ {
                children: full_content
            } ]
        } );

        return document;
    }

    // exportDoc ( doc ) {

    //     Packer.toBlob( doc ).then( blob => {
    //         console.log( blob );
    //         fs( blob, "example.docx" );
    //         console.log( "Document created successfully" );
    //     } );
    // }

    paragraph ( text: string, bold: boolean, italic: boolean, textSize: number, alignment?: any, line?: number, after?: number, before?: number, indent_left?: number, indent_right?: number ) {
        const result = new Paragraph( {
            children: [
                new TextRun( {
                    text: text,
                    bold: bold,
                    italics: italic,
                    size: textSize
                } )
            ],
            alignment: alignment,
            spacing: {
                line: line,
                after: after,
                before: before
            },
            indent: {
                left: indent_left ? indent_left : 0,
                right: indent_right ? indent_right : 0,
            }
        } );
        return result;
    }

    tabelCell ( texts: string[], textSize: number, width: number, alignment: any, bold: boolean, italic: boolean, rowSpan: number, margins_left: number, margins_right: number, verticalAlign?: any ) {
        const newTexts = [];
        texts.forEach( f => {
            newTexts.push(
                new Paragraph( {
                    children: [
                        new TextRun( {
                            text: f,
                            bold: bold,
                            italics: italic,
                            size: textSize
                        } )
                    ],
                    alignment: alignment,
                    spacing: {
                        after: 20,
                        before: 20
                    },
                } ),
            )
        } )
        const cell = new TableCell( {
            children: newTexts,
            width: {
                size: width,
                type: WidthType.DXA,
            },
            rowSpan: rowSpan,
            verticalAlign: verticalAlign ? verticalAlign : VerticalAlign.CENTER,
            margins: {
                left: margins_left,
                right: margins_right,
                top: 100,
                bottom: 100
            },

            // borders: {
            //     left: {
            //         style: borderStyle ? borderStyle : BorderStyle.DOT_DOT_DASH,
            //         size: 3,
            //         color: "333333",
            //     },
            //     right: {
            //         style: borderStyle ? borderStyle : BorderStyle.DOT_DOT_DASH,
            //         size: 3,
            //         color: "333333",
            //     },
            //     top: {
            //         style: borderStyle ? borderStyle : BorderStyle.DOT_DOT_DASH,
            //         size: 3,
            //         color: "333333",
            //     },
            //     bottom: {
            //         style: borderStyle ? borderStyle : BorderStyle.DOT_DOT_DASH,
            //         size: 3,
            //         color: "333333",
            //     },
            // },

        } )
        return cell
    }



}