import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { HelperService } from '@core/services/helper.service';
import mammothPlus from 'mammoth-plus';
import { MathMLToLaTeX } from 'mathml-to-latex';
import * as latex_js from 'latex.js';
import { NotificationService } from '@core/services/notification.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

export interface Question {
    question_direction: string; // nội dung câu hỏi
    question_type: string; // Loại câu hỏi
    answer_option: Answers[]; // 
    answer_correct?: any;
    group_id: number; // là parent_id
    media?: MEDIA;
    part?: number;
    cdr?: number; //Chuẩn đầu ra
    question_number?: number;//
    code?: string; // mã đề;
    config?: Config;
    
    
    
    
    id?: number;
    media_open?: boolean;
    keyParent?: number;    
    shuff?: string;
    children?: Question[];
    hint?: string;
    explain?: string;
    reorder_words_ans?: string[];
}


export interface Answers {
    id: string;
    value: string;
}

export interface MEDIA {
    type: string;
    source: string;
    path: string;
    replay: number;
}

export interface Config {
    cols: 1 | 2 | 3 | 4;
    invertedAnswer: boolean;
}

export interface RESULT {
    data: Question[],
    info: INFORES,
    imgs: IMGS[]
}

export interface IMGS {
    id: number;
    file: File;
}

export interface INFORES {
    noAnswerCorrect: number,
    noAnswerCorrectArray: string[]
}

@Component({
    selector: 'test-question-import-v2',
    templateUrl: './test-question-import-v2.component.html',
    styleUrls: ['./test-question-import-v2.component.css']
})
export class TestQuestionImportV2Component implements OnInit {

    @Input() fileInput: File;

    @Input() questionType: 'grouping' | 'radio' | 'checkbox' | 'group-radio' | 'group-input' | 'inputbox' | 'drag_drop' | 'reorder_words';

    @Output() onReturnResult = new EventEmitter<any>();

    questionImport: Question[];

    hasContent = false;

    arrayIdImages: IMGS[] = [];

    option_show_anwser_col = [
        { value: 1 },
        { value: 2 },
        { value: 3 },
        { value: 4 },
    ]

    option_invertedAnswer = [
        { value: true, label: 'Có đảo' },
        { value: false, label: 'Không đảo' },
    ]

    checkQuestion = {
        noAnswerCorrect: 0,
        noAnswerCorrectArray: []
    }

    type: 'grouping' | 'radio' | 'checkbox' | 'group-radio' | 'group-input' | 'inputbox' | 'drag_drop' | 'reorder_words';

    constructor(
        private helperService: HelperService,
        private noitifi: NotificationService
    ) {

    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['fileInput']) {
            this.hasContent = false;
            this.onReadFile();
        }

        if (changes['questionType']) {
            this.hasContent = false;
            this.type = this.questionType;
            this.questionImport = null;
        }
    }

    ngOnInit(): void {

    }

    onReadFile() {
        if (this.fileInput) {
            if (this.type) {
                this.hasContent = false;
                const file = this.fileInput;
                const indexDot = file.name.lastIndexOf(".");
                let codeFile = '';

                if (indexDot !== -1) {
                    codeFile = file.name.slice(0, indexDot);
                }

                var options = {
                    ignoreEmptyParagraphs: true,
                    includeDefaultStyleMap: false,
                    includeEmbeddedStyleMap: false,
                }

                const reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onloadend = async (event) => {
                    const localUrl = reader.result;
                    mammothPlus.convertToHtml({ arrayBuffer: localUrl }, options).then((result) => {
                        const html = result.value;
                        const regex = /<([^>]+)>/ig;
                        const regexSrcG = /src="(.*?)"/g;
                        const arrayFile = [];
                        let i = 0;

                        const string_latex = result.value.replace(/\$(.*?)\$|<math(.*?)<\/math>/gi, re => {
                            let latex = re;
                            const index = re.indexOf('<math');
                            if (index !== -1) {
                                latex = '$' + MathMLToLaTeX.convert(re) + '$';
                            }
                            let generator = new latex_js.HtmlGenerator({ hyphenate: false });
                            generator = latex_js.parse(latex, { generator: generator });
                            const para = document.createElement("div");
                            para.appendChild(generator.domFragment());
                            return para.innerHTML.replace(/<div(.*?)>|<\/div>|<p>|<\/p>/g, '');
                        });

                        const newHtml = string_latex.replace(regexSrcG, (res) => {
                            if (res) {
                                i = i + 1;
                                arrayFile.push({ id: i, file: this.helperService.convertFileFromBase64(res.slice(5, res.length - 1), codeFile + '_anh_' + i + '_(khong_xoa)', true) });
                                return 'class="admin-class-image" data-org="serverAws" data-id="'.concat(i.toString(), '"').concat(res);
                            } else {
                                return '';
                            }
                        });

                        this.arrayIdImages = arrayFile;
                        const noP = newHtml.replace(/<p>([\s]+)<\/p>/g, '').replace(/<p(.*?)>/gi, '<p>').replace(/<p><\/p>|<font(.*?)>|<\/font>/g, '').trim();
                        const next = noP.replace(/\#\#\[E\]/g, _res => {
                            return '';
                        })
                        this.getQuestions(next, regex, codeFile);
                    }).done();
                };
            }
        } else {
            this.hasContent = false;
            this.questionImport = null;
        }
    }

    getQuestions(word, regex, codeFile) {

        this.checkQuestion.noAnswerCorrect = 0;

        this.checkQuestion.noAnswerCorrectArray = [];

        let arrayWord = [];

        const wordAddKeyPart = word.replace(/##([0-9]+)\#\#/g, (resWord) => {
            if (resWord.length === 6) {
                return '|TMP|'.concat(resWord);
            } else {
                return resWord;
            }
        });

        const wordAddKeyQuestion = wordAddKeyPart.replace(/##\[Q[0-9]*\]/gi, _key => {
            if (_key.length) {
                return '|question|'.concat(_key);
            }
            return _key;
        })

        arrayWord = wordAddKeyQuestion.split('|TMP|').filter(m => m !== null && m.trim().length !== 0);

        arrayWord.splice(0, 1);

        const questions = [];

        arrayWord.forEach((ar, key) => {
            questions.push(this.getContentPart(ar.trim(), regex, key + 1, codeFile));
        });

        this.questionImport = questions;

        this.hasContent = true;
        
        console.log({ data: this.questionImport, info: this.checkQuestion, imgs: this.arrayIdImages });
        this.onReturnResult.emit({ data: this.questionImport, info: this.checkQuestion, imgs: this.arrayIdImages })
    }

    getContentPart(textPart, regex, keyParent, codeFile) {

        let PART = null;

        let cdr = 1;

        const getPart = textPart.replace(/PART(\s*)[0-9]*\.*[0-9]*/, (res) => {
            PART = Number(res.replace("PART", '').trim()) * 10;
            return res;
        })

        const getCdr = textPart.replace(/\#\#([0-9]+)\#\#/, _key => {
            cdr = _key.replace(/\D/gi, '') ? Number(_key.replace(/\D/gi, '')) : 1;
            return ''
        })

        const media = { type: null, source: null, path: null, replay: null };

        const textNoMedia = getCdr.replace(/@@(.*?)]/g, (res => {
            if (res.length) {
                const media_string = res.replace(/@@\[|\]/g, '');
                const arrMedia = media_string.trim().split(' ');
                media.type = arrMedia[0];
                media.source = arrMedia[1];
                media.path = arrMedia[2];
                media.replay = arrMedia[3] ? Number(arrMedia[3]) : 1;
            }
            return '';
        }));

        const partAndQuestion = textNoMedia.split('|question|').filter(m => m !== null && m.trim().length !== 0);

        const partDirectionRaw = partAndQuestion.splice(0, 1)[0].trim();

        let answer_option = [];

        let partDirection = partDirectionRaw;

        let questionAr = partAndQuestion;

        switch (this.type) {
            case 'drag_drop':
                partDirection = partDirectionRaw.replace(/\[(.*?)\]/gi, _res => {
                    if (_res && _res.length) {
                        _res.replace(/\[|\]/gi, '').split('/').filter(m => m && m !== '').forEach((f, key) => {
                            const ans = f.replace(/\s+/gi, ' ').trim();
                            answer_option.push({ id: (key + 1).toString(), value: this.convertTextUtf8(ans) });
                        })
                    }
                    return '';
                })

                if (partAndQuestion.length === 1) {
                    const cutQuestionDragdrop = partAndQuestion[0].replace(/<p>[0-9]+\.\s+/gi, _key => {
                        return '|question|'.concat(_key);
                    })
                    questionAr = cutQuestionDragdrop.split('|question|').filter(m => m !== null && m.trim().length !== 0);
                    questionAr.splice(0, 1)
                }
                break;
            case 'radio':
                break;
            default:
                if (partAndQuestion.length === 1) {
                    const cutQuestionDefault = partAndQuestion[0].replace(/<p>[0-9]+\.\s+/gi, _key => {
                        return '|question|'.concat(_key);
                    })
                    questionAr = cutQuestionDefault.split('|question|').filter(m => m !== null && m.trim().length !== 0);
                    questionAr.splice(0, 1);
                }
                break;
        }

        const lastPartDirection = partDirection.replace(/<\/p>/, '').concat('</p>');

        const part_direction: Question = {
            group_id: 0,
            part: PART ? PART : keyParent * 10,
            question_type: this.type,
            question_direction: lastPartDirection,
            media: media.path ? media : null,
            question_number: null,
            code: codeFile,
            keyParent: keyParent,
            media_open: false,
            answer_option: answer_option,
            cdr: cdr,
            children: []
        };

        if (!part_direction.media) {
            delete part_direction.media;
        }

        if (!answer_option || !answer_option.length) {
            delete part_direction.answer_option;
        }

        questionAr.forEach((f, key) => {
            const child = this.getContentQuestion(f, part_direction, key, codeFile);
            part_direction.children.push(child);
        })

        return part_direction;
    }

    getContentQuestion(questContent, part: Question, keyQuestion, codeFile) {

        let cdr = 1;

        let filCdrQuestion = questContent.replace(/\#\#\[Q[0-9]*\]/gi, _key => {
            if (_key) {
                cdr = _key.replace(/\D/gi, '') ? Number(_key.replace(/\D/gi, '')) : 1;
            }
            return '';
        })

        const lesTestQuest: Question = {
            group_id: null,
            part: part.part ? part.part : part.keyParent * 10,
            question_direction: null,
            question_type: this.type,
            answer_option: [],
            answer_correct: [],
            question_number: keyQuestion + 1,
            config: { cols: 1, invertedAnswer: true },
            hint: null,
            explain: null,
            code: codeFile,
            keyParent: part.keyParent,
            cdr: cdr,
            children: []
        };

        const index_hint = filCdrQuestion.indexOf('[HINT] ');

        const index_exp = filCdrQuestion.indexOf('[EXP] ');

        if (index_exp !== -1) {
            if (index_hint !== -1) {
                lesTestQuest.hint = filCdrQuestion.trim().slice(index_hint + 7, index_exp).replace(/<p>/g, '').split('</p>').join('');
            }
            lesTestQuest.explain = filCdrQuestion.trim().slice(index_exp + 6, filCdrQuestion.length).replace(/<p>/g, '').split('</p>').join('');
        } else {
            if (index_hint !== -1) {
                lesTestQuest.hint = filCdrQuestion.trim().slice(index_hint + 7, filCdrQuestion.length).replace(/<p>/g, '').split('</p>').join('');
            }
        }

        if (index_exp !== -1 && index_hint !== -1) {
            filCdrQuestion = this.deleteAtIndex(filCdrQuestion, 0, index_hint);
        } else if (index_exp !== -1 && index_hint === -1) {
            filCdrQuestion = this.deleteAtIndex(filCdrQuestion, 0, index_exp);
        }

        let questionAndAnswer = [];

        switch (this.type) {
            case 'checkbox':
                this.handelCheckboxAndRadio(questionAndAnswer, filCdrQuestion, lesTestQuest);
                break;
            case 'radio':
                this.handelCheckboxAndRadio(questionAndAnswer, filCdrQuestion, lesTestQuest);
                break;
            case 'inputbox': ;
                this.handelInputAndReorder_words(filCdrQuestion, lesTestQuest, part);
                break;
            case 'reorder_words':
                this.handelInputAndReorder_words(filCdrQuestion, lesTestQuest, part);
                break;
            case 'drag_drop':
                if (part.answer_option && part.answer_option.length) {
                    this.handelInputAndReorder_words(filCdrQuestion, lesTestQuest, part);
                } else {
                    this.handelGroupQuestion(filCdrQuestion, lesTestQuest);

                    // filCdrQuestion.replace(/([0-9]+)\.\s*|[C-c]au\s[0-9]+\:/, number => {
                    //     const questNumber = number.replace(/\D*/g, '');
                    //     lesTestQuest.question_number = questNumber;
                    //     return '';
                    // }).replace("</p>", '');
                }
                break;
            case 'group-input':
                this.handelGroupQuestion(filCdrQuestion, lesTestQuest);
                break;
            case 'group-radio':
                this.handelGroupQuestion(filCdrQuestion, lesTestQuest);
                break;
            case 'grouping':
                this.handelGroupQuestion(filCdrQuestion, lesTestQuest);
                break;
            default:
                break;
        }
        return lesTestQuest;
    }



    handelCheckboxAndRadio(questionAndAnswer, filCdrQuestion, lesTestQuest: Question) {
        questionAndAnswer = [...filCdrQuestion.replace(/\>\s*[A-Z]\.\s/g, ">ANS@##").split(/ANS@##/g)];
        if (questionAndAnswer.length) {
            const questDirection = questionAndAnswer.splice(0, 1);
            if (questDirection[0]) {
                questDirection[0] = questDirection[0].replace(/([0-9]+)\.\s+/, (number) => {
                    const questNumber = number.replace(/\D*/g, '');
                    lesTestQuest.question_number = questNumber;
                    return '';
                }).replace("</p>", '');

                const last_index_p = questDirection[0].lastIndexOf('<p>');
                let questNew = questDirection[0];
                if (last_index_p !== -1) {
                    questNew = questDirection[0].slice(0, last_index_p);
                }
                lesTestQuest.question_direction = questNew.replace(/<(.*?)>\s*<\/(.*?)>/gi, "").trim();
            }

            lesTestQuest.answer_correct = [];
            questionAndAnswer.forEach((a, i) => {
                const answer = { id: '', value: '' };
                const index_correct = a.indexOf('##');
                if (index_correct !== -1) {
                    lesTestQuest.answer_correct = lesTestQuest.answer_correct.concat([(i + 1).toString()]);
                    a = a.replace('##', '');
                }
                answer.id = (i + 1).toString();
                answer.value = a.replace(/<p(.*?)>|<\/p>/gi, '').trim();
                lesTestQuest.answer_option.push(answer);
            });

            if (lesTestQuest.question_type === 'checkbox') {
                lesTestQuest.answer_correct = [lesTestQuest.answer_correct.toString()];
            }

            if (!lesTestQuest.answer_correct.length) {
                this.checkQuestion.noAnswerCorrect += 1;
                this.checkQuestion.noAnswerCorrectArray.push(" ".concat(lesTestQuest.question_number.toString())
                );
            }

        }
    }

    handelInputAndReorder_words(filCdrQuestion, lesTestQuest: Question, part) {
        const split_answer = filCdrQuestion.replace(/\[(.*?)\]/gi, _ans => {
            const answer = _ans.replace(/\[|\]/gi, '').split('|').filter(m => m && m !== '').map(m => {
                m = m.replace(/<(.*?)>/gi, '').replace(/\s+/gi, ' ');
                m = m.trim();
                m = this.convertTextUtf8(m);
                switch (this.type) {
                    case 'drag_drop':
                        const index = part.answer_option.findIndex(i => i.value === m);
                        if (index !== -1) {
                            m = part.answer_option[index].id;
                        }
                        break;
                    default:
                        break;
                }
                return m
            });

            lesTestQuest.answer_correct = [answer.join('|')];

            if (this.type === 'reorder_words' && lesTestQuest.answer_correct[0]) {
                lesTestQuest.reorder_words_ans = lesTestQuest.answer_correct[0].split(' ');
            }

            return '';
        })

        lesTestQuest.question_direction = split_answer.replace(/([0-9]+)\.\s+/, (number) => {
            const questNumber = number.replace(/\D*/g, '');
            lesTestQuest.question_number = questNumber;
            return '';
        }).replace(/<p>(\s*)<\/p>/g, '').replace(/\s+/, ' ').replace(/<(.*?)>\s*<\/(.*?)>/g, "");;

        switch (this.type) {
            case 'reorder_words':
                lesTestQuest.question_direction = lesTestQuest.question_direction.replace(/<(.*?)>/gi, '').trim();
                break;
            default:
                break;
        }
    }

    handelGroupQuestion(filCdrQuestion, lesTestQuest: Question) {
        const miniQuestion = filCdrQuestion.replace(/<p>[0-9]+\)\s+/gi, _key => {
            return '|minQuestion|'.concat(_key);
        })
        const miniQuestion_ar = miniQuestion.split('|minQuestion|').filter(m => m !== null && m.trim().length !== 0);

        const directionParent = miniQuestion_ar.splice(0, 1)[0];

        const maintDirec = directionParent.replace(/([0-9]+)\.\s+/, number => {
            const questNumber = number.replace(/\D*/g, '');
            lesTestQuest.question_number = questNumber;
            return '';
        }).replace(/<\/p>/g, '').replace(/<p>(\s*)<\/p>/g, '').replace(/\s+/, ' ');

        const answer_option = [];

        switch (this.type) {
            case 'group-input':
                lesTestQuest.question_direction = maintDirec.replace(/<(.*?)>\s*<\/(.*?)>/g, "");
                miniQuestion_ar.forEach((f, key) => {
                    lesTestQuest.children.push(this.handelChildrenQuestion(lesTestQuest, key, f));
                })
                break;
            case 'group-radio':
                lesTestQuest.question_direction = maintDirec.replace(/<(.*?)>\s*<\/(.*?)>/g, "");
                miniQuestion_ar.forEach((f, key) => {
                    lesTestQuest.children.push(this.handelChildrenQuestion(lesTestQuest, key, f));
                })
                break;
            default:
                lesTestQuest.question_direction = maintDirec.replace(/\[(.*?)\]/gi, _ans => {
                    if (_ans && _ans.length) {
                        _ans.replace(/\[|\]/gi, '').split('/').filter(m => m && m !== '').forEach((f, key) => {
                            const ans = f.replace(/\s+/gi, ' ').trim();
                            answer_option.push({ id: (key + 1).toString(), value: this.convertTextUtf8(ans) });
                        })
                    }
                    return '';
                }).replace(/<(.*?)>\s*<\/(.*?)>/g, "");

                lesTestQuest.answer_option = answer_option;

                miniQuestion_ar.forEach((f, key) => {
                    lesTestQuest.children.push(this.handelChildrenQuestion(lesTestQuest, key, f));
                })

                break;
        }
    }

    handelChildrenQuestion(lesTestQuest, keyQuestion, questionContent) {
        const childrenQuestion: Question = {
            group_id: null,
            part: lesTestQuest.part,
            question_direction: null,
            question_type: this.type,
            answer_option: [],
            answer_correct: [],
            question_number: keyQuestion + 1,
            config: { cols: 2, invertedAnswer: false },
            code: lesTestQuest.code,
        }

        switch (this.type) {
            case 'group-radio':
                childrenQuestion.answer_option = [
                    { id: '1', value: 'Đúng' },
                    { id: '2', value: 'Sai' }
                ]

                const directionNoAnswer = questionContent.replace(/\#T|\#F/gi, ans => {
                    if (ans.replace(/\#/gi, '') === 'T') {
                        childrenQuestion.answer_correct = ['1'];
                    } else {
                        childrenQuestion.answer_correct = ['2'];
                    }
                    return '';
                })

                childrenQuestion.question_type = 'radio';

                childrenQuestion.question_direction = directionNoAnswer.replace(/<p>[0-9]+\)\s/gi, '<p>').replace(/<(.*?)>\s*<\/(.*?)>/g, "").trim();

                break;
            case 'group-input':
                const directionGroupInput = questionContent.replace(/\[(.*?)\]/gi, _ans => {
                    const answer = _ans.replace(/\[|\]/gi, '').split('|').filter(m => m && m !== '').map(m => {
                        m = m.replace(/<(.*?)>/gi, '').replace(/\s+/gi, ' ');
                        m = m.trim();
                        m = this.convertTextUtf8(m);
                        return m
                    });
                    childrenQuestion.answer_correct = [answer.join('|')];
                    return '';
                })

                childrenQuestion.question_type = 'inputbox';

                childrenQuestion.question_direction = directionGroupInput.replace(/<p>[0-9]+\)\s/gi, '<p>').replace(/<(.*?)>\s*<\/(.*?)>/g, "").trim();

                break;
            default:
                const direction = questionContent.replace(/\[(.*?)\]/gi, _ans => {
                    switch (this.type) {
                        case 'grouping':
                            if (_ans && _ans.length) {
                                const answer = _ans.replace(/\[|\]/gi, '').split(',').filter(m => m && m !== '').map(m => {
                                    m = m.replace(/<(.*?)>/gi, '').replace(/\s+/gi, ' ');
                                    m = m.trim();
                                    m = this.convertTextUtf8(m);
                                    const index = lesTestQuest.answer_option.findIndex(i => i.value === m);
                                    if (index !== -1) {
                                        m = lesTestQuest.answer_option[index].id;
                                    }
                                    return Number(m);
                                });
                                childrenQuestion.answer_correct = [answer.sort().join(',')];
                            }
                            break;
                        case 'drag_drop':
                            if (_ans && _ans.length) {
                                const answer = _ans.replace(/\[|\]/gi, '').split('|').filter(m => m && m !== '').map(m => {
                                    m = m.replace(/<(.*?)>/gi, '').replace(/\s+/gi, ' ');
                                    m = m.trim();
                                    m = this.convertTextUtf8(m);
                                    const index = lesTestQuest.answer_option.findIndex(i => i.value === m);
                                    if (index !== -1) {
                                        m = lesTestQuest.answer_option[index].id;
                                    }
                                    return m
                                });
                                childrenQuestion.answer_correct = [answer.join('|')];
                            }
                            break;
                        default:
                            break;
                    }
                    return '';
                })
                childrenQuestion.question_direction = direction.replace(/<p>[0-9]+\)\s/gi, '<p>').replace(/<(.*?)>\s*<\/(.*?)>/g, "").trim();
                break;
        }

        return childrenQuestion;
    }

    convertTextUtf8(string): string {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(string);
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(bytes);
    }



    selectPreviewAudio(part) {
        this.questionImport.forEach(f => {
            f['media_open'] = false;
        })
        part['media_open'] = true;
    }

    onChangeRadioAnswer(quest: any, event) {
        if (event) {
            quest.answer_correct = [event.toString()]
        }
    }

    onChangeCheckboxAnswer(quest: any, event) {
        if (event) {
            quest.answer_correct = [event.toString()]
        }
    }

    deleteAtIndex(s, i, j) {
        return s.substr(i, j);
    }

    onAddChips(event, ans) {
        if (ans[0] && ans[0].length !== 0) {
            ans[0] = ans[0].concat('|', event['value']);
        }
    }

    onRemoveChips(event, ans) {
        if (ans[0] && ans[0].length !== 0) {
            const arr = ans[0].split('|');
            const index = arr.findIndex(m => m === event['value']);
            if (index !== -1) {
                arr.splice(index, 1);
                ans[0] = arr.join('|')
            }
        }
    }

    dropReorder(event: CdkDragDrop<string[]>, data: String[], quest: Question) {
        moveItemInArray(data, event.previousIndex, event.currentIndex);
        quest.answer_correct = [data.join(' ')];
    }
}
