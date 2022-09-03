import {AbstractControl, FormArray, FormControl, FormGroup} from "@angular/forms";
import {finalize, Subject, Subscription} from "rxjs";

declare type IsAny<T, Y, N> = 0 extends 1 & T ? Y : N;
export declare type TypedOrUntyped<T, Typed, Untyped> = IsAny<T,
  Untyped,
  Typed>;
export declare type RawValue<T extends AbstractControl | undefined> =
  T extends AbstractControl<any, any>
    ? T['setValue'] extends (v: infer R) => void
      ? R
      : never
    : never;

export interface AddressForm {
  street: FormControl<string | null>;
  nr: FormControl<number | null>;
}

export interface TestForm {
  name: FormControl<string>;
  list: FormArray<FormGroup<AddressForm>>;
}

export abstract class ManagedFormArray<T extends AbstractControl<any, any>> extends FormArray<T> {
  private readonly subscriptionMap = new Map<AbstractControl, Subscription>();
  private readonly destroy: Subject<void>;
  private readonly _groupChange = new Subject<{ form: T; index: number }>();

  public readonly groupChanges = this._groupChange.asObservable();

  constructor(
    destroy: Subject<void>,
    initialData?: ReadonlyArray<RawValue<T>>
  ) {
    super([]);
    this.setupInitialData(initialData);
    this.destroy = destroy;

    const subscription = this.destroy
      .subscribe(() => {
        this.subscriptionMap.forEach((x) => x.unsubscribe());
        subscription.unsubscribe();
      });
  }

  private setupInitialData(initialData?: ReadonlyArray<RawValue<T>>) {
    if (initialData) {
      initialData.forEach((x) => this.addItem(x));
    }
  }

  public addItem(data: RawValue<T>) {
    const form = this.createForm(data);
    this.push(form);

    const index = this.controls.indexOf(form);
    const subscription = this.subscribe?.(form, index);
    if (subscription) {
      this.subscriptionMap.set(form, subscription);
    }
  }

  public removeItem(data: T) {
    const subscription = this.subscriptionMap.get(data);
    subscription?.unsubscribe();
    this.subscriptionMap.delete(data);
    const index = this.controls.indexOf(data);
    this.removeAt(index);
  }

  private subscribe(form: T, index: number): Subscription {
    return form.valueChanges.subscribe(() => {
      this._groupChange.next({form, index});
    });
  }

  abstract createForm(data: RawValue<T>): T;
}
