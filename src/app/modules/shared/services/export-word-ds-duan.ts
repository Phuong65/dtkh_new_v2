import { HelperService } from '@core/services/helper.service';
import { Injectable } from '@angular/core';
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    VerticalAlign
} from 'docx';
import { saveAs } from 'file-saver';
import { Classes } from '../models/classes';
import { DonVi } from '../models/don-vi';
import { ElnChuyenMuc } from '../models/Elng';
import { ElnKhoaHoc } from '../models/elng-khoa-hoc';
import { FileChild } from 'docx/build/file/file-child';

@Injectable({
    providedIn: 'root'
})
export class ExportWordDanhSachService {
    selectKhoa: DonVi;
    selectNganh: ElnChuyenMuc;
    selectClass: Classes;

    constructor(
        private helperService: HelperService
    ) {

    }
    exportDanhSach(
        _class: Classes,
        _khoa: DonVi,
        _nganh: ElnChuyenMuc,
        data: any[]
    ) {
        this.selectKhoa = _khoa;
        this.selectNganh = _nganh;
        this.selectClass = _class;

        const doc = new Document({
            sections: [
                {
                    properties: {
                        page: {
                            size: {
                                width: 11906,   // A4 width (twips)
                                height: 16838   // A4 height (twips)
                            },
                            margin: {
                                top: 1440,      // 2.54 cm
                                bottom: 1440,
                                left: 1800,     // 3.17 cm (chuẩn văn bản VN)
                                right: 1200     // 2.12 cm
                            }
                        }
                    },
                    children: [
                        // ===== HEADER =====
                        this.buildHeader(),

                        // ===== TITLE =====
                        this.buildTitle(),

                        // ===== INFO =====
                        ...this.buildInfo(),

                        // ===== TABLE =====
                        this.buildTable(data),

                        ...this.buildFooter(data)
                    ]
                }
            ]
        });

        Packer.toBlob(doc).then(blob => {
            saveAs(blob, 'DSDA'.concat('-', this.helperService.slugVietnamese(this.selectClass.name), '.docx'));
        });
    }

    // ================= HEADER =================
    buildHeader(): Table {
        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: this.noBorder(),
            rows: [
                new TableRow({
                    children: [
                        this.headerCellLeft(),
                        this.headerCellRight()
                    ]
                })
            ]
        });
    }

    headerCellLeft(): TableCell {
        return new TableCell({
            borders: this.noBorder(),
            children: [
                this.p("TRƯỜNG ĐẠI HỌC CÔNG NGHỆ", false),
                this.p("THÔNG TIN VÀ TRUYỀN THÔNG", false),
                this.p(this.selectKhoa.title.toUpperCase(), true)
            ]
        });
    }

    headerCellRight(): TableCell {
        return new TableCell({
            borders: this.noBorder(),
            children: [
                this.p("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", false, AlignmentType.CENTER),
                this.p("Độc lập – Tự do – Hạnh phúc", true, AlignmentType.CENTER, true)
            ]
        });
    }

    // ================= TITLE =================
    buildTitle(): Paragraph {
        return new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 200 },
            children: [
                new TextRun({
                    text: "DANH SÁCH CHỦ ĐỀ ĐỒ ÁN/DỰ ÁN",
                    bold: true,
                    size: 28,
                    font: "Times New Roman"
                })
            ]
        });
    }

    // ================= INFO =================
    buildInfo(): Paragraph[] {
        return [
            this.pInline("Lớp học phần: ", this.selectClass.name),
            this.pInline("Ngành học: ", this.selectNganh ? this.selectNganh.title : ''),
            new Paragraph({
                children: [
                    this.run("Học kỳ: ", false),
                    this.run(String(this.selectClass?.hocky ?? '')),
                    this.run("    Năm học: ", false),
                    this.run(String(this.selectClass?.namhoc ?? ''))
                ]
            }),

        ];
    }

    // ================= TABLE =================
    buildTable(data: any[]): Table {
        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [

                // HEADER
                new TableRow({
                    children: [
                        this.cell("TT", true, AlignmentType.CENTER, 5),
                        this.cell("Tên chủ đề Đồ án/Dự án", true, AlignmentType.CENTER, 35), // 👈 giảm lại
                        this.cell("Số sinh viên thực hiện", true, AlignmentType.CENTER, 25),
                        this.cell("Tên nhiệm vụ", true, AlignmentType.CENTER, 35)
                    ]
                }),

                // DATA
                ...data.map((item, index) =>
                    new TableRow({
                        children: [
                            this.cell(String(index + 1), false, AlignmentType.CENTER, 5),
                            this.cell(item.title, false, AlignmentType.LEFT, 35),
                            this.cell(item.soluong_sinhvien, false, AlignmentType.CENTER, 25),
                            this.cell("", false, AlignmentType.LEFT, 35)
                        ]
                    })
                )
            ]
        });
    }

    // ================= CELL =================
    cell(
        text: string,
        bold = false,
        align = AlignmentType.CENTER,
        widthPercent?: number
    ): TableCell {
        return new TableCell({
            width: widthPercent ? { size: widthPercent, type: WidthType.PERCENTAGE } : undefined,

            margins: {
                top: 100,
                bottom: 100,
                left: 120,
                right: 120
            },
            verticalAlign: VerticalAlign.CENTER,
            children: [
                new Paragraph({
                    alignment: align,
                    children: [
                        new TextRun({
                            text: String(text ?? ''),
                            bold,
                            size: 24,
                            font: "Times New Roman",
                        })
                    ]
                })
            ]
        });
    }

    // ================= PARAGRAPH =================
    p(text: string, bold = false, align = AlignmentType.LEFT, underline = false): Paragraph {
        return new Paragraph({
            alignment: align,
            children: [
                new TextRun({
                    text,
                    bold,
                    underline: underline ? {} : undefined,
                    size: 24,
                    font: "Times New Roman"
                })
            ]
        });
    }

    pInline(label: string, value: string): Paragraph {
        return new Paragraph({
            children: [
                this.run(label, false),
                this.run(value)
            ]
        });
    }

    run(text: string, bold = false, italic = false): TextRun {
        return new TextRun({
            text,
            bold,
            size: 24,
            font: "Times New Roman",
            italics: italic,
        });
    }

    // ================= BORDER =================
    noBorder() {
        return {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE }
        };
    }

    buildFooter(data: any[]): FileChild[] {
        const total = data?.reduce((sum, item) => sum + (item.soluong_sinhvien || 0), 0) || 0;
        return [
            new Paragraph({
                spacing: { before: 300 },
                children: [
                    this.run(`Tổng số sinh viên thực hiện: ${total} sinh viên.`)
                ]
            }),
            // ===== NGÀY + GIẢNG VIÊN =====
            this.buildSignature(),
            // ===== NHIỆM VỤ =====
            ...this.buildNote()
        ];
    }

    buildSignature(): Table {
        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: this.noBorder(),
            rows: [
                new TableRow({
                    children: [

                        // CỘT TRÁI (rỗng)
                        new TableCell({
                            borders: this.noBorder(),
                            width: {
                                size: 50,
                                type: WidthType.PERCENTAGE
                            },
                            children: [
                                // Tiêu đề
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        this.run("LÃNH ĐẠO BỘ MÔN", true)
                                    ]
                                }),

                                // Khoảng trống ký tên
                                new Paragraph({
                                    text: "",
                                    spacing: { after: 400 }
                                }),

                                // Tên
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        this.run('', true)
                                    ]
                                })
                            ]
                        }),

                        // CỘT PHẢI (chữ ký)
                        new TableCell({
                            width: {
                                size: 50,
                                type: WidthType.PERCENTAGE
                            },
                            borders: this.noBorder(),
                            children: [
                                // Tiêu đề
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        this.run("GIẢNG VIÊN GIẢNG DẠY", true)
                                    ]
                                }),

                                // Khoảng trống ký tên
                                new Paragraph({
                                    text: "",
                                    spacing: { after: 400 }
                                }),

                                // Tên
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        this.run(this.selectClass['giangvien'], true)
                                    ]
                                })
                            ]
                        })
                    ]
                })
            ]
        });
    }

    buildNote(): Paragraph[] {
        return [

            new Paragraph({
                spacing: { before: 300 },
                children: [
                    new TextRun({
                        text: "Ghi chú: ",
                        bold: true,
                        underline: {},
                        size: 24,
                        font: "Times New Roman"
                    }),

                    new TextRun({
                        text: "Đối với các Đồ án/Dự án có hơn 01 sinh viên thực hiện thì cột ",
                        size: 24,
                        font: "Times New Roman"
                    }),

                    new TextRun({
                        text: "Tên nhiệm vụ",
                        italics: true,
                        size: 24,
                        font: "Times New Roman",
                        bold: true
                    }),

                    new TextRun({
                        text: " phải nêu rõ từng nhiệm vụ cụ thể. Số nhiệm vụ phải tương ứng với số lượng sinh viên thực hiện.",
                        size: 24,
                        font: "Times New Roman"
                    })
                ]
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "Nếu Đồ án/Dự án có 01 SV thực hiện cột ",
                        size: 24,
                        font: "Times New Roman"
                    }),

                    new TextRun({
                        text: "Tên nhiệm vụ",
                        italics: true,
                        size: 24,
                        font: "Times New Roman",
                        bold: true
                    }),

                    new TextRun({
                        text: " không yêu cầu phải nêu.",
                        size: 24,
                        font: "Times New Roman"
                    })
                ]
            })
        ];
    }
}