export const COURSE_DESCRIPTION_HEADINGS = [
    '1) Mô tả:',
    '2) Quy định về điểm:',
    '3) Điều kiện dự thi:'
] as const;

const BLOT = 'ovicProtectedHeading';
const MARKER = 'data-ovic-heading';

interface DeltaOp {
    insert?: string | Record<string, unknown>;
    retain?: number;
    delete?: number;
    attributes?: Record<string, unknown>;
}
interface EditorDelta { ops: DeltaOp[]; }
interface EditorRange { index: number; length: number; }

// Quill 1.x is loaded by PrimeNG; use that instance instead of importing a second copy.
export interface ProtectedQuill {
    constructor: any;
    root: HTMLElement;
    clipboard: { convert(html: string): EditorDelta };
    getContents(): EditorDelta;
    setContents(delta: EditorDelta, source: string): void;
    getSelection(): EditorRange | null;
    setSelection(index: number, length: number, source: string): void;
    getLength(): number;
    getModule(name: string): any;
    on(name: string, listener: (...args: any[]) => void): void;
    off(name: string, listener: (...args: any[]) => void): void;
}

interface DescriptionParts { bodies: string[]; needsReview: boolean; }

function stripPrefix(block: Element, length: number): string {
    const clone = block.cloneNode(true) as Element;
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    let remaining = length;
    while ((node = walker.nextNode())) {
        const size = node.textContent?.length || 0;
        if (remaining <= size) {
            const range = document.createRange();
            range.setStart(clone, 0);
            range.setEnd(node, remaining);
            range.deleteContents();
            break;
        }
        remaining -= size;
    }
    return clone.outerHTML;
}

function splitDescription(html: string, headings: readonly string[]): DescriptionParts {
    const container = document.createElement('div');
    container.innerHTML = html;
    const bodies = headings.map(() => '');
    if (!container.textContent?.trim() && !container.querySelector('img,video,audio,table,iframe')) {
        return { bodies, needsReview: false };
    }
    const nodes = Array.from(container.childNodes);
    const markers = nodes.filter((node): node is Element => node instanceof Element)
        .map(node => node.firstElementChild)
        .filter(node => node?.hasAttribute('data-ovic-description-section'));
    if (markers.length === headings.length && markers.every((node, index) =>
        node?.getAttribute('data-ovic-description-section') === String(index)
        && node.textContent === headings[index])) {
        let section = 0;
        nodes.forEach(node => {
            const clone = node.cloneNode(true);
            if (clone instanceof Element && clone.firstElementChild?.hasAttribute('data-ovic-description-section')) {
                section = Number(clone.firstElementChild.getAttribute('data-ovic-description-section'));
                clone.firstElementChild.remove();
            }
            const wrapper = document.createElement('div');
            wrapper.appendChild(clone);
            bodies[section] += wrapper.innerHTML;
        });
        return { bodies, needsReview: false };
    }
    const matches = nodes.map(node => {
        if (!(node instanceof Element) || !/^(P|DIV|H[1-6])$/.test(node.tagName)) return null;
        const text = node.textContent || '';
        const match = text.match(/^\s*\d+\)\s*(Mô tả|Quy định về điểm|Điều kiện dự thi)\s*:/u);
        if (!match) return null;
        const index = ['Mô tả', 'Quy định về điểm', 'Điều kiện dự thi'].indexOf(match[1]);
        return { index, length: match[0].length };
    });
    const indices = matches.filter(match => match !== null).map(match => match!.index);
    const recognized = indices.join(',') === '0,1,2' || indices.join(',') === '1,2';
    if (!recognized || headings.join('|') !== COURSE_DESCRIPTION_HEADINGS.join('|')) {
        bodies[0] = html;
        return { bodies, needsReview: true };
    }
    let section = 0;
    nodes.forEach((node, index) => {
        const match = matches[index];
        if (match && node instanceof Element) {
            section = match.index;
            bodies[section] += stripPrefix(node, match.length);
        } else {
            const wrapper = document.createElement('div');
            wrapper.appendChild(node.cloneNode(true));
            bodies[section] += wrapper.innerHTML;
        }
    });
    return { bodies, needsReview: false };
}

export class ProtectedHeadingsController {
    private accepted: EditorDelta = { ops: [] };
    private selection: EditorRange = { index: 1, length: 0 };
    private restoring = false;
    private disposed = false;
    private revision = 0;
    private readonly captureEvents = ['beforeinput', 'keydown', 'paste', 'cut', 'drop', 'dragstart'];

    constructor(private readonly quill: ProtectedQuill, private readonly headings: readonly string[],
        private readonly notify: (message: string) => void, private readonly changed: (html: string) => void) {
        const Quill = quill.constructor;
        if (!Quill.imports[`formats/${BLOT}`]) {
            const Embed = Quill.import('blots/embed');
            class Heading extends Embed {
                static blotName = BLOT;
                static tagName = 'SPAN';
                static className = 'ovic-protected-heading';
                static create(value: { id: number; label: string }): HTMLElement {
                    const node = super.create() as HTMLElement;
                    node.setAttribute(MARKER, String(value.id));
                    node.setAttribute('draggable', 'false');
                    node.textContent = value.label;
                    return node;
                }
                static value(node: HTMLElement) {
                    return { id: Number(node.getAttribute(MARKER)), label: node.textContent?.replace(/﻿/g, '') || '' };
                }
            }
            Quill.register(Heading);
        }
        quill.on('editor-change', this.onEditorChange);
        quill.on('selection-change', this.onSelectionChange);
        this.captureEvents.forEach(name => quill.root.addEventListener(name, this.capture, true));
    }

    load(html: string): void {
        const parts = splitDescription(html, this.headings);
        const ops: DeltaOp[] = [];
        this.headings.forEach((label, id) => {
            ops.push({ insert: { [BLOT]: { id, label } } });
            const body = this.quill.clipboard.convert(parts.bodies[id]).ops || [];
            if (typeof body[0]?.insert !== 'string' || !body[0].insert.startsWith(' ')) ops.push({ insert: ' ' });
            ops.push(...body);
            const last = ops[ops.length - 1];
            if (typeof last?.insert !== 'string' || !last.insert.endsWith('\n')) ops.push({ insert: '\n' });
        });
        this.restoring = true;
        this.quill.setContents({ ops }, 'silent');
        this.accepted = this.quill.getContents();
        this.selection = { index: 1, length: 0 };
        this.revision++;
        this.quill.getModule('history')?.clear();
        this.restoring = false;
        this.notify(parts.needsReview ? 'Nội dung cũ được giữ trong mục Mô tả. Vui lòng rà soát và chuyển nội dung vào mục phù hợp trước khi lưu.' : 'Ba tiêu đề được khóa. Chỉ chỉnh sửa nội dung sau dấu hai chấm.');
    }

    isValid(): boolean {
        return this.valid(this.quill.getContents());
    }

    serialize(): string {
        const clone = this.quill.root.cloneNode(true) as HTMLElement;
        clone.querySelectorAll(`[${MARKER}]`).forEach(node => {
            const id = Number(node.getAttribute(MARKER));
            const title = document.createElement('strong');
            title.setAttribute('data-ovic-description-section', String(id));
            title.textContent = this.headings[id] || '';
            node.replaceWith(title);
        });
        return clone.innerHTML;
    }

    private protectedPositions(delta: EditorDelta): number[] {
        let position = 0;
        const positions: number[] = [];
        delta.ops.forEach(op => {
            if (typeof op.insert === 'object' && op.insert[BLOT]) positions.push(position);
            position += typeof op.insert === 'string' ? op.insert.length : op.insert ? 1 : 0;
        });
        return positions;
    }

    private valid(delta: EditorDelta): boolean {
        let count = 0;
        let previous = '\n';
        let position = 0;
        for (const op of delta.ops) {
            if (typeof op.insert === 'object' && op.insert[BLOT]) {
                const value = op.insert[BLOT] as { id: number; label: string };
                if (value.id !== count || value.label !== this.headings[count] || previous !== '\n'
                    || (count === 0 && position !== 0) || Object.keys(op.attributes || {}).length) return false;
                count++;
            }
            previous = typeof op.insert === 'string' ? op.insert.slice(-1) : '￼';
            position += typeof op.insert === 'string' ? op.insert.length : op.insert ? 1 : 0;
        }
        return count === this.headings.length;
    }

    private touchesHeading(change: EditorDelta): boolean {
        const headings = this.protectedPositions(this.accepted);
        const lineBreaks = headings.slice(1).map(position => position - 1);
        let index = 0;
        return change.ops.some(op => {
            if (typeof op.insert === 'object' && op.insert[BLOT]) return true;
            const length = op.delete ?? op.retain ?? 0;
            const touchesToken = headings.some(position => position >= index && position < index + length);
            const deletesBoundary = op.delete !== undefined
                && lineBreaks.some(position => position >= index && position < index + length);
            const formatsToken = !!op.attributes && touchesToken;
            index += length;
            return (touchesToken && op.delete !== undefined) || deletesBoundary || formatsToken;
        });
    }

    private onEditorChange = (name: string, change: EditorDelta, _old: EditorDelta, source: string): void => {
        if (name !== 'text-change' || this.restoring || this.disposed) return;
        const candidate = this.quill.getContents();
        if (this.touchesHeading(change) || !this.valid(candidate)) {
            this.restoring = true;
            this.quill.setContents(this.accepted, 'silent');
            this.quill.setSelection(Math.min(this.selection.index, this.quill.getLength() - 1), 0, 'silent');
            this.restoring = false;
            const revision = ++this.revision;
            // History handles editor-change before this guard; undo finishes after it.
            queueMicrotask(() => {
                if (!this.disposed && revision === this.revision) this.quill.getModule('history')?.clear();
            });
            this.notify('Tiêu đề cố định không thể sửa hoặc xóa. Hãy chọn phần nội dung sau dấu hai chấm.');
            return;
        }
        this.accepted = candidate;
        this.revision++;
        if (source !== 'silent') this.changed(this.serialize());
    };

    private onSelectionChange = (range: EditorRange | null): void => {
        if (range && !this.restoring) this.selection = { ...range };
    };

    private capture = (event: Event): void => {
        if (event.type === 'drop' || event.type === 'dragstart') {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.notify('Không kéo thả trong mẫu cố định. Bạn có thể sao chép/dán phần nội dung sau dấu hai chấm.');
            return;
        }
        const range = this.quill.getSelection();
        if (!range) return;
        let start = range.index;
        let end = start + range.length;
        if (event instanceof KeyboardEvent) {
            if (!['Backspace', 'Delete'].includes(event.key)) return;
            if (!range.length) {
                if (event.key === 'Backspace') start--;
                else end++;
            }
        } else if (event instanceof InputEvent) {
            if (!range.length && event.inputType.startsWith('delete')) {
                if (event.inputType.endsWith('Backward')) start--;
                else end++;
            }
        }
        const positions = this.protectedPositions(this.accepted);
        if (positions.some(position => position >= start && position < end)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.notify('Tiêu đề cố định không thể sửa hoặc xóa. Hãy chọn phần nội dung sau dấu hai chấm.');
        }
    };

    destroy(): void {
        this.disposed = true;
        this.quill.off('editor-change', this.onEditorChange);
        this.quill.off('selection-change', this.onSelectionChange);
        this.captureEvents.forEach(name => this.quill.root.removeEventListener(name, this.capture, true));
    }
}
