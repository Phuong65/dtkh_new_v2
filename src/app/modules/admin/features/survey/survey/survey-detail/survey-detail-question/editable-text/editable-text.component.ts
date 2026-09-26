import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-editable-text',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editable-text.component.html',
  styleUrls: ['./editable-text.component.css']
})
export class EditableTextComponent implements OnInit {
  ngOnInit(): void {
  }

  @Input() text: string = '';

  @Output() textChange = new EventEmitter<string>();

  @Input() title: boolean = false;

  @Input() disable: boolean = false;

  onInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.textChange.emit(textarea.value);
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

}
