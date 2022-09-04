import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ManagedFormArray, RawValue } from './managed-form-array';

export interface AddressForm {
  street: FormControl<string | null>;
  nr: FormControl<number | null>;
}

export class AddressFormArray extends ManagedFormArray<FormGroup<AddressForm>> {
  constructor(
    destroy: Subject<void>,
    initialData?: ReadonlyArray<RawValue<FormGroup<AddressForm>>>
  ) {
    super(destroy, initialData);
  }

  createForm(data: RawValue<FormGroup<AddressForm>>): FormGroup<AddressForm> {
    return new FormGroup({
      street: new FormControl<string>('test'),
      nr: new FormControl<number>(10),
    });
  }
}

interface TestForm {
  address: AddressFormArray;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnDestroy {
  title = 'ManagedFormArray';
  private destroy = new Subject<void>();

  private initialData: RawValue<AddressFormArray> = [
    {
      street: 'test',
      nr: 100,
    },
  ];
  readonly form = new FormGroup<TestForm>({
    address: new AddressFormArray(this.destroy, this.initialData),
  });

  constructor() {
    this.form.controls.address.groupChanges
      .pipe(takeUntil(this.destroy))
      .subscribe((x) => console.log(x.index, x.form.value));
  }

  public add() {
    this.form.controls.address.addItem({
      street: 'Gloxiniastraat',
      nr: 11,
    });
  }

  public remove(form: FormGroup<AddressForm>) {
    this.form.controls.address.removeItem(form);
  }

  public ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
  }
}
